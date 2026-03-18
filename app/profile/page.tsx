// app/profile/page.tsx
'use client';

import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
// import { useRouter } from 'next/navigation';
import ProfileEditSheet from '@/components/ProfileEditSheet';
// import { cookies } from 'next/headers';

/* ── Icons ── */
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const CardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Stat card ── */
const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center gap-1 px-5 py-4 rounded-2xl flex-1"
    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <span className="text-2xl font-bold text-white font-poppins" style={{ letterSpacing: "-0.03em" }}>{value}</span>
    <span className="text-xs font-medium text-white/40 font-roboto tracking-wide uppercase">{label}</span>
  </div>
);

/* ── Field row ── */
const FieldRow = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-4"
    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] font-semibold tracking-widest uppercase text-white/35 font-roboto">{label}</span>
      <span className="text-base font-medium text-white/80 font-poppins">{value}</span>
    </div>
    {icon && <div className="shrink-0 mt-1 text-white/25">{icon}</div>}
  </div>
);

/* ── Nav row ── */
const NavRow = ({ label, icon, href }: { label: string; icon: React.ReactNode; href: string }) => (
  <Link href={href}>
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-center justify-between py-3.5 px-4 rounded-2xl transition-colors duration-200 group cursor-pointer"
      style={{ background: "rgba(255,255,255,0.0)" }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.0)"}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {icon}
        </div>
        <span className="text-[15px] font-medium text-white/70 group-hover:text-white/90 transition-colors font-poppins">{label}</span>
      </div>
      <span className="text-white/25 group-hover:text-white/50 transition-colors"><ChevronRight /></span>
    </motion.div>
  </Link>
);

/* ── Logout confirmation modal ── */
const LogoutModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ background: "rgba(4,14,11,0.7)", backdropFilter: "blur(8px)" }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1,   opacity: 1, y: 0  }}
      exit={{   scale: 0.9, opacity: 0, y: 20  }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
      style={{
        background: "linear-gradient(145deg, #0d5c54, #082e28)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)" }}>
          <LogOutIcon />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white font-playfair">Sign out?</h3>
          <p className="text-sm text-white/40 font-roboto mt-1">You'll need to log back in to access your cart and orders.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold font-poppins transition-all"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          Cancel
        </button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onConfirm}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold font-poppins transition-all"
          style={{ background: "rgba(255,80,80,0.15)", color: "rgba(255,130,130,1)", border: "1px solid rgba(255,80,80,0.25)" }}
        >
          Yes, sign out
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function ProfilePage() {
  const { user, logout, isLoading , accessToken } = useAuth();
  // const router = useRouter();
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditSheet,   setShowEditSheet]   = useState(false);
  const [displayName,     setDisplayName]     = useState(user?.name ?? '');
  // const  cookieStore = cookies();

  //  const token = cookieStore.get('accessToken')?.value;

  const handleLogout = () => {
    logout(); // clears cookies + state, redirects to /
  };

  // Stagger variants
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const item: import('motion/react').Variants = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as number[] } },
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-green-400/30 border-t-green-400 animate-spin" />
          <span className="text-sm text-white/30 font-roboto">Loading profile…</span>
        </div>
      </div>
    );
  }

  /* ── Not logged in guard ── */
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4"
        style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white/30"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <AlertIcon />
          </div>
          <h2 className="text-2xl font-semibold text-white font-playfair">Not signed in</h2>
          <p className="text-sm text-white/40 font-roboto">Please log in to view your profile.</p>
        </div>
        <Link href="/login">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3.5 rounded-2xl text-sm font-semibold font-poppins"
            style={{ background: "linear-gradient(135deg, #e8f5e0, #c8eabc)", color: "#082e28" }}
          >
            Go to Login
          </motion.div>
        </Link>
      </div>
    );
  }

  // Derive initials
  const initials = user.name
    .split(' ')
    .map(n => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div
      className="min-h-screen font-roboto"
      style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-72 rounded-full opacity-40"
          style={{ background: "radial-gradient(ellipse, #0d5c54, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* Top bar */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4"
        style={{
          background: "rgba(8,26,22,0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link href="/">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <BackIcon />
          </motion.div>
        </Link>
        <span className="text-lg font-semibold text-white/80 font-playfair">Profile</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
                        onClick={() => setShowEditSheet(true)}

          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <EditIcon />
        </motion.button>
      </motion.header>

      <main className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-lg mx-auto flex flex-col gap-4">
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">

          {/* ── Hero card ── */}
          <motion.div
            variants={item}
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(13,92,84,0.55) 0%, rgba(8,46,40,0.6) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-5 text-center">
              {/* Avatar */}
              <motion.div
                className="relative cursor-pointer"
                onHoverStart={() => setAvatarHovered(true)}
                onHoverEnd={() => setAvatarHovered(false)}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center select-none font-playfair font-bold"
                  style={{
                    background: "linear-gradient(135deg, #0d5c54, #4ade80)",
                    boxShadow: "0 0 0 3px rgba(74,222,128,0.25), 0 8px 24px rgba(0,0,0,0.3)",
                    color: "#fff",
                    fontSize: 32,
                  }}
                >
                  {initials}
                </div>
                {/* Online dot */}
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full"
                  style={{ background: "#4ade80", border: "2.5px solid #082e28", boxShadow: "0 0 8px #4ade80" }} />
                {/* Camera on hover */}
                <AnimatePresence>
                  {avatarHovered && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.45)" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Name */}
              <div className="flex flex-col items-center gap-1.5">
                <h1 className="text-2xl font-semibold text-white font-playfair" style={{ letterSpacing: "-0.02em" }}>
                  {displayName || user.name}
                </h1>

               {/* Verified / unverified badge */}
             <div className="mt-1 flex items-center gap-2"> <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase" style={{ background: user.isPhoneVerified ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)", color: user.isPhoneVerified ? "#4ade80" : "#fbbf24", border: `1px solid ${user.isPhoneVerified ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)"}`, }} > <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: user.isPhoneVerified ? "#4ade80" : "#fbbf24", boxShadow: `0 0 5px ${user.isPhoneVerified ? "#4ade80" : "#fbbf24"}` }} /> {user.isPhoneVerified ? "Phone Verified" : "Phone Unverified"} </span> </div>
              </div>
            </div>

            {/* Stats */}
            <div className="px-4 pb-5 flex gap-3">
              <StatCard value="0"    label="Orders"  />
              {/* <StatCard value="₹0"  label="Saved"   /> */}
              {/* <StatCard value="New" label="Status"  /> */}
            </div>
          </motion.div>

          {/* ── Info card ── */}
          <motion.div
            variants={item}
            className="rounded-3xl px-5 py-2"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(16px)",
            }}
          >
            <FieldRow label="Full Name"    value={displayName || user.name} />
            <FieldRow label="Phone"        value={user.phoneNumber || "—"} />
            <FieldRow label="Address"      value="Manage from addresses" icon={<MapPinIcon />} />
            <div className="flex items-start justify-between gap-4 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-white/35 font-roboto">Password</span>
                <span className="text-lg text-white/60 tracking-widest">● ● ● ● ● ● ● ●</span>
              </div>
              <div className="mt-1 text-white/25"><LockIcon /></div>
            </div>
          </motion.div>

          {/* ── Navigation card ── */}
          <motion.div
            variants={item}
            className="rounded-3xl px-2 py-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-[11px] font-semibold tracking-widest uppercase text-white/30 px-4 pb-2 font-roboto">Account</p>
            <NavRow label="Order History"   icon={<PackageIcon />} href="/order-history"         />
            {/* <NavRow label="Payment Details" icon={<CardIcon />}    href="/payment-details" /> */}
            <NavRow label="Saved Addresses" icon={<MapPinIcon />}  href="/address"       />
            {/* <NavRow label="Notifications"   icon={<BellIcon />}    href="/notifications"   /> */}
          </motion.div>

          {/* ── Action buttons ── */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(200,234,188,0.18)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowEditSheet(true)}
              className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm font-poppins transition-all"
              style={{
                background: "linear-gradient(135deg, #e8f5e0 0%, #c8eabc 100%)",
                color: "#082e28",
                boxShadow: "0 4px 20px rgba(74,222,128,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              <EditIcon /> Edit Profile
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowLogoutModal(true)}
              className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm font-poppins transition-all"
              style={{
                background: "rgba(255,80,80,0.07)",
                color: "rgba(255,110,110,0.85)",
                border: "1px solid rgba(255,80,80,0.2)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,130,130,1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.07)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,110,110,0.85)";
              }}
            >
              <LogOutIcon /> Log Out
            </motion.button>
          </motion.div>

        </motion.div>
      </main>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <LogoutModal
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Profile edit sheet */}
      <AnimatePresence>
        {showEditSheet && (
          <ProfileEditSheet
            currentName={displayName || user.name}
            phoneNumber={user.phoneNumber}
            accessToken={accessToken}
            onClose={() => setShowEditSheet(false)}
            onSuccess={updatedName => {
              setDisplayName(updatedName);
              setShowEditSheet(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}