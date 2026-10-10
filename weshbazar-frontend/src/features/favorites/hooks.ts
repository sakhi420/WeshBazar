'use client';

/**
 * Favorites hooks (master prompt §30, §43–§44, §112).
 *
 * `favorites.ids` holds the saved-listing id set that drives every save
 * button; the toggle mutation updates it optimistically and converges on the
 * server's answer for the conflict codes (error-map §3.8):
 * FAVORITE_ALREADY_EXISTS → saved, FAVORITE_NOT_FOUND → not saved.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, ApiErrorCode, queryKeys } from '@/lib/api';
import { addFavorite, fetchFavoriteIds, removeFavorite } from './api';

/** How long the ids set is considered fresh — refreshed on toggle + invalidation. */
const IDS_STALE_MS = 5 * 60_000;

/** Saved-listing id set for the save-button state. Enable only when authed. */
export function useFavoriteIds(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.favorites.ids,
    queryFn: fetchFavoriteIds,
    enabled,
    staleTime: IDS_STALE_MS,
  });
}

export interface FavoriteToggleVariables {
  listingId: string;
  /** The desired end state: true = saved, false = removed. */
  nextSaved: boolean;
}

/** Snapshot of the pre-click ids set, for rollback when the toggle fails. */
interface FavoriteToggleContext {
  previous: string[] | undefined;
}

export function useFavoriteToggle() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, FavoriteToggleVariables, FavoriteToggleContext>({
    mutationFn: async ({ listingId, nextSaved }) => {
      if (nextSaved) {
        await addFavorite(listingId);
      } else {
        await removeFavorite(listingId);
      }
    },
    onMutate: async ({ listingId, nextSaved }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.ids });
      const previous = queryClient.getQueryData<string[]>(queryKeys.favorites.ids);
      if (previous) {
        const set = new Set(previous);
        if (nextSaved) set.add(listingId);
        else set.delete(listingId);
        queryClient.setQueryData(queryKeys.favorites.ids, Array.from(set));
      }
      return { previous };
    },
    onError: (error, variables, context) => {
      // Converge to server truth for the idempotent conflict codes.
      if (error instanceof ApiError && error.code === ApiErrorCode.FAVORITE_ALREADY_EXISTS) {
        queryClient.setQueryData<string[]>(queryKeys.favorites.ids, (current) =>
          current ? Array.from(new Set([...current, variables.listingId])) : current,
        );
        return;
      }
      if (error instanceof ApiError && error.code === ApiErrorCode.FAVORITE_NOT_FOUND) {
        queryClient.setQueryData<string[]>(queryKeys.favorites.ids, (current) =>
          current ? current.filter((id) => id !== variables.listingId) : current,
        );
        return;
      }
      // Anything else rolls back to the pre-click set.
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.favorites.ids, context.previous);
      }
    },
    onSettled: () => {
      // Keep any visible favorites list in sync; the ids set already converged.
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.listRoot });
    },
  });
}
