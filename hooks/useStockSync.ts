// hooks/useStockSync.ts
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/context/CartContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
const POLL_INTERVAL = 30_000; // 30 seconds

interface StockEntry {
  _id:      string;
  quantity: number;
  isActive: boolean;
  name:     string;
}

interface UseStockSyncOptions {
  /** Product IDs currently visible on screen — poll only these */
  productIds: string[];
  /** Called with fresh stock data so the parent can update its local state */
  onStockUpdate: (updates: StockEntry[]) => void;
  /** Pause polling when tab is hidden (default: true) */
  pauseOnHidden?: boolean;
}

/**
 * useStockSync
 *
 * Polls GET /api/v1/products/stock?ids=... every 30 seconds.
 * - Only fires when productIds is non-empty
 * - Pauses automatically when the browser tab is hidden
 * - Fires an immediate fetch on mount so the UI is fresh right away
 * - Cleans up on unmount / productIds change
 */
export function useStockSync({
  productIds,
  onStockUpdate,
  pauseOnHidden = true,
}: UseStockSyncOptions) {
  const { updateStockLimits } = useCart();
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef      = useRef<AbortController | null>(null);
  const idsRef        = useRef<string[]>(productIds);
  const callbackRef   = useRef(onStockUpdate);

  // Keep refs in sync without restarting the interval
  useEffect(() => { idsRef.current      = productIds;    }, [productIds]);
  useEffect(() => { callbackRef.current = onStockUpdate; }, [onStockUpdate]);

  const fetchStock = useCallback(async () => {
    const ids = idsRef.current;
    if (!ids.length) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(
        `${API}/products/stock?ids=${ids.join(',')}`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) return;
      const json = await res.json();
      const entries: StockEntry[] = json?.data ?? json ?? [];
      if (!entries.length) return;

      // 1. Update the parent component's local product list
      callbackRef.current(entries);

      // 2. Update CartContext so stock limits stay accurate for items in cart
      updateStockLimits(
        Object.fromEntries(entries.map(e => [e._id, e.quantity]))
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[useStockSync] poll failed:', err.message);
      }
    }
  }, [updateStockLimits]);

  useEffect(() => {
    if (!productIds.length) return;

    // Fire immediately on mount
    fetchStock();

    // Set up interval
    timerRef.current = setInterval(fetchStock, POLL_INTERVAL);

    // Pause when tab is hidden, resume when visible
    const handleVisibility = () => {
      if (!pauseOnHidden) return;
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      } else {
        fetchStock(); // immediate refresh on tab focus
        timerRef.current = setInterval(fetchStock, POLL_INTERVAL);
      }
    };

    if (pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current?.abort();
      if (pauseOnHidden) {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds.length > 0]); // only restart when going empty ↔ non-empty

  return { refetch: fetchStock };
}