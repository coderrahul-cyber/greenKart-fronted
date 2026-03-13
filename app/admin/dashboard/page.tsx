// app/admin/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import AdminShell from '@/app/admin/components/AdminShell';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';
import { STATUS_STYLE } from '@/app/admin/components/AdminShell';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

interface DashData {
  totalOrders: number; totalRevenue: number; totalUsers: number;
  totalProducts: number; pendingOrders: number; deliveredOrders: number;
  recentOrders: any[]; ordersByStatus: Record<string, number>;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</div>
        {sub && <span className="text-[10px] tracking-wide px-2 py-0.5 rounded-full" style={{ background: `${color}12`, color }}>{sub}</span>}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#e0f2fe' }}>{value}</p>
        <p className="text-[11px] mt-0.5 tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { accessToken } = useAdminAuth();
  const [data,    setData]    = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res  = await fetch(`${API}/admin/dashboard`, { headers: { Authorization: `Bearer ${accessToken}` } });
        const json = await res.json();
        setData(json?.data ?? json);
      } catch {} finally { setLoading(false); }
    })();
  }, [accessToken]);

  const fmt = (n: number) => n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${n}`;

  return (
    <AdminShell title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stat grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total Revenue"   value={fmt(data?.totalRevenue ?? 0)}  color="#4ade80" sub="all time"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} />
            <StatCard label="Total Orders"    value={data?.totalOrders ?? 0}         color="#06b6d4" sub={`${data?.pendingOrders ?? 0} pending`}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} />
            <StatCard label="Total Users"     value={data?.totalUsers ?? 0}          color="#a78bfa"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
            <StatCard label="Active Products" value={data?.totalProducts ?? 0}       color="#f59e0b"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>} />
          </div>

          {/* Orders by status */}
          {data?.ordersByStatus && (
            <div className="rounded-2xl p-5" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Orders by Status</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
                {Object.entries(data.ordersByStatus).map(([status, count]) => {
                  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
                  return (
                    <div key={status} className="rounded-xl p-3 flex flex-col gap-1" style={{ background: s.bg }}>
                      <span className="text-xl font-bold" style={{ color: s.text }}>{count as number}</span>
                      <span className="text-[9px] capitalize tracking-wider" style={{ color: s.text + 'aa' }}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent orders table */}
          {(data?.recentOrders?.length ?? 0) > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Recent Orders</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {['Order ID','Customer','Amount','Status','Date'].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-medium tracking-widest text-[9px] uppercase"
                          style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data!.recentOrders.map((o: any, i: number) => {
                      const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.pending;
                      return (
                        <tr key={o._id ?? i} className="transition-colors hover:bg-white/[0.02]"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td className="px-5 py-3 font-medium" style={{ color: '#06b6d4' }}>{o.orderId ?? o._id?.slice(-8)}</td>
                          <td className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.6)' }}>{o.user?.name ?? o.userId?.name ?? '—'}</td>
                          <td className="px-5 py-3 font-medium" style={{ color: '#e0f2fe' }}>₹{o.totalAmount?.toLocaleString('en-IN') ?? '0'}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold capitalize" style={{ background: s.bg, color: s.text }}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}