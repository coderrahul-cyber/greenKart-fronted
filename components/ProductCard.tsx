"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  productId: string;   // MongoDB _id — REQUIRED for cart sync
  title?: string;
  imageUrl?: string;
  price?: number;
  unit?: string;
  badge?: string;
  rating?: number;
  stockLimit?: number;  // product.quantity from DB
}

export default function ProductCard({
  productId,
  title = "Product",
  imageUrl = "",
  price = 0,
  unit = "kg",
  badge,
  rating = 4.5,
  stockLimit = 99,
}: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { getQuantity, changeQuantity, addToCart, isAtLimit } = useCart();

  // All cart lookups use productId (MongoDB _id), never the name
  const quantity = getQuantity(productId);

  const handleAddToCartClick = () => {
    if (!isAuthenticated) {
      // Redirect to login, come back to current page after
      router.push(`/login?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    addToCart(productId, title, imageUrl, price, stockLimit);
  };

  const atLimit = isAtLimit(productId);

  const handleIncrease = () => {
    if (!isAuthenticated) {
      router.push(`/login?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!atLimit) changeQuantity(productId, quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > 0) changeQuantity(productId, quantity - 1);
  };

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));

  return (
    <div
      className="group relative w-[70%] md:w-[25vw] select-none"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@500;600&display=swap');
        .card-shine::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.0) 50%, rgba(255,255,255,0.04) 100%);
          pointer-events: none;
          z-index: 10;
        }
        .qty-btn:active { transform: scale(0.88); }
      `}</style>

      <motion.div
        whileHover={{ y: -6, scale: 1.015 }}
        transition={{ type: "spring", stiffness: 340, damping: 22 }}
        className="card-shine relative rounded-[28px] overflow-hidden cursor-pointer"
        style={{
          background: "linear-gradient(160deg, #0d5c54 0%, #093d37 60%, #062e28 100%)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.12), 0 20px 40px rgba(6,46,40,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)" }} />

        {/* Image area */}
        <div
          className="relative flex items-center justify-center mx-4 mt-4 rounded-[20px] overflow-hidden"
          style={{
            height: "168px",
            background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          {badge && (
            <div
              className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
              style={{ background: "linear-gradient(90deg, #f9c74f, #f8961e)", color: "#1a1a1a", boxShadow: "0 2px 8px rgba(249,199,79,0.4)" }}
            >
              {badge}
            </div>
          )}

          <AnimatePresence>
            {quantity > 0 && (
              <motion.div
                key="qty-badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "#4ade80", color: "#052e28", boxShadow: "0 2px 10px rgba(74,222,128,0.5)" }}
              >
                {quantity}
              </motion.div>
            )}
          </AnimatePresence>

          {imageUrl ? (
            <motion.img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="text-5xl select-none opacity-40">🥦</div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-white leading-tight text-[17px] font-semibold"
              style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em" }}
            >
              {title}
            </h3>
            <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
              {stars.map((filled, i) => (
                <svg key={i} className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1l1.2 3.6H11L8.1 6.8l1.1 3.5L6 8.4l-3.2 1.9 1.1-3.5L1 4.6h3.8z"
                    fill={filled ? "#f9c74f" : "rgba(255,255,255,0.2)"} />
                </svg>
              ))}
            </div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-white text-2xl font-bold" style={{ letterSpacing: "-0.02em" }}>
              ₹{price.toFixed(0)}
            </span>
            <span className="text-white/40 text-xs font-medium">/ {unit}</span>
          </div>

          {/* Stock indicator */}
          <div className="flex items-center justify-between -mt-2">
            {stockLimit <= 5 && stockLimit > 0 ? (
              <motion.div
                key={stockLimit}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: "#f97316" }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                    style={{ background: "#f97316" }} />
                </span>
                <span className="text-[11px] font-semibold"
                  style={{ color: "rgba(249,115,22,0.9)", fontFamily: "'DM Sans', sans-serif" }}>
                  Only {stockLimit} left
                </span>
              </motion.div>
            ) : stockLimit === 0 ? (
              <span className="text-[11px] font-semibold"
                style={{ color: "rgba(255,80,80,0.8)", fontFamily: "'DM Sans', sans-serif" }}>
                Out of stock
              </span>
            ) : (
              <span className="text-[11px]"
                style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', sans-serif" }}>
                {stockLimit} in stock
              </span>
            )}
          </div>

          <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.08)" }} />

          <AnimatePresence mode="wait" initial={false}>
            {quantity > 0 ? (
              <motion.div
                key="counter"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center justify-between"
              >
                <motion.button
                  onClick={handleDecrease}
                  whileTap={{ scale: 0.88 }}
                  className="qty-btn w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
                  aria-label="Decrease"
                >−</motion.button>

                <motion.span
                  key={quantity}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  className="text-white font-bold text-lg w-8 text-center"
                >
                  {quantity}
                </motion.span>

                <motion.button
                  onClick={handleIncrease}
                  whileTap={{ scale: 0.88 }}
                  className="qty-btn w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg transition-colors"
            
                  disabled={atLimit}
                  style={{ background: "rgba(255,255,255,0.1)", color: atLimit ? "rgba(255,255,255,0.2)" : "#fff", border: "1px solid rgba(255,255,255,0.1)", cursor: atLimit ? "not-allowed" : "pointer" }}
                  aria-label="Increase"
                  title={atLimit ? `Max stock reached` : undefined}
                >+</motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={stockLimit > 0 ? handleAddToCartClick : undefined}
                whileTap={stockLimit > 0 ? { scale: 0.96 } : {}}
                disabled={stockLimit === 0}
                className="w-full h-10 rounded-xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all"
                style={{
                  background: stockLimit === 0
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #e8f5e0 0%, #d4edca 100%)",
                  color: stockLimit === 0 ? "rgba(255,255,255,0.2)" : "#093d37",
                  boxShadow: stockLimit === 0 ? "none" : "0 2px 12px rgba(180,230,160,0.2), inset 0 1px 0 rgba(255,255,255,0.7)",
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: stockLimit === 0 ? "not-allowed" : "pointer",
                  border: stockLimit === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                }}
              >
                {stockLimit === 0 ? (
                  "Out of Stock"
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M1 1h2l2.4 7.5h6.6L14 4H4" stroke="#093d37" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="7" cy="13" r="1" fill="#093d37"/>
                      <circle cx="11" cy="13" r="1" fill="#093d37"/>
                    </svg>
                    Add to Cart
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}