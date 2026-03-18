// app/admin/components/AdminSidebar.tsx
// Desktop: left sidebar  |  Mobile: bottom tab bar
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const NAV = [
  { label:'Dashboard', href:'/admin/dashboard', icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10' },
  { label:'Orders',    href:'/admin/orders',    icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label:'Products',  href:'/admin/products',  icon:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label:'Users',     href:'/admin/users',     icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { label:'Payments',  href:'/admin/payments',  icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
];

export default function AdminSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname  = usePathname();
  const { logout } = useAdminAuth();

  const isActive = (href: string) =>
    href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ── DESKTOP: left sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col h-screen sticky top-0"
        style={{ background:'#080c10', borderRight:'1px solid rgba(6,182,212,0.08)', fontFamily:"'IBM Plex Mono',monospace" }}>

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom:'1px solid rgba(6,182,212,0.08)' }}>
          <Link href="/admin/dashboard">
            <span className="text-lg font-bold tracking-widest" style={{ color:'#06b6d4' }}>GREENKART</span>
            <p className="text-[9px] tracking-widest mt-0.5" style={{ color:'rgba(255,255,255,0.2)' }}>ADMIN PANEL</p>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {NAV.map(({ label, href, icon }) => {
            const active = isActive(href);
            const showBadge = label === 'Orders' && pendingCount > 0;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                style={{ background: active ? 'rgba(6,182,212,0.1)' : 'transparent',
                  color: active ? '#06b6d4' : 'rgba(255,255,255,0.4)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {icon.split('M').filter(Boolean).map((d, i) => <path key={i} d={`M${d}`}/>)}
                </svg>
                <span className="text-[11px] font-medium tracking-wide flex-1">{label}</span>
                {showBadge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background:'rgba(251,191,36,0.15)', color:'#fbbf24' }}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop:'1px solid rgba(6,182,212,0.08)' }}>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ color:'rgba(239,68,68,0.5)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            <span className="text-[11px] font-medium tracking-wide">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE: bottom tab bar ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe"
        style={{ background:'rgba(8,12,16,0.97)', borderTop:'1px solid rgba(6,182,212,0.12)',
          backdropFilter:'blur(20px)', paddingBottom:'max(12px, env(safe-area-inset-bottom))',
          paddingTop:'10px', fontFamily:"'IBM Plex Mono',monospace" }}>
        {NAV.map(({ label, href, icon }) => {
          const active     = isActive(href);
          const showBadge  = label === 'Orders' && pendingCount > 0;
          return (
            <Link key={href} href={href}
              className="relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
              style={{ color: active ? '#06b6d4' : 'rgba(255,255,255,0.3)', minWidth:44 }}>
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
                  {icon.split('M').filter(Boolean).map((d, i) => <path key={i} d={`M${d}`}/>)}
                </svg>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center"
                    style={{ background:'#ef4444', color:'#fff' }}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium tracking-wide">{label}</span>
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background:'#06b6d4' }} />
              )}
            </Link>
          );
        })}

          <button onClick={logout}
            className=" md:hidden  p-2 rounded-xl transition-all"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>

      </nav>

      {/* Bottom padding so content isn't hidden behind tab bar on mobile */}
      <div className="md:hidden h-20 shrink-0" />
    </>
  );
}