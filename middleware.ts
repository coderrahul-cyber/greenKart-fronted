// middleware.ts  (place at project root, next to package.json)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ── User-protected routes ── */
const USER_PROTECTED = [
  '/cart', '/profile', '/orders', '/order-history', '/address',
  '/checkout', '/order-confirmed', '/payment-details', '/addresses', '/notifications',
];

/* ── Admin-protected routes (everything under /admin except /admin/login) ── */
const ADMIN_PUBLIC = ['/admin/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ════════════════════════════════════════
     ADMIN routes — use admin_ prefixed cookie
  ════════════════════════════════════════ */
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin_accessToken')?.value;
    const isAdminPublic = ADMIN_PUBLIC.some(p => pathname.startsWith(p));

    // Not logged in → redirect to admin login (except the login page itself)
    if (!isAdminPublic && !adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Already logged in admin trying to visit login → send to dashboard
    if (isAdminPublic && adminToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return NextResponse.next();
  }

  /* ════════════════════════════════════════
     USER routes
  ════════════════════════════════════════ */
  const userToken   = request.cookies.get('accessToken')?.value;
  const isProtected = USER_PROTECTED.some(p => pathname.startsWith(p));

  if (isProtected && !userToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === '/login' || pathname === '/register') && userToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // User routes
    '/cart/:path*', '/profile/:path*', '/orders/:path*', '/checkout/:path*',
    '/order-history/:path*', '/order-confirmed/:path*',
    '/address/:path*', '/payment-details/:path*',
    '/addresses/:path*', '/notifications/:path*',
    '/login', '/register',
    // Admin routes
    '/admin/:path*',
  ],
};