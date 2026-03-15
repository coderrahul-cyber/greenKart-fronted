// app/order-confirmed/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useReceiptDownload } from '@/hooks/useReceiptDownload';

const API = 'http://localhost:4000/api/v1';

/* ─────────────────────────────────────────
   Mini order-summary card shown on page
───────────────────────────────────────── */
function OrderSummaryCard({ order }: { order: any }) {
  // Exact field names from order.model.ts IOrder + IOrderItem
  const items    = order.items ?? [];
  const addr     = order.shippingAddress ?? {};
  const addrStr  = [addr.line1, addr.line2, addr.city, addr.pincode].filter(Boolean).join(', ');
  // All values read directly from backend — these are the authoritative stored figures.
  // Backend formula: totalAmount = itemsTotal + shippingCharge + taxAmount - discount
  const subtotal = order.itemsTotal    ?? 0;
  const tax      = order.taxAmount     ?? 0;   // 18% of itemsTotal, added by backend
  const discount = order.discount      ?? 0;
  const envShip  = parseInt(process.env.NEXT_PUBLIC_SHIPPING_CHARGE ?? '0', 10);
  const shipping = order.shippingCharge != null ? order.shippingCharge : envShip;
  // Prefer totalAmount from DB; recalculate only if missing
  const total    = order.totalAmount   ?? (subtotal + shipping + tax - discount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[10px] font-semibold tracking-widest uppercase font-roboto"
          style={{ color: "rgba(255,255,255,0.28)" }}>Order summary</span>
        <span className="text-[10px] font-roboto" style={{ color: "rgba(255,255,255,0.22)" }}>
          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {items.slice(0, 4).map((item: any, i: number) => (
          // item fields: name, priceAtBuy, quantity, lineTotal (from IOrderItem)
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 text-xs font-semibold font-poppins w-5 h-5 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                {item.quantity ?? 1}
              </span>
              <span className="text-xs font-roboto truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                {item.name ?? 'Product'}
              </span>
            </div>
            <span className="text-xs font-semibold font-poppins shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
              ₹{(item.lineTotal ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
        {items.length > 4 && (
          <p className="text-[11px] font-roboto" style={{ color: "rgba(255,255,255,0.25)" }}>
            +{items.length - 4} more item{items.length - 4 !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Bill */}
      <div className="px-4 py-3 flex flex-col gap-1.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { l: 'Subtotal',  v: `₹${subtotal.toLocaleString('en-IN')}` },
          { l: 'Shipping',  v: shipping === 0 ? 'Free 🎉' : `₹${shipping.toLocaleString('en-IN')}` },
          { l: 'GST (18%)', v: `₹${tax.toLocaleString('en-IN')}` },
          ...(discount > 0 ? [{ l: 'Discount', v: `-₹${discount.toLocaleString('en-IN')}` }] : []),
        ].map(({ l, v }) => (
          <div key={l} className="flex justify-between">
            <span className="text-[11px] font-roboto" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</span>
            <span className="text-[11px] font-roboto"
              style={{ color: l === 'Shipping' && shipping === 0
                  ? '#4ade80'
                  : l.startsWith('GST')
                    ? 'rgba(255,255,255,0.22)'
                    : "rgba(255,255,255,0.4)" }}>{v}</span>          </div>
        ))}
        <div className="flex justify-between pt-2 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-sm font-semibold font-poppins" style={{ color: "rgba(255,255,255,0.7)" }}>Total paid</span>
          <span className="text-base font-bold font-poppins"
            style={{ background: "linear-gradient(135deg,#f0f7ee,#86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Delivery address */}
      {addrStr && (
        <div className="px-4 py-3 flex items-start gap-2.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="text-[11px] font-roboto leading-relaxed" style={{ color: "rgba(255,255,255,0.32)" }}>
            {addrStr}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Main content
───────────────────────────────────────── */
function OrderConfirmedContent() {
  const { accessToken, user } = useAuth();
  const params    = useSearchParams();
  const orderId   = params.get('orderId') ?? '';

  const [warnings,    setWarnings]    = useState<string[]>([]);
  const [order,       setOrder]       = useState<any>(null);
  const [orderLoading,setOrderLoading]= useState(true);

  const { download, loading: pdfLoading, error: pdfError } = useReceiptDownload();

  /* ── Parse warnings from URL ── */
  useEffect(() => {
    try {
      const raw = params.get('warnings');
      if (raw) setWarnings(JSON.parse(decodeURIComponent(raw)));
    } catch {}
  }, [params]);

  /* ── Fetch order detail for summary card ── */
  useEffect(() => {
    if (!orderId || !accessToken) { setOrderLoading(false); return; }
    (async () => {
      try {
        const res  = await fetch(`${API}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (res.ok) setOrder(json?.data?.order ?? json?.data ?? json?.order ?? null);
      } catch {}
      finally { setOrderLoading(false); }
    })();
  }, [orderId, accessToken]);

  return (
    <div
      className="min-h-screen px-4 py-16 font-roboto"
      style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}
    >
      {/* Blob */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center gap-7">

        {/* ── Animated checkmark ── */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative mt-4"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0.6 }} animate={{ scale: 1.5, opacity: 0 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(74,222,128,0.4), transparent 70%)" }}
          />
          <div className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.06))",
              border: "2px solid rgba(74,222,128,0.35)",
              boxShadow: "0 0 40px rgba(74,222,128,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}>
            <motion.svg
              width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <motion.polyline
                points="20 6 9 17 4 12"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
              />
            </motion.svg>
          </div>
        </motion.div>

        {/* ── Title ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <h1 className="text-4xl font-semibold font-playfair"
            style={{
              background: "linear-gradient(135deg, #f0f7ee 30%, #86efac 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "-0.025em",
            }}>
            Order Confirmed!
          </h1>
          <p className="text-base font-roboto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Your fresh order is on its way 🌿
          </p>
          {orderId && (
            <p className="text-xs font-semibold font-poppins mt-1 px-3 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.09)" }}>
              Order #{orderId.slice(-8).toUpperCase()}
            </p>
          )}
        </motion.div>

        {/* ── Order summary card ── */}
        {orderLoading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="w-full h-32 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.5)" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </motion.div>
        ) : order ? (
          <OrderSummaryCard order={order} />
        ) : null}

        {/* ── Download Receipt button ── */}
        {orderId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full flex flex-col gap-2"
          >
            <motion.button
              whileHover={!pdfLoading ? { scale: 1.015, boxShadow: "0 6px 24px rgba(74,222,128,0.18)" } : {}}
              whileTap={!pdfLoading ? { scale: 0.975 } : {}}
              onClick={() => download(orderId)}
              disabled={pdfLoading}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm font-poppins flex items-center justify-center gap-2.5 transition-all"
              style={{
                background: pdfLoading ? "rgba(74,222,128,0.06)" : "rgba(74,222,128,0.1)",
                color: pdfLoading ? "rgba(74,222,128,0.4)" : "#4ade80",
                border: "1px solid rgba(74,222,128,0.2)",
                cursor: pdfLoading ? "not-allowed" : "pointer",
              }}
            >
              {pdfLoading ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Generating receipt…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Receipt (PDF)
                </>
              )}
            </motion.button>

            {/* PDF error */}
            <AnimatePresence>
              {pdfError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs font-roboto text-center px-2"
                  style={{ color: "rgba(248,113,113,0.7)" }}>
                  {pdfError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Low stock warnings ── */}
        {warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="w-full rounded-2xl overflow-hidden"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}
          >
            <div className="flex items-center gap-2.5 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(251,191,36,0.12)" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#f59e0b" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#f59e0b" }} />
              </span>
              <span className="text-xs font-semibold font-poppins" style={{ color: "rgba(251,191,36,0.85)" }}>
                Low stock heads-up
              </span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1.5">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs font-roboto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>• {w}</p>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── What's next ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-[10px] font-semibold tracking-widest uppercase font-roboto"
            style={{ color: "rgba(255,255,255,0.25)" }}>What's next</p>
          {[
            { step: "1", text: "We're preparing your order",  color: "rgba(96,165,250,0.8)"  },
            { step: "2", text: "Packed and dispatched fresh",  color: "rgba(167,139,250,0.8)" },
            { step: "3", text: "Delivered to your door",       color: "#4ade80"               },
          ].map(({ step, text, color }, i) => (
            <motion.div key={step}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-poppins"
                style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
                {step}
              </div>
              <span className="text-sm font-roboto" style={{ color: "rgba(255,255,255,0.5)" }}>{text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* ── CTA buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full flex flex-col gap-3"
        >
          <Link href="/order-history" className="w-full">
            <motion.div
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}
              className="w-full py-4 rounded-2xl font-semibold text-base font-poppins flex items-center justify-center gap-2.5"
              style={{
                background: "linear-gradient(135deg, #e8f5e0, #c8eabc)",
                color: "#082e28",
                boxShadow: "0 4px 20px rgba(74,222,128,0.12)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              View order details
            </motion.div>
          </Link>

          <Link href="/" className="w-full">
            <motion.div
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm font-poppins flex items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              Continue shopping
            </motion.div>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense>
      <OrderConfirmedContent />
    </Suspense>
  );
}