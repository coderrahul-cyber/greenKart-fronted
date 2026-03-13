/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/products/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminShell from '@/app/admin/components/AdminShell';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

interface Product {
  _id: string; name: string; price: number; unit: string;
  quantity: number; isActive: boolean; images: string[];
  Description?: string; badge?: string; rating?: number; createdAt: string;
}

type FormState = Omit<Product, '_id' | 'isActive' | 'createdAt'> & { _id?: string };

const EMPTY: FormState = { name: '', price: 0, unit: '', quantity: 0, images: [''], Description: '', badge: '', rating: 5 };

function ProductForm({ initial, token, onSave, onClose }: {
  initial: FormState; token: string | null;
  onSave: (p: Product) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!initial._id;

  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setImg = (i: number, v: string) => setForm(f => {
    const imgs = [...f.images]; imgs[i] = v; return { ...f, images: imgs };
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    setSaving(true);
    try {
      const url = isEdit ? `${API}/products/${initial._id}` : `${API}/products`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, images: form.images.filter(Boolean) }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.message || 'Save failed'); return; }
      onSave(json?.data?.product ?? json?.data ?? json);
      onClose();
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-xs outline-none transition-all";
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0f2fe', fontFamily: "'IBM Plex Mono', monospace", caretColor: '#06b6d4' };
  const labelCls = "text-[9px] tracking-widest uppercase mb-1 block";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0d1117', border: '1px solid rgba(6,182,212,0.18)', fontFamily: "'IBM Plex Mono', monospace", maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold tracking-widest" style={{ color: '#e0f2fe' }}>{isEdit ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls} style={{ color: 'rgba(6,182,212,0.7)' }}>Product Name</label>
              <input className={inputCls} style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(6,182,212,0.7)' }}>Price (₹)</label>
              <input type="number" className={inputCls} style={inputStyle} value={form.price === 0 ? '' : form.price} placeholder='0' 
              onChange={e => {
                  const raw = e.target.value;
                  set('price', raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0));
                }}
              required min={0} />


            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(6,182,212,0.7)' }}>Unit</label>
              <input className={inputCls} style={inputStyle} value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="kg / piece / bunch" />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(6,182,212,0.7)' }}>Stock Qty</label>
              <input
                type="number"
                className={inputCls}
                style={inputStyle}
                value={form.quantity === 0 ? '' : form.quantity}
                onChange={e => {
                  const raw = e.target.value;
                  set('quantity', raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0));
                }}
                min={0}
                placeholder="0"
              />
            </div>
            {/* <div>
              <label className={labelCls} style={{ color: 'rgba(6,182,212,0.7)' }}>Category</label>
              <input className={inputCls} style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)} />
            </div> */}
            <div>
              <label className={labelCls} style={{ color: 'rgba(6,182,212,0.7)' }}>Badge</label>
              <input className={inputCls} style={inputStyle} value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="Organic / New / Sale" />
            </div>
            {/* <div>
              <label className={labelCls} style={{ color: 'rgba(6,182,212,0.7)' }}>Rating (0-5)</label>
              <input type="number" className={inputCls} style={inputStyle} value={form.rating} onChange={e => set('rating', Number(e.target.value))} min={0} max={5} step={0.1} />
            </div> */}
          </div>
          {/* Image URLs */}
          <div>
            <label className={labelCls} style={{ color: 'rgba(6,182,212,0.7)' }}>Image URLs (up to 5)</label>
            <div className="flex flex-col gap-2">
              {form.images.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${inputCls} flex-1`} style={inputStyle} value={url}
                    onChange={e => setImg(i, e.target.value)} placeholder={`Image ${i + 1} URL`} />
                  {form.images.length > 1 && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                      className="px-2.5 rounded-xl hover:bg-red-500/10 transition-colors" style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {form.images.length < 5 && (
                <button type="button" onClick={() => setForm(f => ({ ...f, images: [...f.images, ''] }))}
                  className="py-2 rounded-xl text-[10px] font-medium tracking-wider transition-colors"
                  style={{ border: '1px dashed rgba(6,182,212,0.2)', color: 'rgba(6,182,212,0.5)' }}>
                  + ADD IMAGE URL
                </button>
              )}
            </div>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-xs font-bold tracking-wider transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              CANCEL
            </button>
            <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-2"
              style={{ background: saving ? 'rgba(6,182,212,0.06)' : 'linear-gradient(135deg,#0891b2,#06b6d4)', color: saving ? 'rgba(6,182,212,0.4)' : '#080c10' }}>
              {saving ? <><div className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin" />SAVING</> : isEdit ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function AdminProductsPage() {
  const { accessToken } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editForm, setEditForm] = useState<FormState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const PER_PAGE = 12;

  const fetchProducts = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/products`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const json = await res.json();
      setProducts(json?.data?.products ?? json?.data ?? []);
    } catch { } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = (p: Product) => {
    setProducts(prev => {
      const i = prev.findIndex(x => x._id === p._id);
      return i >= 0 ? prev.map((x, j) => j === i ? p : x) : [p, ...prev];
    });
  };

  const toggleProduct = async (id: string, isActive: boolean) => {
    try {
      await fetch(`${API}/admin/products/${id}/toggle`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}` } });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, isActive: !isActive } : p));
    } catch { }
  };

  const deleteProduct = async (id: string) => {
    try {
      await fetch(`${API}/admin/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch { } finally { setDeleteConfirm(null); }
  };

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <AdminShell title="Products">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', color: '#e0f2fe', fontFamily: "'IBM Plex Mono', monospace", caretColor: '#06b6d4' }} />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider"
          style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#080c10' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          ADD PRODUCT
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ background: '#0d1117', border: `1px solid ${p.isActive ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.12)'}` }}>
                {/* Image */}
                <div className="relative h-36 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.1)' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  {!p.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <span className="text-[9px] font-bold tracking-widest px-2 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>INACTIVE</span>
                    </div>
                  )}
                  {p.badge && (
                    <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>{p.badge}</span>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <p className="text-xs font-semibold leading-snug" style={{ color: '#e0f2fe' }}>{p.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: '#4ade80' }}>₹{p.price}</span>
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>/{p.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <span>Stock: <span style={{ color: p.quantity <= 5 ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}>{p.quantity}</span></span>
                    {p.rating && <span>★ {p.rating}</span>}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pt-1 mt-auto">
                    <button onClick={() => setEditForm({ ...p })}
                      className="flex-1 py-1.5 rounded-lg text-[9px] font-bold tracking-wider transition-colors hover:bg-cyan-500/10"
                      style={{ color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>EDIT</button>
                    <button onClick={() => toggleProduct(p._id, p.isActive)}
                      className="flex-1 py-1.5 rounded-lg text-[9px] font-bold tracking-wider transition-colors"
                      style={{ color: p.isActive ? '#fbbf24' : '#4ade80', border: `1px solid ${p.isActive ? 'rgba(251,191,36,0.2)' : 'rgba(74,222,128,0.2)'}` }}>
                      {p.isActive ? 'HIDE' : 'SHOW'}
                    </button>
                    <button onClick={() => setDeleteConfirm(p._id)}
                      className="py-1.5 px-2 rounded-lg text-[9px] font-bold transition-colors hover:bg-red-500/10"
                      style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-xl text-[10px] font-medium transition-all"
                  style={{ background: p === page ? 'rgba(6,182,212,0.15)' : '#0d1117', color: p === page ? '#06b6d4' : 'rgba(255,255,255,0.3)', border: p === page ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-80 rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.25)', fontFamily: "'IBM Plex Mono', monospace" }}
              onClick={e => e.stopPropagation()}>
              <p className="text-xs font-bold tracking-wide" style={{ color: '#f87171' }}>DELETE PRODUCT</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>This cannot be undone. Are you sure?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl text-[11px] font-bold tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>CANCEL</button>
                <button onClick={() => deleteProduct(deleteConfirm)} className="flex-1 py-2.5 rounded-xl text-[11px] font-bold tracking-wider"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>DELETE</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && <ProductForm initial={EMPTY} token={accessToken} onSave={handleSave} onClose={() => setShowAdd(false)} />}
        {editForm && <ProductForm initial={editForm} token={accessToken} onSave={handleSave} onClose={() => setEditForm(null)} />}
      </AnimatePresence>
    </AdminShell>
  );
}