'use client';

/**
 * Admin queries (master prompt §43–44).
 *
 * Dashboard reads plus the moderation queue, detail and commands. `enabled`
 * keeps every query silent until the session gate has resolved to a
 * moderator/admin, so a guest never triggers a guaranteed 401/403.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type ApiError } from '@/lib/api';
import {
  approveAdminListing,
  archiveAdminListing,
  fetchAdminDashboard,
  fetchAdminListing,
  fetchAdminListings,
  fetchAdminReports,
  fetchAdminUsers,
  fetchAdminCategories,
  fetchMarketplaceSummary,
  rejectAdminListing,
  resolveReport,
  dismissReport,
  restoreAdminListing,
  createCategory,
  updateCategory,
  deleteCategory,
  suspendUser,
  banUser,
  restoreUser,
} from './api';
import type {
  AdminListingsQuery,
  AdminReportItem,
  AdminReportsQuery,
  AdminUsersQuery,
  ModerationAction,
} from './types';

/** Dashboard counters (users, listings, reports). */
export function useAdminDashboard(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: fetchAdminDashboard,
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

/** 30-day marketplace summary (daily series + engagement totals). */
export function useMarketplaceSummary(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.summary,
    queryFn: fetchMarketplaceSummary,
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

/** Page-paginated moderation queue — previous page stays visible while paging. */
export function useAdminListings(params: AdminListingsQuery, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.listings(params),
    queryFn: () => fetchAdminListings(params),
    enabled,
    staleTime: 15_000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

/** Detail read for one expanded queue row (moderation trail included). */
export function useAdminListingDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.listing(id ?? ''),
    queryFn: () => fetchAdminListing(id as string),
    enabled: enabled && id !== null,
    staleTime: 30_000,
    retry: false,
  });
}

export interface ModerationVariables {
  listingId: string;
  action: ModerationAction;
  /** Required for REJECT — a machine-readable reason (§44/§58). */
  reason?: string;
  note?: string;
}

/**
 * The four moderation commands. The whole admin key prefix is invalidated on
 * settle: the row may have moved on (409), someone else may have acted, and
 * `permittedActions` must reflect server truth before the next click.
 */
export function useListingModeration() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, ModerationVariables>({
    mutationFn: async ({ listingId, action, reason, note }) => {
      if (action === 'APPROVE') await approveAdminListing(listingId, note);
      else if (action === 'REJECT')
        await rejectAdminListing(listingId, { reason: reason ?? '', note });
      else if (action === 'ARCHIVE') await archiveAdminListing(listingId, note);
      else await restoreAdminListing(listingId, note);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

// --- Reports queue ---------------------------------------------------------

export function useAdminReports(params: AdminReportsQuery, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.reports(params),
    queryFn: () => fetchAdminReports(params),
    enabled,
    staleTime: 15_000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation<AdminReportItem, ApiError, { id: string; payload: { note: string } }>({
    mutationFn: ({ id, payload }) => resolveReport(id, payload),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

export function useDismissReport() {
  const qc = useQueryClient();
  return useMutation<AdminReportItem, ApiError, { id: string; payload: { note: string } }>({
    mutationFn: ({ id, payload }) => dismissReport(id, payload),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

// --- User management -------------------------------------------------------

export function useAdminUsers(params: AdminUsersQuery, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => fetchAdminUsers(params),
    enabled,
    staleTime: 15_000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

// --- Taxonomy --------------------------------------------------------------

export function useAdminCategories(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: fetchAdminCategories,
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSettled: () => { void qc.invalidateQueries({ queryKey: queryKeys.admin.categories }); },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCategory>[1] }) => updateCategory(id, payload),
    onSettled: () => { void qc.invalidateQueries({ queryKey: queryKeys.admin.categories }); },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSettled: () => { void qc.invalidateQueries({ queryKey: queryKeys.admin.categories }); },
  });
}

// --- User management mutations --------------------------------------------

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof suspendUser>[1] }) => suspendUser(id, payload),
    onSettled: () => { void qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof banUser>[1] }) => banUser(id, payload),
    onSettled: () => { void qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });
}

export function useRestoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreUser,
    onSettled: () => { void qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });
}
