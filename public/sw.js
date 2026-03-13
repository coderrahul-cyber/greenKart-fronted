// public/sw.js
// Service Worker — handles background Web Push notifications.
// Place this file at /public/sw.js so Next.js serves it at /sw.js
// (must be at root scope, not inside /app).

const ADMIN_ORDERS_URL = '/admin/orders';

/* ─────────────────────────────────────────
   Install & Activate — take control immediately
───────────────────────────────────────── */
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()));

/* ─────────────────────────────────────────
   Push event — fired even when browser is closed
   Payload shape:
   {
     title:   "New Order Received 🛒",
     body:    "Order ORD-2025-00042 — ₹1,240",
     orderId: "abc123",
     url:     "/admin/orders"
   }
───────────────────────────────────────── */
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch {}

  const title   = data.title   ?? 'GreenKart Admin';
  const body    = data.body    ?? 'You have a new notification.';
  const url     = data.url     ?? ADMIN_ORDERS_URL;
  const orderId = data.orderId ?? null;

  const options = {
    body,
    icon:    '/icons/icon-192x192.png',   // add your admin icon here
    badge:   '/icons/badge-72x72.png',    // monochrome badge for Android
    tag:     orderId ? `order-${orderId}` : 'greenkart-admin',
    renotify: true,   // replace existing notif with same tag
    requireInteraction: true,  // stays until admin clicks (desktop)
    vibrate: [200, 100, 200],
    data:    { url, orderId },
    actions: [
      { action: 'confirm', title: '✅ View Order' },
      { action: 'dismiss', title: 'Dismiss'       },
    ],
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* ─────────────────────────────────────────
   Notification click handler
   - "View Order" action  → open /admin/orders
   - Clicking body        → open /admin/orders
   - "Dismiss" action     → just close
───────────────────────────────────────── */
self.addEventListener('notificationclick', e => {
  e.notification.close();

  if (e.action === 'dismiss') return;

  // Always open the orders list page — never a specific order ID URL
  const targetUrl = ADMIN_ORDERS_URL;

  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // If an admin tab is already open — focus it and navigate
        const adminTab = clients.find(c => c.url.includes('/admin'));
        if (adminTab) {
          adminTab.focus();
          adminTab.navigate(targetUrl);
          return;
        }
        // Otherwise open a new tab
        self.clients.openWindow(targetUrl);
      })
  );
});

/* ─────────────────────────────────────────
   Push subscription change
   (browser rotates the subscription — re-subscribe automatically)
───────────────────────────────────────── */
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: e.oldSubscription?.options?.applicationServerKey })
      .then(newSub => {
        // Post the new subscription back to the page so it can re-save to backend
        self.clients.matchAll().then(clients =>
          clients.forEach(c => c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: newSub.toJSON() }))
        );
      })
  );
});