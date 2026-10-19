/**
 * Pagination contract.
 *
 * - Public discovery endpoints use cursor pagination (`CursorPageMeta`):
 *   stable under inserts/updates, cheap for large feeds.
 * - Admin listings use page/limit pagination (`PageMeta`) because admins need
 *   total counts and jump-to-page behavior.
 *
 * Controllers wrap their result in `cursorPage(...)` / `pageResults(...)`;
 * the response interceptor unwraps it into `{ data: items, meta }`.
 */

export interface CursorPageMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  /** Exact match count for the criteria (ignores cursor/limit); discovery feeds provide it. */
  total?: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class CursorPaginated<T> {
  constructor(
    readonly items: readonly T[],
    readonly meta: CursorPageMeta,
  ) {}
}

export class PagePaginated<T> {
  constructor(
    readonly items: readonly T[],
    readonly meta: PageMeta,
  ) {}
}

export function cursorPage<T>(items: readonly T[], meta: CursorPageMeta): CursorPaginated<T> {
  return new CursorPaginated(items, meta);
}

export function pageResults<T>(items: readonly T[], meta: PageMeta): PagePaginated<T> {
  return new PagePaginated(items, meta);
}

/** Clamps a client-supplied `limit` into [1, max], with a fallback default. */
export function clampLimit(value: number | undefined, fallback = 24, max = 60): number {
  if (value === undefined || !Number.isFinite(value) || value < 1) {
    return fallback;
  }
  return Math.min(Math.trunc(value), max);
}

/** Clamps a client-supplied admin `page` into [1, ∞). */
export function clampPage(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 1) {
    return 1;
  }
  return Math.trunc(value);
}

/**
 * Cursor payloads are opaque to clients: base64url-encoded JSON of a small
 * record (e.g. `{ createdAt, id }`). They carry no secrets, but clients must
 * treat them as opaque values.
 */
export function encodeCursor(payload: Record<string, string | number | boolean | Date>): string {
  const serializable = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value,
    ]),
  );
  return Buffer.from(JSON.stringify(serializable), 'utf8').toString('base64url');
}

/** Returns the decoded cursor payload, or null when the cursor is malformed. */
export function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function pageMeta(page: number, limit: number, total: number): PageMeta {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
