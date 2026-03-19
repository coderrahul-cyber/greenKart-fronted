// app/admin/components/PushNotificationSetup.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWebPush } from '@/hooks/useWebPush';
import { useAdminAuth } from '../context/AdminAuthContext';

const DISMISSED_KEY = 'gk_push_banner_dismissed';

export default function PushNotificationSetup() {
  const {
    subscribe, unsubscribe,
    permission, subscribed,
    loading, error, supported,
  } = useWebPush();

  // ✅ isLoading guards against showing the banner before auth rehydrates
  const { isLoading: authLoading } = useAdminAuth();

  const [showBanner, setShowBanner] = useState(false);

  /* ── Show permission banner ────────────────────────────────────────────────
     Wait for auth to finish rehydrating before evaluating — prevents a flash
     of the banner on cold mount before cookies are read.
  ────────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (authLoading)           return; // wait for cookie rehydration
    if (!supported)            return;
    if (permission !== 'default') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const t = setTimeout(() => setShowBanner(true), 1200);
    return () => clearTimeout(t);
  }, [authLoading, supported, permission]);

  /* ── Auto-subscribe silently if permission was already granted ─────────────
     useRef flag fires this at most ONCE per mount — prevents the infinite
     loop where subscribe() changes loading/permission re-triggering the effect.
  ────────────────────────────────────────────────────────────────────────── */
  const autoSubscribedRef = useRef(false);
  useEffect(() => {
    if (authLoading || !supported || subscribed || autoSubscribedRef.current) return;
    if (permission === 'granted') {
      autoSubscribedRef.current = true;
      subscribe();
    }
  // ✅ subscribe and loading intentionally omitted — avoids infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, permission, subscribed, supported]);

  /* ── Clear dismissal flag when permission is granted ──────────────────────
     So future devices / fresh logins still get prompted.
  ────────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (permission === 'granted') localStorage.removeItem(DISMISSED_KEY);
  }, [permission]);

  const handleEnable = useCallback(async () => {
    setShowBanner(false);
    await subscribe();
  }, [subscribe]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  }, []);

  // Nothing to render if push isn't supported at all
  if (!supported) return null;

  return (
    <>
      {/* ════════════════════════════════════════
          PERMISSION BANNER — slides in from top
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1,  y:   0 }}
            exit={{   opacity: 0,  y: -80  }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4"
          >
            <div
              className="rounded-2xl px-5 py-4 flex gap-4"
              style={{
                background:     'rgba(8, 12, 18, 0.97)',
                border:         '1px solid rgba(6,182,212,0.3)',
                boxShadow:      '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,182,212,0.08)',
                backdropFilter: 'blur(20px)',
                fontFamily:     "'IBM Plex Mono', monospace",
              }}
            >
              {/* Bell icon */}
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#e0f2fe', letterSpacing: '-0.01em' }}>
                  Enable order alerts
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Get notified the moment a new order arrives — even with the browser closed.
                </p>

                {/* Error from previous attempt */}
                {error && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(252,165,165,0.85)' }}>
                    ⚠ {error}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnable}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-opacity"
                    style={{
                      background: loading ? 'rgba(6,182,212,0.08)' : 'linear-gradient(135deg, #0891b2, #06b6d4)',
                      color:      loading ? 'rgba(6,182,212,0.35)'  : '#040d12',
                      opacity:    loading ? 0.7 : 1,
                      cursor:     loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                        Enabling…
                      </>
                    ) : '🔔 Enable'}
                  </motion.button>

                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 rounded-xl text-xs transition-colors"
                    style={{ color: 'rgba(255,255,255,0.22)' }}
                  >
                    Not now
                  </button>
                </div>
              </div>

              {/* X close */}
              <button
                onClick={handleDismiss}
                className="shrink-0 self-start -mt-0.5 -mr-1"
                style={{ color: 'rgba(255,255,255,0.18)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          STATUS PILL — shows when subscribed
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {permission === 'granted' && subscribed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.85,  y: 8 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(8,12,18,0.92)',
              border:     '1px solid rgba(34,197,94,0.2)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            title="Web Push notifications are active"
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            <span className="text-[10px] tracking-widest" style={{ color: 'rgba(34,197,94,0.6)' }}>
              PUSH ACTIVE
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          BLOCKED STATE — tells admin how to fix
      ════════════════════════════════════════ */}
      {permission === 'denied' && (
        <div
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full cursor-default"
          style={{
            background: 'rgba(8,12,18,0.92)',
            border:     '1px solid rgba(239,68,68,0.2)',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
          title="Notifications blocked. Click the lock icon in your browser address bar → Notifications → Allow → reload."
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <span className="text-[10px] tracking-widest" style={{ color: 'rgba(239,68,68,0.5)' }}>
            PUSH BLOCKED · click 🔒 → Allow
          </span>
        </div>
      )}
    </>
  );
}