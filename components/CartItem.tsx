"use client";

import { motion, AnimatePresence } from "motion/react";

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

interface CartItemProps {
  productId:  string;   // used by context for all operations
  name:       string;
  image:      string;
  price:      number;
  quantity:   number;
  stockLimit: number;   // max purchasable quantity
  onRemove:         (productId: string) => void;
  onQuantityChange: (productId: string, newQuantity: number) => void;
}

export default function CartItem({
  productId,
  name,
  image,
  price,
  quantity,
  stockLimit,
  onRemove,
  onQuantityChange,
}: CartItemProps) {
  const atMax = quantity >= stockLimit;
  const atMin = quantity <= 1;

  const handleIncrease = () => {
    if (!atMax) onQuantityChange(productId, quantity + 1);
  };
  const handleDecrease = () => {
    if (quantity > 1) onQuantityChange(productId, quantity - 1);
    else onRemove(productId);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, x: -40, scale: 0.95 }}
      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group flex items-center gap-4 rounded-2xl p-3 transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.065)" }}
    >
      {/* Image */}
      <div
        className="relative shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
        style={{
          width: 72, height: 72,
          background: "linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
          />
        ) : (
          <span style={{ fontSize: 32 }}>🥦</span>
        )}
      </div>

      {/* Name + stock indicator */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3
          className="font-semibold text-base leading-snug truncate"
          style={{ color: "#f0f7ee", fontFamily: "'Playfair Display', serif" }}
        >
          {name}
        </h3>

        {/* Stock limit badge — only shows when close to or at limit */}
        <AnimatePresence>
          {atMax ? (
            <motion.span
              key="max"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1 self-start text-[10px] font-semibold tracking-widest uppercase rounded-full px-2 py-0.5"
              style={{
                background: "rgba(251,191,36,0.1)",
                color: "rgba(251,191,36,0.85)",
                border: "1px solid rgba(251,191,36,0.18)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
              Max stock
            </motion.span>
          ) : quantity >= stockLimit - 2 && stockLimit < 99 ? (
            <motion.span
              key="low"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1 self-start text-[10px] font-semibold tracking-widest uppercase rounded-full px-2 py-0.5"
              style={{
                background: "rgba(251,191,36,0.07)",
                color: "rgba(251,191,36,0.55)",
                border: "1px solid rgba(251,191,36,0.1)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Only {stockLimit - quantity} left
            </motion.span>
          ) : (
            <motion.span
              key="organic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1 self-start text-[10px] font-semibold tracking-widest uppercase rounded-full px-2 py-0.5"
              style={{
                background: "rgba(74,222,128,0.1)",
                color: "rgba(74,222,128,0.8)",
                border: "1px solid rgba(74,222,128,0.15)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              Organic
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-end gap-2.5 shrink-0">
        {/* Total price for this line */}
        <motion.span
          key={quantity}
          initial={{ scale: 1.2, opacity: 0.6 }}
          animate={{ scale: 1,   opacity: 1   }}
          transition={{ duration: 0.2 }}
          className="font-bold text-lg tracking-tight"
          style={{ color: "#f0f7ee", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}
        >
          ₹{(price * quantity).toFixed(0)}
        </motion.span>

        {/* Qty stepper + trash */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-xl px-1.5 py-1"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            {/* Decrease / remove */}
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleDecrease}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-sm font-bold transition-colors"
              style={{
                color: atMin ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.07)",
              }}
              aria-label="Decrease quantity"
            >
              −
            </motion.button>

            <motion.span
              key={quantity}
              initial={{ scale: 1.35, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1  }}
              transition={{ duration: 0.18 }}
              className="w-5 text-center text-sm font-bold"
              style={{ color: "#fff", fontFamily: "'DM Sans', sans-serif" }}
            >
              {quantity}
            </motion.span>

            {/* Increase — disabled at stockLimit */}
            <motion.button
              whileTap={!atMax ? { scale: 0.82 } : {}}
              onClick={handleIncrease}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-sm font-bold transition-colors"
              style={{
                color: atMax ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                background: atMax ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
                cursor: atMax ? "not-allowed" : "pointer",
              }}
              disabled={atMax}
              aria-label="Increase quantity"
              title={atMax ? `Max stock reached (${stockLimit})` : undefined}
            >
              +
            </motion.button>
          </div>

          {/* Remove */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onRemove(productId)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
            style={{
              color: "rgba(255,100,100,0.5)",
              background: "rgba(255,80,80,0.06)",
              border: "1px solid rgba(255,80,80,0.1)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,100,100,1)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.14)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,100,100,0.5)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.06)";
            }}
            aria-label="Remove item"
          >
            <TrashIcon />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}