// app/context/CartContext.tsx
"use client";

import React, {
  createContext, useContext, useState,
  useCallback, useRef, useEffect, ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface CartItem {
  itemId:     string;   // cart sub-doc _id  → used in PATCH/DELETE /:itemId
  productId:  string;   // product _id       → used in POST /items
  name:       string;
  image:      string;
  price:      number;
  quantity:   number;
  stockLimit: number;   // max allowed = product.quantity from DB
}

interface CartContextState {
  cart:            CartItem[];
  isLoading:       boolean;
  addToCart:       (productId: string, name: string, image: string, price: number, stockLimit?: number) => void;
  removeFromCart:  (productId: string) => void;
  changeQuantity:  (productId: string, newQuantity: number) => void;
  getQuantity:     (productId: string) => number;
  getStockLimit:   (productId: string) => number;
  isAtLimit:       (productId: string) => boolean;
  clearCart:          () => void;
  cartWarning:        string;        // set when GET /cart returns a warning (e.g. cart expired)
  clearCartWarning:   () => void;
  /** Called by useStockSync to push fresh stock numbers from the poll */
  updateStockLimits:  (map: Record<string, number>) => void;
}

const CartContext = createContext<CartContextState | undefined>(undefined);
const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

/* ── Debounce — batches rapid +/- into 1 PATCH ── */
function useDebounceSync(delay = 600) {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const schedule = useCallback((key: string, fn: () => Promise<void>) => {
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    const id = setTimeout(async () => {
      timers.current.delete(key);
      await fn();
    }, delay);
    timers.current.set(key, id);
  }, [delay]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  return schedule;
}

/* ── Map backend cart items → CartItem[] ── */
function mapItems(items: any[], stockMap?: Record<string, number>): CartItem[] {
  return (items ?? []).map(i => ({
    itemId:     i._id         ?? i.itemId    ?? '',
    productId:  String(i.productId ?? ''),
    name:       i.productName ?? i.name      ?? '',
    image:      i.productImage ?? (Array.isArray(i.images) ? i.images[0] : '') ?? '',
    price:      i.priceAtAdd  ?? i.price     ?? 0,
    quantity:   i.quantity    ?? 1,
    stockLimit: stockMap?.[String(i.productId)] ?? i.stockLimit ?? i.stock ?? 99,
  }));
}

/* ─────────────────────────────────────────
   Provider
───────────────────────────────────────── */
export function CartProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartWarning, setCartWarning] = useState('');

  const snapshot     = useRef<CartItem[]>([]);
  const scheduleSync = useDebounceSync(600);

  const authHeader = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }), [accessToken]);

  /* ══════════════════════════════════════
     FETCH CART ON LOGIN / REFRESH
  ══════════════════════════════════════ */
  useEffect(() => {
    if (!isAuthenticated) { setCart([]); return; }
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API}/cart`, { headers: authHeader() });
        if (!res.ok) return;
        const json = await res.json();
        const items = json?.data?.cart?.items ?? json?.data?.items ?? [];
        const mapped = mapItems(items);
        console.debug('[CartContext] fetched cart itemIds:', mapped.map(i => ({ name: i.name, itemId: i.itemId })));
        setCart(mapped);
        // Cart expiry warning — backend clears the cart and sends a warning message
        if (json?.data?.warning || json?.warning) {
          setCartWarning(json?.data?.warning ?? json?.warning ?? '');
        }
      } catch (err) {
        console.error('[CartContext] fetch cart failed:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, authHeader]);

  /* ══════════════════════════════════════
     ADD TO CART
     Enforces stockLimit — won't go above it.
  ══════════════════════════════════════ */
  const addToCart = useCallback((
    productId: string,
    name: string,
    image: string,
    price: number,
    stockLimit: number = 99,
  ) => {
    const existing = cart.find(i => i.productId === productId);
    snapshot.current = cart;

    if (existing) {
      // Already in cart — bump by 1, but cap at stockLimit
      const newQty = Math.min(existing.quantity + 1, existing.stockLimit);
      if (newQty === existing.quantity) return; // already at limit, do nothing

      setCart(prev =>
        prev.map(i => i.productId === productId ? { ...i, quantity: newQty } : i)
      );

      scheduleSync(existing.itemId, async () => {
        try {
          const res = await fetch(`${API}/cart/items/${existing.itemId}`, {
            method: 'PATCH',
            headers: authHeader(),
            body: JSON.stringify({ quantity: newQty }),
          });
          // Only rollback on failure — don't overwrite itemIds from PATCH response
          if (!res.ok) throw new Error('patch failed');
        } catch { setCart(snapshot.current); }
      });
    } else {
      // New item — POST immediately, optimistic with temp id
      const tempId = `temp_${productId}`;
      setCart(prev => [...prev, { itemId: tempId, productId, name, image, price, quantity: 1, stockLimit }]);

      (async () => {
        try {
          const res = await fetch(`${API}/cart/items`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ productId, quantity: 1 }),
          });
          if (!res.ok) throw new Error('add failed');
          const json = await res.json();
          const updatedItems: any[] = json?.data?.cart?.items ?? [];
          if (updatedItems.length) {
            // Replace temp itemId with real _id from backend, preserve stockLimits
            setCart(prev => {
              const stockLimitMap: Record<string, number> = {};
              prev.forEach(i => { stockLimitMap[i.productId] = i.stockLimit; });
              stockLimitMap[productId] = stockLimit;
              const mapped = mapItems(updatedItems, stockLimitMap);
              console.debug('[CartContext] addToCart itemIds after POST:', mapped.map(i => ({ name: i.name, itemId: i.itemId, productId: i.productId })));
              return mapped;
            });
          }
        } catch (err) {
          console.error('[CartContext] addToCart failed:', err);
          setCart(snapshot.current);
        }
      })();
    }
  }, [cart, authHeader, scheduleSync]);

  /* ══════════════════════════════════════
     CHANGE QUANTITY
     Hard caps at stockLimit on the way up.
  ══════════════════════════════════════ */
  const changeQuantity = useCallback((productId: string, newQuantity: number) => {
    const cartEntry = cart.find(i => i.productId === productId);
    if (!cartEntry) return;

    if (newQuantity <= 0) { removeFromCart(productId); return; }

    // Enforce stock cap
    const capped = Math.min(newQuantity, cartEntry.stockLimit);
    if (capped === cartEntry.quantity) return; // no change needed

    const itemId = cartEntry.itemId;
    snapshot.current = cart;

    setCart(prev =>
      prev.map(i => i.productId === productId ? { ...i, quantity: capped } : i)
    );

    scheduleSync(itemId, async () => {
      try {
        const res = await fetch(`${API}/cart/items/${itemId}`, {
          method: 'PATCH',
          headers: authHeader(),
          body: JSON.stringify({ quantity: capped }),
        });
        // Only rollback on failure — don't overwrite itemIds from PATCH response
        if (!res.ok) throw new Error('patch failed');
      } catch { setCart(snapshot.current); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, authHeader, scheduleSync]);

  /* ══════════════════════════════════════
     REMOVE FROM CART
  ══════════════════════════════════════ */
  const removeFromCart = useCallback((productId: string) => {
    const cartEntry = cart.find(i => i.productId === productId);
    if (!cartEntry) return;
    const itemId = cartEntry.itemId;

    snapshot.current = cart;
    setCart(prev => prev.filter(i => i.itemId !== itemId));

    (async () => {
      try {
        const res = await fetch(`${API}/cart/items/${itemId}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
        if (!res.ok) throw new Error('delete failed');
      } catch (err) {
        console.error('[CartContext] removeFromCart failed:', err);
        setCart(snapshot.current);
      }
    })();
  }, [cart, authHeader]);

  /* ══════════════════════════════════════
     CLEAR CART
  ══════════════════════════════════════ */
  const clearCart = useCallback(() => {
    snapshot.current = cart;
    setCart([]);
    (async () => {
      try {
        const res = await fetch(`${API}/cart`, { method: 'DELETE', headers: authHeader() });
        if (!res.ok) throw new Error('clear failed');
      } catch { setCart(snapshot.current); }
    })();
  }, [cart, authHeader]);

  /* ══════════════════════════════════════
     UPDATE STOCK LIMITS (called by useStockSync)
     Receives a map of { productId: newQuantity }
     from the 30s poll and updates stockLimit on
     every matching cart item. If an item's current
     quantity now exceeds the new limit, it's capped
     and a PATCH is queued automatically.
  ══════════════════════════════════════ */
  const updateStockLimits = useCallback((map: Record<string, number>) => {
    setCart(prev => {
      let changed = false;
      const next = prev.map(item => {
        const newLimit = map[item.productId];
        if (newLimit === undefined) return item;

        const updatedItem = { ...item, stockLimit: newLimit };

        if (item.quantity > newLimit) {
          updatedItem.quantity = newLimit;
          changed = true;

          if (newLimit > 0) {
            scheduleSync(item.itemId, async () => {
              try {
                await fetch(`${API}/cart/items/${item.itemId}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                  },
                  body: JSON.stringify({ quantity: newLimit }),
                });
              } catch { /* silent */ }
            });
          } else {
            (async () => {
              try {
                await fetch(`${API}/cart/items/${item.itemId}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                  },
                });
              } catch { /* silent */ }
            })();
            return null;
          }
        }
        return updatedItem;
      }).filter(Boolean) as typeof prev;

      return (changed || next.some((n, i) => n.stockLimit !== prev[i]?.stockLimit))
        ? next
        : prev;
    });
  }, [accessToken, scheduleSync]);

  /* ── Helpers ── */
  const clearCartWarning = useCallback(() => setCartWarning(''), []);

  const getQuantity   = useCallback((productId: string) =>
    cart.find(i => i.productId === productId)?.quantity ?? 0, [cart]);

  const getStockLimit = useCallback((productId: string) =>
    cart.find(i => i.productId === productId)?.stockLimit ?? 99, [cart]);

  const isAtLimit     = useCallback((productId: string) => {
    const item = cart.find(i => i.productId === productId);
    return item ? item.quantity >= item.stockLimit : false;
  }, [cart]);

  return (
    <CartContext.Provider value={{
      cart, isLoading, cartWarning, clearCartWarning,
      addToCart, removeFromCart, changeQuantity,
      getQuantity, getStockLimit, isAtLimit, clearCart,
      updateStockLimits,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}