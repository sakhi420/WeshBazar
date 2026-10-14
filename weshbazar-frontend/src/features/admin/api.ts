/**
 * Admin feature — data access (master prompt §43–44).
 *
 * Thin wrappers over the API client; the only place the admin endpoints are
 * called. Reads need ANALYTICS_READ / LISTING_REVIEW and each command carries
 * its own permission — the backend stays authoritative (§42).
 */

import { get, getPage, patch, del, post, type PageResult } from '@/lib/api';
import type {
  AdminDashboard,
  AdminListingDetail,
  AdminListingItem,
  AdminListingsQuery,
  AdminReportItem,
  AdminReportsQuery,
  AdminUserItem,
  AdminUsersQuery,
  AdminCategoryItem,
  AdminProvinceItem,
  AdminCityItem,
  AdminAuditLogItem,
  AdminAuditQuery,
  AdminAttributeItem,
  AdminAttributeOptionItem,
  MarketplaceSummary,
  CreateProvincePayload,
  UpdateProvincePayload,
  CreateCityPayload,
  UpdateCityPayload,
  CreateAttributePayload,
  UpdateAttributePayload,
  CreateOptionPayload,
  UpdateOptionPayload,
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

// --- Reports queue ----------------------------------------------------------

export function fetchAdminReports(
  params: AdminReportsQuery = {},
): Promise<PageResult<AdminReportItem>> {
  return getPage<AdminReportItem>(`${ADMIN_BASE}/reports`, {
    query: {
      status: params.status,
      page: params.page,
      limit: params.limit,
    },
  });
}

/** Resolve a report — the reported listing has been dealt with. */
export function resolveReport(id: string, payload: { note: string }): Promise<AdminReportItem> {
  return post<AdminReportItem>(`${ADMIN_BASE}/reports/${id}/resolve`, payload);
}

/** Dismiss a report — no action needed on the listing. */
export function dismissReport(id: string, payload: { note: string }): Promise<AdminReportItem> {
  return post<AdminReportItem>(`${ADMIN_BASE}/reports/${id}/dismiss`, payload);
}

// --- User management --------------------------------------------------------

export function fetchAdminUsers(
  params: AdminUsersQuery = {},
): Promise<PageResult<AdminUserItem>> {
  return getPage<AdminUserItem>(`${ADMIN_BASE}/users`, {
    query: {
      q: params.q,
      role: params.role,
      status: params.status,
      page: params.page,
      limit: params.limit,
    },
  });
}

/** Suspend: reason required, optional until date. */
export function suspendUser(id: string, payload: { reason: string; until?: string }): Promise<AdminUserItem> {
  return post<AdminUserItem>(`${ADMIN_BASE}/users/${id}/suspend`, payload);
}

/** Ban: reason required. */
export function banUser(id: string, payload: { reason: string }): Promise<AdminUserItem> {
  return post<AdminUserItem>(`${ADMIN_BASE}/users/${id}/ban`, payload);
}

/** Restore from suspended or banned. */
export function restoreUser(id: string): Promise<AdminUserItem> {
  return post<AdminUserItem>(`${ADMIN_BASE}/users/${id}/restore`);
}

// --- Taxonomy ---------------------------------------------------------------

export function fetchAdminCategories(): Promise<AdminCategoryItem[]> {
  return get<AdminCategoryItem[]>(`${ADMIN_BASE}/categories`);
}

export function createCategory(
  payload: { translations: Array<{ locale: string; name: string; description?: string }>; parentId?: string | null; slug?: string; sortOrder?: number },
): Promise<AdminCategoryItem> {
  return post<AdminCategoryItem>(`${ADMIN_BASE}/categories`, payload);
}

export function updateCategory(
  id: string,
  payload: { translations?: Array<{ locale: string; name: string; description?: string }>; parentId?: string | null; slug?: string; status?: string; sortOrder?: number },
): Promise<AdminCategoryItem> {
  return patch<AdminCategoryItem>(`${ADMIN_BASE}/categories/${id}`, payload);
}

export function deleteCategory(id: string): Promise<void> {
  return del<void>(`${ADMIN_BASE}/categories/${id}`);
}
// --- Locations ----------------------------------------------------------------

export function fetchAdminProvinces(): Promise<AdminProvinceItem[]> {
  return get<AdminProvinceItem[]>(`${ADMIN_BASE}/provinces`);
}

export function createProvince(
  payload: CreateProvincePayload,
): Promise<AdminProvinceItem> {
  return post<AdminProvinceItem>(`${ADMIN_BASE}/provinces`, payload);
}

export function updateProvince(
  id: string,
  payload: UpdateProvincePayload,
): Promise<AdminProvinceItem> {
  return patch<AdminProvinceItem>(`${ADMIN_BASE}/provinces/${id}`, payload);
}

export function deleteProvince(id: string): Promise<void> {
  return del<void>(`${ADMIN_BASE}/provinces/${id}`);
}

export function fetchAdminCities(provinceId: string): Promise<AdminCityItem[]> {
  return get<AdminCityItem[]>(`${ADMIN_BASE}/provinces/${provinceId}/cities`);
}

export function createCity(
  provinceId: string,
  payload: CreateCityPayload,
): Promise<AdminCityItem> {
  return post<AdminCityItem>(`${ADMIN_BASE}/provinces/${provinceId}/cities`, payload);
}

export function updateCity(
  id: string,
  payload: UpdateCityPayload,
): Promise<AdminCityItem> {
  return patch<AdminCityItem>(`${ADMIN_BASE}/cities/${id}`, payload);
}

export function deleteCity(id: string): Promise<void> {
  return del<void>(`${ADMIN_BASE}/cities/${id}`);
}

// --- Audit --------------------------------------------------------------------

export function fetchAuditLogs(
  params: AdminAuditQuery = {},
): Promise<PageResult<AdminAuditLogItem>> {
  return getPage<AdminAuditLogItem>(`${ADMIN_BASE}/audit-logs`, {
    query: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorUserId: params.actorUserId,
      page: params.page,
      limit: params.limit,
    },
  });
}

// --- Taxonomy attributes/options ----------------------------------------------

export function fetchAttributes(categoryId: string): Promise<AdminAttributeItem[]> {
  return get<AdminAttributeItem[]>(`${ADMIN_BASE}/categories/${categoryId}/attributes`);
}

export function createAttribute(
  categoryId: string,
  payload: CreateAttributePayload,
): Promise<AdminAttributeItem> {
  return post<AdminAttributeItem>(`${ADMIN_BASE}/categories/${categoryId}/attributes`, payload);
}

export function updateAttribute(
  id: string,
  payload: UpdateAttributePayload,
): Promise<AdminAttributeItem> {
  return patch<AdminAttributeItem>(`${ADMIN_BASE}/attributes/${id}`, payload);
}

export function deleteAttribute(id: string): Promise<void> {
  return del<void>(`${ADMIN_BASE}/attributes/${id}`);
}

export function createOption(
  attributeId: string,
  payload: CreateOptionPayload,
): Promise<AdminAttributeOptionItem> {
  return post<AdminAttributeOptionItem>(`${ADMIN_BASE}/attributes/${attributeId}/options`, payload);
}

export function updateOption(
  id: string,
  payload: UpdateOptionPayload,
): Promise<AdminAttributeOptionItem> {
  return patch<AdminAttributeOptionItem>(`${ADMIN_BASE}/options/${id}`, payload);
}

export function deleteOption(id: string): Promise<void> {
  return del<void>(`${ADMIN_BASE}/options/${id}`);
}
