/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/address/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Address } from '@/context/AuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

/* ─────────────────────────────────────────
   Icons
───────────────────────────────────────── */
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

/* ─────────────────────────────────────────
   GPS hook — same logic as register page
───────────────────────────────────────── */
function useGPS(onFill: (fields: Partial<FormFields>) => void) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const detect = useCallback(async () => {
    setError(''); setSuccess(false);
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'GreenKart/1.0' } }
          );
          const data = await res.json();
          const a    = data.address ?? {};
          const line1Parts = [a.house_number, a.road ?? a.street ?? a.pedestrian, a.neighbourhood ?? a.suburb].filter(Boolean);
          const line2Parts = [a.village ?? a.town ?? a.residential, a.county ?? a.state_district].filter(Boolean);
          onFill({
            line1:   line1Parts.join(', ') || undefined,
            line2:   line2Parts.join(', ') || undefined,
            city:    a.city ?? a.town ?? a.village ?? a.county ?? undefined,
            pincode: (a.postcode ?? '').replace(/[^0-9]/g, '').slice(0, 6) || undefined,
          });
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch { setError('Could not fetch address. Please fill manually.'); }
        finally  { setLoading(false); }
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) setError('Location permission denied.');
        else setError('Location unavailable. Fill manually.');
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  }, [onFill]);

  return { detect, loading, error, success };
}

/* ─────────────────────────────────────────
   Form types
───────────────────────────────────────── */
interface FormFields {
  line1:   string;
  line2:   string;
  city:    string;
  pincode: string;
}
const emptyForm = (): FormFields => ({ line1: '', line2: '', city: '', pincode: '' });

/* ─────────────────────────────────────────
   Address Form (add / edit)
───────────────────────────────────────── */
function AddressForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial?: FormFields;
  onSave:   (fields: FormFields) => void;
  onCancel: () => void;
  saving:   boolean;
  error:    string;
}) {
  const [fields, setFields] = useState<FormFields>(initial ?? emptyForm());
  const set = (k: keyof FormFields) => (v: string) => setFields(f => ({ ...f, [k]: v }));

  const gps = useGPS(partial => {
    setFields(f => ({
      line1:   partial.line1   ?? f.line1,
      line2:   partial.line2   ?? f.line2,
      city:    partial.city    ?? f.city,
      pincode: partial.pincode ?? f.pincode,
    }));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(fields);
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border:     "1px solid rgba(255,255,255,0.1)",
    outline:    "none",
    color:      "#fff",
    width:      "100%",
    borderRadius: "0.75rem",
    padding:    "0.875rem 1rem",
    fontSize:   "0.875rem",
    fontFamily: "'Poppins', sans-serif",
    transition: "border-color 0.2s",
  };

  const focusHandler   = (e: any) => (e.target.style.borderColor = "rgba(74,222,128,0.45)");
  const blurHandler    = (e: any) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

  const Label = ({ text }: { text: string }) => (
    <label className="text-[10px] font-semibold tracking-widest uppercase font-roboto" style={{ color: "rgba(255,255,255,0.3)" }}>
      {text}
    </label>
  );

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{   opacity: 0, y: 10  }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4"
    >
      {/* GPS button */}
      <motion.button
        type="button"
        onClick={gps.detect}
        disabled={gps.loading}
        whileHover={!gps.loading ? { scale: 1.015 } : {}}
        whileTap={!gps.loading ? { scale: 0.97 } : {}}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
        style={{
          background: gps.success ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
          border: gps.success ? "1px solid rgba(74,222,128,0.3)" : "1px dashed rgba(255,255,255,0.14)",
          cursor: gps.loading ? "not-allowed" : "pointer",
        }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: gps.success ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}>
          {gps.loading ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : gps.success ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8" strokeDasharray="2 3"/>
            </svg>
          )}
        </div>
        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-xs font-semibold font-poppins"
            style={{ color: gps.success ? "#4ade80" : "rgba(255,255,255,0.6)" }}>
            {gps.loading ? "Detecting…" : gps.success ? "Location detected!" : "Use current location"}
          </span>
          <span className="text-[10px] font-roboto" style={{ color: "rgba(255,255,255,0.25)" }}>
            {gps.success ? "Review fields below" : "Auto-fill from GPS"}
          </span>
        </div>
        {!gps.loading && !gps.success && (
          <svg className="ml-auto" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        )}
      </motion.button>

      {/* GPS error */}
      <AnimatePresence>
        {gps.error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="text-xs font-roboto px-1" style={{ color: "rgba(251,191,36,0.75)" }}>
            ⚠ {gps.error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        <span className="text-[9px] font-semibold tracking-widest uppercase font-roboto" style={{ color: "rgba(255,255,255,0.18)" }}>or fill manually</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>

      {/* Line 1 */}
      <div className="flex flex-col gap-1.5">
        <Label text="Street Address *" />
        <input
          value={fields.line1}
          onChange={e => set('line1')(e.target.value)}
          placeholder="House No., Street, Area"
          required
          style={inputStyle}
          onFocus={focusHandler} onBlur={blurHandler}
        />
      </div>

      {/* Line 2 */}
      <div className="flex flex-col gap-1.5">
        <Label text="Landmark / Colony" />
        <input
          value={fields.line2}
          onChange={e => set('line2')(e.target.value)}
          placeholder="Near temple, Colony name (optional)"
          style={inputStyle}
          onFocus={focusHandler} onBlur={blurHandler}
        />
      </div>

      {/* City + Pincode */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label text="City *" />
          <input
            value={fields.city}
            onChange={e => set('city')(e.target.value)}
            placeholder="Your city"
            required
            style={inputStyle}
            onFocus={focusHandler} onBlur={blurHandler}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label text="Pincode *" />
          <input
            value={fields.pincode}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              set('pincode')(v);
            }}
            placeholder="6-digit pin"
            required
            inputMode="numeric"
            style={inputStyle}
            onFocus={focusHandler} onBlur={blurHandler}
          />
        </div>
      </div>

      {/* API error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs font-roboto"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", color: "rgba(255,160,160,0.85)" }}
          >
            <svg className="mt-0.5 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <motion.button
          type="button"
          onClick={onCancel}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold font-poppins"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          disabled={saving}
          whileHover={!saving ? { scale: 1.02 } : {}}
          whileTap={!saving ? { scale: 0.97 } : {}}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold font-poppins flex items-center justify-center gap-2"
          style={{
            background: saving ? "rgba(200,234,188,0.5)" : "linear-gradient(135deg, #e8f5e0, #c8eabc)",
            color: "#082e28",
            boxShadow: saving ? "none" : "0 4px 16px rgba(74,222,128,0.12)",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Saving…
            </>
          ) : "Save Address"}
        </motion.button>
      </div>
    </motion.form>
  );
}

/* ─────────────────────────────────────────
   Address Card
───────────────────────────────────────── */
function AddressCard({
  address,
  onEdit,
}: {
  address: Address;
  onEdit:  () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{   opacity: 0, y: 14,  scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
            <PinIcon />
          </div>
        </div>

        {/* Edit button only */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onEdit}
          title="Edit"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-poppins transition-all"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <EditIcon /> Edit
        </motion.button>
      </div>

      {/* Address text */}
      <div className="pl-9">
        <p className="text-sm font-roboto leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          {address.line1}
          {address.line2 ? <>, <span style={{ color: "rgba(255,255,255,0.4)" }}>{address.line2}</span></> : ''}
        </p>
        <p className="text-xs font-roboto mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {address.city} — {address.pincode}
        </p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
type Mode = 'list' | { edit: Address };

export default function AddressPage() {
  const { accessToken, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [addresses,       setAddresses]       = useState<Address[]>([]);
  const [pageLoading,     setPageLoading]      = useState(true);
  const [mode,      setMode]     = useState<Mode>('list');
  const [saving,    setSaving]   = useState(false);
  const [formError, setFormError] = useState('');
  const [toast,     setToast]    = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  /* ── Auth guard ── */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login?from=/address');
  }, [authLoading, isAuthenticated, router]);

  /* ── Fetch addresses ── */
  const fetchAddresses = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res  = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const json = await res.json();
      const raw  = json?.data?.user ?? json?.data ?? json?.user ?? {};
      setAddresses(Array.isArray(raw?.addresses) ? raw.addresses : []);
    } catch {}
    finally { setPageLoading(false); }
  }, [accessToken]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  /* ── Update ── */
  const handleUpdate = async (id: string, fields: FormFields) => {
    setSaving(true); setFormError('');
    try {
      const res  = await fetch(`${API}/users/me/addresses/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify(fields),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json.message || 'Failed to update address.'); return; }
      await fetchAddresses();
      setMode('list');
      showToast('Address updated');
    } catch { setFormError('Network error. Please try again.'); }
    finally   { setSaving(false); }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}>
        <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.6)" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    );
  }

  const isEdit   = typeof mode === 'object';
  const editAddr = isEdit ? (mode as { edit: Address }).edit : null;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}>

      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-64 rounded-full opacity-40"
          style={{ background: "radial-gradient(ellipse, #0d5c54, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4"
        style={{
          background: "rgba(8,26,22,0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => isEdit ? setMode('list') : router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white/80 transition-colors"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <BackIcon />
        </motion.button>

        <div className="flex flex-col items-center">
          <span className="text-base font-semibold font-playfair" style={{ color: "rgba(255,255,255,0.82)" }}>
            {isEdit ? 'Edit Address' : 'Addresses'}
          </span>
          {mode === 'list' && addresses.length > 0 && (
            <span className="text-[10px] font-roboto" style={{ color: "rgba(255,255,255,0.28)" }}>
              {addresses.length} saved
            </span>
          )}
        </div>

        <div className="w-9" />
      </motion.header>

      <main className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-lg mx-auto">

        <AnimatePresence mode="wait">

          {/* ── List view ── */}
          {mode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              {addresses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-5 py-24 text-center"
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-semibold font-playfair" style={{ color: "rgba(255,255,255,0.45)" }}>No addresses yet</p>
                    <p className="text-sm font-roboto mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>Add your delivery address to checkout faster</p>
                  </div>

                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {addresses.map(addr => (
                    <AddressCard
                      key={addr._id}
                      address={addr}
                      onEdit={() => { setFormError(''); setMode({ edit: addr }); }}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {/* ── Edit form ── */}
          {isEdit && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl p-5 sm:p-6"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(16px)",
              }}
            >
              <AddressForm
                initial={editAddr ? { line1: editAddr.line1, line2: editAddr.line2 ?? '', city: editAddr.city, pincode: editAddr.pincode } : undefined}
                onSave={fields => editAddr && handleUpdate(editAddr._id, fields)}
                onCancel={() => setMode('list')}
                saving={saving}
                error={formError}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>


      {/* Success / error toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-roboto max-w-xs"
            style={{
              background: "rgba(10,28,24,0.95)",
              border: "1px solid rgba(74,222,128,0.2)",
              color: "rgba(74,222,128,0.9)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px)",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}