/**
 * Browser entry point for the API client. Client Components and TanStack Query
 * functions import from here so the whole HTTP surface stays behind one adapter
 * (master prompt §6). Re-exports the core client verbs.
 */

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
  type Query,
  type QueryValue,
  type RequestOptions,
} from './client';

export {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  hasAccessToken,
  subscribeAccessToken,
} from './token-store';
