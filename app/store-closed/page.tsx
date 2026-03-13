// app/store-closed/page.tsx
'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

export default function StoreClosedPage() {
  const [reason,      setReason]      = useState<string | null>(null);
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [checking,    setChecking]    = useState(false);
  const [nowOpen,     setNowOpen]     = useState(false);

  useEffect(() => {
    fetch(`${API}/store/status`)
      .then(r => r.json())
      .then(json => {
        const d = json?.data ?? json;
        setReason(d?.closedReason ?? d?.reason ?? null);
        setLastChanged(d?.lastChanged ?? d?.updatedAt ?? null);
        // If store opened while navigating here — show reopen message
        if (d?.isOpen) setNowOpen(true);
      })
      .catch(() => {});
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res  = await fetch(`${API}/store/status`);
      const json = await res.json();
      if (json?.data?.isOpen || json?.isOpen) {
        setNowOpen(true);
        // Refresh to clear the store_open cookie and allow navigation
        setTimeout(() => window.location.href = '/', 1500);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)' }}
    >
      {/* Ambient blob */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fbbf24, transparent 65%)', filter: 'blur(80px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1,  y: 0  }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center text-center gap-6"
      >
        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.06))',
            border: '1px solid rgba(251,191,36,0.25)',
            boxShadow: '0 0 60px rgba(251,191,36,0.1)',
          }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none"
            stroke="rgba(251,191,36,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
            <line x1="4" y1="4" x2="20" y2="20"/>
          </svg>
        </motion.div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-3xl font-semibold"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #fef3c7 30%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {nowOpen ? 'We\'re back!' : 'Store Closed'}
          </h1>
          <p className="text-sm font-roboto leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {nowOpen
              ? 'The store is open again. Taking you to the homepage…'
              : "We're temporarily closed for maintenance. Browse our products and come back soon!"}
          </p>
          {reason && !nowOpen && (
            <p className="text-xs font-roboto px-4 py-2 rounded-xl mt-1"
              style={{ background: 'rgba(251,191,36,0.07)', color: 'rgba(251,191,36,0.65)', border: '1px solid rgba(251,191,36,0.15)' }}>
              {reason}
            </p>
          )}
          {lastChanged && !nowOpen && (
            <p className="text-[11px] font-roboto mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Closed since {new Date(lastChanged).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          {!nowOpen && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCheck}
              disabled={checking}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold font-poppins flex items-center justify-center gap-2"
              style={{
                background: checking ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.12)',
                color: checking ? 'rgba(251,191,36,0.4)' : 'rgba(251,191,36,0.9)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              {checking
                ? <><div className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin" />Checking…</>
                : '🔄 Check if we\'re open'}
            </motion.button>
          )}

          <Link href="/" className="w-full">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold font-poppins text-center"
              style={{
                background: 'linear-gradient(135deg, #e8f5e0, #c8eabc)',
                color: '#082e28',
              }}
            >
              ← Back to Home
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}