// components/FloatingCallButton.tsx
'use client';

import { motion } from 'motion/react';

interface Props {
  phoneNumber: string; // e.g. "919876543210"
}

export default function FloatingCallButton({ phoneNumber }: Props) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <motion.a
        href={`tel:${phoneNumber}`}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.08 }}
        className="flex items-center gap-2 px-4 py-3 rounded-full"
        style={{
          background: "linear-gradient(135deg, #4ade80, #22c55e)",
          boxShadow: "0 10px 30px rgba(34,197,94,0.35)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {/* Icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#082e28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.72 19.72 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.72 19.72 0 0 1 2.09 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.78.6 2.63a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.45-1.12a2 2 0 0 1 2.11-.45c.85.28 1.73.48 2.63.6A2 2 0 0 1 22 16.92z"/>
        </svg>

        {/* Label (only on desktop) */}
        <span className="hidden md:inline text-sm font-semibold font-poppins text-[#082e28]">
          Call Us
        </span>
      </motion.a>
    </motion.div>
  );
}