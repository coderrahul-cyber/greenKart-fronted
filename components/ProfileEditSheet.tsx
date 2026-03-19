// app/profile/components/ProfileEditSheet.tsx
// Bottom sheet for editing user name.
// Phone number is intentionally read-only.
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const API = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`
  : 'http://localhost:4000/api/v1';

interface Props {
  currentName: string;
  phoneNumber: string;
  accessToken: string | null;
  onClose:   () => void;
  onSuccess: (updatedName: string) => void;
}

export default function ProfileEditSheet({ currentName, phoneNumber, accessToken, onClose, onSuccess }: Props) {
  const [name,    setName]    = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* ── Reset when opened with a fresh currentName ── */
  useEffect(() => { setName(currentName); setError(''); }, [currentName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed)           { setError('Name cannot be empty.'); return; }
    if (trimmed === currentName) { onClose(); return; }   // nothing changed

    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/users/me`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials : "include",
        body:    JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to update profile. Please try again.');
        return;
      }
      onSuccess(trimmed);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{   opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(4,14,11,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{   y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background:    'linear-gradient(160deg,#0d1f1b,#0a1916)',
          border:        '1px solid rgba(255,255,255,0.09)',
          boxShadow:     '0 -24px 60px rgba(0,0,0,0.5)',
          fontFamily:    "'DM Sans', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-base font-semibold font-playfair" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Edit Profile
            </h2>
            <p className="text-xs mt-0.5 font-roboto" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Update your display name
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Name field — editable */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold tracking-widest uppercase font-roboto"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Your name"
              maxLength={60}
              autoFocus
              className="w-full rounded-2xl px-4 py-3.5 text-base font-poppins text-white placeholder-white/20 outline-none transition-all"
              style={{
                background:   'rgba(255,255,255,0.06)',
                border:       '1.5px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(74,222,128,0.5)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Phone — read-only, clearly labelled */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold tracking-widest uppercase font-roboto"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              Phone Number
            </label>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border:     '1.5px solid rgba(255,255,255,0.06)',
              }}>
              <span className="text-base font-poppins" style={{ color: 'rgba(255,255,255,0.4)' }}>
                +91 {phoneNumber}
              </span>
              <span className="ml-auto text-[10px] font-semibold tracking-wider rounded-full px-2.5 py-1 font-roboto"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
                LOCKED
              </span>
            </div>
            <p className="text-[11px] font-roboto" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Phone number cannot be changed.
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-roboto"
                style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.18)',
                  color: 'rgba(255,140,140,0.9)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl text-sm font-semibold font-poppins transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color:      'rgba(255,255,255,0.5)',
                border:     '1px solid rgba(255,255,255,0.08)',
              }}>
              Cancel
            </motion.button>

            <motion.button
              whileHover={!loading ? { scale: 1.015, boxShadow: '0 8px 28px rgba(74,222,128,0.2)' } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="flex-1 py-3.5 rounded-2xl text-sm font-semibold font-poppins flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading || !name.trim()
                  ? 'rgba(200,234,188,0.35)'
                  : 'linear-gradient(135deg,#e8f5e0,#c8eabc)',
                color:  '#082e28',
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                boxShadow: !loading && name.trim() ? '0 4px 16px rgba(74,222,128,0.12)' : 'none',
              }}>
              {loading ? (
                <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Saving…</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>Save Changes</>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}