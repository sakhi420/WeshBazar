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

/** Perform a GET against the API from a Server Component and unwrap `data`. */
export async function serverGet<TData>(
  path: string,
  options: ServerRequestOptions = {},
): Promise<TData> {
  const headers: Record<string, string> = {
    'x-request-id': crypto.randomUUID(),
    ...options.headers,
  };
  if (options.cookie) headers.cookie = options.cookie;
  if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;

  const url = apiUrl(path, SERVER_API_BASE_URL) + buildQuery(options.query);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers,
      signal: options.signal,
      next: nextCache(options),
    });
  } catch (cause) {
    if ((cause as Error)?.name === 'AbortError') throw cause;
    throw new ApiError({
      code: ApiErrorCode.NETWORK,
      message: 'Server network request failed',
      status: 0,
      cause,
    });
  }

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
  const headers: Record<string, string> = {
    'x-request-id': crypto.randomUUID(),
    ...options.headers,
  };
  if (options.cookie) headers.cookie = options.cookie;
  if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;

  const url = apiUrl(path, SERVER_API_BASE_URL) + buildQuery(options.query);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers,
      signal: options.signal,
      next: nextCache(options),
    });
  } catch (cause) {
    if ((cause as Error)?.name === 'AbortError') throw cause;
    throw new ApiError({
      code: ApiErrorCode.NETWORK,
      message: 'Server network request failed',
      status: 0,
      cause,
    });
  }

  const envelope = await parseEnvelope<TItem[], CursorMeta>(res);
  const items = Array.isArray(envelope.data) ? envelope.data : [];
  return {
    items,
    nextCursor: envelope.meta?.nextCursor ?? null,
    hasMore: envelope.meta?.hasMore ?? false,
  };
}
