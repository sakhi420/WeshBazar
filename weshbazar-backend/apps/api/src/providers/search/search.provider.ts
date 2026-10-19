/**
 * Search provider abstraction (spec §48, §113).
 *
 * The public listing APIs talk to `SearchProvider` — never to PostgreSQL
 * search internals — so an external engine (OpenSearch) can replace the
 * infrastructure later while the application-level contract stays intact.
 *
 * Everything crossing this boundary is already whitelisted and type-coerced
 * by the discovery service (spec §34, §79): statuses come from the service's
 * visibility policy (§110), the expiry flag additionally removes ACTIVE rows
 * whose runway ended (§70), dynamic criteria are validated against category
 * attribute definitions, and all values are parameterized — the provider
 * never receives arbitrary keys, operators or SQL.
 */
import type {
  AttributeType,
  ListingCondition,
  ListingStatus,
  SellerAccountStatus,
} from '../../generated/prisma/enums';

export const SEARCH_PROVIDER = Symbol('SEARCH_PROVIDER');

/** Controlled sort list (spec §50) — clients pick from these only. */
export const SEARCH_SORTS = ['newest', 'price_asc', 'price_desc', 'most_viewed'] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];

/** Operations a dynamic attribute criterion may carry (spec §34). */
export type SearchFilterOperation = 'eq' | 'contains' | 'gte' | 'lte' | 'in';

/**
 * A whitelisted dynamic attribute criterion. `type` decides how the stored
 * JSONB value is compared; `values` holds one entry for scalar operations
 * and one or more for `in`.
 */
export interface AttributeCriterion {
  key: string;
  operation: SearchFilterOperation;
  type: AttributeType;
  values: readonly (string | number | boolean)[];
}

/**
 * Opaque continuation anchor for a sorted feed. Exactly the fields needed by
 * the active sort are present; `price` is a decimal string so numeric
 * comparisons never lose precision. The service base64url-encodes this
 * payload for clients.
 */
export interface SearchCursor {
  sort: SearchSort;
  id: string;
  /** newest */
  createdAt?: Date;
  /** price sorts — decimal string of the anchor row's price. */
  price?: string;
  /** price sorts — the anchor row carried a NULL price. */
  priceNull?: boolean;
  /** most_viewed */
  views?: number;
}

export interface SearchCriteria {
  /** Statuses the caller's visibility policy allows (§110). */
  statuses: readonly ListingStatus[];
  /**
   * Seller-account states whose listings stay visible; null disables the
   * check (admin tooling). Filtering here — not only at hydration — keeps
   * hidden listings out of pagination windows.
   */
  sellerStatuses: readonly SellerAccountStatus[] | null;
  /**
   * Hides ACTIVE rows whose `expiresAt` has passed (spec §70, §164): the
   * public feed must never show an expired listing, even before the
   * expiration job flips its status. Non-ACTIVE statuses are unaffected.
   */
  excludeExpiredActive: boolean;
  /** Category subtree ids; null means "any category". */
  categoryIds: readonly string[] | null;
  provinceId: string | null;
  cityId: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  conditions: readonly ListingCondition[] | null;
  attributes: readonly AttributeCriterion[];
  /** Normalized search terms; every term must match (AND). */
  terms: readonly string[];
  sort: SearchSort;
  cursor: SearchCursor | null;
  /** Maximum ids to return; providers may look ahead to compute `hasMore`. */
  limit: number;
}

export interface SearchPage {
  /** Matching listing ids in feed order. */
  ids: string[];
  hasMore: boolean;
  /** Anchor for the next page; null when this page is the last. */
  nextCursor: SearchCursor | null;
  /** Exact total matches for the criteria (ignores cursor/limit). */
  total: number;
}

export interface FacetCount {
  value: string;
  count: number;
}

/** Criteria without ordering/pagination — the WHERE/facet surface. */
export type SearchFacetCriteria = Omit<SearchCriteria, 'sort' | 'cursor' | 'limit'>;

export interface SearchProvider {
  search(criteria: SearchCriteria): Promise<SearchPage>;
  /** Facet counts for the public listing `condition` (own filter excluded). */
  countConditionFacets(criteria: SearchFacetCriteria): Promise<FacetCount[]>;
  /** Facet counts for one category attribute (own filter excluded). */
  countAttributeFacets(
    criteria: SearchFacetCriteria,
    field: string,
    kind: 'SELECT' | 'MULTI_SELECT',
  ): Promise<FacetCount[]>;
}
