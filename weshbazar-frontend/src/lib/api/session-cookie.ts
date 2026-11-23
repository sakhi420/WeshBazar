/**
 * Browser-visible session cookies shared by AuthProvider, middleware and
 * the API client. These cookies are non-secret markers only; the actual
 * refresh token remains HttpOnly and backend-controlled.
 */

export const SESSION_COOKIE = 'weshbazar_session';
export const LOCAL_LOGOUT_COOKIE = 'weshbazar_logged_out';

const SESSION_MAX_AGE_SECONDS = 2592000;

export type AuthSessionEvent = 'login' | 'logout';
const AUTH_SESSION_CHANNEL = 'weshbazar-auth';

/** True on a real HTTPS origin so marker cookies get the Secure flag. */
function isHttpsOrigin(): boolean {
  return typeof window !== 'undefined' && window.location?.protocol === 'https:';
}

function cookieSecurityAttribute(): string {
  return isHttpsOrigin() ? ';Secure' : '';
}

/** Mark the browser as session-holding for the middleware gate. */
export function setSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=1;path=/;SameSite=Lax;max-age=${SESSION_MAX_AGE_SECONDS}${cookieSecurityAttribute()}`;
}

/** Immediately expire the marker so the middleware sees a guest. */
export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=;path=/;SameSite=Lax;max-age=0${cookieSecurityAttribute()}`;
}

/**
 * Remember an explicit local sign-out even when the backend cannot be reached.
 * The HttpOnly refresh cookie cannot be deleted by JavaScript; this marker
 * prevents silent bootstrap from reusing it after a reload.
 */
export function markLocalLogout(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCAL_LOGOUT_COOKIE}=1;path=/;SameSite=Lax;max-age=${SESSION_MAX_AGE_SECONDS}${cookieSecurityAttribute()}`;
}

/** Remove the local sign-out marker only after a new login/register succeeds. */
export function clearLocalLogoutMarker(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCAL_LOGOUT_COOKIE}=;path=/;SameSite=Lax;max-age=0${cookieSecurityAttribute()}`;
}

/** True when this browser has explicitly signed out on this origin. */
export function hasLocalLogoutMarker(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim() === `${LOCAL_LOGOUT_COOKIE}=1`);
}

/** Notify other same-origin tabs after an explicit login or logout. */
export function publishAuthSessionEvent(event: AuthSessionEvent): void {
  if (typeof BroadcastChannel === 'undefined') return;
  try {
    const channel = new BroadcastChannel(AUTH_SESSION_CHANNEL);
    channel.postMessage(event);
    channel.close();
  } catch {
    // The marker cookies still protect reloads if cross-tab messaging is unavailable.
  }
}
