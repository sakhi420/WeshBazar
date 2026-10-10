/**
 * Favorites feature — data access (master prompt §30, §43–§44).
 *
 * Thin wrappers over the API boundary. The ids walk is bounded on purpose:
 * it feeds the save-button state set, not the favorites page itself (which
 * paginates with a cursor like every other list).
 */

import { del, getCursorPage, post } from '@/lib/api';
import type { CursorPage } from '@/lib/api';
import type { FavoriteItem, FavoriteView } from './types';

const FAVORITES_PATH = '/me/favorites';
const FAVORITE_PATH = '/favorites';

/** Page size for the ids walk (API max is 60). */
const IDS_PAGE_LIMIT = 60;
/** Bounds the ids walk so a pathological account cannot stall the button. */
const IDS_MAX_PAGES = 5;

/** One page of saved listings, newest first (cursor pagination). */
export function fetchFavoritesPage(options: { cursor?: string; limit?: number }): Promise<
  CursorPage<FavoriteItem>
> {
  return getCursorPage<FavoriteItem>(FAVORITES_PATH, {
    query: { limit: options.limit ?? 24, cursor: options.cursor },
  });
}

/**
 * Collect saved listing ids for the save-button state set by walking up to
 * IDS_MAX_PAGES cursor pages. Ids beyond the cap resolve to "not saved" until
 * the user interacts — acceptable worst-case for very large collections.
 */
export async function fetchFavoriteIds(): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < IDS_MAX_PAGES; page += 1) {
    const result = await getCursorPage<FavoriteItem>(FAVORITES_PATH, {
      query: { limit: IDS_PAGE_LIMIT, cursor },
    });
    for (const item of result.items) ids.push(item.listing.id);
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return ids;
}

/** Save a listing (409 FAVORITE_ALREADY_EXISTS converges to "saved"). */
export function addFavorite(listingId: string): Promise<FavoriteView> {
  return post<FavoriteView>(`${FAVORITE_PATH}/${encodeURIComponent(listingId)}`);
}

/** Remove a saved listing (404 FAVORITE_NOT_FOUND converges to "not saved"). */
export function removeFavorite(listingId: string): Promise<void> {
  return del<void>(`${FAVORITE_PATH}/${encodeURIComponent(listingId)}`);
}
