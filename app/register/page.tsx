// app/register/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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

/* ── Full-screen error modal for backend errors ── */
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  // Classify the error to show the right icon + colour
  const isServiceArea = message.toLowerCase().includes('8km') || message.toLowerCase().includes('deliver') || message.toLowerCase().includes('service');
  const isDuplicate   = message.toLowerCase().includes('already') || message.toLowerCase().includes('registered');
  const isAddress     = message.toLowerCase().includes('address') || message.toLowerCase().includes('verify');

  const icon = isServiceArea ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(249,115,22,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    </svg>
  ) : isDuplicate ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );

  const accentColor = isServiceArea ? 'rgba(249,115,22,0.9)' : isDuplicate ? 'rgba(96,165,250,0.9)' : 'rgba(248,113,113,0.9)';
  const accentBg    = isServiceArea ? 'rgba(249,115,22,0.1)' : isDuplicate ? 'rgba(96,165,250,0.1)' : 'rgba(248,113,113,0.1)';
  const accentBorder= isServiceArea ? 'rgba(249,115,22,0.2)' : isDuplicate ? 'rgba(96,165,250,0.2)' : 'rgba(248,113,113,0.2)';
  const title       = isServiceArea ? "Outside Delivery Area" : isDuplicate ? "Account Already Exists" : isAddress ? "Address Not Verified" : "Registration Failed";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ background: "rgba(4,14,11,0.8)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0,  opacity: 1, scale: 1    }}
        exit={{   y: 50, opacity: 0, scale: 0.95  }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0e1e1a 0%, #121e1b 100%)",
          border: `1px solid ${accentBorder}`,
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon + title */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold font-playfair" style={{ color: "rgba(255,255,255,0.9)" }}>
              {title}
            </h3>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 pb-2">
          <p className="text-sm font-roboto text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            {message}
          </p>
        </div>

        {/* Action */}
        <div className="px-6 pb-6 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm font-poppins transition-all"
            style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}
          >
            {isDuplicate ? "Try a different account" : isServiceArea ? "Update address" : "Got it"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Reusable input field
function Field({
  label, type = 'text', value, onChange, placeholder, suffix, multiline = false, required = true,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  suffix?: React.ReactNode; multiline?: boolean; required?: boolean;
}) {
  const sharedStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const sharedClass = "w-full rounded-xl px-4 py-3.5 text-sm font-poppins text-white placeholder-white/20 outline-none transition-all resize-none";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold tracking-widest uppercase text-white/35 font-roboto">{label}</label>
      <div className="relative">
        {multiline ? (
          <textarea
            required={required}
            rows={3}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={sharedClass}
            style={sharedStyle}
            onFocus={e => (e.target.style.borderColor = "rgba(74,222,128,0.45)")}
            onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        ) : (
          <input
            type={type}
            required={required}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={sharedClass}
            style={{ ...sharedStyle, paddingRight: suffix ? '3rem' : undefined }}
            onFocus={e => (e.target.style.borderColor = "rgba(74,222,128,0.45)")}
            onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        )}
        {suffix && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
    </div>
  );
}

// Password strength
function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: '',       color: 'transparent' },
    { label: 'Weak',   color: '#ef4444'     },
    { label: 'Fair',   color: '#f59e0b'     },
    { label: 'Good',   color: '#84cc16'     },
    { label: 'Strong', color: '#4ade80'     },
  ];
  return { score, ...map[score] };
}

// Step indicator
function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className="w-2 h-2 rounded-full transition-all duration-300"
      style={{
        background: done ? '#4ade80' : active ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.15)',
        boxShadow: active ? '0 0 8px rgba(74,222,128,0.5)' : 'none',
        transform: active ? 'scale(1.35)' : 'scale(1)',
      }}
    />
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  // Fields
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [line1,    setLine1]    = useState('');
  const [line2,    setLine2]    = useState('');
  const [city,     setCity]     = useState('');
  const [pincode,  setPincode]  = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);

  // UI state
  const [step,    setStep]    = useState(0); // 0 = personal, 1 = address, 2 = password
  const [loading, setLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [errorModal, setErrorModal] = useState(''); // backend errors shown as modal

  // Geolocation state
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [geoError,    setGeoError]    = useState('');
  const [geoSuccess,  setGeoSuccess]  = useState(false);

  const pw = strength(password);
  const STEPS = 3;

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── Step 0 validation ──
    if (step === 0) {
      if (!name.trim())  { setError('Full name is required.'); return; }
      if (!email.trim()) { setError('Email address is required.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
      if (!phone.trim()) { setError('Phone number is required.'); return; }
      if (phone.replace(/\D/g, '').length !== 10) { setError('Phone number must be exactly 10 digits.'); return; }
      setStep(s => s + 1);
      return;
    }

    // ── Step 1 validation — address is required ──
    if (step === 1) {
      if (!line1.trim())   { setError('Street address (Line 1) is required.'); return; }
      if (!city.trim())    { setError('City is required.'); return; }
      if (!pincode.trim()) { setError('Pincode is required.'); return; }
      if (pincode.replace(/\D/g, '').length !== 6) { setError('Pincode must be 6 digits.'); return; }
      setStep(s => s + 1);
      return;
    }

    // ── Step 2: submit ──
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (pw.score < 2) { setError('Please choose a stronger password.'); return; }
    setLoading(true);
    const res = await register({
      name,
      email,
      phoneNumber: phone.replace(/\D/g, ''),
      password,
      address: { line1, line2, city, pincode },
    });
    setLoading(false);
    if (res.success) {
      router.push('/');
      return;
    }

    const msg = res.error || 'Something went wrong. Please try again.';

    // Jump to the relevant step so the user can fix the right field
    const lower = msg.toLowerCase();
    if (lower.includes('phone') || lower.includes('mobile')) {
      setStep(0);
      setErrorModal(msg);
    } else if (lower.includes('email')) {
      setStep(0);
      setErrorModal(msg);
    } else if (lower.includes('address') || lower.includes('verify') || lower.includes('8km') || lower.includes('deliver') || lower.includes('service')) {
      setStep(1);
      setErrorModal(msg);
    } else {
      setErrorModal(msg);
    }
  };

  /* ── Reverse geocode using OpenStreetMap Nominatim (free, no key) ── */
  const fetchLocation = async () => {
    setGeoError('');
    setGeoSuccess(false);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'GreenKart/1.0' } }
          );
          const data = await res.json();
          const a = data.address ?? {};

          // Build line1 from available parts
          const line1Parts = [
            a.house_number,
            a.road ?? a.street ?? a.pedestrian ?? a.footway,
            a.neighbourhood ?? a.suburb ?? a.quarter,
          ].filter(Boolean);

          const line2Parts = [
            a.village ?? a.town ?? a.residential,
            a.county ?? a.state_district,
          ].filter(Boolean);

          const detectedCity    = a.city ?? a.town ?? a.village ?? a.county ?? '';
          const detectedPincode = a.postcode ?? '';
          const detectedLine1   = line1Parts.join(', ');
          const detectedLine2   = line2Parts.join(', ');

          // Only overwrite empty fields so user edits aren't lost
          if (detectedLine1) setLine1(detectedLine1);
          if (detectedLine2 && !line2) setLine2(detectedLine2);
          if (detectedCity)    setCity(detectedCity);
          if (detectedPincode) setPincode(detectedPincode.replace(/[^0-9]/g, '').slice(0, 6));

          setGeoSuccess(true);
          setTimeout(() => setGeoSuccess(false), 3000);
        } catch {
          setGeoError('Could not fetch address. Please fill manually.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) setGeoError('Location permission denied. Please allow access and try again.');
        else if (err.code === 2) setGeoError('Location unavailable. Please fill address manually.');
        else setGeoError('Location request timed out. Please try again.');
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit:  (dir: number) => ({ opacity: 0, x: dir * -40 }),
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-64 rounded-full opacity-50"
          style={{ background: "radial-gradient(ellipse, #0d5c54, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)", filter: "blur(50px)" }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
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

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1,  y: 0,  scale: 1    }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="rounded-3xl px-7 py-8 sm:px-9 sm:py-10 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Header */}
          <div className="mb-6 flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase font-roboto"
              style={{ color: "rgba(74,222,128,0.75)" }}>
              New here?
            </span>
            <div className="flex items-end justify-between">
              <h1 className="text-3xl font-semibold text-white font-playfair" style={{ letterSpacing: "-0.02em" }}>
                Create account
              </h1>
              {/* Step dots */}
              <div className="flex items-center gap-2 mb-1.5">
                {Array.from({ length: STEPS }).map((_, i) => (
                  <StepDot key={i} active={step === i} done={step > i} />
                ))}
              </div>
            </div>
            <p className="text-sm text-white/40 font-roboto">
              {step === 0 && "Tell us a bit about yourself."}
              {step === 1 && "Where should we deliver?"}
              {step === 2 && "Secure your account."}
            </p>
          </div>

          {/* Step content — slides left/right */}
          <form onSubmit={nextStep}>
            <AnimatePresence mode="wait" custom={1}>
              {step === 0 && (
                <motion.div
                  key="step0"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="flex flex-col gap-4"
                >
                  <Field label="Full Name"    value={name}  onChange={setName}  placeholder="Rahul Singh" />
                  <Field label="Email"        type="email"  value={email} onChange={setEmail} placeholder="you@example.com" />
                  <Field
                    label="Phone Number *"
                    type="tel"
                    value={phone}
                    onChange={v => {
                      // Strip non-digits, cap at 10 characters
                      const digits = v.replace(/\D/g, '').slice(0, 10);
                      setPhone(digits);
                    }}
                    placeholder="9876543210"
                    suffix={
                      <span className="text-xs font-semibold font-roboto pointer-events-none"
                        style={{ color: phone.length === 10 ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.2)' }}>
                        {phone.length}/10
                      </span>
                    }
                  />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="flex flex-col gap-4"
                >
                  {/* Address preview card */}
                  {/* GPS auto-fill button */}
                  <motion.button
                    type="button"
                    onClick={fetchLocation}
                    disabled={geoLoading}
                    whileHover={!geoLoading ? { scale: 1.02 } : {}}
                    whileTap={!geoLoading ? { scale: 0.97 } : {}}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all"
                    style={{
                      background: geoSuccess
                        ? "rgba(74,222,128,0.1)"
                        : "rgba(255,255,255,0.05)",
                      border: geoSuccess
                        ? "1px solid rgba(74,222,128,0.3)"
                        : "1px dashed rgba(255,255,255,0.15)",
                      cursor: geoLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: geoSuccess
                          ? "rgba(74,222,128,0.18)"
                          : geoLoading
                            ? "rgba(74,222,128,0.08)"
                            : "rgba(255,255,255,0.08)",
                        border: geoSuccess
                          ? "1px solid rgba(74,222,128,0.3)"
                          : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {geoLoading ? (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                      ) : geoSuccess ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                          <circle cx="12" cy="12" r="8" strokeDasharray="2 3"/>
                        </svg>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex flex-col gap-0.5 text-left">
                      <span
                        className="text-sm font-semibold font-poppins transition-colors"
                        style={{ color: geoSuccess ? "#4ade80" : "rgba(255,255,255,0.65)" }}
                      >
                        {geoLoading ? "Detecting location…" : geoSuccess ? "Location detected!" : "Use my current location"}
                      </span>
                      <span className="text-[11px] font-roboto" style={{ color: "rgba(255,255,255,0.28)" }}>
                        {geoLoading ? "Fetching address from GPS…" : geoSuccess ? "Fields filled — review and edit if needed" : "Auto-fill address from GPS"}
                      </span>
                    </div>

                    {/* Arrow */}
                    {!geoLoading && !geoSuccess && (
                      <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    )}
                  </motion.button>

                  {/* Geo error */}
                  <AnimatePresence>
                    {geoError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs font-roboto"
                          style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.15)", color: "rgba(251,191,36,0.8)" }}>
                          <svg className="mt-0.5 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          {geoError}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                    <span className="text-[10px] font-semibold tracking-widest uppercase font-roboto" style={{ color: "rgba(255,255,255,0.2)" }}>or fill manually</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                  </div>

                  <Field
                    label="Street Address *"
                    value={line1}
                    onChange={setLine1}
                    placeholder="House / Flat No., Street, Area"
                  />
                  <Field
                    label="Landmark / Colony"
                    value={line2}
                    onChange={setLine2}
                    placeholder="Near temple, Colony name (optional)"
                    required={false}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="City *"
                      value={city}
                      onChange={setCity}
                      placeholder="Your city"
                    />
                    <Field
                      label="Pincode *"
                      type="tel"
                      value={pincode}
                      onChange={v => { if (/^\d{0,6}$/.test(v)) setPincode(v); }}
                      placeholder="6-digit pin"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="flex flex-col gap-4"
                >
                  {/* Summary pill */}
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-poppins shrink-0"
                      style={{ background: "linear-gradient(135deg, #0d5c54, #4ade80)", color: "#fff" }}
                    >
                      {name ? name[0].toUpperCase() : "?"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white/80 font-poppins truncate">{name}</span>
                      <span className="text-xs text-white/35 font-roboto truncate">{email}</span>
                    </div>
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

                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1">
                          {[1,2,3,4].map(i => (
                            <motion.div
                              key={i}
                              className="flex-1 h-1 rounded-full"
                              animate={{ background: i <= pw.score ? pw.color : 'rgba(255,255,255,0.1)' }}
                              transition={{ duration: 0.25 }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-roboto" style={{ color: pw.color }}>{pw.label}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{   opacity: 0, y: -6, height: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <div
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-roboto"
                    style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", color: "rgba(255,140,140,0.9)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              {/* Back button (steps 1 & 2) */}
              {step > 0 && (
                <motion.button
                  type="button"
                  onClick={() => { setError(''); setStep(s => s - 1); }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl transition-all font-poppins"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </motion.button>
              )}

              {/* Next / Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.015, boxShadow: "0 8px 30px rgba(74,222,128,0.2)" } : {}}
                whileTap={!loading ? { scale: 0.975 } : {}}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-sm font-poppins flex items-center justify-center gap-2 transition-all"
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
                    Creating account…
                  </>
                ) : step < STEPS - 1 ? (
                  <>
                    Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                ) : (
                  <>
                    Create Account
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Backend error modal */}
      <AnimatePresence>
        {errorModal && (
          <ErrorModal
            message={errorModal}
            onClose={() => {
              setErrorModal('');
              // If address error, stay on step 1 so user can fix it
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}