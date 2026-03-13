// app/admin/login/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';
// import { cookies } from 'next/headers';

export default function AdminLoginPage() {
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();

  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [shake,       setShake]       = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/admin/dashboard');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => { usernameRef.current?.focus(); }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!username.trim() || !password.trim()) return;
//     setSubmitting(true); setError('');
//     const result = await login(username.trim(), password);
//     setSubmitting(false);
//     if (result.success) {
//       router.replace('/admin/dashboard');
//     } else {
//       setError(result.error ?? 'Invalid credentials');
//       setShake(true);
//       setTimeout(() => setShake(false), 600);
//     }
//   };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!username.trim() || !password.trim()) return;
  setSubmitting(true); setError('');

  // ── Clear all cookies before attempting login ──────────────────────────
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  const result = await login(username.trim(), password);
  setSubmitting(false);
  if (result.success) {
    router.replace('/admin/dashboard');
  } else {
    setError(result.error ?? 'Invalid credentials');
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }
};

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080c10" }}>
      <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "#080c10", fontFamily: "'IBM Plex Mono', 'Fira Code', monospace" }}
    >
      {/* Grid background */}
      <div className="pointer-events-none fixed inset-0" aria-hidden style={{
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Corner accents */}
      {[
        "top-0 left-0 border-t-2 border-l-2",
        "top-0 right-0 border-t-2 border-r-2",
        "bottom-0 left-0 border-b-2 border-l-2",
        "bottom-0 right-0 border-b-2 border-r-2",
      ].map((cls, i) => (
        <div key={i} className={`pointer-events-none fixed w-8 h-8 ${cls}`}
          style={{ borderColor: "rgba(6,182,212,0.3)" }} />
      ))}

      {/* Glow orb */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", filter: "blur(80px)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1,  y: 0  }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <motion.div
          animate={shake ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(6,182,212,0.2)",
            boxShadow: "0 0 0 1px rgba(6,182,212,0.06), 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Top bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0891b2, #06b6d4, #22d3ee)" }} />

          <div className="px-8 pt-8 pb-9 flex flex-col gap-7">

            {/* Header */}
            <div className="flex flex-col gap-3">
              {/* Terminal icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: "#06b6d4" }}>
                    GreenKart
                  </span>
                  <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>
                    /
                  </span>
                  <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Admin
                  </span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: "#f0f9ff", letterSpacing: "-0.03em" }}>
                  Control Panel
                </h1>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Restricted access — authorised personnel only
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-[0.15em] uppercase" style={{ color: "rgba(6,182,212,0.7)" }}>
                  Username
                </label>
                <div className="relative">
                  <input
                    ref={usernameRef}
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    autoComplete="username"
                    spellCheck={false}
                    placeholder="admin"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(6,182,212,0.18)",
                      color: "#e0f2fe",
                      fontFamily: "inherit",
                      caretColor: "#06b6d4",
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(6,182,212,0.5)")}
                    onBlur={e  => (e.target.style.borderColor = "rgba(6,182,212,0.18)")}
                  />
                  {/* blinking cursor indicator */}
                  {username === '' && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 w-0.5 h-4 animate-pulse"
                      style={{ background: "rgba(6,182,212,0.5)" }} />
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-[0.15em] uppercase" style={{ color: "rgba(6,182,212,0.7)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(6,182,212,0.18)",
                      color: "#e0f2fe",
                      fontFamily: "inherit",
                      caretColor: "#06b6d4",
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(6,182,212,0.5)")}
                    onBlur={e  => (e.target.style.borderColor = "rgba(6,182,212,0.18)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y:  0, height: "auto" }}
                    exit={{   opacity: 0, y: -4, height: 0 }}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs overflow-hidden"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(252,165,165,0.9)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting || !username.trim() || !password.trim()}
                whileHover={!submitting ? { scale: 1.01 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all mt-1"
                style={{
                  background: (submitting || !username.trim() || !password.trim())
                    ? "rgba(6,182,212,0.08)"
                    : "linear-gradient(135deg, #0891b2, #06b6d4)",
                  color: (submitting || !username.trim() || !password.trim())
                    ? "rgba(6,182,212,0.3)"
                    : "#080c10",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: (!submitting && username.trim() && password.trim())
                    ? "0 4px 20px rgba(6,182,212,0.25)"
                    : "none",
                }}
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    AUTHENTICATING
                  </>
                ) : (
                  <>
                    AUTHENTICATE
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(6,182,212,0.08)", background: "rgba(6,182,212,0.02)" }}>
            <span className="text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>
              SECURE ACCESS
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
              <span className="text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
                SYSTEM ONLINE
              </span>
            </div>
          </div>
        </motion.div>

        {/* Version tag */}
        <p className="text-center mt-4 text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.1)" }}>
          GREENKART ADMIN v1.0 · INTERNAL USE ONLY
        </p>
      </motion.div>
    </div>
  );
}