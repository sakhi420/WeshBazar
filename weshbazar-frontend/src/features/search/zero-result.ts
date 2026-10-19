/**
 * Zero-result recovery + honest result count (fix plan — Phase 3).
 *
 * Server-Component safe by design: no client hooks, no `use client`. It only
 * reads one `DiscoveryQuery` and returns plain data the pages render as links.
 *
 * Contract note: the public discovery feed is **cursor-paginated** with meta
 * `{ nextCursor, hasMore, limit }` (frontend-api-contract.md §6.1). The frozen
 * `GET /listings` response carries NO `total`, so a true total count (3.2) and
 * facet counts (3.3/3.4) are blocked on a backend contract change. What we can
 * do without inventing an endpoint:
 *
 *  - Offer meaningful recovery steps on a zero-result search (3.1) instead of
 *    a lone "clear filters" button.
 *  - Render an honest count that never claims a total the API does not return
 *    (partial 3.2): "بیش از N آگهی" while `hasMore`, exact `N` otherwise.
 */

import type { DiscoveryQuery } from '@/features/listings';
import { FILTER_SEPARATOR } from './params';

/** One recovery suggestion rendered as a link/button. */
export interface ZeroResultAction {
  label: string;
  href: string;
}

/**
 * Serialize a discovery query back into a URL query string. This is the exact
 * inverse of `parseDiscoverySearchParams` + `toDiscoveryQuery`: only the frozen
 * wire parameter names are emitted (`q`, `category`, `province`, `city`,
 * `minPrice`, `maxPrice`, `condition`, `sort`, `filter`).
 */
export function discoveryHref(path: string, query: DiscoveryQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.province) params.set('province', query.province);
  if (query.city) params.set('city', query.city);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  if (query.condition?.length) params.set('condition', query.condition.join(','));
  if (query.sort) params.set('sort', query.sort);
  if (query.filter?.length) params.set('filter', query.filter.join(FILTER_SEPARATOR));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function hasQuery(query: DiscoveryQuery): boolean {
  return Boolean(query.q && query.q.trim().length > 0);
}

function hasCategory(query: DiscoveryQuery): boolean {
  return Boolean(query.category);
}

/** True when any non-keyword facet is active (mirrors `countActiveFilters`). */
function hasFacets(query: DiscoveryQuery): boolean {
  return Boolean(
    query.province ||
      query.city ||
      query.minPrice !== undefined ||
      query.maxPrice !== undefined ||
      (query.condition && query.condition.length > 0) ||
      (query.filter && query.filter.length > 0),
  );
}

function dropFacets(query: DiscoveryQuery): DiscoveryQuery {
  const next: DiscoveryQuery = { ...query };
  delete next.province;
  delete next.city;
  delete next.minPrice;
  delete next.maxPrice;
  delete next.condition;
  delete next.filter;
  return next;
}

export interface ZeroResultContext {
  /** The pathname that "clear all" should land on within the current surface. */
  basePath: string;
  /** True on the category surface, where the route owns `category`. */
  categoryOwnedByRoute: boolean;
}

/**
 * Ordered, de-duplicated recovery suggestions for a zero-result discovery.
 * More surgical suggestions come first (widen category → keep keyword → keep
 * filters), and the full "clear all" reset is always last. Callers render the
 * list as links; the final item is the guaranteed escape hatch.
 */
export function buildZeroResultRecovery(
  query: DiscoveryQuery,
  ctx: ZeroResultContext,
): ZeroResultAction[] {
  const actions: ZeroResultAction[] = [];
  const seen = new Set<string>();

  const push = (label: string, href: string) => {
    if (seen.has(href)) return;
    seen.add(href);
    actions.push({ label, href });
  };

  /** Serialize for the current surface, dropping the route-owned category. */
  const surfaceHref = (q: DiscoveryQuery): string => {
    const cleaned: DiscoveryQuery = { ...q };
    if (ctx.categoryOwnedByRoute) delete cleaned.category;
    return discoveryHref(ctx.basePath, cleaned);
  };

  /** Widen to the global search surface (`/search`), always dropping category. */
  const widenedHref = (q: DiscoveryQuery): string => {
    const cleaned: DiscoveryQuery = { ...q };
    delete cleaned.category;
    return discoveryHref('/search', cleaned);
  };

  const q = hasQuery(query);
  const facets = hasFacets(query);

  // 1. Widen from a category page to a global search (keep the keyword).
  if (ctx.categoryOwnedByRoute) {
    push('دیدن در همهٔ دسته‌ها', widenedHref(dropFacets(query)));
  }

  // 2. Keep the keyword, drop the restrictive geo/price/condition/attribute facets.
  if (q && facets) {
    push('حذف فیلترها و نگه‌داشتن جست‌وجو', surfaceHref(dropFacets(query)));
  }

  // 3. Keep the filters, drop the keyword — only when dropping it still leaves
  //    a meaningful constraint (facets, or a category on the search surface).
  if (q && (facets || (hasCategory(query) && !ctx.categoryOwnedByRoute))) {
    const withoutQuery: DiscoveryQuery = { ...query };
    delete withoutQuery.q;
    push('جست‌وجو بدون کلیدواژه', surfaceHref(withoutQuery));
  }

  // 4. Full reset of the current surface (always unique by construction).
  push('پاک کردن همهٔ فیلترها', surfaceHref({}));

  return actions.slice(0, 4);
}

/**
 * Honest result-count label. Prefers the server's exact `total`; when the
 * server did not provide one, falls back to the contract-honest "more than N"
 * label for incomplete pages.
 */
export function formatResultCount(length: number, hasMore: boolean, total?: number): string {
  if (total !== undefined && total !== null) return `${total} آگهی پیدا شد`;
  if (hasMore) return `بیش از ${length} آگهی پیدا شد`;
  return `${length} آگهی پیدا شد`;
}