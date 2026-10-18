/**
 * Centralized, typed access to environment variables.
 * Never read process.env scattered across the app — go through this module so
 * defaults and validation live in one place (master prompt §6).
 */

function str(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Public API origin for *browser* requests (no trailing slash, no /api/v1 prefix).
 *
 * An empty value means "same origin": Next.js `rewrites()` forwards `/api/v1/*`
 * to the backend in the background (next.config.mjs), so browser calls never
 * cross origins and CORS is eliminated permanently. The unset default remains
 * `http://localhost:3000` for backwards compatibility.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL === undefined
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_BASE_URL.trim()
).replace(/\/$/, '');

/** Prefix applied to every route except /health/* (frontend-api-contract.md §1). */
export const API_PREFIX = str(process.env.NEXT_PUBLIC_API_PREFIX, '/api/v1');

/** Absolute origin used to build media/image URLs in dev (frontend-api-contract.md §8). */
export const MEDIA_BASE_URL = str(
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
  API_BASE_URL,
).replace(/\/$/, '');

/** Public site origin, used for canonical/OG metadata. */
export const SITE_URL = str(process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3001').replace(
  /\/$/,
  '',
);

/**
 * Server-only origin used by React Server Components. Falls back to the public
 * base URL. In production this may point at an internal address.
 */
export const SERVER_API_BASE_URL = str(process.env.API_SERVER_BASE_URL, API_BASE_URL).replace(
  /\/$/,
  '',
);

/** Join the API origin + prefix into a full endpoint URL. */
export function apiUrl(path: string, origin: string = API_BASE_URL): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${API_PREFIX}${cleanPath}`;
}
