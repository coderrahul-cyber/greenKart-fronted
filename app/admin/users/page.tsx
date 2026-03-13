// app/admin/users/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminShell from '@/app/admin/components/AdminShell';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

interface User {
  _id: string; name: string; email: string; phoneNumber: string;
  isActive: boolean; isEmailVerified: boolean; createdAt: string;
  orderCount?: number; totalSpent?: number;
}

function UserDrawer({ user, token, onClose, onToggle }: {
  user: User; token: string | null; onClose: () => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [detail, setDetail]     = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/users/${user._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setDetail(j?.data?.user ?? j?.data ?? null)).catch(() => {});
  }, [user._id, token]);

  const toggle = async () => {
    setToggling(true);
    try {
      await fetch(`${API}/admin/users/${user._id}/toggle`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      onToggle(user._id, !user.isActive);
    } catch {} finally { setToggling(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-start justify-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-sm h-screen overflow-y-auto flex flex-col"
        style={{ background: '#0d1117', borderLeft: '1px solid rgba(6,182,212,0.15)', fontFamily: "'IBM Plex Mono', monospace" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-xs font-bold" style={{ color: '#e0f2fe' }}>{user.name}</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#e0f2fe' }}>{user.name}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ background: user.isActive ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', color: user.isActive ? '#4ade80' : '#f87171' }}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </span>
                {user.isEmailVerified && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>Verified</span>
                )}
              </div>
            </div>
          </div>
          {/* Info */}
          <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { l: 'Phone',   v: user.phoneNumber || '—' },
              { l: 'Joined',  v: new Date(user.createdAt).toLocaleDateString('en-IN') },
              { l: 'Orders',  v: String(detail?.orders?.length ?? user.orderCount ?? '—') },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between text-[11px]">
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{v}</span>
              </div>
            ))}
          </div>
          {/* Addresses */}
          {(detail?.addresses?.length ?? 0) > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Addresses</p>
              {detail.addresses.map((a: any) => (
                <p key={a._id} className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {[a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', ')}
                  {a.isDefault && <span className="ml-1 text-[8px] text-cyan-400">(default)</span>}
                </p>
              ))}
            </div>
          )}
          {/* Toggle */}
          <motion.button whileTap={{ scale: 0.97 }} disabled={toggling} onClick={toggle}
            className="w-full py-3 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all"
            style={{
              background: user.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
              color:      user.isActive ? '#f87171'              : '#4ade80',
              border:     `1px solid ${user.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
            }}>
            {toggling ? <div className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin" />
              : user.isActive ? 'SUSPEND USER' : 'ACTIVATE USER'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminUsersPage() {
  const { accessToken } = useAdminAuth();
  const [users,   setUsers]   = useState<User[]>([]);
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [selected,setSelected]= useState<User | null>(null);
  const [page,    setPage]    = useState(1);
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

  const handleToggle = (id: string, active: boolean) => {
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: active } : u));
    if (selected?._id === id) setSelected(prev => prev ? { ...prev, isActive: active } : null);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <AdminShell title="Users">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { l: 'Total',    v: stats.total    ?? users.length, c: '#06b6d4' },
            { l: 'Active',   v: stats.active   ?? 0,            c: '#4ade80' },
            { l: 'Verified', v: stats.verified ?? 0,            c: '#a78bfa' },
            { l: 'New (30d)',v: stats.newThisMonth ?? 0,         c: '#f59e0b' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xl font-bold" style={{ color: c }}>{v}</p>
              <p className="text-[10px] tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none max-w-sm"
          style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', color: '#e0f2fe', fontFamily: "'IBM Plex Mono', monospace", caretColor: '#06b6d4' }} />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['User','Email','Phone','Status','Joined',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium tracking-widest text-[9px] uppercase"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, i) => (
                  <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onClick={() => setSelected(u)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: '#e0f2fe' }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{u.email}</td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{u.phoneNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                        style={{ background: u.isActive ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', color: u.isActive ? '#4ade80' : '#f87171' }}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <button className="px-2.5 py-1.5 rounded-lg text-[9px] font-medium hover:bg-cyan-500/10 transition-colors"
                        style={{ color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>
                        VIEW
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-16 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{filtered.length} users · page {page}/{totalPages}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg text-[10px] font-medium transition-all"
                  style={{ background: p === page ? 'rgba(6,182,212,0.15)' : 'transparent', color: p === page ? '#06b6d4' : 'rgba(255,255,255,0.3)', border: p === page ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {selected && <UserDrawer user={selected} token={accessToken} onClose={() => setSelected(null)} onToggle={handleToggle} />}
      </AnimatePresence>
    </AdminShell>
  );
}