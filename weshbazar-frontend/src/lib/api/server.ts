/**
 * Server-side API client for React Server Components (master prompt §5, §33).
 *
 * Public discovery/category/location/seller content should be server-rendered
 * wherever practical. This adapter:
 *  - builds absolute URLs from the server API origin
 *  - supports Next caching hints (`revalidate` / `tags`)
 *  - reuses the shared envelope parser and error model
 *
 * The in-memory access token is a browser concern; the server never persists a
 * user's token. Authenticated data is fetched on the client via `browser.ts`.
 * Server reads that need the caller's cookie can forward it explicitly.
 */

import { SERVER_API_BASE_URL, apiUrl } from '@/lib/env';
import { ApiError, ApiErrorCode } from './errors';
import { buildQuery, parseEnvelope, type Query } from './client';
import type { CursorMeta, CursorPage } from './types';

/** Cap SSR reads so an unreachable backend cannot hang the render thread. */
const DEFAULT_SERVER_FETCH_TIMEOUT_MS = 10_000;

export interface ServerRequestOptions {
  query?: Query;
  /** Forward the incoming cookie header (e.g. from `next/headers`). */
  cookie?: string;
  /** Optional bearer token when rendering an authenticated view on the server. */
  accessToken?: string;
  /** Next.js fetch cache: seconds to revalidate. */
  revalidate?: number | false;
  /** Next.js fetch cache tags for on-demand revalidation. */
  tags?: string[];
  signal?: AbortSignal;
  /** Abort the request after this many ms (default 10s). Pass 0 to disable. */
  timeoutMs?: number;
  headers?: Record<string, string>;
}

function nextCache(
  options: ServerRequestOptions,
): { revalidate?: number | false; tags?: string[] } | undefined {
  const next: { revalidate?: number | false; tags?: string[] } = {};
  if (options.revalidate !== undefined) next.revalidate = options.revalidate;
  if (options.tags && options.tags.length > 0) next.tags = options.tags;
  return Object.keys(next).length > 0 ? next : undefined;
}

/**
 * Combine any caller signal with a hard timeout. Caller aborts propagate as
 * `AbortError`; the internal timeout aborts with `TimeoutError` so the shared
 * fetch helper can map it to a clean `NETWORK` ApiError instead of hanging.
 */
function serverFetchSignal(
  provided: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal | undefined {
  const hasTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0;
  if (!hasTimeout) return provided;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException('Server request timed out', 'TimeoutError'));
  }, timeoutMs);

  const abortFromCaller = () => {
    clearTimeout(timer);
    controller.abort();
  };
  if (provided) {
    if (provided.aborted) abortFromCaller();
    else provided.addEventListener('abort', abortFromCaller, { once: true });
  }
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });

  return controller.signal;
}

/** Perform a GET against the API origin and return the raw `Response`. */
async function serverFetch(path: string, options: ServerRequestOptions): Promise<Response> {
  const headers: Record<string, string> = {
    'x-request-id': crypto.randomUUID(),
    ...options.headers,
  };
  if (options.cookie) headers.cookie = options.cookie;
  if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;

  const url = apiUrl(path, SERVER_API_BASE_URL) + buildQuery(options.query);
  const signal = serverFetchSignal(
    options.signal,
    options.timeoutMs ?? DEFAULT_SERVER_FETCH_TIMEOUT_MS,
  );

  try {
    return await fetch(url, {
      method: 'GET',
      headers,
      signal,
      next: nextCache(options),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'TimeoutError') {
      throw new ApiError({
        code: ApiErrorCode.NETWORK,
        message: 'Server request timed out',
        status: 0,
        cause,
      });
    }
    if ((cause as Error)?.name === 'AbortError') throw cause;
    throw new ApiError({
      code: ApiErrorCode.NETWORK,
      message: 'Server network request failed',
      status: 0,
      cause,
    });
  }
}

/** Perform a GET against the API from a Server Component and unwrap `data`. */
export async function serverGet<TData>(
  path: string,
  options: ServerRequestOptions = {},
): Promise<TData> {
  const res = await serverFetch(path, options);
  const envelope = await parseEnvelope<TData, unknown>(res);
  return envelope.data;
}

/**
 * Cursor-paginated GET from a Server Component (public discovery).
 * Mirrors `getCursorPage` but keeps Next cache hints and server origin, so the
 * first page can be server-rendered and its cursor handed to the client for
 * "load more" (frontend-api-contract.md §6.1).
 */
export async function serverGetCursorPage<TItem>(
  path: string,
  options: ServerRequestOptions = {},
): Promise<CursorPage<TItem>> {
  const res = await serverFetch(path, options);
  const envelope = await parseEnvelope<TItem[], CursorMeta>(res);
  const items = Array.isArray(envelope.data) ? envelope.data : [];
  return {
    items,
    nextCursor: envelope.meta?.nextCursor ?? null,
    hasMore: envelope.meta?.hasMore ?? false,
    total: envelope.meta?.total,
  };
}
