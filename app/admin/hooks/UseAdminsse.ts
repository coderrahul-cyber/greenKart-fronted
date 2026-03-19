// hooks/useAdminSSE.ts
// Connects to GET /admin/notifications/stream (SSE).
// Pushes incoming events into a toast queue.
// Auto-reconnects on disconnect with exponential back-off.
// The token is passed as a query param because EventSource
// cannot set custom headers.
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin`;

export interface AdminNotification {
  id:        string;   // generated client-side for dedup
  type:      string;   // e.g. "NEW_ORDER"
  orderId?:  string;   // human-readable e.g. ORD-2025-00001 (display only)
  mongoId?:  string;   // MongoDB _id — use THIS for API calls like PATCH /orders/:id/status
  title?:    string;
  message:   string;
  timestamp: string;
  createdAt: Date;
  read:      boolean;
}

export function useAdminSSE() {
  const { accessToken, isAuthenticated } = useAdminAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [connected,     setConnected]     = useState(false);

  const esRef        = useRef<EventSource | null>(null);
  const retryRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryMs      = useRef(2000);

  // ── Keep a stable ref to the latest token ──────────────────────────────
  // This lets the reconnect logic (inside onerror) always read the current
  // token without closing over a stale value from an old connect() call.
  const tokenRef = useRef<string | null>(null);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  // ── Parse raw SSE payload into AdminNotification ────────────────────────
  const makeNotif = useCallback((payload: any, defaultType = 'INFO'): AdminNotification => ({
    id:        `${Date.now()}-${Math.random()}`,
    type:      payload.type      ?? defaultType,
    orderId:   payload.orderId   ?? undefined,
    mongoId:   payload.mongoId   ?? payload._id ?? undefined,
    title:     payload.title     ?? undefined,
    message:   payload.message   ?? 'New notification',
    timestamp: payload.timestamp ?? new Date().toISOString(),
    createdAt: new Date(),
    read:      false,
  }), []);

  // ── Push into queue (capped at 50) ─────────────────────────────────────
  const push = useCallback((notif: AdminNotification) => {
    setNotifications(prev => [notif, ...prev].slice(0, 50));
  }, []);

  // ── Core connect — uses tokenRef so it's always fresh ──────────────────
  // connectRef lets onerror call the latest version of connect without
  // capturing a stale closure, avoiding the eslint-disable hack.
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    const token = tokenRef.current;
    if (!token) return;

    // Close any existing connection cleanly before opening a new one
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${API}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      retryMs.current = 2000; // reset back-off on successful connect
    };

    // Generic message event (unnamed)
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (!payload || payload.type === 'ping') return;
        push(makeNotif(payload));
      } catch {}
    };

    // Named event: "new_order"
    es.addEventListener('new_order', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        push(makeNotif({
          ...payload,
          type:  'NEW_ORDER',
          title: payload.title ?? `New Order — ${payload.orderId ?? ''}`,
          message: payload.message ?? `New order from ${payload.customerName ?? 'customer'}`,
        }, 'NEW_ORDER'));
      } catch {}
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;
      // Exponential back-off: 2s → 4s → 8s → max 30s
      // connectRef.current always points to the latest connect(),
      // so a token refresh between retries is handled automatically.
      retryRef.current = setTimeout(() => {
        retryMs.current = Math.min(retryMs.current * 2, 30_000);
        connectRef.current();
      }, retryMs.current);
    };
  }, [makeNotif, push]); // tokenRef is a ref — not a dep, always fresh

  // Keep the ref pointing at the latest connect
  useEffect(() => { connectRef.current = connect; }, [connect]);

  // ── Connect / disconnect lifecycle ─────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [isAuthenticated, accessToken, connect]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, connected, unreadCount, markRead, dismiss };
}