/* eslint-disable @typescript-eslint/no-explicit-any */
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
  itemId:     string;
  productId:  string;
  name:       string;
  image:      string;
  price:      number;
  quantity:   number;
  stockLimit: number;
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
  clearCart:       () => void;
  cartWarning:     string;
  clearCartWarning:() => void;
  updateStockLimits:(map: Record<string, number>) => void;
}

const CartContext = createContext<CartContextState | undefined>(undefined);
const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

/* ─────────────────────────────────────────
   Debounce
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   Map Items
───────────────────────────────────────── */
function mapItems(items: any[], stockMap?: Record<string, number>): CartItem[] {
  return (items ?? []).map(i => ({
    itemId:     i._id ?? '',
    productId:  String(i.productId ?? ''),
    name:       i.productName ?? '',
    image:      i.productImage ?? '',
    price:      i.priceAtAdd ?? 0,
    quantity:   i.quantity ?? 1,
    stockLimit: stockMap?.[String(i.productId)] ?? i.stock ?? 99,
  }));
}

/* ─────────────────────────────────────────
   Provider
───────────────────────────────────────── */
export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartWarning, setCartWarning] = useState('');

  const snapshot = useRef<CartItem[]>([]);
  const scheduleSync = useDebounceSync(600);

  /* ─────────────────────────────────────────
     IMPORTANT FIX: remove Authorization header
     use cookies instead
  ───────────────────────────────────────── */
  const fetchWithAuth = useCallback((url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  }, []);

  /* ─────────────────────────────────────────
     Fetch Cart
  ───────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) {
      setCart([]);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetchWithAuth(`${API}/cart`);
        if (!res.ok) return;

        const json = await res.json();
        const items = json?.data?.cart?.items ?? [];

        const mapped = mapItems(items);
        setCart(mapped);

        if (json?.data?.warning) {
          setCartWarning(json.data.warning);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, fetchWithAuth]);

  /* ─────────────────────────────────────────
     Add To Cart
  ───────────────────────────────────────── */

  // This change brefore Etstin
 const addToCart = useCallback((
  productId: string,
  name: string,
  image: string,
  price: number,
  stockLimit: number = 99
) => {
  const existing = cart.find(i => i.productId === productId);
  snapshot.current = cart;

  if (existing) {
    const newQty = Math.min(existing.quantity + 1, existing.stockLimit);
    if (newQty === existing.quantity) return;

    setCart(prev =>
      prev.map(i => i.productId === productId ? { ...i, quantity: newQty } : i)
    );

    scheduleSync(existing.itemId, async () => {
      try {
        await fetchWithAuth(`${API}/cart/items/${existing.itemId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: newQty }),
        });
      } catch {
        setCart(snapshot.current);
      }
    });
  } else {
    const tempId = `temp_${productId}`;
    setCart(prev => [...prev, { itemId: tempId, productId, name, image, price, quantity: 1, stockLimit }]);

    (async () => {
      try {
        const res = await fetchWithAuth(`${API}/cart/items`, {
          method: 'POST',
          body: JSON.stringify({ productId, quantity: 1 }),
        });

        if (!res.ok) throw new Error();

        const json = await res.json();
        const updatedItems = json?.data?.cart?.items ?? [];

        setCart(mapItems(updatedItems));
      } catch {
        setCart(snapshot.current);
      }
    })();
  }
}, [cart, scheduleSync, fetchWithAuth]);

  /* ─────────────────────────────────────────
     Change Quantity
  ───────────────────────────────────────── */
  const changeQuantity = useCallback((productId: string, newQuantity: number) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const capped = Math.min(newQuantity, item.stockLimit);
    if (capped <= 0) return removeFromCart(productId);

    snapshot.current = cart;

    setCart(prev =>
      prev.map(i => i.productId === productId ? { ...i, quantity: capped } : i)
    );

    scheduleSync(item.itemId, async () => {
      try {
        await fetchWithAuth(`${API}/cart/items/${item.itemId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: capped }),
        });
      } catch {
        setCart(snapshot.current);
      }
    });
  }, [cart, scheduleSync, fetchWithAuth]);

  /* ─────────────────────────────────────────
     Remove
  ───────────────────────────────────────── */
  const removeFromCart = useCallback((productId: string) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    snapshot.current = cart;
    setCart(prev => prev.filter(i => i.itemId !== item.itemId));

    (async () => {
      try {
        await fetchWithAuth(`${API}/cart/items/${item.itemId}`, {
          method: 'DELETE',
        });
      } catch {
        setCart(snapshot.current);
      }
    })();
  }, [cart, fetchWithAuth]);

  /* ─────────────────────────────────────────
     Clear
  ───────────────────────────────────────── */
  const clearCart = useCallback(() => {
    snapshot.current = cart;
    setCart([]);

    (async () => {
      try {
        await fetchWithAuth(`${API}/cart`, { method: 'DELETE' });
      } catch {
        setCart(snapshot.current);
      }
    })();
  }, [cart, fetchWithAuth]);

  /* ─────────────────────────────────────────
     Helpers
  ───────────────────────────────────────── */
  const getQuantity = useCallback((id: string) =>
    cart.find(i => i.productId === id)?.quantity ?? 0, [cart]);

  const getStockLimit = useCallback((id: string) =>
    cart.find(i => i.productId === id)?.stockLimit ?? 99, [cart]);

  const isAtLimit = useCallback((id: string) => {
    const item = cart.find(i => i.productId === id);
    return item ? item.quantity >= item.stockLimit : false;
  }, [cart]);

  const clearCartWarning = useCallback(() => setCartWarning(''), []);

  return (
    <CartContext.Provider value={{
      cart,
      isLoading,
      cartWarning,
      clearCartWarning,
      addToCart,
      removeFromCart,
      changeQuantity,
      getQuantity,
      getStockLimit,
      isAtLimit,
      clearCart,
      updateStockLimits: () => {},
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