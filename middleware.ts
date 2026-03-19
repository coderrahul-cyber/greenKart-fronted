// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const USER_PROTECTED = [
  '/cart', '/profile', '/orders', '/order-history', '/address',
  '/checkout', '/order-confirmed', '/payment-details', '/addresses', '/notifications',
];

const ADMIN_PUBLIC = ['/admin/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ── Admin routes ── */
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin_accessToken')?.value;
    const isAdminPublic = ADMIN_PUBLIC.some(p => pathname.startsWith(p));

    if (!isAdminPublic && !adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (isAdminPublic && adminToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return NextResponse.next();
  }

  /* ── User auth guard ── */
  const accessToken  = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isProtected = USER_PROTECTED.some(p => pathname.startsWith(p));

  // FIX: allow if EITHER token exists
  const hasSession = !!(accessToken || refreshToken);

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  /* ── Prevent logged-in users from visiting auth pages ── */
  const isOtpStep =
    pathname === '/register' &&
    request.nextUrl.searchParams.get('otp') === '1';

  if ((pathname === '/login' || pathname === '/register') && hasSession && !isOtpStep) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/cart/:path*', '/profile/:path*', '/orders/:path*', '/checkout/:path*',
    '/order-history/:path*', '/order-confirmed/:path*',
    '/address/:path*', '/payment-details/:path*',
    '/addresses/:path*', '/notifications/:path*',
    '/login', '/register',
    '/admin/:path*',
  ],
};