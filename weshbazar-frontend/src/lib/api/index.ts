/**
 * API client boundary barrel (master prompt §6).
 * Feature layers import from `@/lib/api` so no UI component ever wires raw
 * fetch, envelope parsing, pagination, or error mapping itself.
 */

export * from './types';
export * from './errors';
export * from './token-store';
export { queryKeys } from './query-keys';
export { clearUserScopedCaches } from './cache';
export {
  clearSessionCookie,
  setSessionCookie,
  markLocalLogout,
  clearLocalLogoutMarker,
  hasLocalLogoutMarker,
  publishAuthSessionEvent,
  SESSION_COOKIE,
  LOCAL_LOGOUT_COOKIE,
} from './session-cookie';

// Browser-side verbs.
export {
  request,
  get,
  post,
  patch,
  del,
  getCursorPage,
  getPage,
  buildQuery,
  refreshAccessToken,
  parseEnvelope,
  newIdempotencyKey,
  type Query,
  type QueryValue,
  type RequestOptions,
} from './client';

// Server-side (RSC) verb.
export { serverGet, serverGetCursorPage, type ServerRequestOptions } from './server';
