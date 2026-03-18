// app/admin/users/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminShell from '@/app/admin/components/AdminShell';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

interface User {
  _id: string; name: string; phoneNumber: string;
  isActive: boolean; isPhoneVerified: boolean; createdAt: string;
  orderCount?: number; totalSpent?: number;
}

/* ── User detail bottom sheet ── */
function UserSheet({ user, token, onClose, onPhoneVerifyToggle, onDelete }: {
  user: User; token: string | null; onClose: () => void;
  onPhoneVerifyToggle: (id: string, verified: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [verifyToggling, setVerifyToggling] = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [detail,         setDetail]         = useState<any>(null);
  const phone = user.phoneNumber ?? '';

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/users/${user._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setDetail(j?.data?.user ?? j?.data ?? null)).catch(() => {});
  }, [user._id, token]);

  const handleVerifyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVerified = e.target.value === 'verified';
    if (newVerified === user.isPhoneVerified) return;
    setVerifyToggling(true);
    try {
      await fetch(`${API}/admin/users/${user._id}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      onPhoneVerifyToggle(user._id, newVerified);
    } catch {} finally { setVerifyToggling(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await fetch(`${API}/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(user._id);
      onClose();
    } catch {} finally { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
      style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)' }}
      onClick={() => { setConfirmDelete(false); onClose(); }}>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', stiffness:320, damping:32 }}
        className="w-full sm:max-w-sm  min-h-[70dvh] md:min-h-auto max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ background:'#0d1117', border:'1px solid rgba(6,182,212,0.15)', fontFamily:"'IBM Plex Mono',monospace" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-bold" style={{ color:'#e0f2fe' }}>{user.name}</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5" style={{ color:'rgba(255,255,255,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4 pb-8">
          {/* Avatar + call */}
          <div className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold"
                style={{ background:'rgba(6,182,212,0.1)', color:'#06b6d4', border:'1px solid rgba(6,182,212,0.2)' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color:'#e0f2fe' }}>{user.name}</p>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{
                      background: user.isPhoneVerified ? 'rgba(96,165,250,0.1)' : 'rgba(239,68,68,0.1)',
                      color:      user.isPhoneVerified ? '#60a5fa'               : '#f87171',
                    }}>
                    {user.isPhoneVerified ? 'Phone Verified' : 'Phone Unverified'}
                  </span>
                </div>
              </div>
            </div>
            {phone && (
              <a href={`tel:+91${phone.replace(/\D/g,'')}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
                style={{ background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.06 2.22 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                </svg>
                <span className="text-[10px] font-bold">CALL</span>
              </a>
            )}
          </div>

          {/* Info */}
          <div className="rounded-2xl px-4 py-3 flex flex-col gap-2.5"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {[
              { l:'Phone',   v: phone ? `+91 ${phone}` : '—' },
              { l:'Joined',  v: new Date(user.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) },
              { l:'Orders',  v: String(detail?.orders?.length ?? user.orderCount ?? '—') },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between text-[11px]">
                <span style={{ color:'rgba(255,255,255,0.3)' }}>{l}</span>
                <span style={{ color:'rgba(255,255,255,0.7)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Phone Verification Dropdown */}
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.06 2.22 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.3)' }}>Phone Verification</span>
            </div>
            <div className="flex items-center gap-2">
              {verifyToggling && (
                <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin"
                  style={{ color: user.isPhoneVerified ? '#60a5fa' : '#f87171' }} />
              )}
              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: user.isPhoneVerified ? '#60a5fa' : '#f87171' }} />
              <select
                value={user.isPhoneVerified ? 'verified' : 'not_verified'}
                onChange={handleVerifyChange}
                disabled={verifyToggling}
                className="text-[10px] font-semibold rounded-lg px-2 py-1.5 pr-6 outline-none appearance-none cursor-pointer disabled:opacity-50"
                style={{
                  background:         user.isPhoneVerified ? 'rgba(96,165,250,0.08)'  : 'rgba(239,68,68,0.08)',
                  color:              user.isPhoneVerified ? '#60a5fa'                 : '#f87171',
                  border:             `1px solid ${user.isPhoneVerified ? 'rgba(96,165,250,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  fontFamily:         "'IBM Plex Mono',monospace",
                  backgroundImage:    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat:   'no-repeat',
                  backgroundPosition: 'right 6px center',
                }}>
                <option value="verified"     style={{ background:'#0d1117', color:'#60a5fa' }}>VERIFIED</option>
                <option value="not_verified" style={{ background:'#0d1117', color:'#f87171' }}>NOT VERIFIED</option>
              </select>
            </div>
          </div>

          {/* Addresses */}
          {(detail?.addresses?.length ?? 0) > 0 && (
            <div className="rounded-2xl px-4 py-3"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] tracking-widest uppercase mb-2" style={{ color:'rgba(255,255,255,0.25)' }}>Addresses</p>
              {detail.addresses.map((a: any) => (
                <p key={a._id} className="text-[10px] leading-relaxed mb-1" style={{ color:'rgba(255,255,255,0.45)' }}>
                  {[a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', ')}
                  {a.isDefault && <span className="ml-1 text-[8px]" style={{ color:'#06b6d4' }}>(default)</span>}
                </p>
              ))}
            </div>
          )}

          {/* ── Delete button — only for unverified users ── */}
          {!user.isPhoneVerified && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={deleting}
              onClick={handleDelete}
              className="w-full py-3.5 rounded-2xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all"
              style={{
                background: confirmDelete ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.08)',
                color:      '#f87171',
                border:     `1px solid ${confirmDelete ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.2)'}`,
              }}>
              {deleting ? (
                <div className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                  {confirmDelete ? 'CONFIRM DELETE?' : 'DELETE USER'}
                </>
              )}
            </motion.button>
          )}

          {/* cancel confirm hint */}
          {confirmDelete && !deleting && (
            <button onClick={() => setConfirmDelete(false)}
              className="text-[10px] text-center w-full pb-1"
              style={{ color:'rgba(255,255,255,0.2)' }}>
              tap elsewhere to cancel
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── User card ── */
function UserCard({ user, onOpen }: { user: User; onOpen: () => void }) {
  const phone = user.phoneNumber ?? '';
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      whileTap={{ scale:0.99 }}
      className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
      style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.06)' }}
      onClick={onOpen}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold shrink-0"
        style={{ background:'rgba(6,182,212,0.1)', color:'#06b6d4', border:'1px solid rgba(6,182,212,0.15)' }}>
        {user.name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold truncate" style={{ color:'#e0f2fe' }}>{user.name}</p>
          {user.isPhoneVerified && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.35)' }}>
          +91 {phone || '—'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
          style={{
            background: user.isActive ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
            color:      user.isActive ? '#4ade80'               : '#f87171',
          }}>
          {user.isActive ? 'Active' : 'Suspended'}
        </span>
        {phone && (
          <a href={`tel:+91${phone.replace(/\D/g,'')}`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background:'rgba(74,222,128,0.08)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.15)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.06 2.22 2 2 0 012 .04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminUsersPage() {
  const { accessToken } = useAdminAuth();
  const [users,    setUsers]    = useState<User[]>([]);
  const [stats,    setStats]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 15;

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        fetch(`${API}/admin/users`,       { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/admin/users/stats`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const [uJson, sJson] = await Promise.all([uRes.json(), sRes.json()]);
      setUsers(uJson?.data?.users ?? uJson?.data ?? []);
      setStats(sJson?.data ?? null);
    } catch {} finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handlePhoneVerifyToggle = (id: string, verified: boolean) => {
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isPhoneVerified: verified } : u));
    if (selected?._id === id) setSelected(prev => prev ? { ...prev, isPhoneVerified: verified } : null);
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u._id !== id));
    setSelected(null);
  };

  const filtered   = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.phoneNumber?.includes(q);
  });
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <AdminShell title="Users">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { l:'Total',     v: stats.total       ?? users.length, c:'#06b6d4' },
            { l:'Active',    v: stats.active       ?? 0,            c:'#4ade80' },
            { l:'Verified',  v: stats.verified     ?? 0,            c:'#a78bfa' },
            { l:'New (30d)', v: stats.newThisMonth ?? 0,            c:'#f59e0b' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-2xl px-4 py-3" style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-2xl font-bold" style={{ color:c }}>{v}</p>
              <p className="text-[10px] tracking-wide mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>{l}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or phone..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none"
          style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', color:'#e0f2fe', fontFamily:"'IBM Plex Mono',monospace", caretColor:'#06b6d4' }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {paginated.map((u, i) => (
              <motion.div key={u._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.02 }}>
                <UserCard user={u} onOpen={() => setSelected(u)} />
              </motion.div>
            ))}
            {paginated.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <p className="text-xs" style={{ color:'rgba(255,255,255,0.2)' }}>No users found</p>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.2)' }}>{filtered.length} users · page {page}/{totalPages}</span>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 rounded-lg text-[10px] font-medium transition-all"
                    style={{ background: p === page ? 'rgba(6,182,212,0.15)' : 'transparent', color: p === page ? '#06b6d4' : 'rgba(255,255,255,0.3)', border: p === page ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selected && (
          <UserSheet
            user={selected}
            token={accessToken}
            onClose={() => setSelected(null)}
            onPhoneVerifyToggle={handlePhoneVerifyToggle}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}