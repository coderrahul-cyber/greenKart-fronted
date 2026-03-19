// app/checkout/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { OutOfStockItem } from '@/hooks/usePlaceOrder';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

/* ─────────────────────────────────────────
   Icons
───────────────────────────────────────── */
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

/* ─────────────────────────────────────────
   Out-of-stock modal (reused from cart)
───────────────────────────────────────── */
function OutOfStockModal({ items, onClose }: { items: OutOfStockItem[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ background: "rgba(4,14,11,0.8)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0,  opacity: 1, scale: 1    }}
        exit={{   y: 60, opacity: 0, scale: 0.96  }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1a0c0c, #200e0e)",
          border: "1px solid rgba(255,80,80,0.18)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 flex items-start gap-4" style={{ borderBottom: "1px solid rgba(255,80,80,0.1)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.2)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,120,120,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold font-playfair" style={{ color: "rgba(255,200,200,0.95)" }}>Stock changed</h3>
            <p className="text-sm mt-0.5 font-roboto" style={{ color: "rgba(255,255,255,0.35)" }}>
              Sorry for the inconvenience — your cart has been updated.
            </p>
          </div>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {items.map(item => (
            <div key={item.productId} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.12)" }}>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold font-poppins truncate" style={{ color: "rgba(255,210,210,0.9)" }}>{item.name}</span>
                <span className="text-xs font-roboto" style={{ color: "rgba(255,255,255,0.35)" }}>
                  You had {item.requested} · {item.available === 0 ? "Now out of stock" : `Only ${item.available} left`}
                </span>
              </div>
              <span className="shrink-0 text-xs font-bold font-poppins px-2.5 py-1 rounded-full"
                style={item.available === 0
                  ? { background: "rgba(255,80,80,0.15)", color: "rgba(255,120,120,0.9)" }
                  : { background: "rgba(251,191,36,0.12)", color: "rgba(251,191,36,0.85)" }}>
                {item.available === 0 ? "Removed" : `Adjusted → ${item.available}`}
              </span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <p className="text-xs font-roboto mb-4 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
            Your cart has been automatically updated. Review and try again.
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm font-poppins"
            style={{ background: "linear-gradient(135deg, #e8f5e0, #c8eabc)", color: "#082e28" }}>
            Review updated cart
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Payment method card
───────────────────────────────────────── */
function PaymentCard({
  selected, onClick, icon, title, subtitle, badge, disabled: badgeUnavailable,
}: {
  selected:          boolean;
  onClick:           () => void;
  icon:              React.ReactNode;
  title:             string;
  subtitle:          string;
  badge?:            string;
  disabled?:         boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all"
      style={{
        background: selected ? "rgba(74,222,128,0.07)" : "rgba(255,255,255,0.04)",
        border: selected ? "1.5px solid rgba(74,222,128,0.35)" : "1.5px solid rgba(255,255,255,0.08)",
        boxShadow: selected ? "0 0 0 3px rgba(74,222,128,0.06)" : "none",
      }}
    >
      {/* Radio */}
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ border: `2px solid ${selected ? "#4ade80" : "rgba(255,255,255,0.2)"}` }}>
        {selected && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#4ade80" }}
          />
        )}
      </div>

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: selected ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold font-poppins" style={{ color: selected ? "#f0f7ee" : "rgba(255,255,255,0.65)" }}>
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full font-poppins"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs font-roboto mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{subtitle}</p>
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function CheckoutPage() {
  const { accessToken, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cart, removeFromCart, changeQuantity, clearCart }            = useCart();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [address,       setAddress]       = useState<any>(null);
  const [addrLoading,   setAddrLoading]   = useState(true);
  const [placing,       setPlacing]       = useState(false);
  const [error,         setError]         = useState('');
  const [razorpayDown,  setRazorpayDown]  = useState(false);
  const [outOfStock,    setOutOfStock]    = useState<OutOfStockItem[]>([]);

  const subtotal   = useMemo(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const shipping   = subtotal >= 500 ? 0 : 20;
  const tax        = Math.round(subtotal * 0.18);
  const total      = subtotal + shipping + tax;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login?from=/checkout');
  }, [authLoading, isAuthenticated, router]);

  /* ── Fetch address ── */
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res  = await fetch(`${API}/users/me`, {
          //  headers: { Authorization: `Bearer ${accessToken}` }
          credentials : "include"
           });
        const json = await res.json();
        const userData  = json?.data?.user ?? json?.data ?? json?.user ?? {};
        const addresses = userData?.addresses ?? [];
        setAddress(addresses.find((a: any) => a.isDefault) ?? addresses[0] ?? null);
      } catch {}
      finally { setAddrLoading(false); }
    })();
  }, [accessToken]);

  /* ── Parse stock error message ── */
  const parseStockError = (msg: string): OutOfStockItem | null => {
    const match = msg.match(/[""](.+?)[""].*?only\s+(\d+)\s+unit/i);
    if (!match) return null;
    const name      = match[1];
    const available = parseInt(match[2], 10);
    const cartItem  = cart.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (!cartItem) return null;
    return { productId: cartItem.productId, name: cartItem.name, available, requested: cartItem.quantity };
  };

  /* ── Place order (COD) ── */
  const placeCOD = async () => {
    if (!address) { setError('No delivery address found. Please add one in your profile.'); return; }
    setPlacing(true); setError('');
    try {
      const res  = await fetch(`${API}/orders`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials : "include",
        body:    JSON.stringify({
          shippingAddress: { line1: address.line1, line2: address.line2 ?? '', city: address.city, pincode: address.pincode },
          paymentMethod:   'cod',
        }),
      });
      const json = await res.json();

      if (res.ok && json.success !== false) {
        clearCart();
        const orderId       = json?.data?.order?._id ?? json?.data?._id ?? '';
        const lowStockWarn  = json?.data?.warnings ?? json?.warnings ?? [];
        router.push(`/order-confirmed?orderId=${orderId}&warnings=${encodeURIComponent(JSON.stringify(lowStockWarn))}`);
        return;
      }

      // Stock error
      if (json.code === 'INSUFFICIENT_STOCK' && Array.isArray(json.data)) {
        json.data.forEach((item: OutOfStockItem) => {
          if (item.available === 0) removeFromCart(item.productId);
          else changeQuantity(item.productId, item.available);
        });
        setOutOfStock(json.data);
        return;
      }
      // Plain stock message
      if (json.message) {
        const parsed = parseStockError(json.message);
        if (parsed) {
          if (parsed.available === 0) removeFromCart(parsed.productId);
          else changeQuantity(parsed.productId, parsed.available);
          setOutOfStock([parsed]);
          return;
        }
        setError(json.message);
        return;
      }
      setError('Something went wrong. Please try again.');
    } catch { setError('Network error. Check your connection.'); }
    finally   { setPlacing(false); }
  };

  /* ── Initiate Razorpay payment ──────────────────────────────────
     Flow:
     0.  Load Razorpay SDK.
     0b. Pre-flight ping — confirm Razorpay API is reachable BEFORE
         creating any order. If unreachable, throw immediately so
         NO order is ever created and the cart is untouched.
     1.  POST /orders { paymentMethod: "razorpay" } → orderId + paymentId
     2.  POST /payments/razorpay/create-order { paymentId } → razorpayOrderId
     3.  Open Razorpay modal → user pays
     4.  POST /payments/razorpay/verify → confirmed
  ──────────────────────────────────────────────────────────────── */
  const placeOnline = async () => {
    if (!address) { setError('No delivery address found. Please add one in your profile.'); return; }
    setPlacing(true); setError(''); setRazorpayDown(false);

    let createdOrderId: string | null = null;

    const cancelPendingOrder = async () => {
      if (!createdOrderId) return;
      try {
        await fetch(`${API}/orders/${createdOrderId}/cancel`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials : "include",
          body:    JSON.stringify({ reason: 'Payment gateway unavailable' }),
        });
      } catch {}
    };

    try {

      // ── Step 0: Load Razorpay SDK first — before touching the backend ──
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s   = document.createElement('script');
          s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload  = () => resolve();
          s.onerror = () => reject(new Error('RAZORPAY_SDK_LOAD_FAILED'));
          document.body.appendChild(s);
        });
      }

      // ── Step 0b: Pre-flight ping — verify Razorpay API is reachable
      //             BEFORE creating any order on our backend.
      //             A 401 means Razorpay is UP (just rejecting our unauthed ping).
      //             A network error / timeout / 5xx means Razorpay is truly down.
      //             We throw RAZORPAY_SDK_LOAD_FAILED so the catch block below
      //             sets razorpayDown=true without ever touching the backend.
      try {
        const ping = await fetch('https://api.razorpay.com/v1/payments', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        if (ping.status >= 500) throw new Error('RAZORPAY_SDK_LOAD_FAILED');
      } catch (pingErr: any) {
        // Only treat as down for network/timeout errors — 4xx means reachable
        if (
          pingErr.name    === 'TimeoutError'               ||
          pingErr.name    === 'TypeError'                  || // network failure
          pingErr.message === 'RAZORPAY_SDK_LOAD_FAILED'
        ) {
          throw new Error('RAZORPAY_SDK_LOAD_FAILED');
        }
        // 4xx from Razorpay = reachable, safe to continue
      }

      // ── Step 1: Place order with paymentMethod "razorpay" ──────────
      const orderRes  = await fetch(`${API}/orders`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json'},
        credentials :"include",
        body:    JSON.stringify({
          shippingAddress: { line1: address.line1, line2: address.line2 ?? '', city: address.city, pincode: address.pincode },
          paymentMethod:   'razorpay',
        }),
      });
      const orderJson = await orderRes.json();

      if (!orderRes.ok) {
        if (orderJson.code === 'RAZORPAY_UNAVAILABLE') { setRazorpayDown(true); return; }
        // Stock errors
        if (orderJson.code === 'INSUFFICIENT_STOCK' && Array.isArray(orderJson.data)) {
          orderJson.data.forEach((item: OutOfStockItem) => {
            if (item.available === 0) removeFromCart(item.productId);
            else changeQuantity(item.productId, item.available);
          });
          setOutOfStock(orderJson.data);
          return;
        }
        if (orderJson.message) {
          const parsed = parseStockError(orderJson.message);
          if (parsed) {
            if (parsed.available === 0) removeFromCart(parsed.productId);
            else changeQuantity(parsed.productId, parsed.available);
            setOutOfStock([parsed]);
            return;
          }
          setError(orderJson.message);
          return;
        }
        setError('Could not place order. Please try again.');
        return;
      }

      createdOrderId  = orderJson?.data?.order?._id ?? orderJson?.data?.orderId ?? null;
      const paymentId = orderJson?.data?.payment?._id ?? orderJson?.data?.paymentId ?? '';
      if (!paymentId) { setError('Payment reference missing. Please try again.'); return; }

      // ── Step 2: Create Razorpay order ──────────────────────────────
      const rzpOrderRes  = await fetch(`${API}/payments/razorpay/create-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials : "include",
        body:    JSON.stringify({ paymentId }),
      });
      const rzpOrderJson = await rzpOrderRes.json();
      if (!rzpOrderRes.ok) {
        if (rzpOrderJson.code === 'RAZORPAY_UNAVAILABLE') {
          await cancelPendingOrder();
          setRazorpayDown(true);
          return;
        }
        setError(rzpOrderJson.message || 'Could not initiate payment.');
        return;
      }

      const razorpayOrderId = rzpOrderJson?.data?.razorpayOrderId ?? rzpOrderJson?.data?.id ?? rzpOrderJson?.id;
      const keyId           = rzpOrderJson?.data?.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const options = {
        key:         keyId,
        amount:      total * 100,
        currency:    'INR',
        name:        'GreenKart',
        description: `Order — ${totalItems} item${totalItems !== 1 ? 's' : ''}`,
        order_id:    razorpayOrderId,
        prefill: {
          name:    user?.name        ?? '',
          // email:   user?.email       ?? '',
          contact: user?.phoneNumber ?? '',
        },
        theme: { color: '#4ade80' },

        // ── Step 4: Verify after user pays ─────────────────────────
        handler: async (response: any) => {
          try {
            const verifyRes  = await fetch(`${API}/payments/razorpay/verify`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials : 'include',
              body:    JSON.stringify({
                paymentId,
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyJson = await verifyRes.json();

            if (verifyRes.ok && verifyJson.success !== false) {
              clearCart();
              const lowStockWarn = verifyJson?.data?.warnings ?? verifyJson?.warnings ?? [];
              router.push(`/order-confirmed?orderId=${createdOrderId}&warnings=${encodeURIComponent(JSON.stringify(lowStockWarn))}`);
            } else {
              setError(verifyJson.message || 'Payment verification failed. Please contact support.');
            }
          } catch { setError('Payment verification failed. Please contact support.'); }
          finally   { setPlacing(false); }
        },

        modal: { ondismiss: () => setPlacing(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      if (err?.message === 'RAZORPAY_SDK_LOAD_FAILED') {
        // SDK failed to load or pre-flight ping failed —
        // cancelPendingOrder is a no-op here since createdOrderId is still null
        await cancelPendingOrder();
        setRazorpayDown(true);
      } else {
        setError(err.message || 'Could not load payment gateway.');
      }
      setPlacing(false);
    }
  };

  const handleProceed = () => paymentMethod === 'cod' ? placeCOD() : placeOnline();

  if (authLoading || addrLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}>
        <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.6)" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}>

      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-64 rounded-full opacity-40"
          style={{ background: "radial-gradient(ellipse, #0d5c54, transparent 70%)", filter: "blur(50px)" }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-40 flex items-center gap-4 px-5 py-4"
        style={{ background: "rgba(8,26,22,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/cart">
          <motion.div whileTap={{ scale: 0.9 }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white/80 transition-colors"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <BackIcon />
          </motion.div>
        </Link>
        <div className="flex flex-col">
          <span className="text-base font-semibold font-playfair" style={{ color: "rgba(255,255,255,0.82)" }}>Checkout</span>
          <span className="text-[10px] font-roboto" style={{ color: "rgba(255,255,255,0.28)" }}>
            {totalItems} item{totalItems !== 1 ? 's' : ''} · ₹{total.toLocaleString('en-IN')}
          </span>
        </div>
      </motion.header>

      <main className="relative z-10 pt-24 pb-32 px-4 sm:px-6 max-w-lg mx-auto flex flex-col gap-5">

        {/* ── Delivery address ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-[10px] font-semibold tracking-widest uppercase font-roboto mb-3" style={{ color: "rgba(255,255,255,0.28)" }}>
            Delivering to
          </p>
          {address ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.18)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-poppins" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {user?.name}
                </p>
                <p className="text-xs font-roboto mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city} — {address.pincode}
                </p>
              </div>
              <Link href="/address">
                <span className="text-[11px] font-semibold font-poppins shrink-0 px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  Change
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm font-roboto" style={{ color: "rgba(248,113,113,0.7)" }}>
                No address found
              </p>
              <Link href="/address">
                <span className="text-xs font-semibold font-poppins px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                  + Add address
                </span>
              </Link>
            </div>
          )}
        </motion.div>

        {/* ── Order items ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="px-4 pt-4 pb-2 text-[10px] font-semibold tracking-widest uppercase font-roboto" style={{ color: "rgba(255,255,255,0.28)" }}>
            Order summary
          </p>
          {cart.map((item, i) => (
            <div key={item.itemId} className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <span style={{ fontSize: 18 }}>🥦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-poppins truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{item.name}</p>
                <p className="text-xs font-roboto mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold font-poppins shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
          {/* Bill */}
          <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {[
              { l: 'Items total',   v: `₹${subtotal.toLocaleString('en-IN')}` },
              { l: 'Shipping',      v: shipping === 0 ? 'Free 🎉' : `₹${shipping}` },
              { l: 'GST (18%)',     v: `₹${tax.toLocaleString('en-IN')}` },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between">
                <span className="text-xs font-roboto" style={{ color: "rgba(255,255,255,0.35)" }}>{l}</span>
                <span className="text-xs font-roboto" style={{ color: shipping === 0 && l === 'Shipping' ? '#4ade80' : "rgba(255,255,255,0.5)" }}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-sm font-semibold font-poppins" style={{ color: "rgba(255,255,255,0.7)" }}>Total</span>
              <span className="text-lg font-bold font-poppins"
                style={{ background: "linear-gradient(135deg, #f0f7ee, #86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Payment method ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-3"
        >
          <p className="text-[10px] font-semibold tracking-widest uppercase font-roboto px-1" style={{ color: "rgba(255,255,255,0.28)" }}>
            Payment method
          </p>

          <PaymentCard
            selected={paymentMethod === 'cod'}
            onClick={() => setPaymentMethod('cod')}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M22 10H2"/><path d="M7 15h.01M11 15h2"/>
              </svg>
            }
            title="Cash on Delivery"
            subtitle="Pay when your order arrives"
          />

          <PaymentCard
            selected={paymentMethod === 'online'}
            onClick={() => { setPaymentMethod('online'); setRazorpayDown(false); }}
            badge={razorpayDown ? "Unavailable" : "Instant"}
            disabled={false}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            }
            title="Pay Online"
            subtitle="UPI, cards, netbanking via Razorpay"
          />
        </motion.div>

        {/* Razorpay unavailable — switch to COD nudge */}
        <AnimatePresence>
          {razorpayDown && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{   opacity: 0, y: -6,  scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(251,191,36,0.25)", background: "rgba(251,191,36,0.05)" }}
            >
              {/* Top bar */}
              <div className="flex items-center gap-2.5 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(251,191,36,0.12)", background: "rgba(251,191,36,0.06)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span className="text-xs font-semibold font-poppins" style={{ color: "rgba(251,191,36,0.9)" }}>
                  Online payments temporarily unavailable
                </span>
              </div>
              {/* Body */}
              <div className="px-4 py-3.5 flex items-start justify-between gap-4">
                <p className="text-xs font-roboto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Razorpay is currently down. Your items are safe — switch to Cash on Delivery to place your order now.
                </p>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => { setPaymentMethod('cod'); setRazorpayDown(false); }}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold font-poppins"
                  style={{
                    background: "linear-gradient(135deg, #e8f5e0, #c8eabc)",
                    color: "#082e28",
                    boxShadow: "0 2px 10px rgba(74,222,128,0.15)",
                  }}
                >
                  Switch to COD
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generic error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 rounded-2xl px-4 py-3.5"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)" }}
            >
              <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,120,120,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm font-roboto" style={{ color: "rgba(255,160,160,0.85)" }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ── Sticky bottom — Place Order ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-4"
        style={{ background: "linear-gradient(to top, #081a16 60%, transparent)", backdropFilter: "blur(8px)" }}>
        <motion.button
          whileHover={!placing && !!address ? { scale: 1.015, boxShadow: "0 8px 30px rgba(74,222,128,0.2)" } : {}}
          whileTap={!placing && !!address ? { scale: 0.975 } : {}}
          onClick={handleProceed}
          disabled={placing || !address || cart.length === 0}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-base font-poppins transition-all"
          style={{
            background: (!address || cart.length === 0 || placing)
              ? "rgba(200,234,188,0.4)"
              : "linear-gradient(135deg, #e8f5e0, #c8eabc)",
            color: "#082e28",
            boxShadow: "0 4px 20px rgba(74,222,128,0.12)",
            cursor: (!address || placing) ? "not-allowed" : "pointer",
            display: "flex",
          }}
        >
          {placing ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {paymentMethod === 'cod' ? 'Placing order…' : 'Opening payment…'}
            </>
          ) : (
            <>
              {paymentMethod === 'cod'
                ? 'Place Order — Cash on Delivery'
                : `Pay ₹${total.toLocaleString('en-IN')} Online`}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </motion.button>
      </div>

      {/* Out-of-stock modal */}
      <AnimatePresence>
        {outOfStock.length > 0 && (
          <OutOfStockModal items={outOfStock} onClose={() => { setOutOfStock([]); router.push('/cart'); }} />
        )}
      </AnimatePresence>
    </div>
  );
}