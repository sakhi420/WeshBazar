/**
 * Admin feature — data access (master prompt §43–44).
 *
 * Thin wrappers over the API client; the only place the admin endpoints are
 * called. Reads need ANALYTICS_READ / LISTING_REVIEW and each command carries
 * its own permission — the backend stays authoritative (§42).
 */

import { get, getPage, post, type PageResult } from '@/lib/api';
import type {
  AdminDashboard,
  AdminListingDetail,
  AdminListingItem,
  AdminListingsQuery,
  MarketplaceSummary,
} from './types';

const ADMIN_BASE = '/admin';

/** Dashboard counters: users, listings by status, reports. */
export function fetchAdminDashboard(): Promise<AdminDashboard> {
  return get<AdminDashboard>(`${ADMIN_BASE}/dashboard`);
}

/**
 * Marketplace summary for the server default range (the last 30 days):
 * daily series + engagement totals.
 */
export function fetchMarketplaceSummary(): Promise<MarketplaceSummary> {
  return get<MarketplaceSummary>(`${ADMIN_BASE}/analytics/summary`);
}

// --- Listing moderation queue (§44) ------------------------------------------

/** Page-paginated moderation queue; the backend defaults to PENDING_REVIEW FIFO. */
export function fetchAdminListings(
  params: AdminListingsQuery = {},
): Promise<PageResult<AdminListingItem>> {
  return getPage<AdminListingItem>(`${ADMIN_BASE}/listings`, {
    query: {
      status: params.status,
      reported: params.reported,
      categoryId: params.categoryId,
      sellerAccountId: params.sellerAccountId,
      q: params.q,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    },
  });
}

/** Any-state detail read with the moderation trail. */
export function fetchAdminListing(id: string): Promise<AdminListingDetail> {
  return get<AdminListingDetail>(`${ADMIN_BASE}/listings/${id}`);
}

/**
 * The four moderation commands (§44/§58/§106). Each returns the refreshed
 * owner listing; callers refetch the queue instead of caching the response.
 */
export function approveAdminListing(id: string, note?: string): Promise<unknown> {
  return post<unknown>(`${ADMIN_BASE}/listings/${id}/approve`, { note });
}

export function rejectAdminListing(
  id: string,
  payload: { reason: string; note?: string },
): Promise<unknown> {
  return post<unknown>(`${ADMIN_BASE}/listings/${id}/reject`, {
    reason: payload.reason,
    note: payload.note,
  });
}

export function archiveAdminListing(id: string, note?: string): Promise<unknown> {
  return post<unknown>(`${ADMIN_BASE}/listings/${id}/archive`, { note });
}

export function restoreAdminListing(id: string, note?: string): Promise<unknown> {
  return post<unknown>(`${ADMIN_BASE}/listings/${id}/restore`, { note });
}
