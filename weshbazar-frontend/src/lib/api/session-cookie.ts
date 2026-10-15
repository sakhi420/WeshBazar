/**
 * Browser session marker cookie shared by AuthProvider and every sign-out path
 * (master prompt §7; audit SESSION-001).
 *
 * The backend refresh cookie is HttpOnly with path=/api/v1/auth, so the browser
 * never sends it on page requests. Page Middleware therefore relies on this
 * *non-secret* marker to cheaply distinguish guests from session-holders during
 * SSR navigation.
 */
export const SESSION_COOKIE = 'weshbazar_session';

// Match the refresh-token TTL (~30 days).
const SESSION_MAX_AGE_SECONDS = 2592000;

/** Mark the browser as session-holding for the middleware gate. */
export function setSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=1;path=/;SameSite=Lax;max-age=${SESSION_MAX_AGE_SECONDS}`;
}

/** Immediately expire the marker so the middleware sees a guest. */
export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=;path=/;SameSite=Lax;max-age=0`;
}