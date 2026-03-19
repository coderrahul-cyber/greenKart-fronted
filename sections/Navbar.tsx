"use client";

import { CartIcon } from "@/components/Cart";
import { AlignLeftIcon } from "@/components/Hambuger";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const MENU_LINKS = [
  { label: "About-Us",          href: "/about",     icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4" },
  // { label: "Seasonal",      href: "/seasonal", icon: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20" },
  // { label: "Offers",        href: "/offers",   icon: "M7 7h.01M17 17h.01M7 17L17 7M6 6a1 1 0 112 0 1 1 0 01-2 0zm10 10a1 1 0 112 0 1 1 0 01-2 0z" },
  { label: "Order History", href: "/order-history",   icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Profile",       href: "/profile",  icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
];

const Navbar = () => {
  const {logout , isAuthenticated} = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  /* ── Deepen glass on scroll ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Scroll lock ── */
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    if (isMenuOpen) {
      body.style.overflow           = "hidden";
      html.style.overflow           = "hidden";
      body.style.overscrollBehavior = "none";
      html.style.overscrollBehavior = "none";
    } else {
      body.style.overflow           = "";
      html.style.overflow           = "";
      body.style.overscrollBehavior = "";
      html.style.overscrollBehavior = "";
    }
    return () => {
      body.style.overflow           = "";
      html.style.overflow           = "";
      body.style.overscrollBehavior = "";
      html.style.overscrollBehavior = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* ══════════════════════════════════
          STICKY GLASS NAVBAR
      ══════════════════════════════════ */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6"
        style={{ paddingTop: "12px" }}
      >
        <div
          className="mx-auto flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500"
          style={{
            maxWidth: "900px",
            background: scrolled
              ? "rgba(8, 26, 22, 0.72)"
              : "rgba(8, 26, 22, 0.45)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: scrolled
              ? "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)"
              : "0 4px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Hamburger — all screen sizes */}
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            className="flex items-center cursor-pointer justify-center rounded-xl p-1.5 transition-all"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            <AlignLeftIcon size={24} color="currentColor" />
          </button>

          {/* Centered Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <span
              className="text-2xl sm:text-[26px] font-semibold tracking-tight select-none"
              style={{
                fontFamily: "'Playfair Display', serif",
                background: "linear-gradient(135deg, #f0f7ee 30%, #86efac 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              GreenKart
            </span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Cart"
            className="flex items-center justify-center rounded-xl p-1.5 transition-all"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            <CartIcon size={24} color="currentColor" />
          </Link>
        </div>
      </motion.nav>

      {/* ══════════════════════════════════
          FULL-SCREEN OVERLAY
          Circular scale from top-left
      ══════════════════════════════════ */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, borderRadius: "100%" }}
            animate={{ scale: 1, opacity: 1, borderRadius: "0%"   }}
            exit={{   scale: 0, opacity: 0, borderRadius: "100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 overflow-hidden flex flex-col"
            style={{
              originX: 0.02,
              originY: 0.02,
              background: "linear-gradient(145deg, #0d5c54 0%, #082e28 55%, #051e1a 100%)",
            }}
          >
            {/* Ambient blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              <div style={{
                position: "absolute", top: "-100px", right: "-100px",
                width: "500px", height: "500px", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 65%)",
                filter: "blur(40px)",
              }}/>
              <div style={{
                position: "absolute", bottom: "-80px", left: "-80px",
                width: "400px", height: "400px", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(13,92,84,0.4) 0%, transparent 65%)",
                filter: "blur(50px)",
              }}/>
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="absolute top-5 left-5 z-10 flex items-center justify-center rounded-xl p-2 transition-all"
              style={{
                color: "rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M17 5L5 17M5 5l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Logo inside overlay */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1,  y: 0   }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="absolute top-5 left-1/2 -translate-x-1/2"
            >
              <span
                className="text-2xl font-semibold select-none"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  background: "linear-gradient(135deg, #f0f7ee 30%, #86efac 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                GreenKart
              </span>
            </motion.div>

            {/* ── Nav links ── */}
            <div className="flex flex-1 flex-col justify-center px-8 sm:px-16 pt-20 pb-8">

              <motion.p
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1,  x: 0  }}
                transition={{ delay: 0.28, duration: 0.35 }}
                className="mb-5 text-xs font-semibold tracking-widest uppercase"
                style={{ color: "rgba(74,222,128,0.7)", fontFamily: "'DM Sans', sans-serif" }}
              >
                Menu
              </motion.p>

              <nav className="flex flex-col gap-1">
                {MENU_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -28 }}
                    animate={{ opacity: 1,  x: 0  }}
                    transition={{ delay: 0.32 + i * 0.07, duration: 0.38, ease: "easeOut" }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      }}
                    >
                      {/* Icon chip */}
                      <div
                        className="flex items-center justify-center rounded-xl shrink-0"
                        style={{
                          width: 40, height: 40,
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.09)",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                          stroke="rgba(255,255,255,0.65)" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d={link.icon}/>
                        </svg>
                      </div>

                      <span
                        className="text-xl font-medium"
                        style={{ color: "rgba(255,255,255,0.82)", letterSpacing: "-0.01em" }}
                      >
                        {link.label}
                      </span>

                      {/* Hover arrow */}
                      <svg
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        width="16" height="16" viewBox="0 0 16 16" fill="none"
                      >
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="rgba(74,222,128,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1,  scaleX: 1 }}
                transition={{ delay: 0.65, duration: 0.4, ease: "easeOut" }}
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.08)",
                  marginTop: 28, marginBottom: 20,
                  transformOrigin: "left",
                }}
              />

              {/* Log out */}
              {isAuthenticated && 
 <motion.button 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1,  y: 0  }}
                transition={{ delay: 0.7, duration: 0.35 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all self-start"
                style={{
                  color: "rgba(255,100,100,0.75)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,130,130,1)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,100,100,0.75)";
                }}
                onClick={e=>{
                  logout();
                  setIsMenuOpen(false);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Log Out
              </motion.button>


              }
             
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1  }}
              transition={{ delay: 0.75, duration: 0.4 }}
              className="px-8 sm:px-16 pb-8 flex items-center justify-between"
            >
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                © 2025 GreenKart
              </p>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}/>
                <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                  All systems live
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;