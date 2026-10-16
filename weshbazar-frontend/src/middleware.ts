import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route guard middleware (§7, V5.3 session regression).
 *
 * - Authenticated users are redirected away from auth pages (login/register).
 * - Guests are redirected to login with `next` preserved for private routes.
 *
 * The backend refresh cookie (`weshbazar_refresh`) is HttpOnly with
 * path=/api/v1/auth — the browser NEVER sends it on page requests.
 * Therefore we watch a lightweight non‑HttpOnly `weshbazar_session`
 * cookie that the frontend AuthProvider sets (path=/) after a successful
 * bootstrap. Its presence means "the browser has an active server session";
 * absence means guest.
 */

/** Paths that should redirect authenticated users to `/`. */
const AUTH_PATHS = ['/auth/login', '/auth/register'];

/** Path prefixes that require an active session. */
const PROTECTED_PREFIXES = ['/favorites', '/account', '/my-listings', '/sell', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('weshbazar_session');

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

/**
 * Only run on page routes, never on static assets, API calls, or the
 * `/.well-known/*` probes Chrome DevTools issues (e.g.
 * `/.well-known/appspecific/com.chrome.devtools.json`). Skipping those keeps
 * benign 404 probe requests from forcing a `/_not-found` server render and
 * stalling the middleware on an offline backend.
 */
export const config = {
  matcher: [
    '/((?!_next|api|favicon|brand|fonts|media|\\.well-known).*)',
  ],
};