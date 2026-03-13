// hooks/usePlaceOrder.ts
// Thin type-only export so CheckoutPage can import OutOfStockItem
// without a circular dependency. The actual order placement logic
// lives directly in CheckoutPage for clarity.
"use client";

export interface OutOfStockItem {
  productId: string;
  name:      string;
  available: number;
  requested: number;
}