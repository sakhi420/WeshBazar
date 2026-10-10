'use client';

/**
 * My Listings hooks (§31): cursor-paged owner queue + lifecycle mutations.
 *
 * Every lifecycle mutation returns the refreshed `OwnerListingDto`, so cache
 * sync reuses the §43 helper: one source of truth feeds the list, the wizard
 * and the preview. On a version conflict the single record is re-read and the
 * list invalidated, so the action buttons reflect the real status again.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import {
  archiveListing,
  fetchMyListing,
  fetchMyListingsPage,
  markListingSold,
  renewListing,
} from '../api';
import { shouldRefreshOwnerListing, syncOwnerListing } from '../sell';
import type { OwnerListing, OwnerListingStatus } from '../types';
import { MY_LISTINGS_PAGE_LIMIT } from './view-model';

/** Cursor-paged queue of the seller's own listings (enabled only when authed). */
export function useMyListings(status: OwnerListingStatus | null, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.mine({ status, limit: MY_LISTINGS_PAGE_LIMIT }),
    queryFn: ({ pageParam }) =>
      fetchMyListingsPage({
        status: status ?? undefined,
        cursor: pageParam ?? undefined,
        limit: MY_LISTINGS_PAGE_LIMIT,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    enabled,
    staleTime: 30_000,
  });
}

export type ListingLifecycleAction = 'renew' | 'mark-sold' | 'archive';

export interface ListingLifecycleVariables {
  listingId: string;
  action: ListingLifecycleAction;
  /** Last known version — the backend rejects stale commands (§43). */
  expectedVersion: number;
}

/** Renew / mark-sold / archive with the shared owner-listing cache sync. */
export function useListingLifecycle() {
  const queryClient = useQueryClient();

  return useMutation<OwnerListing, ApiError, ListingLifecycleVariables>({
    mutationFn: ({ listingId, action, expectedVersion }) => {
      if (action === 'renew') return renewListing(listingId, expectedVersion);
      if (action === 'mark-sold') return markListingSold(listingId, expectedVersion);
      return archiveListing(listingId, expectedVersion);
    },
    onSuccess: (listing) => {
      syncOwnerListing(queryClient, listing);
    },
    onError: (error, variables) => {
      // The command failed — the row may have moved on (409) or the listing
      // is gone/not owned. Refresh both the list and the single record so the
      // UI shows server truth instead of a stale status.
      void queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      if (shouldRefreshOwnerListing(error)) {
        void fetchMyListing(variables.listingId)
          .then((listing) => syncOwnerListing(queryClient, listing))
          .catch(() => undefined);
      }
    },
  });
}
