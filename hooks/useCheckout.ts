// hooks/useCheckout.ts
"use client";

import { useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

export interface OutOfStockItem {
  productId: string;
  name:      string;
  available: number;
  requested: number;
}

export type CheckoutResult =
  | { ok: true; lowStockWarnings: string[] }  // warnings[] from backend after order placed
  | { ok: false; outOfStock: OutOfStockItem[]; message: string; generic?: boolean };

function parsePlainStockMessage(
  message: string,
  cart: Array<{ productId: string; name: string; quantity: number }>,
): OutOfStockItem | null {
  const match = message.match(/[""](.+?)[""].*?only\s+(\d+)\s+unit/i);
  if (!match) return null;
  const name      = match[1];
  const available = parseInt(match[2], 10);
  const cartItem  = cart.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!cartItem) return null;
  return { productId: cartItem.productId, name: cartItem.name, available, requested: cartItem.quantity };
}

export function useCheckout() {
  const { accessToken }                          = useAuth();
  const { cart, removeFromCart, changeQuantity } = useCart();
  const [isProcessing, setIsProcessing]          = useState(false);

  const checkout = useCallback(async (): Promise<CheckoutResult> => {
    setIsProcessing(true);
    try {

      // ── Step 1: Fetch fresh user profile to get address ──────────────
      // Don't trust context — fetch directly so we always have addresses.
      let shippingAddress: Record<string, string> | null = null;

      try {
        const meRes = await fetch(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const meJson = await meRes.json();
        console.log('[useCheckout] /users/me raw response:', meJson);

        // Try every possible shape the backend might return
        const userData =
          meJson?.data?.user ??
          meJson?.data      ??
          meJson?.user      ??
          null;

        console.log('[useCheckout] parsed userData:', userData);

        const addresses: any[] = userData?.addresses ?? [];
        console.log('[useCheckout] addresses array:', addresses);

        const addr = addresses.find((a: any) => a.isDefault) ?? addresses[0] ?? null;
        console.log('[useCheckout] selected address:', addr);

        if (addr) {
          shippingAddress = {
            line1:   addr.line1   ?? '',
            line2:   addr.line2   ?? '',
            city:    addr.city    ?? '',
            pincode: String(addr.pincode ?? ''),
          };
        }
      } catch (err) {
        console.error('[useCheckout] /users/me fetch failed:', err);
      }

      if (!shippingAddress) {
        return {
          ok:         false,
          outOfStock: [],
          message:    'No shipping address found. Please add an address in your profile.',
          generic:    true,
        };
      }

      console.log('[useCheckout] placing order with:', { shippingAddress, paymentMethod: 'cod' });

      // ── Step 2: Place the order ───────────────────────────────────────
      const res = await fetch(`${API}/orders`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          shippingAddress,
          paymentMethod: 'cod',
        }),
      });

      const json = await res.json();
      console.log('[useCheckout] order response:', res.status, json);

      if (res.ok && json.success !== false) {
        const lowStockWarnings: string[] = json?.data?.warnings ?? json?.warnings ?? [];
        return { ok: true, lowStockWarnings };
      }

      /* ── Structured stock error ── */
      if (json.code === 'INSUFFICIENT_STOCK' && Array.isArray(json.data)) {
        const outOfStock: OutOfStockItem[] = json.data;
        applyCartFixes(outOfStock, removeFromCart, changeQuantity);
        return { ok: false, outOfStock, message: buildMessage(outOfStock) };
      }

      /* ── Plain-text stock error (current backend format) ── */
      if (!res.ok && json.message) {
        const parsed = parsePlainStockMessage(json.message, cart);
        if (parsed) {
          applyCartFixes([parsed], removeFromCart, changeQuantity);
          return { ok: false, outOfStock: [parsed], message: buildMessage([parsed]) };
        }
        return { ok: false, outOfStock: [], message: json.message, generic: true };
      }

      return {
        ok: false, outOfStock: [],
        message: json.message || 'Something went wrong. Please try again.',
        generic: true,
      };

    } catch (err) {
      console.error('[useCheckout] unexpected error:', err);
      return {
        ok: false, outOfStock: [],
        message: 'Could not reach the server. Check your connection.',
        generic: true,
      };
    } finally {
      setIsProcessing(false);
    }
  }, [accessToken, cart, removeFromCart, changeQuantity]);

  return { checkout, isProcessing };
}

function applyCartFixes(
  items: OutOfStockItem[],
  remove: (id: string) => void,
  change: (id: string, qty: number) => void,
) {
  items.forEach(i =>
    i.available === 0 ? remove(i.productId) : change(i.productId, i.available)
  );
}

function buildMessage(items: OutOfStockItem[]): string {
  return items
    .map(i => i.available === 0
      ? `${i.name} is out of stock`
      : `${i.name} — only ${i.available} left`)
    .join(', ');
}