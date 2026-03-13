// app/admin/components/AdminSidebar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const NAV = [
  {
    href: '/admin/dashboard', label: 'Dashboard', badge: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/admin/orders', label: 'Orders', badge: 'orders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    href: '/admin/products', label: 'Products', badge: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    href: '/admin/users', label: 'Users', badge: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/admin/payments', label: 'Payments', badge: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        <line x1="6" y1="15" x2="10" y2="15" strokeWidth="2"/>
      </svg>
    ),
  },
];

export default function AdminSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname  = usePathname();
  const { admin, logout } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  const W = collapsed ? 68 : 224;

  return (
    <motion.aside
      animate={{ width: W }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-hidden z-40"
      style={{
        background: "linear-gradient(180deg, #070b0f 0%, #090d13 100%)",
        borderRight: "1px solid rgba(6,182,212,0.1)",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)" }} />

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 relative"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.07)" }}>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#0e7490,#06b6d4)",
              boxShadow: "0 0 16px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          {/* online pulse */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
            style={{ background: "#22c55e", borderColor: "#070b0f" }} />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
            >
              <div className="text-[11px] font-bold tracking-[0.18em]" style={{ color: "#e0f2fe" }}>GREENKART</div>
              <div className="text-[9px] tracking-[0.2em]" style={{ color: "rgba(6,182,212,0.45)" }}>ADMIN PANEL</div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setCollapsed(c => !c)}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="ml-auto p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.03)" }}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <motion.svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.25 }}
          >
            <polyline points="15 18 9 12 15 6"/>
          </motion.svg>
        </motion.button>
      </div>

      {/* ── Section label ────────────────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-4 pt-5 pb-1"
          >
            <span className="text-[9px] tracking-[0.22em] uppercase"
              style={{ color: "rgba(6,182,212,0.3)" }}>Navigation</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="flex-1 py-2 flex flex-col gap-0.5 px-2 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {NAV.map(({ href, label, icon, badge }, i) => {
          const active = pathname.startsWith(href);
          const count  = badge === 'orders' ? pendingCount : 0;

          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
            >
              <Link href={href}>
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 3 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer overflow-hidden"
                  style={{
                    background: active ? "rgba(6,182,212,0.1)" : "transparent",
                    color:      active ? "#22d3ee"             : "rgba(255,255,255,0.3)",
                  }}
                  title={collapsed ? label : undefined}
                >
                  {/* active left bar */}
                  {active && (
                    <motion.div
                      layoutId="activeBar"
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                      style={{ background: "linear-gradient(180deg, #06b6d4, #0891b2)" }}
                    />
                  )}

                  {/* active bg shimmer */}
                  {active && (
                    <div className="absolute inset-0 rounded-xl opacity-40"
                      style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, transparent 60%)" }} />
                  )}

                  <span className={`shrink-0 transition-colors ${active ? 'text-cyan-400' : ''}`}>
                    {icon}
                  </span>

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-[11px] font-medium tracking-wide whitespace-nowrap flex-1"
                        style={{ letterSpacing: "0.04em" }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff",
                        boxShadow: "0 0 8px rgba(239,68,68,0.4)" }}
                    >
                      {count > 99 ? '99+' : count}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="mx-3 h-px" style={{ background: "rgba(6,182,212,0.07)" }} />

      {/* ── Admin user + Logout ───────────────────────────────────── */}
      <div className="px-2 py-3 flex flex-col gap-1">

        {/* User info row */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))",
              color: "#06b6d4",
              border: "1px solid rgba(6,182,212,0.2)",
            }}>
            {admin?.username?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[11px] font-medium truncate" style={{ color: "#e0f2fe" }}>
                  {admin?.username ?? 'admin'}
                </p>
                <p className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.4)" }}>
                  {admin?.role ?? 'administrator'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout button — full width */}
        <motion.button
          onClick={handleLogout}
          disabled={loggingOut}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full transition-all"
          style={{
            background: loggingOut ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.12)",
            color: loggingOut ? "rgba(252,165,165,0.4)" : "rgba(252,165,165,0.7)",
            cursor: loggingOut ? "not-allowed" : "pointer",
          }}
          onMouseEnter={e => {
            if (!loggingOut) {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.25)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(252,165,165,0.95)";
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(252,165,165,0.7)";
          }}
          title="Logout"
        >
          {loggingOut ? (
            <div className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
              style={{ borderColor: "rgba(252,165,165,0.2)", borderTopColor: "rgba(252,165,165,0.6)" }} />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          )}

          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[11px] font-medium tracking-wide whitespace-nowrap"
                style={{ letterSpacing: "0.05em" }}
              >
                {loggingOut ? "Signing out…" : "Sign Out"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-20 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
    </motion.aside>
  );
}