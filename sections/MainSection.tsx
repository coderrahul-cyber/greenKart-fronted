/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useStockSync } from "@/hooks/useStockSync";
import ProductCard from "@/components/ProductCard";
import { motion, AnimatePresence } from "motion/react";
import FloatingCartButton from "@/components/FloatingCartButton";
import FloatingCallButton from "@/components/FloatingCallButton";
import ContactFAB from "@/components/ContactFAB";

/* ─────────────────────────────────────────
   Types — mirror IProduct from backend
───────────────────────────────────────── */
interface Product {
  _id:            string;
  name:           string;
  slug:           string;
  description?:   string;
  images:         string[];
  price:          number;
  discountPrice?: number;
  quantity:       number;
  isActive:       boolean;
}

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

/* ─────────────────────────────────────────
   Skeleton card — shown while loading
───────────────────────────────────────── */
const SkeletonCard = () => (
  <div
    className="w-55 rounded-[28px] overflow-hidden animate-pulse"
    style={{
      background: "linear-gradient(160deg, #0d5c54 0%, #062e28 100%)",
      height: 280,
    }}
  >
    <div className="mx-4 mt-4 rounded-[20px] h-42"
      style={{ background: "rgba(255,255,255,0.07)" }} />
    <div className="px-4 pt-3 flex flex-col gap-2">
      <div className="h-4 w-3/4 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="h-5 w-1/3 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  </div>
);

/* ─────────────────────────────────────────
   Empty state
───────────────────────────────────────── */
const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full flex flex-col items-center gap-4 py-20 text-center"
  >
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    </div>
    <div>
      <p className="text-white/50 font-semibold font-poppins">No products found</p>
      <p className="text-white/25 text-sm font-roboto mt-1">The store might be loading or taking a break.</p>
    </div>
    <button
      onClick={onRetry}
      className="px-5 py-2.5 rounded-xl text-sm font-semibold font-poppins transition-all"
      style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
    >
      Try again
    </button>
  </motion.div>
);

/* ─────────────────────────────────────────
   Error banner
───────────────────────────────────────── */
const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
    style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.18)" }}
  >
    <div className="flex items-center gap-3">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,130,130,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span className="text-sm font-roboto" style={{ color: "rgba(255,140,140,0.85)" }}>{message}</span>
    </div>
    <button
      onClick={onRetry}
      className="shrink-0 text-xs font-semibold font-poppins px-3 py-1.5 rounded-lg transition-all"
      style={{ background: "rgba(255,80,80,0.15)", color: "rgba(255,150,150,1)" }}
    >
      Retry
    </button>
  </motion.div>
);

/* ─────────────────────────────────────────
   Main Section
───────────────────────────────────────── */
const MainSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // IDs of products currently on screen — passed to the stock poll
  const productIds = useMemo(() => products.map(p => p._id), [products]);

  // Called by useStockSync every 30s with fresh quantities
  const handleStockUpdate = useCallback((updates: { _id: string; quantity: number; isActive: boolean }[]) => {
    setProducts(prev => prev.map(p => {
      const update = updates.find(u => u._id === p._id);
      if (!update) return p;
      // If product became inactive (out of stock / delisted), mark it
      return { ...p, quantity: update.quantity, isActive: update.isActive };
    }));
  }, []);

  useStockSync({ productIds, onStockUpdate: handleStockUpdate });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/products`, { cache: "no-store"  , credentials : "include"});
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const json = await res.json();
      // Support both { data: { products: [] } } and { data: [] } shapes
      const list: Product[] =
        Array.isArray(json?.data?.products) ? json.data.products :
        Array.isArray(json?.data)           ? json.data :
        Array.isArray(json)                 ? json : [];
      // Filter only active products
      setProducts(list.filter(p => p.isActive !== false));
    } catch (err: any) {
      setError(err?.message || "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <section
      className="relative min-h-screen w-full overflow-x-hidden px-4 py-20 md:py-10 sm:px-6 lg:px-10"
      style={{ background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)" }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div style={{
          position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(13,92,84,0.35) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}/>
        <div style={{
          position: "absolute", bottom: "80px", right: "-80px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}/>
      </div>

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 mb-10 flex flex-col items-center gap-3 text-center"
      >
        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold tracking-widest uppercase"
          style={{
            borderColor: "rgba(74,222,128,0.25)",
            background: "rgba(74,222,128,0.08)",
            color: "#4ade80",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80" }} />
          Sourced Daily
        </span>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: "#f0f7ee", letterSpacing: "-0.025em" }}
        >
          Today&apos;s{" "}
          <span style={{
            background: "linear-gradient(90deg, #4ade80, #86efac)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Picks
          </span>
        </h1>

        <p
          className="max-w-xs text-sm sm:max-w-sm sm:text-base"
          style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
        >
          Farm-fresh picks delivered straight to your door.
        </p>

        <div className="mt-1 flex items-center gap-3">
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.12)" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(74,222,128,0.5)" }} />
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* Live product count badge */}
        <AnimatePresence>
          {!loading && products.length > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-roboto"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {products.length} product{products.length !== 1 ? "s" : ""} available
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center">

        {/* Error banner */}
        <AnimatePresence>
          {error && <ErrorBanner message={error} onRetry={fetchProducts} />}
        </AnimatePresence>

        {/* Skeletons while loading */}
        {loading && !error && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-full flex justify-center">
            <SkeletonCard />
          </div>
        ))}

        {/* Real products */}
        {!loading && !error && products.length === 0 && (
          <EmptyState onRetry={fetchProducts} />
        )}

        {!loading && !error && products.map((product, index) => {
          const isOdd = index % 2 !== 0;
          return (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, x: isOdd ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
              className="w-full flex justify-center"
            >
              <ProductCard
                title={product.name}
                imageUrl={product.images?.[0] ?? ""}
                price={product.price}
                productId={product._id}
                badge={product.discountPrice ? "Sale" : undefined}
                stockLimit={product.quantity}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      {!loading && products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 mt-12 flex justify-center"
        >
          <button
            className="group flex items-center gap-2.5 rounded-full border px-7 py-3 text-sm font-semibold transition-all"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              borderColor: "rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(74,222,128,0.4)";
              (e.currentTarget as HTMLButtonElement).style.color = "#4ade80";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(74,222,128,0.07)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            }}
          >
            Browse All Products
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: "transform 0.2s" }}>
              <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>
      )}

      <FloatingCartButton />
      <ContactFAB message="hi" phoneNumber={process.env.NEXT_PUBLIC_CONTACT_PHONE!} />
    </section>
  );
};

export default MainSection;