// app/admin/orders/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminShell, { STATUS_STYLE, ALL_STATUSES } from '@/app/admin/components/AdminShell';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

interface Order {
  _id: string; orderId: string; status: string; totalAmount: number;
  itemsTotal: number; shippingCharge: number; discount: number;
  createdAt: string; items: any[]; shippingAddress: any;
  userId?: any; user?: any; payment?: any;
}

/* ── Status dropdown ── */
function StatusSelect({ orderId, current, token, onUpdated }: {
  orderId: string; current: string; token: string | null;
  onUpdated: (id: string, status: string) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

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

  const s = STATUS_STYLE[current] ?? STATUS_STYLE.pending;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold capitalize transition-all"
        style={{ background: s.bg, color: s.text, border: `1px solid ${s.text}22`, minWidth: 100 }}
      >
        {loading ? (
          <div className="w-2.5 h-2.5 border border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
        )}
        <span className="flex-1 text-left">{current}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -4, scale: 0.97  }}
            className="absolute top-full mt-1 left-0 z-20 rounded-xl overflow-hidden shadow-xl"
            style={{ background: '#0d1117', border: '1px solid rgba(6,182,212,0.15)', minWidth: 140 }}
          >
            {ALL_STATUSES.map(st => {
              const ss = STATUS_STYLE[st];
              return (
                <button key={st} onClick={() => update(st)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] capitalize font-medium text-left transition-colors hover:bg-white/5"
                  style={{ color: st === current ? ss.text : 'rgba(255,255,255,0.5)' }}>
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

/* ── Order detail drawer ── */
function OrderDrawer({ order, token, onClose, onStatusUpdate }: {
  order: Order; token: string | null;
  onClose: () => void; onStatusUpdate: (id: string, status: string) => void;
}) {
  const addr = order.shippingAddress ?? {};
  const user = order.userId ?? order.user ?? {};

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-start justify-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md h-screen overflow-y-auto flex flex-col"
        style={{ background: '#0d1117', borderLeft: '1px solid rgba(6,182,212,0.15)', fontFamily: "'IBM Plex Mono', monospace" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <p className="text-xs font-bold" style={{ color: '#06b6d4' }}>{order.orderId}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Status */}
          <div className="flex flex-col gap-2">
            <p className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Order Status</p>
            <StatusSelect orderId={order._id} current={order.status} token={token} onUpdated={onStatusUpdate} />
          </div>

          {/* Customer */}
          <div className="rounded-xl p-4 flex flex-col gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Customer</p>
            <p className="text-xs font-semibold" style={{ color: '#e0f2fe' }}>{user.name ?? '—'}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email ?? '—'}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.phoneNumber ?? '—'}</p>
          </div>

          {/* Address */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Delivery Address</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {[addr.line1, addr.line2, addr.city, addr.pincode].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Items */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-widest uppercase px-4 py-3" style={{ color: 'rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              Items ({order.items?.length ?? 0})
            </p>
            {(order.items ?? []).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: i < (order.items?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover shrink-0"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate" style={{ color: '#e0f2fe' }}>{item.name}</p>
                  <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>×{item.quantity} @ ₹{item.priceAtBuy}</p>
                </div>
                <p className="text-xs font-semibold shrink-0" style={{ color: '#4ade80' }}>₹{item.lineTotal?.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          {/* Bill */}
          <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Bill Summary</p>
            {[
              { l: 'Subtotal',  v: `₹${order.itemsTotal?.toLocaleString('en-IN') ?? 0}` },
              { l: 'Shipping',  v: order.shippingCharge === 0 ? 'Free' : `₹${order.shippingCharge}` },
              { l: 'Discount',  v: order.discount > 0 ? `-₹${order.discount}` : null },
              { l: 'Payment',   v: order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)' },
            ].filter(r => r.v !== null).map(({ l, v }) => (
              <div key={l} className="flex justify-between text-[11px]">
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{l}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-semibold" style={{ color: '#e0f2fe' }}>Total</span>
              <span className="text-sm font-bold" style={{ color: '#4ade80' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ── */
export default function AdminOrdersPage() {
  const { accessToken } = useAdminAuth();
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [stats,      setStats]      = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState<Order | null>(null);
  const [page,       setPage]       = useState(1);
  const PER_PAGE = 15;

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [ordRes, statRes] = await Promise.all([
        fetch(`${API}/admin/orders`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/admin/orders/stats`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const [ordJson, statJson] = await Promise.all([ordRes.json(), statRes.json()]);
      setOrders(ordJson?.data?.orders ?? ordJson?.data ?? []);
      setStats(statJson?.data ?? null);
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
    const matchSearch = !q || (o.orderId?.toLowerCase().includes(q)) ||
      (o.userId?.name ?? o.user?.name ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <AdminShell title="Orders">
      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { l: 'Total',     v: stats.total     ?? orders.length, c: '#06b6d4' },
            { l: 'Pending',   v: stats.pending   ?? 0,             c: '#fbbf24' },
            { l: 'Delivered', v: stats.delivered ?? 0,             c: '#4ade80' },
            { l: 'Cancelled', v: stats.cancelled ?? 0,             c: '#f87171' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xl font-bold" style={{ color: c }}>{v}</p>
              <p className="text-[10px] tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order ID or customer..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', color: '#e0f2fe', fontFamily: "'IBM Plex Mono', monospace", caretColor: '#06b6d4' }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...ALL_STATUSES].map(st => {
            const s = STATUS_STYLE[st];
            const active = filter === st;
            return (
              <button key={st} onClick={() => { setFilter(st); setPage(1); }}
                className="px-3 py-2 rounded-xl text-[10px] font-medium capitalize tracking-wide transition-all"
                style={{
                  background: active ? (s?.bg ?? 'rgba(6,182,212,0.12)') : 'rgba(255,255,255,0.03)',
                  color:      active ? (s?.text ?? '#06b6d4')             : 'rgba(255,255,255,0.3)',
                  border:     active ? `1px solid ${s?.text ?? '#06b6d4'}33` : '1px solid rgba(255,255,255,0.06)',
                }}>
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Order ID','Customer','Items','Amount','Status','Date','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium tracking-widest text-[9px] uppercase"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map((o, i) => {
                    const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.pending;
                    const user = o.userId ?? o.user ?? {};
                    return (
                      <motion.tr
                        key={o._id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="transition-colors hover:bg-white/[0.02] cursor-pointer"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onClick={() => setSelected(o)}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: '#06b6d4' }}>{o.orderId ?? o._id?.slice(-8)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium" style={{ color: '#e0f2fe' }}>{user.name ?? '—'}</p>
                          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{user.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>{o.items?.length ?? 0}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: '#4ade80' }}>₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <StatusSelect orderId={o._id} current={o.status} token={accessToken} onUpdated={handleStatusUpdate} />
                        </td>
                        <td className="px-4 py-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(o.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <button className="px-2.5 py-1.5 rounded-lg text-[9px] font-medium tracking-wide transition-colors hover:bg-cyan-500/10"
                            style={{ color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}
                            onClick={e => { e.stopPropagation(); setSelected(o); }}>
                            VIEW
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {filtered.length} orders · page {page}/{totalPages}
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

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <OrderDrawer order={selected} token={accessToken}
            onClose={() => setSelected(null)} onStatusUpdate={handleStatusUpdate} />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}