// app/order-history/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderItem {
  productId:  string;
  name:       string;
  image:      string;
  priceAtBuy: number;
  quantity:   number;
  lineTotal:  number;
}

interface Order {
  _id:            string;
  items:          OrderItem[];
  shippingAddress: { line1: string; line2?: string; city: string; pincode: string };
  status:         OrderStatus;
  paymentStatus:  PaymentStatus;
  itemsTotal:     number;
  shippingCharge: number;
  discount:       number;
  taxAmount:      number;
  totalAmount:    number;
  createdAt:      string;
  updatedAt:      string;
}

/* ─────────────────────────────────────────
   Status config
───────────────────────────────────────── */
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; step: number }> = {
  pending:    { label: 'Pending',    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)',   step: 0 },
  confirmed:  { label: 'Confirmed',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)',   step: 1 },
  processing: { label: 'Processing', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.2)',  step: 2 },
  shipped:    { label: 'Shipped',    color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.2)',   step: 3 },
  delivered:  { label: 'Delivered',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.2)',   step: 4 },
  cancelled:  { label: 'Cancelled',  color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)',  step: -1 },
  refunded:   { label: 'Refunded',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)', step: -1 },
};

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  pending:  { label: 'COD',     color: 'rgba(251,191,36,0.7)' },
  paid:     { label: 'Paid',    color: 'rgba(74,222,128,0.8)' },
  failed:   { label: 'Failed',  color: 'rgba(248,113,113,0.8)' },
  refunded: { label: 'Refunded',color: 'rgba(148,163,184,0.7)' },
};

const STEPS = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];

/* ─────────────────────────────────────────
   Icons
───────────────────────────────────────── */
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const BoxIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <motion.svg
    animate={{ rotate: open ? 180 : 0 }}
    transition={{ duration: 0.25 }}
    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"/>
  </motion.svg>
);
const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

/* ─────────────────────────────────────────
   Progress tracker
───────────────────────────────────────── */
function ProgressTracker({ status }: { status: OrderStatus }) {
  const cfg     = STATUS_CONFIG[status];
  const current = cfg.step;
  if (current < 0) return null; // cancelled/refunded — no tracker

  return (
    <div className="flex items-center gap-0 w-full mt-4">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const pending = i > current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  background: done || active ? cfg.color : 'rgba(255,255,255,0.1)',
                  scale: active ? 1.2 : 1,
                  boxShadow: active ? `0 0 12px ${cfg.color}` : 'none',
                }}
                transition={{ duration: 0.3 }}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ border: `2px solid ${done || active ? cfg.color : 'rgba(255,255,255,0.15)'}` }}
              >
                {done && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#082e28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 6 5 9 10 3"/>
                  </svg>
                )}
              </motion.div>
              <span className="text-[9px] font-semibold tracking-wide uppercase font-roboto whitespace-nowrap"
                style={{ color: done || active ? cfg.color : 'rgba(255,255,255,0.2)' }}>
                {label}
              </span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1 mb-4" style={{ background: done ? cfg.color : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   Single Order Card
───────────────────────────────────────── */
function OrderCard({ order, index }: { order: Order; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const status  = STATUS_CONFIG[order.status]  ?? STATUS_CONFIG.pending;
  const payment = PAYMENT_CONFIG[order.paymentStatus] ?? PAYMENT_CONFIG.pending;

  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const time = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* ── Header — always visible ── */}
      <button
        className="w-full text-left px-5 py-4 flex flex-col gap-3"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Row 1: order id + status + chevron */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold tracking-widest uppercase font-roboto"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Order
            </span>
            <span className="text-sm font-semibold font-poppins" style={{ color: "rgba(255,255,255,0.7)" }}>
              #{order._id.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full font-poppins"
              style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}
            >
              {status.label}
            </span>
            <span className="text-white/30"><ChevronIcon open={expanded} /></span>
          </div>
        </div>

        {/* Row 2: date + items count + total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-roboto" style={{ color: "rgba(255,255,255,0.35)" }}>
              {date} · {time}
            </span>
            <span className="text-xs font-roboto" style={{ color: "rgba(255,255,255,0.2)" }}>
              {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold font-poppins" style={{ color: payment.color }}>
              {payment.label}
            </span>
            <span className="text-base font-bold font-poppins"
              style={{
                background: "linear-gradient(135deg, #f0f7ee, #86efac)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}>
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Progress tracker */}
        <ProgressTracker status={order.status} />
      </button>

      {/* ── Expanded detail ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-1" style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

            <div className="px-5 py-4 flex flex-col gap-4">

              {/* Items */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold tracking-widest uppercase font-roboto"
                  style={{ color: "rgba(255,255,255,0.25)" }}>Items</p>
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Image */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontSize: 22 }}>🥦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold font-playfair truncate" style={{ color: "#f0f7ee" }}>
                        {item.name}
                      </p>
                      <p className="text-xs font-roboto mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        ₹{item.priceAtBuy.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold font-poppins text-sm shrink-0" style={{ color: "rgba(255,255,255,0.7)" }}>
                      ₹{item.lineTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill breakdown */}
              <div className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-semibold tracking-widest uppercase font-roboto mb-1"
                  style={{ color: "rgba(255,255,255,0.25)" }}>Bill Summary</p>
                {[
                  { label: 'Items total',    value: `₹${order.itemsTotal.toLocaleString('en-IN')}` },
                  { label: 'Shipping',       value: order.shippingCharge === 0 ? 'Free' : `₹${order.shippingCharge}` },
                  { label: 'Tax (18% GST)',  value: `₹${order.taxAmount.toLocaleString('en-IN')}` },
                  ...(order.discount > 0 ? [{ label: 'Discount', value: `-₹${order.discount}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs font-roboto" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
                    <span className="text-xs font-medium font-roboto"
                      style={{ color: label === 'Discount' ? '#4ade80' : "rgba(255,255,255,0.5)" }}>{value}</span>
                  </div>
                ))}
                <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold font-poppins" style={{ color: "rgba(255,255,255,0.7)" }}>Total</span>
                  <span className="text-base font-bold font-poppins"
                    style={{
                      background: "linear-gradient(135deg, #f0f7ee, #86efac)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Shipping address */}
              <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="mt-0.5" style={{ color: "rgba(74,222,128,0.6)" }}><LocationIcon /></span>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase font-roboto mb-1"
                    style={{ color: "rgba(255,255,255,0.25)" }}>Delivery Address</p>
                  <p className="text-sm font-roboto" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
                    {`, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}`}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Skeleton
───────────────────────────────────────── */
const SkeletonCard = ({ i }: { i: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: i * 0.05 }}
    className="rounded-3xl p-5 flex flex-col gap-3 animate-pulse"
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
  >
    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-1.5">
        <div className="h-2.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-4 w-28 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>
      <div className="h-6 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
    <div className="flex justify-between">
      <div className="h-3 w-32 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="h-4 w-16 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
    <div className="flex gap-2 mt-1">
      {[0,1,2,3].map(j => (
        <div key={j} className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      ))}
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function OrderHistoryPage() {
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState<OrderStatus | 'all'>('all');

  /* ── Redirect if not logged in ── */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?from=/order-history');
    }
  }, [authLoading, isAuthenticated, router]);

  /* ── Fetch orders ── */
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API}/orders`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const json = await res.json();
        // Support { data: { orders: [] } } or { data: [] }
        const list: Order[] =
          Array.isArray(json?.data?.orders) ? json.data.orders :
          Array.isArray(json?.data)         ? json.data         :
          Array.isArray(json)               ? json              : [];
        // Sort newest first
        setOrders(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err: any) {
        setError(err.message || 'Could not load orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const filtered = useMemo(() =>
    filter === 'all' ? orders : orders.filter(o => o.status === filter),
  [orders, filter]);

  const filterOptions: Array<OrderStatus | 'all'> = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (authLoading) return null;

  return (
    <div
      className="min-h-screen font-roboto"
      style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}
    >
      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-72 rounded-full opacity-40"
          style={{ background: "radial-gradient(ellipse, #0d5c54, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* Top bar */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4"
        style={{
          background: "rgba(8,26,22,0.65)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <BackIcon />
          </motion.div>
        </Link>
        <div className="flex flex-col items-center">
          <span className="text-base font-semibold text-white/80 font-playfair">Order History</span>
          {!loading && orders.length > 0 && (
            <span className="text-[10px] text-white/30 font-roboto">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="w-9" />
      </motion.header>

      <main className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-2xl mx-auto flex flex-col gap-4">

        {/* ── Filter pills ── */}
        {!loading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
          >
            {filterOptions.map(f => {
              const active = filter === f;
              const cfg = f !== 'all' ? STATUS_CONFIG[f] : null;
              return (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setFilter(f)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-poppins capitalize transition-all"
                  style={{
                    background: active
                      ? (cfg?.bg ?? 'rgba(74,222,128,0.12)')
                      : 'rgba(255,255,255,0.05)',
                    color: active
                      ? (cfg?.color ?? '#4ade80')
                      : 'rgba(255,255,255,0.35)',
                    border: `1px solid ${active ? (cfg?.border ?? 'rgba(74,222,128,0.25)') : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {f === 'all' ? `All (${orders.length})` : `${STATUS_CONFIG[f].label}`}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* ── Skeletons ── */}
        {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} i={i} />)}

        {/* ── Error ── */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.15)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,120,120,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-sm font-roboto" style={{ color: "rgba(255,150,150,0.7)" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold font-poppins"
              style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 py-24 text-center"
          >
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <BoxIcon />
            </div>
            <div>
              <p className="text-xl font-semibold font-playfair" style={{ color: "rgba(255,255,255,0.5)" }}>
                No orders yet
              </p>
              <p className="text-sm font-roboto mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                Your order history will appear here
              </p>
            </div>
            <Link href="/">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold font-poppins"
                style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                Start shopping
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* ── No results for filter ── */}
        {!loading && !error && orders.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-sm font-roboto" style={{ color: "rgba(255,255,255,0.3)" }}>
              No {STATUS_CONFIG[filter as OrderStatus]?.label.toLowerCase()} orders
            </p>
          </motion.div>
        )}

        {/* ── Order cards ── */}
        <AnimatePresence mode="popLayout">
          {filtered.map((order, i) => (
            <OrderCard key={order._id} order={order} index={i} />
          ))}
        </AnimatePresence>

      </main>
    </div>
  );
}