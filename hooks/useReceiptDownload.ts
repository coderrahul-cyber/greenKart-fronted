// hooks/useReceiptDownload.ts
// Fetches order details from GET /api/v1/orders/:id
// then generates and downloads a PDF receipt using jsPDF.
// No backend changes required — pure frontend PDF generation.
//
// Install: bun add jspdf
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

const API = "http://localhost:4000/api/v1";

/* ─────────────────────────────────────────
   Types (mirror backend order shape)
───────────────────────────────────────── */
export interface ReceiptItem {
  name:       string;
  quantity:   number;
  price:      number;   // price per unit (priceAtOrder or price)
  total:      number;   // quantity × price
}

export interface ReceiptData {
  orderId:       string;
  orderDate:     string;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
  address:       string;
  paymentMethod: string;
  paymentStatus: string;
  items:         ReceiptItem[];
  subtotal:      number;
  shipping:      number;
  tax:           number;
  discount:      number;
  total:         number;
}

/* ─────────────────────────────────────────
   Map raw backend order → ReceiptData
   Field names taken directly from order.model.ts:
     items[].name, items[].priceAtBuy, items[].quantity, items[].lineTotal
     itemsTotal, shippingCharge, taxAmount, discount, totalAmount
     payment (populated) → payment.method, payment.status
     orderId (human-readable e.g. ORD-2025-00001), _id (mongo id)
───────────────────────────────────────── */
function mapOrder(order: any, user: any): ReceiptData {
  // ── Items ─────────────────────────────────────────────────────────────────
  const items: ReceiptItem[] = (order.items ?? []).map((i: any) => ({
    name:     i.name     ?? "Product",
    quantity: i.quantity ?? 1,
    price:    i.priceAtBuy ?? 0,           // exact field from IOrderItem
    total:    i.lineTotal  ?? (i.priceAtBuy ?? 0) * (i.quantity ?? 1),
  }));

  // ── Totals — exact field names from Order schema ───────────────────────────
  // Backend formula: totalAmount = itemsTotal + shippingCharge + taxAmount - discount
  const subtotal = order.itemsTotal ?? 0;
  const tax      = order.taxAmount  ?? 0;  // 18% of itemsTotal, added by backend
  const discount = order.discount   ?? 0;

  // Shipping: prefer stored value, fall back to env var
  const envShipping = parseInt(process.env.NEXT_PUBLIC_SHIPPING_CHARGE ?? '0', 10);
  const shipping    = order.shippingCharge != null ? order.shippingCharge : envShipping;

  // Use totalAmount from DB as the authoritative figure.
  // Recalculate only if it's missing (should never happen for saved orders).
  const total = order.totalAmount ?? (subtotal + shipping + tax - discount);

  // ── Payment — populated via .populate("payment") ──────────────────────────
  // payment.method values from Payment model: "cod" | "razorpay"
  // payment.status values: "pending" | "paid" | "failed" | "refunded"
  const payment       = order.payment ?? {};
  const rawMethod     = payment.method ?? "";
  const paymentMethod = rawMethod === "cod"
    ? "Cash on Delivery"
    : rawMethod === "razorpay"
      ? "Online (Razorpay)"
      : rawMethod || "—";
  const paymentStatus = payment.status ?? "pending";

  // ── Address ────────────────────────────────────────────────────────────────
  const addr      = order.shippingAddress ?? {};
  const addrParts = [addr.line1, addr.line2, addr.city, addr.pincode].filter(Boolean);

  // ── Human-readable order ID (ORD-2025-00001) shown on receipt ─────────────
  // orderId is the auto-generated readable ID; _id is the Mongo ObjectId
  const receiptOrderId = order.orderId ?? order._id ?? "";

  return {
    orderId:       receiptOrderId,
    orderDate:     order.createdAt
      ? new Date(order.createdAt).toLocaleString("en-IN", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : new Date().toLocaleDateString("en-IN"),
    customerName:  user?.name        ?? "Customer",
    customerEmail: user?.email       ?? "",
    customerPhone: user?.phoneNumber ?? "",
    address:       addrParts.join(", "),
    paymentMethod,
    paymentStatus,
    items,
    subtotal,
    shipping,
    tax,
    discount,
    total,
  };
}

/* ─────────────────────────────────────────
   Draw the PDF using jsPDF
───────────────────────────────────────── */
async function drawReceipt(data: ReceiptData): Promise<void> {
  // Lazy-load jsPDF so it doesn't bloat the initial bundle
  const { jsPDF } = await import("jspdf");

  const doc   = new jsPDF({ unit: "mm", format: "a4" });
  const W     = 210;   // page width mm
  const PAD   = 18;    // left/right padding
  const CW    = W - PAD * 2;  // content width
  let   y     = 0;     // current Y cursor

  /* ── Colour palette ── */
  const GREEN_D  = [8,  46,  40]  as [number,number,number]; // #082e28
  const GREEN_M  = [11, 76,  70]  as [number,number,number]; // #0B4C46
  const GREEN_L  = [74, 222,128]  as [number,number,number]; // #4ade80
  const WHITE    = [255,255,255]  as [number,number,number];
  const GREY_D   = [30, 30,  30]  as [number,number,number];
  const GREY_M   = [80, 80,  80]  as [number,number,number];
  const GREY_L   = [160,160,160]  as [number,number,number];
  const DIVIDER  = [220,220,220]  as [number,number,number];
  const BG_LIGHT = [245,252,248]  as [number,number,number];

  /* ── Helpers ── */
  const fill  = (r: number,g: number,b: number) => doc.setFillColor(r,g,b);
  const stroke= (r: number,g: number,b: number) => doc.setDrawColor(r,g,b);
  const color = (r: number,g: number,b: number) => doc.setTextColor(r,g,b);
  const font  = (style: "normal"|"bold"|"italic", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };
  const rect  = (x: number, yy: number, w: number, h: number, r = 0) => doc.roundedRect(x, yy, w, h, r, r, "F");
  const line  = (x1: number, yy: number, x2: number, y2: number) => doc.line(x1, yy, x2, y2);
  const text  = (t: string, x: number, yy: number, opts?: any) => doc.text(t, x, yy, opts);
  const inr   = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /* ═══════════════════════════════════════
     HEADER BAND
  ═══════════════════════════════════════ */
  y = 0;
  fill(...GREEN_D);
  rect(0, y, W, 42, 0);

  // Accent strip top
  fill(...GREEN_L);
  rect(0, 0, W, 2, 0);

  // Logo / brand
  color(...GREEN_L);
  font("bold", 22);
  text("GreenKart", PAD, 17);

  color(...WHITE);
  font("normal", 8);
  text("Fresh. Local. Delivered.", PAD, 23);

  // RECEIPT label right side
  color(...GREEN_L);
  font("bold", 18);
  text("RECEIPT", W - PAD, 17, { align: "right" });

  color(...WHITE);
  font("normal", 8);
  // orderId is already human-readable (ORD-2025-00001) from the pre-save hook
  const shortId = data.orderId.startsWith("ORD-")
    ? data.orderId
    : `#${data.orderId.slice(-8).toUpperCase()}`;
  text(shortId, W - PAD, 23, { align: "right" });

  // Date
  color(...GREY_L);
  font("normal", 7.5);
  text(data.orderDate, W - PAD, 29, { align: "right" });

  y = 42;

  /* ═══════════════════════════════════════
     CUSTOMER + DELIVERY INFO — 2 columns
  ═══════════════════════════════════════ */
  y += 10;
  const colW = (CW - 6) / 2;

  // Bill To
  fill(...BG_LIGHT);
  stroke(220, 235, 225);
  doc.roundedRect(PAD, y, colW, 32, 2, 2, "FD");

  color(...GREEN_M);
  font("bold", 7.5);
  text("BILL TO", PAD + 4, y + 7);

  color(...GREY_D);
  font("bold", 9);
  text(data.customerName, PAD + 4, y + 14);

  color(...GREY_M);
  font("normal", 7.5);
  text(data.customerEmail, PAD + 4, y + 20);
  text(data.customerPhone, PAD + 4, y + 26);

  // Deliver To
  const cx2 = PAD + colW + 6;
  fill(...BG_LIGHT);
  doc.roundedRect(cx2, y, colW, 32, 2, 2, "FD");

  color(...GREEN_M);
  font("bold", 7.5);
  text("DELIVER TO", cx2 + 4, y + 7);

  color(...GREY_D);
  font("normal", 8);
  const addrLines = doc.splitTextToSize(data.address, colW - 10);
  addrLines.forEach((l: string, i: number) => {
    color(...GREY_M);
    font("normal", 7.5);
    text(l, cx2 + 4, y + 14 + i * 6);
  });

  y += 42;

  /* ═══════════════════════════════════════
     PAYMENT INFO PILL ROW
  ═══════════════════════════════════════ */
  y += 6;
  const pills = [
    { label: "Payment Method", value: data.paymentMethod },
    { label: "Payment Status", value: data.paymentStatus.toUpperCase() },
    { label: "Items",          value: String(data.items.length) },
  ];
  const pw = CW / pills.length - 4;
  pills.forEach(({ label, value }, i) => {
    const px = PAD + i * (pw + 6);
    const isStatus = label === "Payment Status";
    const isPaid   = value.toLowerCase().includes("paid");
    fill(...(isStatus ? (isPaid ? [235, 252, 240] : [255, 249, 235]) as [number,number,number] : BG_LIGHT));
    doc.roundedRect(px, y, pw, 16, 2, 2, "F");

    color(...GREY_L);
    font("normal", 6.5);
    text(label.toUpperCase(), px + 4, y + 6);

    color(...(isStatus ? (isPaid ? [22, 101, 52] : [133, 77, 14]) : GREY_D) as [number,number,number]);
    font("bold", 8);
    text(value, px + 4, y + 12);
  });

  y += 24;

  /* ═══════════════════════════════════════
     ITEMS TABLE
  ═══════════════════════════════════════ */
  // Table header
  fill(...GREEN_D);
  rect(PAD, y, CW, 9, 2);

  color(...GREEN_L);
  font("bold", 7.5);
  const COL = {
    item: PAD + 4,
    qty:  PAD + CW * 0.58,
    price:PAD + CW * 0.72,
    total:PAD + CW - 2,
  };
  text("ITEM",      COL.item,  y + 6);
  text("QTY",       COL.qty,   y + 6);
  text("UNIT PRICE",COL.price, y + 6);
  text("AMOUNT",    COL.total, y + 6, { align: "right" });

  y += 9;

  // Rows
  data.items.forEach((item, idx) => {
    const rowH = 10;
    if (idx % 2 === 0) {
      fill(...BG_LIGHT);
    } else {
      fill(255, 255, 255);
    }
    rect(PAD, y, CW, rowH, 0);

    color(...GREY_D);
    font("normal", 8);
    const nameLines = doc.splitTextToSize(item.name, CW * 0.52);
    text(nameLines[0], COL.item, y + 6.5);

    color(...GREY_M);
    font("normal", 8);
    text(String(item.quantity),     COL.qty,   y + 6.5);
    text(inr(item.price),           COL.price, y + 6.5);

    color(...GREY_D);
    font("bold", 8);
    text(inr(item.total), COL.total, y + 6.5, { align: "right" });

    y += rowH;
  });

  // Table bottom border
  stroke(...DIVIDER);
  doc.setLineWidth(0.3);
  line(PAD, y, PAD + CW, y);

  y += 8;

  /* ═══════════════════════════════════════
     BILL SUMMARY (right-aligned)
  ═══════════════════════════════════════ */
  const summaryX  = PAD + CW * 0.55;
  const summaryW  = CW * 0.45;
  const labelX    = summaryX + 4;
  const valueX    = PAD + CW - 2;
  const rowGap    = 7;

  // Subtotal / Shipping / Discount rows — GST not included in total
  const summaryRows: { label: string; value: string; dim?: boolean }[] = [
    { label: "Subtotal", value: inr(data.subtotal) },
    { label: "Shipping", value: data.shipping === 0 ? "Free" : inr(data.shipping) },
    { label: "GST (18%)", value: inr(data.tax) },
  ];
  if (data.discount > 0) {
    summaryRows.push({ label: "Discount", value: `-${inr(data.discount)}` });
  }

  summaryRows.forEach(({ label, value }) => {
    color(...GREY_M); font("normal", 8);
    text(label, labelX, y);
    const isFree = value === "Free";
    color(...(isFree ? GREEN_L : GREY_D)); font("normal", 8);
    text(value, valueX, y, { align: "right" });
    y += rowGap;
  });

  // Total row with highlight
  y += 2;
  fill(...GREEN_D);
  doc.roundedRect(summaryX, y - 5, summaryW, 12, 2, 2, "F");
  color(...GREEN_L); font("bold", 9);
  text("TOTAL", labelX, y + 3);
  color(...WHITE); font("bold", 11);
  text(inr(data.total), valueX, y + 3, { align: "right" });

  y += 20;

  /* ═══════════════════════════════════════
     THANK YOU FOOTER
  ═══════════════════════════════════════ */
  // Separator
  stroke(...DIVIDER);
  doc.setLineWidth(0.2);
  line(PAD, y, PAD + CW, y);
  y += 8;

  color(...GREEN_M); font("bold", 10);
  text("Thank you for shopping with GreenKart!", W / 2, y, { align: "center" });

  y += 6;
  color(...GREY_L); font("normal", 7.5);
  text("For support, contact us at support@greenkart.in or visit greenkart.in", W / 2, y, { align: "center" });

  y += 10;

  // Bottom accent bar
  fill(...GREEN_D);
  rect(0, 290, W, 7, 0);
  fill(...GREEN_L);
  rect(0, 290, W, 2, 0);
  color(...WHITE); font("normal", 6);
  text(`GreenKart Receipt  ·  Order ${shortId}  ·  Generated ${new Date().toLocaleDateString("en-IN")}`, W / 2, 295, { align: "center" });

  /* ── Save ── */
  doc.save(`GreenKart_Receipt_${shortId}.pdf`);
}

/* ─────────────────────────────────────────
   Hook
───────────────────────────────────────── */
export function useReceiptDownload() {
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const download = useCallback(async (orderId: string) => {
    if (!orderId) { setError("Order ID missing."); return; }
    setLoading(true); setError("");
    try {
      // Fetch order detail
      const res  = await fetch(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) { setError(json.message || "Could not fetch order details."); return; }

      // Normalise response shape
      const order = json?.data?.order ?? json?.data ?? json?.order ?? json;
      const data  = mapOrder(order, user);
      await drawReceipt(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate receipt.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, user]);

  return { download, loading, error };
}