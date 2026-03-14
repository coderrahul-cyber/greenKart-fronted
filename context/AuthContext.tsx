// app/context/AuthContext.tsx
'use client';

import {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
export interface Address {
  _id:       string;
  line1:     string;
  line2?:    string;
  city:      string;
  pincode:   string;
  isDefault: boolean;
}

export interface User {
  id:              string;
  name:            string;
  email:           string;
  phoneNumber:     string;
  addresses:       Address[];
  isEmailVerified: boolean;
  cart:            string;
}

interface AuthContextType {
  user:            User | null;
  accessToken:     string | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  login:    (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData, rememberMe?: boolean)              => Promise<{ success: boolean; error?: string }>;
  logout:   () => void;
}

interface RegisterData {
  name:        string;
  email:       string;
  phoneNumber: string;
  password:    string;
  address?: { line1: string; line2?: string; city: string; pincode: string };
}

const AuthContext = createContext<AuthContextType | null>(null);
const API        = 'http://localhost:4000/api/v1';
const REFRESH_MS = 13 * 60 * 1000; // refresh every 13 min (token expires at 15)

/* ─────────────────────────────────────────
   Cookie helpers
───────────────────────────────────────── */
function setCookie(name: string, value: string, days = 7) {
  // days=0 → session cookie (no expires — browser deletes on close)
  const expiresPart = days > 0
    ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}`
    : '';
  document.cookie = `${name}=${encodeURIComponent(value)}${expiresPart}; path=/; SameSite=Lax`;
}
function getCookie(name: string): string | null {
  return document.cookie.split('; ').reduce<string | null>((acc, part) => {
    const [k, v] = part.split('=');
    return k === name ? decodeURIComponent(v ?? '') : acc;
  }, null);
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/* ─────────────────────────────────────────
   Map raw API user → User type
───────────────────────────────────────── */
function mapUser(u: any): User {
  return {
    id:              u._id  ?? u.id  ?? '',
    name:            u.name          ?? '',
    email:           u.email         ?? '',
    phoneNumber:     u.phoneNumber   ?? '',
    isEmailVerified: u.isEmailVerified ?? false,
    cart:            u.cart          ?? '',
    addresses:       Array.isArray(u.addresses) ? u.addresses : [],
  };
}

/* ─────────────────────────────────────────
   Provider
───────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,        setUser]        = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const router       = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Clear all auth state + cookies ── */
  const clearAll = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    deleteCookie('user');
    if (typeof localStorage !== 'undefined') localStorage.removeItem('gk_remember');
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, []);

  /* ── Fetch full profile ── */
  const fetchMe = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const json = await res.json();
      const raw  = json?.data?.user ?? json?.data ?? json?.user ?? null;
      return raw ? mapUser(raw) : null;
    } catch {
      return null;
    }
  }, []);

  /* ── Persist tokens + user to cookies ──────────────────────────
     rememberMe=true  → 30-day cookies (survive browser close)
     rememberMe=false → session cookies (expire when tab closes,
                        achieved by omitting expires — days=0)
  ────────────────────────────────────────────────────────────── */
  const persist = useCallback((at: string, rt: string, userData: User, rememberMe = false) => {
    setAccessToken(at);
    setUser(userData);
    const atDays  = rememberMe ? 30 : 0;   // 0 = session cookie
    const rtDays  = rememberMe ? 30 : 0;
    const uDays   = rememberMe ? 30 : 0;
    setCookie('accessToken',  at,                      atDays);
    setCookie('refreshToken', rt,                      rtDays);
    setCookie('user',         JSON.stringify(userData), uDays);
    // Store the remember preference so silentRefresh can re-persist with the same TTL
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gk_remember', rememberMe ? '1' : '0');
    }
  }, []);

  /* ── Silent token refresh ─────────────────────────────────────────
     Calls POST /users/refresh-token with the stored refresh token.
     On success: updates accessToken state + cookie silently.
     On failure: refresh token expired → log the user out.
  ────────────────────────────────────────────────────────────────── */
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    const rt = getCookie('refreshToken');
    if (!rt) { clearAll(); return null; }
    try {
      const res  = await fetch(`${API}/users/refresh-token`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: rt }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        // Refresh token invalid / expired — session truly over
        clearAll();
        return null;
      }
      const newAt = json?.data?.accessToken ?? json?.accessToken ?? null;
      if (!newAt) { clearAll(); return null; }

      setAccessToken(newAt);
      // Re-persist with the same TTL the user originally chose
      const wasRemembered = typeof localStorage !== 'undefined' && localStorage.getItem('gk_remember') === '1';
      setCookie('accessToken', newAt, wasRemembered ? 30 : 0);
      return newAt;
    } catch {
      // Network error — don't log out, keep existing token and retry next cycle
      return null;
    }
  }, [clearAll]);

  /* ── Start the 13-min refresh interval ── */
  const startRefreshCycle = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => {
      silentRefresh();
    }, REFRESH_MS);
  }, [silentRefresh]);

  /* ── Cleanup interval on unmount ── */
  useEffect(() => () => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, []);

  /* ── Rehydrate from cookies on mount ─────────────────────────────
     1. Read stored accessToken
     2. Try /users/me — if it works the token is still valid
     3. If /users/me fails (token expired), try a silent refresh once
     4. If refresh also fails — clear everything
  ────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const token = getCookie('accessToken');
    if (!token) { setIsLoading(false); return; }

    setAccessToken(token); // set immediately so auth guards don't flash

    fetchMe(token).then(async freshUser => {
      if (freshUser) {
        // Token still valid — restore session and start refresh cycle
        setUser(freshUser);
        setCookie('user', JSON.stringify(freshUser), 1);
        startRefreshCycle();
      } else {
        // Token expired — attempt one silent refresh before giving up
        const newAt = await silentRefresh();
        if (newAt) {
          const userAfterRefresh = await fetchMe(newAt);
          if (userAfterRefresh) {
            setUser(userAfterRefresh);
            setCookie('user', JSON.stringify(userAfterRefresh), 1);
            startRefreshCycle();
          } else {
            clearAll();
          }
        }
        // clearAll already called inside silentRefresh if it failed
      }
      setIsLoading(false);
    });
  }, [fetchMe, silentRefresh, startRefreshCycle, clearAll]);

  /* ── Login ── */
  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const res  = await fetch(`${API}/users/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        return { success: false, error: json.message || 'Login failed' };

      const { accessToken: at, refreshToken: rt } = json.data;

      const fullUser = await fetchMe(at);
      if (!fullUser)
        return { success: false, error: 'Could not load your profile. Please try again.' };

      persist(at, rt, fullUser, rememberMe);
      startRefreshCycle(); // start refresh cycle immediately on login
      return { success: true };
    } catch {
      return { success: false, error: 'Network error — is the server running?' };
    }
  };

  /* ── Register ── */
  const register = async (data: RegisterData, rememberMe = false) => {
    try {
      const res  = await fetch(`${API}/users/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        return { success: false, error: json.message || 'Registration failed' };

      const { accessToken: at, refreshToken: rt } = json.data;

      const fullUser = await fetchMe(at);
      if (!fullUser)
        return { success: false, error: 'Could not load your profile. Please try again.' };

      persist(at, rt, fullUser, rememberMe);
      startRefreshCycle(); // start refresh cycle on register too
      return { success: true };
    } catch {
      return { success: false, error: 'Network error — is the server running?' };
    }
  };

  /* ── Logout ── */
  const logout = useCallback(() => {
    clearAll();
    router.push('/');
  }, [clearAll, router]);

  return (
    <AuthContext.Provider value={{
      user, accessToken, isLoading,
      isAuthenticated: !!accessToken,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}