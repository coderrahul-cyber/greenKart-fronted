// app/admin/components/AdminShell.tsx
// Shared layout wrapper used by every protected admin page.
// Handles: auth guard, sidebar, notification panel, SSE connection.
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminAuthGuard from './AdminAuthguard';
import AdminSidebar   from './AdminSidebar';
import { useAdminAuth }  from '@/app/admin/context/AdminAuthContext';
import { useAdminSSE, AdminNotification } from '@/app/admin/hooks/UseAdminsse';
import PushNotificationSetup from './Pushnotificationsetup';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

/* ── Status colour map ── */
export const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', dot: '#fbbf24' },
  confirmed:  { bg: 'rgba(96,165,250,0.1)',  text: '#60a5fa', dot: '#60a5fa' },
  processing: { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa', dot: '#a78bfa' },
  shipped:    { bg: 'rgba(34,211,238,0.1)',  text: '#22d3ee', dot: '#22d3ee' },
  delivered:  { bg: 'rgba(74,222,128,0.1)',  text: '#4ade80', dot: '#4ade80' },
  cancelled:  { bg: 'rgba(239,68,68,0.1)',   text: '#f87171', dot: '#f87171' },
  refunded:   { bg: 'rgba(156,163,175,0.1)', text: '#9ca3af', dot: '#9ca3af' },
};

export const ALL_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'];

/* ── Notification toast panel ── */
function NotifPanel({
  notifs, onMarkRead, onDismiss, onConfirmOrder, onClose,
}: {
  notifs: AdminNotification[];
  onMarkRead: (id: string) => void;
  onDismiss:  (id: string) => void;
  onConfirmOrder: (mongoId: string, notifId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{   opacity: 0, x: 16, scale: 0.97  }}
      transition={{ duration: 0.2 }}
      className="fixed top-4 right-4 z-50 w-80 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: '#0d1117',
        border: '1px solid rgba(6,182,212,0.18)',
        fontFamily: "'IBM Plex Mono', monospace",
        maxHeight: '80vh',
      }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-cyan-400">NOTIFICATIONS</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* list */}
      <div className="overflow-y-auto flex-1">
        {notifs.length === 0 ? (
          <p className="text-center py-10 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No notifications</p>
        ) : notifs.map(n => (
          <div key={n.id}
            className="px-4 py-3 flex flex-col gap-2 transition-colors"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: n.read ? 'transparent' : 'rgba(6,182,212,0.04)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                {!n.read && <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-snug" style={{ color: '#e0f2fe' }}>{n.title}</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{n.message}</p>
                  <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {new Date(n.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button onClick={() => onDismiss(n.id)} className="shrink-0 p-0.5 hover:text-red-400 transition-colors"
                style={{ color: 'rgba(255,255,255,0.15)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Confirm button for new_order notifications */}
            {n.type === 'NEW_ORDER' && (
              n.mongoId
                ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={confirming === n.id}
                onClick={async () => {
                  setConfirming(n.id);
                  // mongoId is the MongoDB _id — safe for PATCH /admin/orders/:id/status
                  await onConfirmOrder(n.mongoId!, n.id);
                  setConfirming(null);
                  onMarkRead(n.id);
                }}
                className="w-full py-2 rounded-xl text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: confirming === n.id ? 'rgba(74,222,128,0.06)' : 'rgba(74,222,128,0.12)',
                  color: confirming === n.id ? 'rgba(74,222,128,0.4)' : '#4ade80',
                  border: '1px solid rgba(74,222,128,0.2)',
                  cursor: confirming === n.id ? 'not-allowed' : 'pointer',
                }}
              >
                {confirming === n.id ? (
                  <><div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />CONFIRMING</>
                ) : (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>CONFIRM ORDER</>
                )}
              </motion.button>
                ) : (
                  // mongoId missing — backend SSE payload needs to include mongoId field
                  <div className="w-full py-2 rounded-xl text-[11px] text-center"
                    style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    Order ID missing — check SSE payload
                  </div>
                )
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Top bar ── */
function TopBar({
  title, unreadCount, connected, showNotif, onToggleNotif,
}: {
  title: string; unreadCount: number; connected: boolean;
  showNotif: boolean; onToggleNotif: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-30"
      style={{
        background: 'rgba(9,13,18,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(6,182,212,0.08)',
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
      <h1 className="text-sm font-bold tracking-widest uppercase" style={{ color: '#e0f2fe', letterSpacing: '0.12em' }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {/* Connection indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        {/* Notification bell */}
        <button onClick={onToggleNotif}
          className="relative p-2 rounded-xl transition-colors"
          style={{ background: showNotif ? 'rgba(6,182,212,0.1)' : 'transparent', color: showNotif ? '#06b6d4' : 'rgba(255,255,255,0.3)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ background: '#ef4444', color: '#fff' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Main Shell ── */
export default function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { accessToken } = useAdminAuth();
  const { notifications, unreadCount, connected, markRead, markAllRead, dismiss } = useAdminSSE(accessToken);
  const [showNotif, setShowNotif] = useState(false);

  const confirmOrder = async (mongoId: string, notifId: string) => {
    // Guard: mongoId must be a valid MongoDB ObjectId (24 hex chars)
    // If it looks like ORD-2025-XXXXX the SSE payload is missing mongoId
    if (!mongoId || !/^[a-f0-9]{24}$/i.test(mongoId)) {
      console.error(
        '[AdminShell] confirmOrder received invalid id:', mongoId,
        '— backend must send mongoId (_id) not orderId in the SSE new_order event'
      );
      return;
    }
    try {
      const res = await fetch(`${API}/admin/orders/${mongoId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ status: 'confirmed' }),
      });
      if (res.ok) {
        markRead(notifId);
      } else {
        const json = await res.json().catch(() => ({}));
        console.error('[AdminShell] confirmOrder failed:', res.status, json?.message);
      }
    } catch (e) {
      console.error('[AdminShell] confirmOrder network error:', e);
    }
  };

  // Close notif panel on outside click
  useEffect(() => {
    if (!showNotif) return;
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-notif-panel]') && !t.closest('[data-notif-btn]')) setShowNotif(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showNotif]);

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen" style={{ background: '#080c10', fontFamily: "'IBM Plex Mono', monospace" }}>
        <AdminSidebar pendingCount={unreadCount} />

        <div className="flex-1 flex flex-col min-w-0">
          <div data-notif-btn>
            <TopBar title={title} unreadCount={unreadCount} connected={connected}
              showNotif={showNotif} onToggleNotif={() => setShowNotif(s => !s)} />
          </div>

          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>

        {/* Notification panel */}
        <AnimatePresence>
          {showNotif && (
            <div data-notif-panel>
              <NotifPanel
                notifs={notifications}
                onMarkRead={markRead}
                onDismiss={dismiss}
                onConfirmOrder={confirmOrder}
                onClose={() => setShowNotif(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

        {/* Web Push — asks permission on new device, auto-subscribes if already granted */}
        <PushNotificationSetup />
    </AdminAuthGuard>
  );
}