/**
 * Sell wizard — cache glue between mutations and query state (§43).
 *
 * Every listing/media mutation answers with the refreshed `OwnerListingDto`;
 * `syncOwnerListing` seeds the owner read so the next step renders instantly
 * and refreshes the discovery surfaces in the background. The draft version
 * itself is updated by the caller via `mergeOwnerListing`.
 */

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api';
import type { OwnerListing } from '../types';

/** Seed `GET /me/listings/{id}` with fresh data and refresh listing views. */
export function syncOwnerListing(queryClient: QueryClient, listing: OwnerListing): void {
  queryClient.setQueryData(queryKeys.listings.owner(listing.id), listing);
  void queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
}
