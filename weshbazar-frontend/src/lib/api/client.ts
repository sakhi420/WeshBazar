/**
 * Browser API client — the single adapter every client-side HTTP interaction
 * goes through (master prompt §6, §7; frontend-api-contract.md §12).
 *
 * Guarantees:
 *  - absolute URL built from base + /api/v1 prefix
 *  - `credentials: 'include'` on every request (refresh cookie round-trip)
 *  - `x-request-id` on every request
 *  - in-memory access token attached as `Authorization: Bearer`
 *  - single-flight silent refresh + one replay on 401 TOKEN_EXPIRED
 *  - session cleared on terminal 401 codes
 *  - typed ApiError thrown on any non-2xx / transport failure
 *
 * UI code must never call `fetch` directly — use this module (or the
 * feature-layer functions built on it).
 */

import { apiUrl } from '@/lib/env';
import {
  ApiError,
  ApiErrorCode,
  apiErrorFromEnvelope,
  parseRetryAfter,
} from './errors';
import { clearAccessToken, getAccessToken, setAccessToken } from './token-store';
import type {
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  CursorMeta,
  CursorPage,
  PageMeta,
  PageResult,
} from './types';

export type QueryValue = string | number | boolean | null | undefined | Array<string | number>;
export type Query = Record<string, QueryValue>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Query;
  /** JSON-serializable body. Omit for FormData uploads (set `formData` instead). */
  body?: unknown;
  /** Multipart body (media upload). Content-Type is set by the browser. */
  formData?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Idempotency-Key for unsafe writes (create, contact reveal, report, upload). */
  idempotencyKey?: string;
  /** Attach the bearer token when present. Default true. */
  auth?: boolean;
  /** Internal: skip the automatic 401 refresh+replay (used by the refresh call). */
  skipAuthRefresh?: boolean;
  cache?: RequestCache;
}

/** Shape of `data` returned by auth_register / auth_login / auth_refresh. */
interface AuthTokensResponse {
  tokens?: { accessToken?: string };
}

function newRequestId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') return cryptoObj.randomUUID();
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Fresh Idempotency-Key for an unsafe write (contact reveal, report, create).
 * Callers generate one per user intent and reuse it across retries of that
 * same intent so the backend can deduplicate.
 */
export function newIdempotencyKey(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') return cryptoObj.randomUUID();
  return `idem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Serialize a query object into a URLSearchParams, honoring repeated params. */
export function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// --- Single-flight refresh ---------------------------------------------------

let refreshInFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', 'x-request-id': newRequestId() },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      clearAccessToken();
      return null;
    }
    const envelope = (await res.json()) as ApiSuccessEnvelope<AuthTokensResponse>;
    const token = envelope?.data?.tokens?.accessToken ?? null;
    if (token) {
      setAccessToken(token);
      return token;
    }
    clearAccessToken();
    return null;
  } catch {
    clearAccessToken();
    return null;
  }
}

/**
 * Rotate the refresh cookie under a same-origin browser lock.
 *
 * The refresh cookie is shared by every tab, but each tab has its own
 * in-memory `refreshInFlight` promise. Without a cross-tab lock, two tabs
 * can submit the same cookie concurrently; the backend correctly treats the
 * second rotation as token replay and revokes the whole session family.
 *
 * Web Locks serializes refreshes across same-origin tabs. The next tab then
 * sends the cookie set by the preceding response. Browsers without Web Locks
 * retain the previous single-tab behavior rather than losing authentication.
 */
async function doRefreshWithCrossTabLock(): Promise<string | null> {
  const lockManager = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!lockManager) return doRefresh();

  try {
    return await lockManager.request(
      'weshbazar-auth-refresh',
      { mode: 'exclusive' },
      () => doRefresh(),
    );
  } catch {
    // If the browser exposes but cannot acquire Web Locks, preserve the
    // existing refresh behavior. The server's replay detection remains intact.
    return doRefresh();
  }
}

/** Rotate the access token once, de-duplicating callers in this tab and across tabs. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefreshWithCrossTabLock().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// --- Response parsing --------------------------------------------------------

export async function parseEnvelope<TData, TMeta>(
  res: Response,
): Promise<ApiSuccessEnvelope<TData, TMeta>> {
  const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
  // 204 No Content (logout, session revoke) has an empty body.
  if (res.status === 204) {
    return {
      success: true,
      data: undefined as unknown as TData,
      requestId: res.headers.get('x-request-id') ?? '',
    };
  }

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    // Non-JSON body on an error status → synthesize a transport-style error.
    if (!res.ok) {
      throw new ApiError({
        code: res.status >= 500 ? ApiErrorCode.INTERNAL_ERROR : ApiErrorCode.BAD_REQUEST,
        message: res.statusText || 'Request failed',
        status: res.status,
        requestId: res.headers.get('x-request-id') ?? undefined,
      });
    }
  }

  if (!res.ok) {
    const envelope = raw as ApiErrorEnvelope | null;
    if (envelope && envelope.success === false && envelope.error) {
      throw apiErrorFromEnvelope(envelope, res.status, retryAfter);
    }
    throw new ApiError({
      code: res.status >= 500 ? ApiErrorCode.INTERNAL_ERROR : ApiErrorCode.BAD_REQUEST,
      message: res.statusText || 'Request failed',
      status: res.status,
      requestId: res.headers.get('x-request-id') ?? undefined,
    });
  }

  return raw as ApiSuccessEnvelope<TData, TMeta>;
}

// --- Core request ------------------------------------------------------------

async function executeRequest<TData, TMeta>(
  path: string,
  options: RequestOptions,
): Promise<ApiSuccessEnvelope<TData, TMeta>> {
  const {
    method = 'GET',
    query,
    body,
    formData,
    headers = {},
    signal,
    idempotencyKey,
    auth = true,
    cache,
  } = options;

  const finalHeaders: Record<string, string> = {
    'x-request-id': newRequestId(),
    ...headers,
  };

  if (formData) {
    // Let the browser set multipart boundary; do not force content-type.
  } else if (body !== undefined) {
    finalHeaders['content-type'] = finalHeaders['content-type'] ?? 'application/json';
  }

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders['authorization'] = `Bearer ${token}`;
  }

  if (idempotencyKey) finalHeaders['idempotency-key'] = idempotencyKey;

  let res: Response;
  try {
    res = await fetch(apiUrl(path) + buildQuery(query), {
      method,
      credentials: 'include',
      headers: finalHeaders,
      signal,
      cache,
      body: formData ? formData : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    if ((cause as Error)?.name === 'AbortError') throw cause;
    throw new ApiError({
      code: ApiErrorCode.NETWORK,
      message: 'Network request failed',
      status: 0,
      cause,
    });
  }

  return parseEnvelope<TData, TMeta>(res);
}

/**
 * Perform an API request. On 401 TOKEN_EXPIRED it silently refreshes once and
 * replays; on terminal 401 codes it clears the session and rethrows.
 */
export async function request<TData, TMeta = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccessEnvelope<TData, TMeta>> {
  try {
    return await executeRequest<TData, TMeta>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.isTokenExpired && !options.skipAuthRefresh) {
      const token = await refreshAccessToken();
      if (token) {
        // Replay exactly once with the fresh token.
        return executeRequest<TData, TMeta>(path, options);
      }
      clearAccessToken();
    }
    if (error instanceof ApiError && error.isSessionTerminal) {
      clearAccessToken();
    }
    throw error;
  }
}

// --- Convenience verbs -------------------------------------------------------

export async function get<TData>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
  const env = await request<TData>(path, { ...options, method: 'GET' });
  return env.data;
}

export async function post<TData>(path: string, body?: unknown, options?: RequestOptions) {
  const env = await request<TData>(path, { ...options, method: 'POST', body });
  return env.data;
}

export async function patch<TData>(path: string, body?: unknown, options?: RequestOptions) {
  const env = await request<TData>(path, { ...options, method: 'PATCH', body });
  return env.data;
}

export async function del<TData = void>(path: string, options?: RequestOptions) {
  const env = await request<TData>(path, { ...options, method: 'DELETE' });
  return env.data;
}

// --- Pagination normalization ------------------------------------------------

/** Normalize a cursor-paginated list response (public discovery). */
export async function getCursorPage<TItem>(
  path: string,
  options?: Omit<RequestOptions, 'method'>,
): Promise<CursorPage<TItem>> {
  const env = await request<TItem[], CursorMeta>(path, { ...options, method: 'GET' });
  const items = Array.isArray(env.data) ? env.data : [];
  return {
    items,
    nextCursor: env.meta?.nextCursor ?? null,
    hasMore: env.meta?.hasMore ?? false,
    total: env.meta?.total,
  };
}

/** Normalize a page-paginated list response (admin queues). */
export async function getPage<TItem>(
  path: string,
  options?: Omit<RequestOptions, 'method'>,
): Promise<PageResult<TItem>> {
  const env = await request<TItem[], PageMeta>(path, { ...options, method: 'GET' });
  const items = Array.isArray(env.data) ? env.data : [];
  const page = env.meta?.page ?? 1;
  const totalPages = env.meta?.totalPages ?? 1;
  return {
    items,
    page,
    limit: env.meta?.limit ?? items.length,
    total: env.meta?.total ?? items.length,
    totalPages,
    hasMore: page < totalPages,
  };
}
