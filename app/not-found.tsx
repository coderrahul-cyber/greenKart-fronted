// app/not-found.tsx
'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

/* ── floating particle ── */
function Particle({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: 'rgba(251,191,36,0.25)' }}
      animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.4, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

const particles = [
  { x: 10, y: 20, size: 4,  delay: 0,    duration: 3.2 },
  { x: 85, y: 15, size: 6,  delay: 0.8,  duration: 4.1 },
  { x: 70, y: 75, size: 3,  delay: 1.4,  duration: 2.8 },
  { x: 20, y: 70, size: 5,  delay: 0.3,  duration: 3.7 },
  { x: 50, y: 10, size: 4,  delay: 2.0,  duration: 3.4 },
  { x: 92, y: 55, size: 3,  delay: 1.1,  duration: 4.5 },
  { x: 5,  y: 50, size: 6,  delay: 0.6,  duration: 3.0 },
  { x: 60, y: 88, size: 4,  delay: 1.8,  duration: 2.6 },
];

/* ── animated gear ── */
function Gear({ size, cx, cy, speed, reverse }: { size: number; cx: number; cy: number; speed: number; reverse?: boolean }) {
  const teeth = 8;
  const r = size / 2;
  const innerR = r * 0.65;
  const toothH = r * 0.22;
  const toothW = (2 * Math.PI * r) / (teeth * 2.5);

  const points = Array.from({ length: teeth }).flatMap((_, i) => {
    const angle1 = (i / teeth) * 2 * Math.PI - toothW / (2 * r);
    const angle2 = (i / teeth) * 2 * Math.PI + toothW / (2 * r);
    return [
      `${cx + Math.cos(angle1) * r},${cy + Math.sin(angle1) * r}`,
      `${cx + Math.cos(angle1) * (r + toothH)},${cy + Math.sin(angle1) * (r + toothH)}`,
      `${cx + Math.cos(angle2) * (r + toothH)},${cy + Math.sin(angle2) * (r + toothH)}`,
      `${cx + Math.cos(angle2) * r},${cy + Math.sin(angle2) * r}`,
    ];
  });

  return (
    <motion.g
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      style={{ originX: cx, originY: cy, transformOrigin: `${cx}px ${cy}px` }}>
      <polygon points={points.join(' ')} fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.5)" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={innerR} fill="rgba(13,17,23,0.9)" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={r * 0.18} fill="rgba(251,191,36,0.6)" />
    </motion.g>
  );
}

/* ── progress bar (fake looping) ── */
function ProgressBar() {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex justify-between mb-1.5">
        <span className="text-[9px] tracking-widest" style={{ color: 'rgba(251,191,36,0.5)', fontFamily: "'IBM Plex Mono',monospace" }}>BUILDING</span>
        <span className="text-[9px] tracking-widest" style={{ color: 'rgba(251,191,36,0.5)', fontFamily: "'IBM Plex Mono',monospace" }}>IN PROGRESS</span>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)' }}
          animate={{ x: ['-100%', '0%', '100%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

export default function NotFound() {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: '#070a0f', fontFamily: "'IBM Plex Mono',monospace" }}>

      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(251,191,36,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.04) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(251,191,36,0.06) 0%, transparent 70%)' }} />

      {/* Particles */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Gears SVG — background decoration */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }}>
        <Gear size={120} cx={80}  cy={120} speed={12} />
        <Gear size={72}  cx={172} cy={72}  speed={7}  reverse />
        <Gear size={90}  cx={-10} cy={280} speed={10} reverse />

        <Gear size={100} cx={1300} cy={100} speed={9} reverse />
        <Gear size={60}  cx={1380} cy={185} speed={5.5} />

        <Gear size={80}  cx={60}  cy={750} speed={8} reverse />
        <Gear size={110} cx={1340} cy={760} speed={11} />
      </svg>

      {/* Main card */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="relative z-10 flex flex-col items-center text-center px-6 py-12 max-w-sm w-full mx-4 rounded-3xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(251,191,36,0.12)', backdropFilter: 'blur(12px)' }}>

        {/* Caution tape stripe top */}
        <motion.div variants={item} className="absolute -top-3 left-6 right-6 h-6 rounded-full overflow-hidden flex">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 h-full"
              style={{ background: i % 2 === 0 ? '#fbbf24' : '#1c1408' }} />
          ))}
        </motion.div>

        {/* Icon */}
        <motion.div variants={item} className="mt-4 mb-5">
          <div className="relative w-20 h-20 mx-auto">
            {/* outer ring pulse */}
            <motion.div className="absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(251,191,36,0.3)' }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1.5px solid rgba(251,191,36,0.3)' }}>
              {/* Hard hat / construction icon */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <motion.path
                  d="M2 17h20v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z"
                  fill="rgba(251,191,36,0.7)"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.8, repeat: Infinity }} />
                <motion.path
                  d="M12 3C8 3 5 6 4.2 10H19.8C19 6 16 3 12 3z"
                  fill="rgba(251,191,36,0.9)"
                  animate={{ opacity: [0.9, 1, 0.9] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }} />
                <path d="M10 10V7M14 10V7" stroke="rgba(13,17,23,0.8)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* 404 */}
        <motion.p variants={item}
          className="text-[10px] tracking-[0.3em] mb-1"
          style={{ color: 'rgba(251,191,36,0.45)', fontFamily: "'IBM Plex Mono',monospace" }}>
          ERROR · 404
        </motion.p>

        <motion.h1 variants={item}
          className="text-5xl font-extrabold mb-2 leading-none"
          style={{ fontFamily: "'Syne',sans-serif", color: '#fbbf24', textShadow: '0 0 40px rgba(251,191,36,0.3)' }}>
          UNDER<br />CONSTRUCTION
        </motion.h1>

        <motion.p variants={item}
          className="text-[11px] leading-relaxed mb-6 max-w-[220px]"
          style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'IBM Plex Mono',monospace" }}>
          This page is being built.<br />Check back soon — good things are coming.
        </motion.p>

        {/* Progress bar */}
        <motion.div variants={item} className="w-full mb-6">
          <ProgressBar />
        </motion.div>

        {/* Go home button */}
        <motion.div variants={item} className="w-full">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-2xl text-xs font-bold tracking-[0.15em] flex items-center justify-center gap-2.5 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))',
                border: '1px solid rgba(251,191,36,0.35)',
                color: '#fbbf24',
                fontFamily: "'IBM Plex Mono',monospace",
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              BACK TO HOME
            </motion.div>
          </Link>
        </motion.div>

        {/* Caution tape stripe bottom */}
        <motion.div variants={item} className="absolute -bottom-3 left-6 right-6 h-6 rounded-full overflow-hidden flex">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 h-full"
              style={{ background: i % 2 === 0 ? '#fbbf24' : '#1c1408' }} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}