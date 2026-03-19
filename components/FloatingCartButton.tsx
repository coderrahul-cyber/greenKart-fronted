// components/FloatingCartButton.tsx
'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function FloatingCartButton() {
  const router = useRouter();
  const { cart } = useCart();

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 "
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => router.push('/cart')}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #e8f5e0, #c8eabc)",
              boxShadow: "0 8px 30px rgba(74,222,128,0.25)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {/* Cart Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#082e28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>

            {/* Text */}
            <span className="text-sm font-semibold font-poppins text-[#082e28]">
              View Cart
            </span>

            {/* Badge */}
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "#082e28",
                color: "#c8eabc",
              }}
            >
              {totalItems}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}