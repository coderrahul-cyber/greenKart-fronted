// app/cart/page.tsx
"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import CartItem from '@/components/CartItem';
import { useCart } from '@/context/CartContext';
import { useStockSync } from '@/hooks/useStockSync';
import Navbar from '@/sections/Navbar';

/* ─────────────────────────────────────────
   Cart Expiry Warning Banner
   Shown when GET /cart returns a warning
   (backend cleared an inactive cart)
───────────────────────────────────────── */
function CartExpiryBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-2xl rounded-2xl px-4 py-3.5 flex items-start gap-3 mb-4"
      style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-poppins" style={{ color: "rgba(251,191,36,0.9)" }}>
          Cart cleared
        </p>
        <p className="text-xs font-roboto mt-0.5 leading-relaxed" style={{ color: "rgba(251,191,36,0.65)" }}>
          {message}
        </p>
      </div>
      <button onClick={onClose} className="shrink-0 mt-0.5" style={{ color: "rgba(251,191,36,0.4)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Main CartPage
───────────────────────────────────────── */
export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, changeQuantity, cartWarning, clearCartWarning } = useCart();

  const subtotal   = useMemo(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  // Keep stock limits fresh while user reviews their cart
  const productIds = useMemo(() => cart.map(i => i.productId), [cart]);
  useStockSync({ productIds, onStockUpdate: () => {} });

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}
    >
      <Navbar />
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div style={{
          position: "absolute", top: "10%", right: "-80px",
          width: "420px", height: "420px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", left: "-60px",
          width: "340px", height: "340px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13,92,84,0.3) 0%, transparent 70%)",
          filter: "blur(50px)",
        }} />
      </div>

      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 flex flex-col items-center">

        {/* Cart expiry warning */}
        <AnimatePresence>
          {cartWarning && (
            <CartExpiryBanner message={cartWarning} onClose={clearCartWarning} />
          )}
        </AnimatePresence>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-2xl mb-8 flex flex-col gap-1"
        >
          <span className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(74,222,128,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
            Your Order
          </span>
          <div className="flex items-end justify-between">
            <h1 className="text-4xl sm:text-5xl font-semibold"
              style={{
                fontFamily: "'Playfair Display', serif",
                background: "linear-gradient(135deg, #f0f7ee 30%, #86efac 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.025em",
              }}>
              Cart
            </h1>
            {totalItems > 0 && (
              <span className="text-sm font-roboto mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </motion.div>

        {/* Cart card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="w-full max-w-2xl rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Items */}
          <div className="p-4 sm:p-5 flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {cart.map(item => (
                <CartItem
                  key={item.itemId}
                  productId={item.productId}
                  name={item.name}
                  image={item.image}
                  price={item.price}
                  quantity={item.quantity}
                  stockLimit={item.stockLimit}
                  onRemove={removeFromCart}
                  onQuantityChange={changeQuantity}
                />
              ))}
            </AnimatePresence>

            {/* Empty state */}
            <AnimatePresence>
              {cart.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1    }}
                  exit={{   opacity: 0, scale: 0.95  }}
                  className="flex flex-col items-center justify-center py-20 gap-5"
                >
                  <div className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-lg font-semibold"
                      style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Playfair Display', serif" }}>
                      Your cart is empty
                    </p>
                    <p className="text-sm"
                      style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif" }}>
                      Add some fresh picks to get started
                    </p>
                    <Link href="/">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="mt-3 px-6 py-2.5 rounded-xl text-sm font-semibold font-poppins"
                        style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                        Browse products
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Summary + checkout */}
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{   opacity: 0, height: 0     }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mx-4 sm:mx-5 mb-1"
                  style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

                <div className="px-4 sm:px-5 pt-4 pb-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'DM Sans', sans-serif" }}>
                      Subtotal
                    </span>
                    <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif" }}>
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-1"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-base font-semibold"
                      style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
                      Total
                    </span>
                    <motion.span
                      key={subtotal}
                      initial={{ scale: 1.1, opacity: 0.7 }}
                      animate={{ scale: 1,   opacity: 1   }}
                      transition={{ duration: 0.22 }}
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: "-0.03em",
                        background: "linear-gradient(135deg, #f0f7ee, #86efac)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      ₹{subtotal.toFixed(2)}
                    </motion.span>
                  </div>

                  <p className="text-[11px] font-roboto text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Taxes & delivery calculated at checkout
                  </p>

                  {/* Proceed to Checkout */}
                  <motion.button
                    whileHover={{ scale: 1.015, boxShadow: "0 8px 30px rgba(74,222,128,0.2)" }}
                    whileTap={{ scale: 0.975 }}
                    onClick={() => router.push('/checkout')}
                    className="w-full mt-1 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #e8f5e0 0%, #c8eabc 100%)",
                      color: "#082e28",
                      fontFamily: "'DM Sans', sans-serif",
                      boxShadow: "0 4px 20px rgba(74,222,128,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    Proceed to Checkout
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}