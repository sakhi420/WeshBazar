'use client';

/**
 * Edit Listing hooks (§42): the owner record query, the diff save and the
 * resubmission command.
 *
 * Every mutation answers with the refreshed `OwnerListingDto`, so cache sync
 * reuses the §43 helper; a version conflict re-reads the single record so the
 * next save diffs against server truth instead of a stale seed.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import { fetchMyListing, submitListing, updateListing } from '../api';
import { shouldRefreshOwnerListing, syncOwnerListing } from '../sell';
import type { OwnerListing, UpdateListingPayload } from '../types';

/** Owner single-listing read for the edit page (enabled only when authed). */
export function useOwnerListingEditor(listingId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.listings.owner(listingId),
    queryFn: () => fetchMyListing(listingId),
    enabled,
    staleTime: 30_000,
  });
}

export interface SaveListingEditVariables {
  listingId: string;
  payload: UpdateListingPayload;
}

/** `PATCH /listings/{id}` with the shared owner-listing cache sync. */
export function useSaveListingEdit() {
  const queryClient = useQueryClient();

  return useMutation<OwnerListing, ApiError, SaveListingEditVariables>({
    mutationFn: ({ listingId, payload }) => updateListing(listingId, payload),
    onSuccess: (listing) => {
      syncOwnerListing(queryClient, listing);
    },
    onError: (error, variables) => {
      if (shouldRefreshOwnerListing(error)) {
        void fetchMyListing(variables.listingId)
          .then((listing) => syncOwnerListing(queryClient, listing))
          .catch(() => undefined);
      }
    },
  });
}

export interface SubmitListingEditVariables {
  listingId: string;
  expectedVersion: number;
}

/** `POST /listings/{id}/submit` — DRAFT/REJECTED → review (or live). */
export function useSubmitListingEdit() {
  const queryClient = useQueryClient();

  return useMutation<OwnerListing, ApiError, SubmitListingEditVariables>({
    mutationFn: ({ listingId, expectedVersion }) => submitListing(listingId, expectedVersion),
    onSuccess: (listing) => {
      syncOwnerListing(queryClient, listing);
    },
    onError: (error, variables) => {
      if (shouldRefreshOwnerListing(error)) {
        void fetchMyListing(variables.listingId)
          .then((listing) => syncOwnerListing(queryClient, listing))
          .catch(() => undefined);
      }
    },
  });
}
