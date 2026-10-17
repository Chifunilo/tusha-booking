// middleware.ts (at project root)
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const PROTECTED_ROUTES = [
  '/booking', '/payment', '/profile-page', '/bookings',
  '/business-dashboard', '/add-property', '/add-room',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  if (pathname.startsWith('/admin')) {
    // The login page itself must stay reachable by anyone — it's how an admin
    // authenticates in the first place. Everything else under /admin requires
    // an existing admin session.
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const session = await getSession(token);

    // A non-admin (including a logged-out visitor) gets a 404, not a redirect
    // to login — the admin area shouldn't be distinguishable from a route
    // that simply doesn't exist.
    if (!session || session.userType !== 'admin') {
      return NextResponse.rewrite(new URL('/__admin_not_found__', request.url));
    }

    return NextResponse.next();
  }

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));

  if (!isProtected) return NextResponse.next();

  const session = await getSession(token);

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/booking/:path*', '/payment/:path*', '/profile-page/:path*', '/bookings/:path*',
    '/business-dashboard/:path*', '/add-property/:path*', '/add-room/:path*',
    '/admin/:path*',
  ],
};
