// hooks/useAdminSSE.ts
// Connects to GET /admin/notifications/stream (SSE).
// Pushes incoming events into a toast queue.
// Auto-reconnects on disconnect with exponential back-off.
// The token is passed as a query param because EventSource
// cannot set custom headers.
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

// const API = 'http://localhost:4000/api/v1/admin';
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
  const esRef     = useRef<EventSource | null>(null);
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryMs   = useRef(2000);

  const connect = useCallback(() => {
    if (!accessToken) return;
    if (esRef.current) esRef.current.close();

    const url = `${API}/notifications/stream?token=${encodeURIComponent(accessToken)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      retryMs.current = 2000; // reset back-off
    };

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        // Ignore heartbeat pings (empty or { type: 'ping' })
        if (!payload || payload.type === 'ping') return;

        const notif: AdminNotification = {
          id:        `${Date.now()}-${Math.random()}`,
          type:      payload.type    ?? 'INFO',
          orderId:   payload.orderId ?? undefined,          // human-readable ID (display)
          mongoId:   payload.mongoId ?? payload._id ?? undefined, // MongoDB _id (API calls)
          title:     payload.title   ?? undefined,
          message:   payload.message ?? 'New notification',
          timestamp: payload.timestamp ?? new Date().toISOString(),
          createdAt: new Date(),
          read:      false,
        };
        setNotifications(prev => [notif, ...prev].slice(0, 50)); // keep last 50
      } catch {}
    };

    // Named event: "new_order"
    es.addEventListener('new_order', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const notif: AdminNotification = {
          id:        `${Date.now()}-${Math.random()}`,
          type:      'NEW_ORDER',
          orderId:   payload.orderId ?? undefined,           // human-readable e.g. ORD-2025-00001
          mongoId:   payload.mongoId ?? payload._id ?? undefined, // MongoDB _id for PATCH /orders/:id
          title:     payload.title   ?? `New Order — ${payload.orderId ?? ''}`,
          message:   payload.message ?? `New order from ${payload.customerName ?? 'customer'}`,
          timestamp: payload.timestamp ?? new Date().toISOString(),
          createdAt: new Date(),
          read:      false,
        };
        setNotifications(prev => [notif, ...prev].slice(0, 50));
      } catch {}
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;
      // Exponential back-off: 2s → 4s → 8s → max 30s
      retryRef.current = setTimeout(() => {
        retryMs.current = Math.min(retryMs.current * 2, 30000);
        // eslint-disable-next-line react-hooks/immutability
        connect();
      }, retryMs.current);
    };
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken) connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [isAuthenticated, accessToken, connect]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, connected, unreadCount, markRead, dismiss };
}