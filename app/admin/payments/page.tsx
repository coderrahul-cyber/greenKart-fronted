// app/admin/payments/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminShell from '@/app/admin/components/AdminShell';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  pending:  { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
  paid:     { bg: 'rgba(74,222,128,0.1)',  text: '#4ade80', border: 'rgba(74,222,128,0.25)'  },
  failed:   { bg: 'rgba(239,68,68,0.1)',   text: '#f87171', border: 'rgba(239,68,68,0.25)'   },
  refunded: { bg: 'rgba(156,163,175,0.1)', text: '#9ca3af', border: 'rgba(156,163,175,0.25)' },
};

const STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded'] as const;
type PaymentStatus = typeof STATUS_OPTIONS[number];

const STATUS_ICONS: Record<string, JSX.Element> = {
  pending: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  paid: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  failed: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  refunded: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
    </svg>
  ),
};

interface Payment {
  _id: string; method: string; status: string; amount: number;
  orderId?: any; userId?: any; createdAt: string; paidAt?: string;
  razorpayOrderId?: string; razorpayPaymentId?: string; transactionId?: string;
}

// ── COD Confirm Button ────────────────────────────────────────────────────────
function CodConfirmButton({
  payment, token, onConfirmed,
}: {
  payment: Payment;
  token: string | null;
  onConfirmed: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  // Only show for COD payments that are not yet paid or refunded
  const canConfirm =
    payment.method === 'cod' &&
    payment.status !== 'paid' &&
    payment.status !== 'refunded';

  if (!canConfirm) return null;

  const handleConfirm = async () => {
    if (!token || confirming) return;
    setConfirming(true); setError('');
    try {
      const res = await fetch(`${API}/payments/${payment._id}/cod-confirm`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? 'Failed to confirm');
      setDone(true);
      onConfirmed(payment._id);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {error && (
          <motion.p key="err"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[10px] text-center py-1.5 px-3 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleConfirm}
        disabled={confirming || done}
        whileHover={!confirming && !done ? { scale: 1.01 } : {}}
        whileTap={!confirming && !done ? { scale: 0.97 } : {}}
        className="w-full py-3 rounded-xl text-[11px] font-bold tracking-wider flex items-center justify-center gap-2.5 transition-all"
        style={{
          background: done
            ? 'rgba(74,222,128,0.1)'
            : confirming
              ? 'rgba(74,222,128,0.08)'
              : 'linear-gradient(135deg, #15803d, #22c55e)',
          color:  done ? '#4ade80' : confirming ? 'rgba(74,222,128,0.4)' : '#052e16',
          border: done ? '1px solid rgba(74,222,128,0.25)' : 'none',
          cursor: confirming || done ? 'not-allowed' : 'pointer',
          boxShadow: (!confirming && !done) ? '0 4px 20px rgba(34,197,94,0.25)' : 'none',
        }}
      >
        {confirming ? (
          <>
            <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(74,222,128,0.2)', borderTopColor: '#22c55e' }} />
            Confirming Payment…
          </>
        ) : done ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Payment Confirmed
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              <line x1="6" y1="15" x2="10" y2="15" strokeWidth="2.5"/>
            </svg>
            Confirm COD Payment
          </>
        )}
      </motion.button>
    </div>
  );
}

// ── Status Selector ───────────────────────────────────────────────────────────
function StatusSelector({
  paymentId, currentStatus, token, onUpdated,
}: {
  paymentId: string; currentStatus: string;
  token: string | null;
  onUpdated: (id: string, newStatus: string) => void;
}) {
  const [status,  setStatus]  = useState(currentStatus);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [changed, setChanged] = useState(false);

  // Sync if parent updates status (e.g. after COD confirm)
  useEffect(() => {
    setStatus(currentStatus);
    setChanged(false);
  }, [currentStatus]);

  const handleChange = (val: string) => {
    setStatus(val); setChanged(val !== currentStatus);
    setError(''); setSuccess(false);
  };

  const handleSave = async () => {
    if (!token || !changed) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/admin/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? 'Failed');
      setSuccess(true); setChanged(false);
      onUpdated(paymentId, status);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e: any) {
      setError(e.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const s = PAYMENT_STATUS_STYLE[status] ?? PAYMENT_STATUS_STYLE.pending;

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: 'rgba(6,182,212,0.6)' }}>
          Update Status
        </p>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize"
          style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
          <span>{STATUS_ICONS[status]}</span>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STATUS_OPTIONS.map(opt => {
          const style  = PAYMENT_STATUS_STYLE[opt];
          const active = status === opt;
          return (
            <motion.button key={opt} whileTap={{ scale: 0.97 }} onClick={() => handleChange(opt)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-medium capitalize transition-all"
              style={{
                background: active ? style.bg  : 'rgba(255,255,255,0.02)',
                color:      active ? style.text : 'rgba(255,255,255,0.3)',
                border:     active ? `1px solid ${style.border}` : '1px solid rgba(255,255,255,0.06)',
                boxShadow:  active ? `0 0 12px ${style.bg}` : 'none',
              }}>
              <span style={{ color: active ? style.text : 'rgba(255,255,255,0.2)' }}>{STATUS_ICONS[opt]}</span>
              {opt}
              {active && (
                <svg className="ml-auto" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[10px] text-center py-1.5 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
            ⚠ {error}
          </motion.p>
        )}
        {success && (
          <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[10px] text-center py-1.5 rounded-lg"
            style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
            ✓ Status updated successfully
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button onClick={handleSave} disabled={!changed || saving}
        whileHover={changed && !saving ? { scale: 1.01 } : {}}
        whileTap={changed && !saving ? { scale: 0.98 } : {}}
        className="w-full py-2.5 rounded-xl text-[11px] font-semibold tracking-wider flex items-center justify-center gap-2 transition-all"
        style={{
          background: (!changed || saving) ? 'rgba(6,182,212,0.05)' : 'linear-gradient(135deg, #0891b2, #06b6d4)',
          color:      (!changed || saving) ? 'rgba(6,182,212,0.25)' : '#080c10',
          cursor:     (!changed || saving) ? 'not-allowed' : 'pointer',
          boxShadow:  (changed && !saving) ? '0 4px 16px rgba(6,182,212,0.2)' : 'none',
        }}>
        {saving ? (
          <>
            <div className="w-3 h-3 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(6,182,212,0.2)', borderTopColor: '#06b6d4' }} />
            Saving…
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Status
          </>
        )}
      </motion.button>
    </div>
  );
}

// ── Payment Drawer ─────────────────────────────────────────────────────────────
function PaymentDrawer({
  payment, token, onClose, onStatusUpdated, onCodConfirmed,
}: {
  payment: Payment; token: string | null;
  onClose: () => void;
  onStatusUpdated: (id: string, status: string) => void;
  onCodConfirmed: (id: string) => void;
}) {
  const [detail,       setDetail]       = useState<any>(null);
  const [livePayment,  setLivePayment]  = useState<Payment>(payment);

  useEffect(() => { setLivePayment(payment); }, [payment]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/payments/${payment._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setDetail(j?.data?.payment ?? j?.data ?? null)).catch(() => {});
  }, [payment._id, token]);

  const handleCodConfirmed = (id: string) => {
    setLivePayment(p => ({ ...p, status: 'paid' }));
    onCodConfirmed(id);
  };

  const handleStatusUpdated = (id: string, newStatus: string) => {
    setLivePayment(p => ({ ...p, status: newStatus }));
    onStatusUpdated(id, newStatus);
  };

  const s     = PAYMENT_STATUS_STYLE[livePayment.status] ?? PAYMENT_STATUS_STYLE.pending;
  const order = detail?.orderId ?? payment.orderId ?? {};
  const user  = detail?.userId  ?? payment.userId  ?? {};
  const isCod = livePayment.method === 'cod';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-start justify-end"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-sm h-screen overflow-y-auto"
        style={{ background: '#0d1117', borderLeft: '1px solid rgba(6,182,212,0.15)', fontFamily: "'IBM Plex Mono', monospace" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold" style={{ color: '#06b6d4' }}>Payment Details</p>
              {isCod && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-widest"
                  style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                  COD
                </span>
              )}
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {new Date(payment.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Amount card */}
          <div className="rounded-xl p-5 text-center relative overflow-hidden"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="absolute inset-0 opacity-20"
              style={{ background: `radial-gradient(circle at 50% 0%, ${s.text}, transparent 70%)` }} />
            <p className="text-3xl font-bold relative" style={{ color: s.text }}>
              ₹{livePayment.amount?.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 relative">
              <span style={{ color: s.text }}>{STATUS_ICONS[livePayment.status]}</span>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: s.text }}>
                {livePayment.status}
              </span>
            </div>
          </div>

          {/* COD confirm — shown prominently above info when applicable */}
          {isCod && livePayment.status !== 'paid' && livePayment.status !== 'refunded' && (
            <div className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>Cash on Delivery</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Mark as paid once cash has been collected from the customer.
                  </p>
                </div>
              </div>
              <CodConfirmButton
                payment={livePayment}
                token={token}
                onConfirmed={handleCodConfirmed}
              />
            </div>
          )}

          {/* COD already confirmed banner */}
          {isCod && livePayment.status === 'paid' && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="text-[10px]" style={{ color: '#4ade80' }}>
                COD payment collected and confirmed
              </p>
            </div>
          )}

          {/* Payment info */}
          <div className="rounded-xl p-4 flex flex-col gap-2.5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-[0.18em] uppercase mb-1" style={{ color: 'rgba(6,182,212,0.4)' }}>
              Details
            </p>
            {[
              { l: 'Method',     v: isCod ? 'Cash on Delivery' : 'Online (Razorpay)' },
              { l: 'Order ID',   v: order?.orderId ?? order?._id?.slice(-8) ?? '—' },
              { l: 'Customer',   v: user?.name  ?? '—' },
              { l: 'Email',      v: user?.email ?? '—' },
              ...(payment.transactionId      ? [{ l: 'Transaction',  v: payment.transactionId      }] : []),
              ...(payment.razorpayPaymentId  ? [{ l: 'Razorpay ID',  v: payment.razorpayPaymentId  }] : []),
              ...(payment.razorpayOrderId    ? [{ l: 'Rzp Order',    v: payment.razorpayOrderId    }] : []),
              ...(payment.paidAt             ? [{ l: 'Paid At',      v: new Date(payment.paidAt).toLocaleString('en-IN') }] : []),
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between gap-2 text-[11px]">
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</span>
                <span className="text-right truncate max-w-[55%]" style={{ color: 'rgba(255,255,255,0.65)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Generic status updater */}
          <StatusSelector
            paymentId={livePayment._id}
            currentStatus={livePayment.status}
            token={token}
            onUpdated={handleStatusUpdated}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminPaymentsPage() {
  const { accessToken } = useAdminAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats,    setStats]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 15;

  const fetchPayments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${API}/admin/payments`,       { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/admin/payments/stats`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const [pJson, sJson] = await Promise.all([pRes.json(), sRes.json()]);
      setPayments(pJson?.data?.payments ?? pJson?.data ?? []);
      setStats(sJson?.data ?? null);
    } catch {} finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleStatusUpdated = useCallback((id: string, newStatus: string) => {
    setPayments(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));
    setSelected(prev => prev?._id === id ? { ...prev, status: newStatus } : prev);
  }, []);

  // COD confirm sets status → paid optimistically
  const handleCodConfirmed = useCallback((id: string) => {
    setPayments(prev => prev.map(p => p._id === id ? { ...p, status: 'paid' } : p));
    setSelected(prev => prev?._id === id ? { ...prev, status: 'paid' } : prev);
  }, []);

  const filtered = payments.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (p.userId?.name ?? '').toLowerCase().includes(q)
      || p._id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <AdminShell title="Payments">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { l: 'Total Revenue', v: `₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`, c: '#4ade80' },
            { l: 'Paid',          v: stats.paid    ?? 0, c: '#06b6d4' },
            { l: 'Pending',       v: stats.pending ?? 0, c: '#fbbf24' },
            { l: 'Failed',        v: stats.failed  ?? 0, c: '#f87171' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-xl p-4"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xl font-bold" style={{ color: c }}>{v}</p>
              <p className="text-[10px] tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', color: '#e0f2fe', fontFamily: "'IBM Plex Mono', monospace", caretColor: '#06b6d4' }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'paid', 'pending', 'failed', 'refunded'].map(st => {
            const s = PAYMENT_STATUS_STYLE[st];
            const active = filter === st;
            return (
              <button key={st} onClick={() => { setFilter(st); setPage(1); }}
                className="px-3 py-2 rounded-xl text-[10px] font-medium capitalize tracking-wide transition-all"
                style={{
                  background: active ? (s?.bg ?? 'rgba(6,182,212,0.12)') : 'rgba(255,255,255,0.03)',
                  color:      active ? (s?.text ?? '#06b6d4')             : 'rgba(255,255,255,0.3)',
                  border:     active ? `1px solid ${s?.border ?? '#06b6d4'}` : '1px solid rgba(255,255,255,0.06)',
                }}>
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Payment ID', 'Customer', 'Amount', 'Method', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium tracking-widest text-[9px] uppercase"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => {
                  const s   = PAYMENT_STATUS_STYLE[p.status] ?? PAYMENT_STATUS_STYLE.pending;
                  const cod = p.method === 'cod';
                  return (
                    <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onClick={() => setSelected(p)}>
                      <td className="px-4 py-3 font-medium text-[10px]" style={{ color: '#06b6d4' }}>
                        {p._id.slice(-10)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: '#e0f2fe' }}>{p.userId?.name ?? '—'}</p>
                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{p.userId?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#4ade80' }}>
                        ₹{p.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-[10px]"
                          style={{ color: cod ? '#fbbf24' : 'rgba(255,255,255,0.45)' }}>
                          {cod ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                          )}
                          {cod ? 'COD' : 'Online'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 w-fit px-2 py-1 rounded-full text-[9px] font-semibold capitalize"
                          style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                          <span>{STATUS_ICONS[p.status]}</span>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        {/* Inline COD badge in table for quick identification */}
                        {cod && p.status !== 'paid' && p.status !== 'refunded' ? (
                          <span className="px-2 py-1 rounded-lg text-[9px] font-bold tracking-wide"
                            style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                            CONFIRM
                          </span>
                        ) : (
                          <button className="px-2.5 py-1.5 rounded-lg text-[9px] font-medium hover:bg-cyan-500/10 transition-colors"
                            style={{ color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>
                            VIEW
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {filtered.length} payments · page {page}/{totalPages}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: p === page ? 'rgba(6,182,212,0.15)' : 'transparent',
                    color:      p === page ? '#06b6d4'               : 'rgba(255,255,255,0.3)',
                    border:     p === page ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <PaymentDrawer
            payment={selected}
            token={accessToken}
            onClose={() => setSelected(null)}
            onStatusUpdated={handleStatusUpdated}
            onCodConfirmed={handleCodConfirmed}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}