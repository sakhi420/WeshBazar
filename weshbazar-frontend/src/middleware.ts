import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route guard middleware (§7, V5.3 session regression).
 *
 * - Authenticated users are redirected away from auth pages (login/register).
 * - Guests are redirected to login with `next` preserved for private routes.
 *
 * The `weshbazar_refresh` HttpOnly cookie signals an active session; its
 * presence is a cheap server-side signal — the actual session validity is
 * checked by the page-level auth bootstrap. Absence means guest.
 */

/** Paths that should redirect authenticated users to `/`. */
const AUTH_PATHS = ['/auth/login', '/auth/register'];

/** Path prefixes that require an active session. */
const PROTECTED_PREFIXES = ['/favorites', '/account', '/my-listings', '/sell', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('weshbazar_refresh');

  // Redirect signed-in users away from login/register.
  if (hasSession && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect guests to login for protected routes, preserving the target.
  if (!hasSession && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/** Only run on page routes, never on static assets or API calls. */
export const config = {
  matcher: [
    '/((?!_next|api|favicon|brand|fonts|media).*)',
  ],
};