// components/ContactFAB.tsx
'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface Props {
  phoneNumber: string;
  message?: string;
}

export default function ContactFAB({
  phoneNumber,
  message = "Hi, I want to place an order",
}: Props) {
  const [open, setOpen] = useState(false);

  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  const callURL     = `tel:${phoneNumber}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">

      {/* CURVED ACTION BUTTONS */}
      <AnimatePresence>
        {open && (
          <>
            {/* WhatsApp (upper arc) */}
            <motion.a
              href={whatsappURL}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, x: -50, y: -60, scale: 1 }}
              exit={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: "#25D366",
                boxShadow: "0 8px 25px rgba(37,211,102,0.2)",
              }}
            >
              {/* <svg width="18" height="18" viewBox="0 0 32 32" fill="#082e28">

                <path d="M16 .4C7.4.4.4 7.4.4 16c0 2.8.7 5.5 2.1 7.9L0 32l8.3-2.2c2.3 1.3 4.9 2 7.7 2 8.6 0 15.6-7 15.6-15.6S24.6.4 16 .4z"/>
              </svg> */}
              <img src="/whatsapp.svg" alt="whatsapp" className='w-8' />
            </motion.a>

            {/* Call (side arc) */}
            <motion.a
              href={callURL}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, x: -70, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
              className="absolute w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4ade80, #22c55e)",
                boxShadow: "0 8px 25px rgba(34,197,94,0.2)",
              }}
            >
             <svg width="18" height="18" viewBox="0 0 24 24"
  fill="none" stroke="#082e28" strokeWidth="2"
  strokeLinecap="round" strokeLinejoin="round">
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2
    19.79 19.79 0 0 1-8.63-3.07
    19.5 19.5 0 0 1-6-6
    19.79 19.79 0 0 1-3.07-8.67
    A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72
    12.84 12.84 0 0 0 .7 2.81
    2 2 0 0 1-.45 2.11L8.09 9.91
    a16 16 0 0 0 6 6l1.27-1.27
    a2 2 0 0 1 2.11-.45
    12.84 12.84 0 0 0 2.81.7
    A2 2 0 0 1 22 16.92z" />
</svg>
            </motion.a>
          </>
        )}
      </AnimatePresence>

      {/* MAIN BUTTON */}
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: open ? 45 : 0 }} // subtle rotation
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #86efac, #4ade80)",
          boxShadow: "0 12px 35px rgba(74,222,128,0.2)",
        }}
      >
        {/* ICON SWITCH */}
        <AnimatePresence mode="wait">
          {!open ? (
            <motion.svg
              key="chat"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="#082e28" strokeWidth="2"
            >
              <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
            </motion.svg>
          ) : (
            <motion.svg
              key="close"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              width="22" height="22" viewBox="0 0 24 24" className="rotate-45"
              fill="none" stroke="#082e28" strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}