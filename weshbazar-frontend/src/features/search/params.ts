/**
 * Search feature — discovery URL grammar (master prompt §21, §25–27).
 *
 * One module owns how discovery state survives in the URL and how it maps onto
 * the frozen `GET /listings` query (frontend-api-contract.md §7). URL keys
 * mirror the API parameter names so shared links stay meaningful.
 *
 * This module is Server-Component safe by design: the nuqs parsers live in
 * `./parsers` (client-only). Server code reads the URL through
 * `parseDiscoverySearchParams` so no client function is ever invoked during
 * SSR/build.
 *
 * Deliberate omissions from the URL:
 *  - `locale` (fixed to fa-AF) and `cursor` (per-session pagination state).
 */

import type { DiscoveryQuery } from '@/features/listings';
import type { ListingCondition } from '@/lib/api';

/** Sort enum + contract default (`newest` stays out of the URL). */
export const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc', 'most_viewed'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
export const DEFAULT_SORT: SortOption = 'newest';

/** ListingCondition enum accepted by the discovery filter (max 4 values). */
export const CONDITION_OPTIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'] as const;
export const MAX_CONDITION_FILTERS = 4;

/** Contract caps for filter expressions (frontend-api-contract.md §7.1). */
export const MAX_FILTER_EXPRESSIONS = 32;
export const MAX_FILTER_EXPRESSION_LENGTH = 200;

/**
 * URL separator for the `filter` array. A pipe never appears in generated
 * expressions (values pass through `sanitizeFilterValue` first) — commas
 * cannot be used because `in` values are comma-separated by grammar.
 * Exported for the client-side nuqs parsers in `./parsers`.
 */
export const FILTER_SEPARATOR = '|';

/** Parsed discovery URL state shared by the search and category surfaces. */
export interface DiscoveryUrlState {
  q?: string | null;
  category?: string | null;
  province?: string | null;
  city?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  condition?: ListingCondition[] | null;
  sort?: SortOption | null;
  filter?: string[] | null;
}

/**
 * Map URL state (+ route overrides such as the category page slug) onto the
 * frozen discovery query. Defaults are omitted so the request stays minimal.
 */
export function toDiscoveryQuery(
  state: DiscoveryUrlState,
  overrides: Partial<DiscoveryUrlState> = {},
): DiscoveryQuery {
  const merged = { ...state, ...overrides };
  const query: DiscoveryQuery = {};

  const q = merged.q?.trim();
  if (q) query.q = q;
  if (merged.category) query.category = merged.category;
  if (merged.province) query.province = merged.province;
  if (merged.city) query.city = merged.city;
  if (merged.minPrice !== null && merged.minPrice !== undefined) query.minPrice = merged.minPrice;
  if (merged.maxPrice !== null && merged.maxPrice !== undefined) query.maxPrice = merged.maxPrice;
  if (merged.condition?.length) {
    query.condition = merged.condition.slice(0, MAX_CONDITION_FILTERS);
  }
  if (merged.sort && merged.sort !== DEFAULT_SORT) query.sort = merged.sort;

  const filters = (merged.filter ?? [])
    .filter((item) => item.length > 0)
    .slice(0, MAX_FILTER_EXPRESSIONS);
  if (filters.length > 0) query.filter = filters;

  return query;
}

// --- Filter expressions (`key:operator:value`, frontend-api-contract §7.1) ---

export const FILTER_OPERATORS = ['eq', 'contains', 'gte', 'lte', 'in'] as const;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export interface FilterExpression {
  key: string;
  operator: FilterOperator;
  value: string;
}

/** Serialize one expression to the wire form (`key:operator:value`). */
export function serializeFilterExpression(expression: FilterExpression): string {
  return `${expression.key}:${expression.operator}:${expression.value}`;
}

/**
 * Parse a wire expression. Only the first two `:` are structural so values may
 * themselves contain colons. Returns null for malformed input — callers ignore
 * junk instead of crashing (bad-data resilience §54–57).
 */
export function parseFilterExpression(raw: string): FilterExpression | null {
  const first = raw.indexOf(':');
  if (first <= 0) return null;
  const second = raw.indexOf(':', first + 1);
  if (second <= first + 1) return null;
  const key = raw.slice(0, first);
  const operator = raw.slice(first + 1, second);
  const value = raw.slice(second + 1);
  if (!key || !value) return null;
  if (!(FILTER_OPERATORS as readonly string[]).includes(operator)) return null;
  return { key, operator: operator as FilterOperator, value };
}

/** Parse a full list, dropping malformed entries. */
export function parseFilterExpressions(raw: string[] | null | undefined): FilterExpression[] {
  const parsed: FilterExpression[] = [];
  for (const item of raw ?? []) {
    const expression = parseFilterExpression(item);
    if (expression) parsed.push(expression);
  }
  return parsed;
}

/**
 * Strip the URL separator from a user-entered value before it lands in an
 * expression stored in the URL. `in` values keep their commas — the wire
 * grammar owns those.
 */
export function sanitizeFilterValue(value: string): string {
  return value.split(FILTER_SEPARATOR).join(' ').trim();
}

/** Count of active filter facets (mobile filter-button badge). */
export function countActiveFilters(state: DiscoveryUrlState): number {
  let count = 0;
  if (state.province) count += 1;
  if (state.city) count += 1;
  if (state.minPrice !== null && state.minPrice !== undefined) count += 1;
  if (state.maxPrice !== null && state.maxPrice !== undefined) count += 1;
  count += state.condition?.length ?? 0;
  count += state.filter?.length ?? 0;
  return count;
}

// --- Server-side reading -----------------------------------------------------

/**
 * Read Next.js `searchParams` (strings or string arrays) into the shared URL
 * state, dropping anything malformed. The server must resolve the same query
 * the client would build from the URL, or SSR results and client updates drift.
 */
export function parseDiscoverySearchParams(
  raw: Record<string, string | string[] | undefined>,
): DiscoveryUrlState {
  const single = (value: string | string[] | undefined): string | undefined => {
    const first = Array.isArray(value) ? value[0] : value;
    const trimmed = first?.trim();
    return trimmed ? trimmed : undefined;
  };
  const list = (
    value: string | string[] | undefined,
    separator: string,
  ): string[] | undefined => {
    if (value === undefined) return undefined;
    const parts = (Array.isArray(value) ? value : [value]).flatMap((item) =>
      item.split(separator),
    );
    const cleaned = parts.map((item) => item.trim()).filter((item) => item.length > 0);
    return cleaned.length > 0 ? cleaned : undefined;
  };
  const numeric = (value: string | string[] | undefined): number | undefined => {
    const rawValue = single(value);
    if (rawValue === undefined) return undefined;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };

  const sort = single(raw.sort);
  const conditions = list(raw.condition, ',')?.filter((item): item is ListingCondition =>
    (CONDITION_OPTIONS as readonly string[]).includes(item),
  );

  return {
    q: single(raw.q),
    category: single(raw.category),
    province: single(raw.province),
    city: single(raw.city),
    minPrice: numeric(raw.minPrice),
    maxPrice: numeric(raw.maxPrice),
    condition: conditions && conditions.length > 0 ? conditions : undefined,
    sort:
      sort && (SORT_OPTIONS as readonly string[]).includes(sort)
        ? (sort as SortOption)
        : undefined,
    filter: list(raw.filter, FILTER_SEPARATOR),
  };
}
