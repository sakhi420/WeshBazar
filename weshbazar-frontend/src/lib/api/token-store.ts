/**
 * In-memory access-token store (master prompt §7, frontend-api-contract.md §2).
 *
 * The access token lives ONLY in JS memory — never localStorage/sessionStorage,
 * never in a URL, never logged. The refresh token is an HttpOnly cookie managed
 * by the browser and is intentionally invisible to this code.
 */

type Listener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) listener(token);
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

/** Subscribe to access-token changes (used to sync React auth state). */
export function subscribeAccessToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function hasAccessToken(): boolean {
  return accessToken !== null && accessToken.length > 0;
}
