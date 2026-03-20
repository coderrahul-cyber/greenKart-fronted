// app/register/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/* ─── Eye icon ── */
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

/* ─── Checkbox ── */
function Checkbox({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5">
      <div className="flex items-center justify-center shrink-0 rounded-md transition-all"
        style={{ width: 18, height: 18,
          background: checked ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1.5px solid ${checked ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.15)'}` }}>
        {checked && (
          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="10" height="10" viewBox="0 0 12 12" fill="none">
            <polyline points="2 6 5 9 10 3" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        )}
      </div>
      <span className="text-xs font-roboto select-none" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
    </button>
  );
}

/* ─── Error modal ── */
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  const isDuplicate   = /already|registered/i.test(message);
  const isServiceArea = /8km|deliver|service area/i.test(message);
  const color = isServiceArea ? '249,115,22' : isDuplicate ? '96,165,250' : '248,113,113';
  const title = isServiceArea ? 'Outside Delivery Area' : isDuplicate ? 'Account Already Exists' : 'Registration Failed';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ background: 'rgba(4,14,11,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0e1e1a,#121e1b)',
          border: `1px solid rgba(${color},0.2)`, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `rgba(${color},0.1)`, border: `1px solid rgba(${color},0.2)` }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke={`rgba(${color},0.9)`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold font-playfair" style={{ color: 'rgba(255,255,255,0.9)' }}>{title}</h3>
          <p className="text-sm font-roboto" style={{ color: 'rgba(255,255,255,0.45)' }}>{message}</p>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-semibold font-poppins"
            style={{ background: 'linear-gradient(135deg,#e8f5e0,#c8eabc)', color: '#082e28' }}>
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Input field ── */
function Field({ label, value, onChange, placeholder, type = 'text', suffix, required = true }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; suffix?: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold tracking-widest uppercase text-white/35 font-roboto">{label}</label>
      <div className="relative">
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className="w-full rounded-xl px-4 py-3.5 text-sm font-poppins text-white placeholder-white/20 outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            paddingRight: suffix ? '3.5rem' : undefined }}
          onFocus={e => (e.target.style.borderColor = 'rgba(74,222,128,0.45)')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
        {suffix && <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">{suffix}</div>}
      </div>
    </div>
  );
}

/* ─── Step dot ── */
function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="w-2 h-2 rounded-full transition-all duration-300" style={{
      background: done ? '#4ade80' : active ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.15)',
      boxShadow: active ? '0 0 8px rgba(74,222,128,0.5)' : 'none',
      transform: active ? 'scale(1.35)' : 'scale(1)',
    }} />
  );
}

/* ─── Password strength ── */
function useStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return {
    score: s,
    label: ['', 'Weak', 'Fair', 'Good', 'Strong'][s],
    color: ['transparent', '#ef4444', '#f59e0b', '#84cc16', '#4ade80'][s],
  };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  /* ── Fields ── */
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [line1,    setLine1]    = useState('');
  const [line2,    setLine2]    = useState('');
  const [city,     setCity]     = useState('');
  const [pincode,  setPincode]  = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);

  /* ── UI state ── */
  const [step,       setStep]       = useState(0); // 0=personal 1=address 2=password
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [saveLogin,  setSaveLogin]  = useState(false);

  /* ── Geo state ── */
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError,   setGeoError]   = useState('');
  const [geoSuccess, setGeoSuccess] = useState(false);

  const STEPS = 3;
  const pw    = useStrength(password);

  /* ── Step 2 submit ── */
  const handleRegister = async () => {
    if (pw.score < 2) { setError('Please choose a stronger password.'); return; }
    setLoading(true); setError('');
    const res = await register({
      name,
      phoneNumber: phone.replace(/\D/g, ''),
      password,
      address: { line1, line2, city, pincode },
    }, saveLogin);
    setLoading(false);
   if (res.success) {
  if (saveLogin) {
    localStorage.setItem('gk_saved_phone', phone.replace(/\D/g, ''));
    localStorage.setItem('gk_saved_pw', password);
  }
  window.location.href = '/';
  return;
}
    const msg   = res.error || 'Something went wrong. Please try again.';
    const lower = msg.toLowerCase();
    if (lower.includes('phone') || lower.includes('already') || lower.includes('mobile')) {
      setStep(0); setErrorModal(msg);
    } else if (lower.includes('address') || lower.includes('8km') || lower.includes('deliver') || lower.includes('service')) {
      setStep(1); setErrorModal(msg);
    } else {
      setErrorModal(msg);
    }
  };

  /* ── Form submit ── */
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (step === 0) {
      if (!name.trim())                           { setError('Full name is required.'); return; }
      if (!phone.trim())                          { setError('Phone number is required.'); return; }
      if (phone.replace(/\D/g,'').length !== 10)  { setError('Phone number must be exactly 10 digits.'); return; }
      setStep(1);
    } else if (step === 1) {
      if (!line1.trim())                          { setError('Street address is required.'); return; }
      if (!city.trim())                           { setError('City is required.'); return; }
      if (!pincode.trim())                        { setError('Pincode is required.'); return; }
      if (pincode.replace(/\D/g,'').length !== 6) { setError('Pincode must be 6 digits.'); return; }
      setStep(2);
    } else if (step === 2) {
      handleRegister();
    }
  };

  /* ── GPS ── */
  const fetchLocation = async () => {
    setGeoError(''); setGeoSuccess(false);
    if (!navigator.geolocation) { setGeoError('Geolocation not supported.'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'GreenKart/1.0' } }
          );
          const d = await r.json();
          const a = d.address ?? {};
          const l1 = [a.house_number, a.road ?? a.street, a.neighbourhood ?? a.suburb].filter(Boolean).join(', ');
          const l2 = [a.village ?? a.town, a.county ?? a.state_district].filter(Boolean).join(', ');
          if (l1) setLine1(l1);
          if (l2 && !line2) setLine2(l2);
          if (a.city ?? a.town ?? a.village) setCity(a.city ?? a.town ?? a.village ?? '');
          if (a.postcode) setPincode(a.postcode.replace(/\D/g,'').slice(0,6));
          setGeoSuccess(true);
          setTimeout(() => setGeoSuccess(false), 3000);
        } catch { setGeoError('Could not fetch address. Fill manually.'); }
        finally  { setGeoLoading(false); }
      },
      err => {
        setGeoLoading(false);
        setGeoError(err.code === 1 ? 'Location permission denied.' : 'Location unavailable.');
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const slide = {
    enter:  (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(180deg,#081a16 0%,#0a2420 60%,#0c2d28 100%)' }}>

      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-64 rounded-full opacity-50"
          style={{ background: 'radial-gradient(ellipse,#0d5c54,transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#4ade80,transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }} className="relative z-10 mb-8">
        <Link href="/">
          <span className="text-3xl font-semibold select-none font-playfair"
            style={{ background: 'linear-gradient(135deg,#f0f7ee 30%,#86efac 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GreenKart
          </span>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl px-7 py-8 sm:px-9 sm:py-10"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.07)' }}>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase font-roboto"
              style={{ color: 'rgba(74,222,128,0.75)' }}>New here?</span>
            <div className="flex items-end justify-between">
              <h1 className="text-3xl font-semibold text-white font-playfair" style={{ letterSpacing: '-0.02em' }}>
                Create account
              </h1>
              <div className="flex items-center gap-2 mb-1.5">
                {Array.from({ length: STEPS }).map((_, i) => (
                  <StepDot key={i} active={step === i} done={step > i} />
                ))}
              </div>
            </div>
            <p className="text-sm text-white/40 font-roboto">
              {step === 0 && 'Tell us about yourself.'}
              {step === 1 && 'Where should we deliver?'}
              {step === 2 && 'Secure your account.'}
            </p>
          </div>

          <form onSubmit={handleFormSubmit}>
            <AnimatePresence mode="wait" custom={1}>

              {/* Step 0 — Personal */}
              {step === 0 && (
                <motion.div key="s0" custom={1} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: 'easeInOut' }} className="flex flex-col gap-4">
                  <Field label="Full Name" value={name} onChange={setName} placeholder="Mayank joshi" />
                  <Field label="Phone Number" type="tel" value={phone}
                    onChange={v => setPhone(v.replace(/\D/g,'').slice(0,10))}
                    placeholder="9876543210"
                    suffix={
                      <span className="text-xs font-roboto"
                        style={{ color: phone.length === 10 ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.2)' }}>
                        {phone.length}/10
                      </span>
                    } />
                </motion.div>
              )}

              {/* Step 1 — Address */}
              {step === 1 && (
                <motion.div key="s1" custom={1} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: 'easeInOut' }} className="flex flex-col gap-4">

                  {/* GPS button */}
                  <motion.button type="button" onClick={fetchLocation} disabled={geoLoading}
                    whileHover={!geoLoading ? { scale: 1.02 } : {}} whileTap={!geoLoading ? { scale: 0.97 } : {}}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all"
                    style={{ background: geoSuccess ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                      border: geoSuccess ? '1px solid rgba(74,222,128,0.3)' : '1px dashed rgba(255,255,255,0.15)',
                      cursor: geoLoading ? 'not-allowed' : 'pointer' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: geoSuccess ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)' }}>
                      {geoLoading ? (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      ) : geoSuccess ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-sm font-semibold font-poppins"
                        style={{ color: geoSuccess ? '#4ade80' : 'rgba(255,255,255,0.65)' }}>
                        {geoLoading ? 'Detecting…' : geoSuccess ? 'Location detected!' : 'Use current location'}
                      </span>
                      <span className="text-[11px] font-roboto" style={{ color: 'rgba(255,255,255,0.28)' }}>
                        Auto-fill address from GPS
                      </span>
                    </div>
                  </motion.button>
                  {geoError && <p className="text-xs font-roboto" style={{ color: 'rgba(255,120,120,0.8)' }}>{geoError}</p>}

                  <Field label="Address Line 1" value={line1} onChange={setLine1} placeholder="Amaun" />
                  <Field label="Address Line 2 (optional)" value={line2} onChange={setLine2}
                    placeholder="Amaun" required={false} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City" value={city} onChange={setCity} placeholder="khatima" />
                    <Field label="Pincode" type="tel" value={pincode} 
                      onChange={v => setPincode(v.replace(/\D/g,'').slice(0,6))} placeholder="262308" />
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Password */}
              {step === 2 && (
                <motion.div key="s2" custom={1} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: 'easeInOut' }} className="flex flex-col gap-4">

                  {/* Summary pill */}
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#0d5c54,#4ade80)', color: '#fff' }}>
                      {name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/80 font-poppins truncate">{name}</p>
                      <p className="text-xs text-white/35 font-roboto">+91 {phone}</p>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-widest uppercase text-white/35 font-roboto">Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                        className="w-full rounded-xl px-4 py-3.5 pr-12 text-sm font-poppins text-white placeholder-white/20 outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(74,222,128,0.45)')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        <EyeIcon open={showPw} />
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1">
                          {[1,2,3,4].map(i => (
                            <motion.div key={i} className="flex-1 h-1 rounded-full"
                              animate={{ background: i <= pw.score ? pw.color : 'rgba(255,255,255,0.1)' }}
                              transition={{ duration: 0.25 }} />
                          ))}
                        </div>
                        <span className="text-xs font-roboto" style={{ color: pw.color }}>{pw.label}</span>
                      </div>
                    )}
                  </div>

                  <Checkbox checked={saveLogin} onChange={setSaveLogin}
                    label="Save my login details for next time" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="overflow-hidden mt-4">
                  <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-roboto"
                    style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)',
                      color: 'rgba(255,140,140,0.9)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <motion.button type="button" whileTap={{ scale: 0.95 }}
                  onClick={() => { setError(''); setStep(s => s - 1); }}
                  className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.55)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </motion.button>
              )}
              <motion.button type="submit" disabled={loading}
                whileHover={!loading ? { scale: 1.015, boxShadow: '0 8px 30px rgba(74,222,128,0.2)' } : {}}
                whileTap={!loading ? { scale: 0.975 } : {}}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-sm font-poppins flex items-center justify-center gap-2"
                style={{ background: loading ? 'rgba(200,234,188,0.5)' : 'linear-gradient(135deg,#e8f5e0,#c8eabc)',
                  color: '#082e28', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(74,222,128,0.1),inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                {loading ? (
                  <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Creating account…</>
                ) : (
                  <>
                    {step < STEPS - 1 ? 'Continue' : 'Create Account'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-white/35 font-roboto">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-green-400/80 hover:text-green-400 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {errorModal && <ErrorModal message={errorModal} onClose={() => setErrorModal('')} />}
      </AnimatePresence>
    </div>
  );
}