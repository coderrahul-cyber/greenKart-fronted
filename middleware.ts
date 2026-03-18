// middleware.ts  (place at project root, next to package.json)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ── User-protected routes (require login) ── */
const USER_PROTECTED = [
  '/cart', '/profile', '/orders', '/order-history', '/address',
  '/checkout', '/order-confirmed', '/payment-details', '/addresses', '/notifications',
];

/* ── Admin-protected routes ── */
const ADMIN_PUBLIC = ['/admin/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ── Admin routes ── */
  if (pathname.startsWith('/admin')) {
    const adminToken    = request.cookies.get('admin_accessToken')?.value;
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
  const userToken   = request.cookies.get('accessToken')?.value;
  const isProtected = USER_PROTECTED.some(p => pathname.startsWith(p));

  if (isProtected && !userToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Don't redirect /register if user is on the OTP verification step
  // (?otp=1 is set by the register page when moving to step 3)
  const isOtpStep = pathname === '/register' && request.nextUrl.searchParams.get('otp') === '1';
  if ((pathname === '/login' || pathname === '/register') && userToken && !isOtpStep) {
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