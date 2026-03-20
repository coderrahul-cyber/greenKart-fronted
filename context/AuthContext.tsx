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
  id:          string;
  name:        string;
  phoneNumber: string;
  addresses:   Address[];
  isPhoneVerified: boolean;
  cart:        string;
}

interface AuthContextType {
  user:            User | null;
  accessToken:     string | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  login:    (phoneNumber: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData, rememberMe?: boolean)                    => Promise<{ success: boolean; error?: string }>;
  logout:   () => void;
}

interface RegisterData {
  name:        string;
  phoneNumber: string;
  password:    string;
  isPhoneVerified?: boolean;
  address?: { line1: string; line2?: string; city: string; pincode: string };
}

const AuthContext = createContext<AuthContextType | null>(null);
const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
const REFRESH_MS = 13 * 60 * 1000;

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function mapUser(u: any): User {
  return {
    id:              u._id ?? u.id ?? '',
    name:            u.name ?? '',
    phoneNumber:     u.phoneNumber ?? '',
    isPhoneVerified: u.isPhoneVerified ?? false,
    cart:            u.cart ?? '',
    addresses:       Array.isArray(u.addresses) ? u.addresses : [],
  };
}

/* ─────────────────────────────────────────
   Provider
───────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

//   useEffect(() => {
//   (async () => {
//     try {
//       const res = await fetch(`${API}/users/me`, {
//         credentials: "include"
//       });

//       const json = await res.json();

//       if (res.ok) {
//         setUser(json.data.user);
//       } else {
//         setUser(null);
//       }
//     } catch {
//       setUser(null);
//     } finally {
//       setIsLoading(false); // 🔥 important
//     }
//   })();
// }, []);
  /* ── Clear ── */
  const clearAll = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, []);

  /* ── Fetch profile (cookie-based) ── */
  const fetchMe = useCallback(async (): Promise<User | null> => {
  try {
    const res = await fetch(`${API}/users/me`, {
      credentials: "include",
    });

    // 🔴 If unauthorized → try refresh
    if (res.status === 401) {
      const refreshRes = await fetch(`${API}/users/refresh-token`, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshRes.ok) return null;

      // retry /me after refresh
      const retryRes = await fetch(`${API}/users/me`, {
        credentials: "include",
      });

      if (!retryRes.ok) return null;

      const json = await retryRes.json();
      const raw = json?.data?.user ?? json?.data ?? json?.user ?? null;

      return raw ? mapUser(raw) : null;
    }

    if (!res.ok) return null;

    const json = await res.json();
    const raw = json?.data?.user ?? json?.data ?? json?.user ?? null;

    return raw ? mapUser(raw) : null;

  } catch {
    return null;
  }
}, []);

  /* ── Persist ── */
  const persist = useCallback((userData: User) => {
    setAccessToken("cookie");
    setUser(userData);
  }, []);

  /* ── Silent refresh ── */
  const silentRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/users/refresh-token`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        clearAll();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [clearAll]);

  /* ── Start refresh cycle ── */
  const startRefreshCycle = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);

    refreshTimer.current = setInterval(() => {
      silentRefresh();
    }, REFRESH_MS);
  }, [silentRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, []);

  /* ── Initial load ── */
  useEffect(() => {
    fetchMe().then(async (freshUser) => {
      if (freshUser) {
        persist(freshUser);
        startRefreshCycle();
      } else {
        const refreshed = await silentRefresh();
        if (refreshed) {
          const userAfter = await fetchMe();
          if (userAfter) {
            persist(userAfter);
            startRefreshCycle();
          } else {
            clearAll();
          }
        }
      }
      setIsLoading(false);
    });
  }, [fetchMe, silentRefresh, persist, startRefreshCycle, clearAll]);

  /* ── Login ── */
/* ── Login ── */
const login = async (phoneNumber: string, password: string) => {
  try {
    const res = await fetch(`${API}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, password }),
      credentials: "include",
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      return { success: false, error: json.message || "Login failed" };
    }

    const userData = mapUser(json.data.user);
    persist(userData);
    startRefreshCycle();

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
};

/* ── Register ── */
const register = async (data: RegisterData) => {
  try {
    const res = await fetch(`${API}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      return { success: false, error: json.message || "Registration failed" };
    }

    const userData = mapUser(json.data.user);
    persist({ ...userData, isPhoneVerified: false });
    startRefreshCycle();

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
};

  /* ── Logout ── */
  const logout = useCallback(async () => {
  try {
    await fetch(`${API}/users/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {}

  clearAll();
  router.push('/');
}, [clearAll, router]);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!accessToken,
      login,
      register,
      logout,
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