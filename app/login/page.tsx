// app/login/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const SAVED_EMAIL_KEY = 'gk_saved_email';
const SAVED_PW_KEY    = 'gk_saved_pw';

/* ── Icons ── */
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ── Custom checkbox ── */
function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 group"
    >
      <div
        className="w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          width: 18, height: 18,
          background: checked ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1.5px solid ${checked ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.15)'}`,
        }}
      >
        {checked && (
          <motion.svg
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            width="10" height="10" viewBox="0 0 12 12" fill="none"
          >
            <polyline points="2 6 5 9 10 3" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        )}
      </div>
      <span className="text-xs font-roboto select-none" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
    </button>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [hasSaved,   setHasSaved]   = useState(false); // whether saved creds exist

  /* ── On mount: restore saved credentials if they exist ── */
  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    const savedPw    = localStorage.getItem(SAVED_PW_KEY);
    if (savedEmail && savedPw) {
      setEmail(savedEmail);
      setPassword(savedPw);
      setRememberMe(true);
      setHasSaved(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password, rememberMe);
    setLoading(false);

    if (res.success) {
      // Save or clear credentials based on checkbox
      if (rememberMe) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
        localStorage.setItem(SAVED_PW_KEY,    password);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
        localStorage.removeItem(SAVED_PW_KEY);
      }
      router.push(from);
    } else {
      setError(res.error || 'Something went wrong');
    }
  };

  const clearSaved = () => {
    localStorage.removeItem(SAVED_EMAIL_KEY);
    localStorage.removeItem(SAVED_PW_KEY);
    setEmail('');
    setPassword('');
    setRememberMe(false);
    setHasSaved(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-md"
    >
      <div
        className="rounded-3xl px-7 py-8 sm:px-9 sm:py-10"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-widest uppercase font-roboto"
            style={{ color: "rgba(74,222,128,0.75)" }}>
            Welcome back
          </span>
          <h1 className="text-3xl font-semibold text-white font-playfair" style={{ letterSpacing: "-0.02em" }}>
            Sign in
          </h1>
          <p className="text-sm text-white/40 font-roboto">Fresh groceries are waiting for you.</p>
        </div>

        {/* Saved credentials banner */}
        <AnimatePresence>
          {hasSaved && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0,  height: 'auto' }}
              exit={{   opacity: 0, y: -8,  height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div
                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: 'rgba(74,222,128,0.07)',
                  border: '1px solid rgba(74,222,128,0.18)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(74,222,128,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <p className="text-xs font-roboto truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Saved as <span style={{ color: 'rgba(74,222,128,0.8)' }}>{email}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSaved}
                  className="shrink-0 text-[10px] font-semibold font-roboto px-2.5 py-1 rounded-lg transition-colors"
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-widest uppercase text-white/35 font-roboto">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setHasSaved(false); }}
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-3.5 text-sm font-poppins text-white placeholder-white/20 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(74,222,128,0.45)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-widest uppercase text-white/35 font-roboto">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3.5 pr-12 text-sm font-poppins text-white placeholder-white/20 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={e => (e.target.style.borderColor = "rgba(74,222,128,0.45)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          {/* Remember me row */}
          <div className="flex items-center justify-between">
            <Checkbox
              checked={rememberMe}
              onChange={setRememberMe}
              label="Remember me"
            />
            {/* Placeholder for forgot password link */}
            {/* <Link href="/forgot-password" className="text-xs font-roboto" style={{ color: 'rgba(74,222,128,0.6)' }}>
              Forgot password?
            </Link> */}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{   opacity: 0, y: -6  }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-roboto"
                style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", color: "rgba(255,140,140,0.9)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.015, boxShadow: "0 8px 30px rgba(74,222,128,0.2)" } : {}}
            whileTap={!loading ? { scale: 0.975 } : {}}
            className="mt-1 w-full py-4 rounded-2xl font-semibold text-sm font-poppins flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading ? "rgba(200,234,188,0.5)" : "linear-gradient(135deg, #e8f5e0 0%, #c8eabc 100%)",
              color: "#082e28",
              boxShadow: "0 4px 20px rgba(74,222,128,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-white/35 font-roboto">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-green-400/80 hover:text-green-400 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-64 rounded-full opacity-50"
          style={{ background: "radial-gradient(ellipse, #0d5c54, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.45 }}
        className="relative z-10 mb-8"
      >
        <Link href="/">
          <span
            className="text-3xl font-semibold select-none font-playfair"
            style={{
              background: "linear-gradient(135deg, #f0f7ee 30%, #86efac 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GreenKart
          </span>
        </Link>
      </motion.div>

      <div className="relative z-10 w-full flex justify-center">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}