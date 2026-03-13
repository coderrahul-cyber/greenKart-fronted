/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useWebPush.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

// const API = 'http://localhost:4000/api/v1/admin';
const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin`;


export type PushPermission = 'default' | 'granted' | 'denied';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  const buf     = new ArrayBuffer(raw.length);
  const view    = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return view;
}

export function useWebPush() {
  const { accessToken, isAuthenticated } = useAdminAuth();

  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [supported,  setSupported]  = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  /* ── Check browser support on mount (client-only) ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = 'serviceWorker' in navigator
            && 'PushManager'   in window
            && 'Notification'  in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission as PushPermission);
  }, []);

  /* ── Save subscription to backend ── */
  /* defined before the SW effect so it can be referenced inside it */
  const saveSubscriptionToBackend = useCallback(async (sub: PushSubscription | any, token: string) => {
    if (!token) return;
    try {
      // Backend expects the raw PushSubscription object at req.body
      // (NOT wrapped in { subscription: ... })
      // adminSavePushSubscription reads: req.body.endpoint + req.body.keys.p256dh + req.body.keys.auth
      const body = sub.toJSON ? sub.toJSON() : sub;
      const res = await fetch(`${API}/push/subscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.warn('[WebPush] Failed to save subscription:', json?.message);
      } else {
        console.log('[WebPush] Subscription saved to backend ✓');
      }
    } catch (e) {
      console.warn('[WebPush] saveSubscription network error:', e);
    }
  }, []);

  /* ── Register SW + check existing subscription ─────────────────
     Runs once when supported + authenticated.
     If an existing push subscription is found, re-saves it to the
     backend (guards against backend data loss on redeploy).
  ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!supported || !isAuthenticated || !accessToken) return;

    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        if (cancelled) return;
        swRegRef.current = reg;

        // Wait for SW to be ready/active
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        const existing = await reg.pushManager.getSubscription();
        if (cancelled) return;

        if (existing) {
          setSubscribed(true);
          setPermission('granted');
          // Re-save so backend always has fresh subscription
          await saveSubscriptionToBackend(existing, accessToken);
        }
      } catch (err: any) {
        if (!cancelled) console.warn('[WebPush] SW registration failed:', err?.message);
      }
    })();

    return () => { cancelled = true; };
  }, [supported, isAuthenticated, accessToken, saveSubscriptionToBackend]);

  /* ── Listen for subscription rotation messages from SW ── */
  useEffect(() => {
    if (!supported || typeof navigator === 'undefined') return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PUSH_SUBSCRIPTION_CHANGED' && e.data.subscription && accessToken) {
        saveSubscriptionToBackend(e.data.subscription, accessToken);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [supported, accessToken, saveSubscriptionToBackend]);

  /* ── Fetch VAPID public key from backend ── */
    /* ── Fetch VAPID public key from backend ── */
  const getVapidKey = useCallback(async (_token: string): Promise<Uint8Array<ArrayBuffer> | null> => {
    try {
      // vapid-key is a public route — no auth required
      const res  = await fetch(`${API}/push/vapid-key`);
      const json = await res.json();
      const key  = json?.data?.publicKey ?? json?.publicKey ?? null;
      if (!key) {
        console.warn('[WebPush] VAPID public key missing from response:', json);
        return null;
      }
      return urlBase64ToUint8Array(key);
    } catch (e) {
      console.warn('[WebPush] getVapidKey error:', e);
      return null;
    }
  }, []);

  /* ── Subscribe ── */
  const subscribe = useCallback(async () => {
    if (!supported) { setError('Push notifications not supported in this browser.'); return; }
    if (!accessToken) { setError('Not authenticated.'); return; }
    setLoading(true); setError('');

    try {
      // 1. Request permission — MUST be triggered by user gesture
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== 'granted') {
        setError(perm === 'denied'
          ? 'Permission denied. Click the 🔒 icon in address bar → Notifications → Allow.'
          : 'Permission not granted.');
        return;
      }

      // 2. Get / create SW registration
      let reg = swRegRef.current;
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        swRegRef.current = reg;
      }
      await navigator.serviceWorker.ready;

      // 3. Get VAPID public key from backend
      const vapidKey = await getVapidKey(accessToken);
      if (!vapidKey) {
        setError('Could not fetch push key from server. Check VAPID_PUBLIC_KEY env var.');
        return;
      }

      // 4. Create push subscription
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: vapidKey,
      });

      // 5. Send subscription to backend
      await saveSubscriptionToBackend(sub, accessToken);
      setSubscribed(true);

    } catch (err: any) {
      console.error('[WebPush] subscribe error:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Permission denied. Allow notifications in browser settings.');
      } else if (err?.name === 'InvalidStateError') {
        setError('Push subscription failed. Try reloading the page.');
      } else {
        setError(err?.message ?? 'Failed to enable push notifications.');
      }
    } finally {
      setLoading(false);
    }
  }, [supported, accessToken, getVapidKey, saveSubscriptionToBackend]);

  /* ── Unsubscribe ── */
  const unsubscribe = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const reg = swRegRef.current
        ?? (await navigator.serviceWorker.ready);
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setSubscribed(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to disable push notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { subscribe, unsubscribe, permission, subscribed, loading, error, supported };
}