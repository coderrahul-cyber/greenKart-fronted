// app/admin/payments/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminShell from '@/app/admin/components/AdminShell';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

const PS: Record<string, { bg: string; text: string }> = {
  pending:   { bg:'rgba(251,191,36,0.1)',  text:'#fbbf24' },
  paid:      { bg:'rgba(74,222,128,0.1)',  text:'#4ade80' },
  failed:    { bg:'rgba(239,68,68,0.1)',   text:'#f87171' },
  refunded:  { bg:'rgba(156,163,175,0.1)', text:'#9ca3af' },
  cancelled: { bg:'rgba(239,68,68,0.08)',  text:'#f87171' },
};

interface Payment {
  _id: string; method: string; status: string; amount: number;
  orderId?: any; userId?: any; createdAt: string;
  razorpayOrderId?: string; razorpayPaymentId?: string;
}

/* ── Payment detail bottom sheet ── */
function PaymentSheet({ payment, token, onClose }: { payment: Payment; token: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/payments/${payment._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setDetail(j?.data?.payment ?? j?.data ?? null)).catch(() => {});
  }, [payment._id, token]);

  const s     = PS[payment.status] ?? PS.pending;
  const order = detail?.orderId ?? payment.orderId ?? {};
  const user  = detail?.userId  ?? payment.userId  ?? {};
  const phone = user?.phoneNumber ?? '';

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
      style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)' }} onClick={onClose}>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', stiffness:320, damping:32 }}
        className="w-full sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{ background:'#0d1117', border:'1px solid rgba(6,182,212,0.15)', fontFamily:"'IBM Plex Mono',monospace" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background:'rgba(255,255,255,0.15)' }} />
        </div>

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-xs font-bold" style={{ color:'#06b6d4' }}>Payment Details</p>
            <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>
              {new Date(payment.createdAt).toLocaleString('en-IN', { day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5" style={{ color:'rgba(255,255,255,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Amount */}
          <div className="rounded-2xl p-5 text-center" style={{ background:s.bg, border:`1px solid ${s.text}22` }}>
            <p className="text-4xl font-bold" style={{ color:s.text }}>₹{payment.amount?.toLocaleString('en-IN')}</p>
            <span className="text-[10px] font-bold tracking-widest mt-1 capitalize block" style={{ color:s.text }}>{payment.status}</span>
          </div>

          {/* Customer + call */}
          {user?.name && (
            <div className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color:'#e0f2fe' }}>{user.name}</p>
                {phone && <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.4)' }}>+91 {phone}</p>}
              </div>
              {phone && (
                <a href={`tel:+91${phone.replace(/\D/g,'')}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-all"
                  style={{ background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.06 2.22 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                  </svg>
                  <span className="text-[10px] font-bold">CALL</span>
                </a>
              )}
            </div>
          )}

          {/* Details */}
          <div className="rounded-2xl px-4 py-3 flex flex-col gap-2.5"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {[
              { l:'Method',    v: payment.method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)' },
              { l:'Order ID',  v: order?.orderId ?? order?._id?.slice(-8) ?? '—' },
              ...(payment.razorpayPaymentId ? [{ l:'Razorpay ID', v: payment.razorpayPaymentId }] : []),
              ...(payment.razorpayOrderId   ? [{ l:'Rzp Order',  v: payment.razorpayOrderId   }] : []),
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between gap-2 text-[11px]">
                <span style={{ color:'rgba(255,255,255,0.3)' }}>{l}</span>
                <span className="text-right truncate max-w-[60%]" style={{ color:'rgba(255,255,255,0.65)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Payment card ── */
function PaymentCard({ payment, onOpen }: { payment: Payment; onOpen: () => void }) {
  const s     = PS[payment.status] ?? PS.pending;
  const user  = payment.userId ?? {};
  const phone = user?.phoneNumber ?? '';

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      whileTap={{ scale:0.99 }}
      className="rounded-2xl p-4 flex flex-col gap-3 cursor-pointer"
      style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.06)' }}
      onClick={onOpen}>

      {/* Top: amount + status */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold" style={{ color: payment.status === 'paid' ? '#4ade80' : s.text }}>
            ₹{payment.amount?.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>
            {new Date(payment.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold capitalize"
          style={{ background:s.bg, color:s.text }}>{payment.status}</span>
      </div>

      {/* Customer + call */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background:'rgba(6,182,212,0.1)', color:'#06b6d4' }}>
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold truncate" style={{ color:'#e0f2fe' }}>{user.name ?? '—'}</p>
            {phone && <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.35)' }}>+91 {phone}</p>}
          </div>
        </div>
        {phone && (
          <a href={`tel:+91${phone.replace(/\D/g,'')}`}
            onClick={e => e.stopPropagation()}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all"
            style={{ background:'rgba(74,222,128,0.08)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.15)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.06 2.22 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
          </a>
        )}
      </div>

      {/* Method */}
      <div className="flex items-center gap-1.5 pt-2" style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {payment.method === 'cod'
            ? <span className="px-1.5 py-0.5 rounded" style={{ background:'rgba(251,191,36,0.08)', color:'rgba(251,191,36,0.6)' }}>COD</span>
            : <span className="px-1.5 py-0.5 rounded" style={{ background:'rgba(96,165,250,0.08)', color:'rgba(96,165,250,0.6)' }}>Razorpay</span>
          }
        </span>
        <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
        <span className="text-[10px] font-mono" style={{ color:'rgba(255,255,255,0.25)' }}>
          {payment._id.slice(-10).toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
}

export default function AdminPaymentsPage() {
  const { accessToken } = useAdminAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats,    setStats]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 12;

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

  const filtered = payments.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || (p.userId?.name ?? '').toLowerCase().includes(q)
      || (p.userId?.phoneNumber ?? '').includes(q) || p._id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // Compute stats from data if API stats shape differs
  const totalRevenue = stats?.totalCollected ?? payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount ?? 0), 0);
  const countByStatus = (st: string) => {
    if (stats?.byStatus) {
      const found = stats.byStatus.find((s: any) => s._id === st);
      return found?.count ?? 0;
    }
    return payments.filter(p => p.status === st).length;
  };

  return (
    <AdminShell title="Payments">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l:'Revenue',  v:`₹${totalRevenue.toLocaleString('en-IN')}`, c:'#4ade80' },
          { l:'Paid',     v: countByStatus('paid'),                      c:'#06b6d4' },
          { l:'Pending',  v: countByStatus('pending'),                   c:'#fbbf24' },
          { l:'Failed',   v: countByStatus('failed'),                    c:'#f87171' },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-2xl px-4 py-3" style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xl font-bold truncate" style={{ color:c }}>{v}</p>
            <p className="text-[10px] tracking-wide mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customer or ID..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none"
          style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', color:'#e0f2fe', fontFamily:"'IBM Plex Mono',monospace", caretColor:'#06b6d4' }} />
      </div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {['all','paid','pending','failed','refunded'].map(st => {
          const ss = PS[st]; const active = filter === st;
          return (
            <button key={st} onClick={() => { setFilter(st); setPage(1); }}
              className="px-3 py-1.5 rounded-xl text-[10px] font-medium capitalize tracking-wide transition-all shrink-0"
              style={{ background: active ? (ss?.bg ?? 'rgba(6,182,212,0.12)') : 'rgba(255,255,255,0.03)', color: active ? (ss?.text ?? '#06b6d4') : 'rgba(255,255,255,0.3)', border: active ? `1px solid ${ss?.text ?? '#06b6d4'}44` : '1px solid rgba(255,255,255,0.06)' }}>
              {st}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginated.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.02 }}>
                <PaymentCard payment={p} onOpen={() => setSelected(p)} />
              </motion.div>
            ))}
          </div>
          {paginated.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <p className="text-xs" style={{ color:'rgba(255,255,255,0.2)' }}>No payments found</p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.2)' }}>{filtered.length} payments · page {page}/{totalPages}</span>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg text-[10px] font-medium transition-all"
                    style={{ background: p === page ? 'rgba(6,182,212,0.15)' : 'transparent', color: p === page ? '#06b6d4' : 'rgba(255,255,255,0.3)', border: p === page ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selected && <PaymentSheet payment={selected} token={accessToken} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </AdminShell>
  );
}