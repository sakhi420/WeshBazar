/**
 * Listings feature — data access (master prompt §6, §21–23).
 *
 * Public discovery + detail reads. Contact reveal lives in `features/contacts`;
 * report submission lives in `features/reports` — both build on the shared API
 * boundary, never raw fetch.
 */

import { get, getCursorPage, patch, post, serverGet, serverGetCursorPage } from '@/lib/api';
import type { CursorPage, Query } from '@/lib/api';
import type {
  CreateListingPayload,
  DiscoveryQuery,
  FacetCount,
  OwnerListing,
  OwnerListingStatus,
  OwnerListingSummary,
  PublicListingDetail,
  PublicListingSummary,
  UpdateListingPayload,
} from './types';

const LOCALE = 'fa-AF';

/**
 * Map the view-model query onto wire parameters (frontend-api-contract.md §7).
 * Written field-by-field so a rename fails to compile here first, and so no
 * empty-string/undefined noise reaches the URL builder.
 */
function discoveryParams(query: DiscoveryQuery): Query {
  return {
    locale: query.locale ?? LOCALE,
    q: query.q,
    category: query.category,
    province: query.province,
    city: query.city,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    condition: query.condition,
    sort: query.sort,
    filter: query.filter,
    cursor: query.cursor,
    limit: query.limit,
  };
}

/** Server Component: first page of a discovery query (cursor-paginated). */
export function fetchListingsServer(
  query: DiscoveryQuery = {},
): Promise<CursorPage<PublicListingSummary>> {
  return serverGetCursorPage<PublicListingSummary>('/listings', {
    query: discoveryParams(query),
    revalidate: 30,
    tags: ['listings'],
  });
}

/** Browser: one page of a discovery query (first page + `load more` cursor). */
export function fetchListings(
  query: DiscoveryQuery = {},
  signal?: AbortSignal,
): Promise<CursorPage<PublicListingSummary>> {
  return getCursorPage<PublicListingSummary>('/listings', {
    query: discoveryParams(query),
    signal,
  });
}

/** Browser: facet counts for the filter panel (`GET /listings/facets`). */
export function fetchListingFacets(
  query: DiscoveryQuery = {},
  signal?: AbortSignal,
): Promise<Record<string, FacetCount[]>> {
  return get<Record<string, FacetCount[]>>('/listings/facets', {
    query: discoveryParams(query),
    signal,
  });
}

/** Server Component: public listing detail by slug. */
export function fetchListingDetailServer(slug: string): Promise<PublicListingDetail> {
  return serverGet<PublicListingDetail>(`/listings/${encodeURIComponent(slug)}`, {
    query: { locale: LOCALE },
    revalidate: 60,
    tags: ['listings', `listing:${slug}`],
  });
}

/** Browser: public listing detail by slug (client-side navigations). */
export function fetchListingDetail(slug: string): Promise<PublicListingDetail> {
  return get<PublicListingDetail>(`/listings/${encodeURIComponent(slug)}`, {
    query: { locale: LOCALE },
  });
}

// --- Owner-side (sell flow §34–§41) ------------------------------------------

/**
 * Create a listing draft (`POST /listings`, §45). All required CreateListingDto
 * fields must be present; the verified-phone gate applies at submission only.
 */
export function createListing(payload: CreateListingPayload): Promise<OwnerListing> {
  return post<OwnerListing>('/listings', payload);
}

/**
 * Edit a listing (`PATCH /listings/{id}`). Send the last known `version` as
 * `expectedVersion`; material edits may re-enter review under the backend
 * state machine (§42).
 */
export function updateListing(id: string, payload: UpdateListingPayload): Promise<OwnerListing> {
  return patch<OwnerListing>(`/listings/${encodeURIComponent(id)}`, payload);
}

/**
 * Submit for review (`POST /listings/{id}/submit`) — publishes immediately
 * under AUTO_APPROVE categories (§45). Fails with PHONE_NOT_VERIFIED until
 * the seller's phone is verified.
 */
export function submitListing(id: string, expectedVersion: number): Promise<OwnerListing> {
  return post<OwnerListing>(`/listings/${encodeURIComponent(id)}/submit`, { expectedVersion });
}

/** Owner single-listing read (`GET /me/listings/{id}`) — wizard sync + preview. */
export function fetchMyListing(id: string): Promise<OwnerListing> {
  return get<OwnerListing>(`/me/listings/${encodeURIComponent(id)}`);
}

/**
 * One cursor page of the seller's own listings (`GET /me/listings`, §31).
 * `status` filters the queue; rows are lightweight `OwnerListingSummaryDto`s.
 */
export function fetchMyListingsPage(options: {
  status?: OwnerListingStatus;
  cursor?: string;
  limit?: number;
}): Promise<CursorPage<OwnerListingSummary>> {
  return getCursorPage<OwnerListingSummary>('/me/listings', {
    query: {
      locale: LOCALE,
      status: options.status,
      cursor: options.cursor,
      limit: options.limit ?? 20,
    },
  });
}

/**
 * Renew (`POST /listings/{id}/renew`, §70): extends an ACTIVE listing's
 * runway or republishes an ARCHIVED one (returns it to DRAFT for review).
 */
export function renewListing(id: string, expectedVersion: number): Promise<OwnerListing> {
  return post<OwnerListing>(`/listings/${encodeURIComponent(id)}/renew`, { expectedVersion });
}

/** Mark sold (`POST /listings/{id}/mark-sold`): ACTIVE → SOLD, final. */
export function markListingSold(id: string, expectedVersion: number): Promise<OwnerListing> {
  return post<OwnerListing>(`/listings/${encodeURIComponent(id)}/mark-sold`, { expectedVersion });
}

/** Archive (`POST /listings/{id}/archive`): ACTIVE → ARCHIVED. */
export function archiveListing(id: string, expectedVersion: number): Promise<OwnerListing> {
  return post<OwnerListing>(`/listings/${encodeURIComponent(id)}/archive`, { expectedVersion });
}
