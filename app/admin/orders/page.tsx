// app/admin/orders/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminShell, { STATUS_STYLE, ALL_STATUSES } from '@/app/admin/components/AdminShell';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

interface Order {
  _id: string; orderId: string; status: string; totalAmount: number;
  createdAt: string; items: any[]; shippingAddress: any;
  userId?: any; user?: any; payment?: any;
  itemsTotal: number; shippingCharge: number; discount: number;
}

/* ── Status pill + dropdown ── */
function StatusSelect({ orderId, current, token, onUpdated }: {
  orderId: string; current: string; token: string | null;
  onUpdated: (id: string, status: string) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const s = STATUS_STYLE[current] ?? STATUS_STYLE.pending;

  const update = async (status: string) => {
    if (status === current) { setOpen(false); return; }
    setLoading(true); setOpen(false);
    try {
      await fetch(`${API}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      onUpdated(orderId, status);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold capitalize transition-all"
        style={{ background: s.bg, color: s.text, border: `1px solid ${s.text}33` }}>
        {loading
          ? <div className="w-2.5 h-2.5 border border-current/30 border-t-current rounded-full animate-spin" />
          : <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />}
        <span>{current}</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:-4, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-4, scale:0.97 }}
            className="absolute top-full mt-1 left-0 z-30 rounded-xl overflow-hidden shadow-2xl"
            style={{ background:'#0d1117', border:'1px solid rgba(6,182,212,0.15)', minWidth:140 }}>
            {ALL_STATUSES.map(st => {
              const ss = STATUS_STYLE[st];
              return (
                <button key={st} onClick={() => update(st)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] capitalize font-medium text-left hover:bg-white/5 transition-colors"
                  style={{ color: st === current ? ss.text : 'rgba(255,255,255,0.45)' }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ss.dot }} />
                  {st}
                  {st === current && <svg className="ml-auto" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Order detail bottom sheet ── */
function OrderSheet({ order, token, onClose, onStatusUpdate }: {
  order: Order; token: string | null;
  onClose: () => void; onStatusUpdate: (id: string, status: string) => void;
}) {
  const addr = order.shippingAddress ?? {};
  const user = order.userId ?? order.user ?? {};
  const phone = user.phoneNumber ?? '';

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
      style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)' }} onClick={onClose}>
      <motion.div
        initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', stiffness:320, damping:32 }}
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ background:'#0d1117', border:'1px solid rgba(6,182,212,0.15)', fontFamily:"'IBM Plex Mono', monospace" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-sm font-bold" style={{ color:'#06b6d4' }}>{order.orderId}</p>
            <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>
              {new Date(order.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"
            style={{ color:'rgba(255,255,255,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">

          {/* Status */}
          <div className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] tracking-widest uppercase" style={{ color:'rgba(255,255,255,0.3)' }}>Status</span>
            <StatusSelect orderId={order._id} current={order.status} token={token} onUpdated={onStatusUpdate} />
          </div>

          {/* Customer + call button */}
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background:'rgba(6,182,212,0.1)', color:'#06b6d4', border:'1px solid rgba(6,182,212,0.2)' }}>
                {user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color:'#e0f2fe' }}>{user.name ?? '—'}</p>
                {phone && (
                  <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.4)' }}>+91 {phone}</p>
                )}
              </div>
            </div>
            {/* Call button — tapping on mobile opens the dialer */}
            {phone && (
              <a href={`tel:+91${phone.replace(/\D/g,'')}`}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
                style={{ background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.06 2.22 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                </svg>
                <span className="text-[10px] font-bold">CALL</span>
              </a>
            )}
          </div>

          {/* Address */}
          <div className="rounded-2xl px-4 py-3"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-widest uppercase mb-2" style={{ color:'rgba(255,255,255,0.25)' }}>Delivery Address</p>
            <p className="text-xs leading-relaxed" style={{ color:'rgba(255,255,255,0.55)' }}>
              {[addr.line1, addr.line2, addr.city, addr.pincode].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Items */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-widest uppercase px-4 py-3"
              style={{ color:'rgba(255,255,255,0.25)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              Items ({order.items?.length ?? 0})
            </p>
            {(order.items ?? []).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < (order.items?.length ?? 0)-1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                {item.image && <img src={item.image} alt={item.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate" style={{ color:'rgba(255,255,255,0.7)' }}>{item.name}</p>
                  <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.3)' }}>×{item.quantity}</p>
                </div>
                <p className="text-xs font-semibold shrink-0" style={{ color:'#4ade80' }}>
                  ₹{(item.lineTotal ?? item.priceAtBuy * item.quantity)?.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          {/* Bill */}
          <div className="rounded-2xl px-4 py-3 flex flex-col gap-2"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {[
              { l:'Subtotal',  v:`₹${(order.itemsTotal ?? 0).toLocaleString('en-IN')}` },
              { l:'Shipping',  v: order.shippingCharge === 0 ? 'Free' : `₹${order.shippingCharge}` },
              ...(order.discount > 0 ? [{ l:'Discount', v:`-₹${order.discount}` }] : []),
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between text-[11px]">
                <span style={{ color:'rgba(255,255,255,0.3)' }}>{l}</span>
                <span style={{ color:'rgba(255,255,255,0.6)' }}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1 text-sm font-bold"
              style={{ borderTop:'1px solid rgba(255,255,255,0.06)', color:'#4ade80' }}>
              <span style={{ color:'rgba(255,255,255,0.7)' }}>Total</span>
              <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment method */}
          {order.payment && (
            <div className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] tracking-widest uppercase" style={{ color:'rgba(255,255,255,0.25)' }}>Payment</span>
              <span className="text-[11px] font-semibold" style={{ color: order.payment?.status === 'paid' ? '#4ade80' : '#fbbf24' }}>
                {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online'} · {order.payment?.status}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Order card ── */
function OrderCard({ order, token, onStatusUpdate, onOpen }: {
  order: Order; token: string | null;
  onStatusUpdate: (id: string, status: string) => void;
  onOpen: () => void;
}) {
  const user  = order.userId ?? order.user ?? {};
  const phone = user.phoneNumber ?? '';
  const s     = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;

  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      whileTap={{ scale:0.99 }}
      className="rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-colors active:bg-white/[0.03]"
      style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.06)' }}
      onClick={onOpen}>

      {/* Top row: order ID + amount */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold" style={{ color:'#06b6d4' }}>{order.orderId ?? order._id?.slice(-8).toUpperCase()}</p>
          <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
          </p>
        </div>
        <p className="text-sm font-bold shrink-0" style={{ color:'#4ade80' }}>
          ₹{order.totalAmount?.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Customer row + call */}
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
        {/* Direct call link */}
        {phone && (
          <a href={`tel:+91${phone.replace(/\D/g,'')}`}
            onClick={e => e.stopPropagation()}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)' }}
            title={`Call +91 ${phone}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.06 2.22 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
          </a>
        )}
      </div>

      {/* Bottom row: items count + status dropdown */}
      <div className="flex items-center justify-between gap-2 pt-1"
        style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.3)' }}>
          {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
          {order.payment?.method === 'cod'
            ? <span className="ml-2 px-1.5 py-0.5 rounded" style={{ background:'rgba(251,191,36,0.08)', color:'rgba(251,191,36,0.6)' }}>COD</span>
            : <span className="ml-2 px-1.5 py-0.5 rounded" style={{ background:'rgba(96,165,250,0.08)', color:'rgba(96,165,250,0.6)' }}>Online</span>
          }
        </span>
        <div onClick={e => e.stopPropagation()}>
          <StatusSelect orderId={order._id} current={order.status} token={token} onUpdated={onStatusUpdate} />
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminOrdersPage() {
  const { accessToken } = useAdminAuth();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [stats,    setStats]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 12;

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [oRes, sRes] = await Promise.all([
        fetch(`${API}/admin/orders?limit=100`,       { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/admin/orders/stats`,  { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const [oJson, sJson] = await Promise.all([oRes.json(), sRes.json()]);
      setOrders(oJson?.data?.orders ?? oJson?.data ?? []);
      setStats(sJson?.data ?? null);
    } catch {} finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = (id: string, status: string) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    if (selected?._id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const user = o.userId ?? o.user ?? {};
    const matchSearch = !q || o.orderId?.toLowerCase().includes(q) || (user.name ?? '').toLowerCase().includes(q) || (user.phoneNumber ?? '').includes(q);
    return matchStatus && matchSearch;
  });

  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <AdminShell title="Orders">

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { l:'Total',     v: stats.totalOrders ?? orders.length, c:'#06b6d4' },
            { l:'Pending',   v: stats.byStatus?.pending   ?? 0,     c:'#fbbf24' },
            { l:'Delivered', v: stats.byStatus?.delivered ?? 0,     c:'#4ade80' },
            { l:'Cancelled', v: stats.byStatus?.cancelled ?? 0,     c:'#f87171' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-2xl px-4 py-3" style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-2xl font-bold" style={{ color:c }}>{v}</p>
              <p className="text-[10px] tracking-wide mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search order, customer or phone..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none"
          style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', color:'#e0f2fe', fontFamily:"'IBM Plex Mono',monospace", caretColor:'#06b6d4' }} />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 flex-wrap mb-4 overflow-x-auto pb-1">
        {['all', ...ALL_STATUSES].map(st => {
          const ss = STATUS_STYLE[st];
          const active = filter === st;
          return (
            <button key={st} onClick={() => { setFilter(st); setPage(1); }}
              className="px-3 py-1.5 rounded-xl text-[10px] font-medium capitalize tracking-wide transition-all shrink-0"
              style={{
                background: active ? (ss?.bg ?? 'rgba(6,182,212,0.12)') : 'rgba(255,255,255,0.03)',
                color:      active ? (ss?.text ?? '#06b6d4')              : 'rgba(255,255,255,0.3)',
                border:     active ? `1px solid ${ss?.text ?? '#06b6d4'}44` : '1px solid rgba(255,255,255,0.06)',
              }}>
              {st}
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {paginated.map((o, i) => (
                <motion.div key={o._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.03 }}>
                  <OrderCard order={o} token={accessToken} onStatusUpdate={handleStatusUpdate} onOpen={() => setSelected(o)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {paginated.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="2"/>
              </svg>
              <p className="text-xs" style={{ color:'rgba(255,255,255,0.2)' }}>No orders found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.2)' }}>
                {filtered.length} orders · page {page}/{totalPages}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: p === page ? 'rgba(6,182,212,0.15)' : 'transparent',
                      color:      p === page ? '#06b6d4'               : 'rgba(255,255,255,0.3)',
                      border:     p === page ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
                    }}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom sheet */}
      <AnimatePresence>
        {selected && (
          <OrderSheet order={selected} token={accessToken}
            onClose={() => setSelected(null)} onStatusUpdate={handleStatusUpdate} />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}