// app/admin/context/AdminAuthContext.tsx
// Completely separate from user AuthContext.
// Stores admin tokens in cookies prefixed with "admin_".
// Auto-refreshes the access token every 13 minutes so the
// admin never gets logged out during an active session.
// apiFetch() automatically attaches the Bearer token to every request.
'use client';

import {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
const REFRESH_MS = 13 * 60 * 1000; // refresh every 13 min (token expires at 15)

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
export interface AdminUser {
  username: string;
  role:     'admin' | 'superadmin';
}

interface AdminAuthContextType {
  admin:           AdminUser | null;
  accessToken:     string | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  login:    (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:   () => void;
  /** Drop-in fetch wrapper — automatically attaches Authorization: Bearer <token> */
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

/* ─────────────────────────────────────────
   Cookie helpers (admin_ prefixed)
───────────────────────────────────────── */
function setCookie(name: string, value: string, days: number) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
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
   Provider
───────────────────────────────────────── */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin,       setAdmin]       = useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const router       = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep a ref in sync with state so apiFetch always reads the latest token
  // without needing to be re-created on every token change.
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  /* ── Persist to cookies ── */
  const persist = useCallback((at: string, rt: string, adminData: AdminUser) => {
    setAccessToken(at);
    setAdmin(adminData);
    accessTokenRef.current = at;
    setCookie('admin_accessToken',  at,                        1);  // 1 day
    setCookie('admin_refreshToken', rt,                        30); // 30 days
    setCookie('admin_user',         JSON.stringify(adminData), 1);
  }, []);

  /* ── Clear everything ── */
  const clearAll = useCallback(() => {
    setAccessToken(null);
    setAdmin(null);
    accessTokenRef.current = null;
    deleteCookie('admin_accessToken');
    deleteCookie('admin_refreshToken');
    deleteCookie('admin_user');
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, []);

  /* ── Silent token refresh ─────────────────────────────────
     Calls POST /admin/refresh-token with the stored refresh
     token. On success updates the access token cookie and
     state. On failure (refresh token expired) logs out.
  ─────────────────────────────────────────────────────── */
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    const rt = getCookie('admin_refreshToken');
    if (!rt) { clearAll(); return null; }
    try {
      const res  = await fetch(`${API}/admin/refresh-token`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: rt }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { clearAll(); return null; }

      const newAt = json?.data?.accessToken ?? json?.accessToken ?? null;
      if (!newAt) { clearAll(); return null; }

      setAccessToken(newAt);
      accessTokenRef.current = newAt;
      setCookie('admin_accessToken', newAt, 1);
      return newAt;
    } catch {
      clearAll();
      return null;
    }
  }, [clearAll]);

  /* ── Start auto-refresh interval ── */
  const startRefreshCycle = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => {
      silentRefresh();
    }, REFRESH_MS);
  }, [silentRefresh]);

  /* ── Rehydrate on mount ── */
  useEffect(() => {
    const storedToken = getCookie('admin_accessToken');
    const storedUser  = getCookie('admin_user');

    if (!storedToken || !storedUser) { setIsLoading(false); return; }

    try {
      const parsed = JSON.parse(storedUser) as AdminUser;
      setAccessToken(storedToken);
      accessTokenRef.current = storedToken;
      setAdmin(parsed);
      startRefreshCycle();
    } catch {
      clearAll();
    } finally {
      setIsLoading(false);
    }
  }, [clearAll, startRefreshCycle]);

  /* ── Cleanup on unmount ── */
  useEffect(() => () => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, []);

  /* ── Login ── */
  const login = useCallback(async (username: string, password: string) => {
    try {
      const res  = await fetch(`${API}/admin/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        return { success: false, error: json.message || 'Invalid credentials' };

      const at   = json?.data?.accessToken  ?? json?.accessToken  ?? '';
      const rt   = json?.data?.refreshToken ?? json?.refreshToken ?? '';
      const role = json?.data?.role ?? json?.role ?? 'admin';

      const adminData: AdminUser = { username, role };
      persist(at, rt, adminData);
      startRefreshCycle();

      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server.' };
    }
  }, [persist, startRefreshCycle]);

  /* ── Logout ── */
  const logout = useCallback(() => {
    clearAll();
    router.push('/admin/login');
  }, [clearAll, router]);

  /* ── apiFetch ──────────────────────────────────────────────
     Drop-in replacement for fetch() on all protected admin
     routes. Reads the latest token from the ref (not state)
     so it never closes over a stale value, then injects the
     Authorization header automatically.

     Usage:
       const res = await apiFetch('/admin/dashboard');
       const res = await apiFetch('/admin/products', {
         method: 'POST',
         body: JSON.stringify(data),
       });
  ─────────────────────────────────────────────────────── */
  const apiFetch = useCallback(async (
    path: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    // Prefer live state token; fall back to cookie in case of
    // cold rehydration before state has settled.
    const token = accessTokenRef.current ?? getCookie('admin_accessToken');

    return fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Caller-supplied headers always win (e.g. multipart/form-data)
        ...options.headers,
      },
    });
  }, []); // stable ref — never needs to re-create

  return (
    <AdminAuthContext.Provider value={{
      admin,
      accessToken,
      isLoading,
      isAuthenticated: !!accessToken,
      login,
      logout,
      apiFetch,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}