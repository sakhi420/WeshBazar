/**
 * Favorite presenters (spec §55).
 *
 * The favorites feed reuses the public listing summary — a saved listing is
 * rendered exactly like a feed card — plus the concrete lifecycle status so
 * clients can mark sold entries. Only ACTIVE and SOLD listings ever appear
 * (§110 visibility applies to saved items too).
 */
import type { Locale } from '../utils/locale.utils';
import { type ListingWithRefs, type MediaUrlResolver } from './listing.presenter';
import { toPublicListingSummary, type PublicListingSummary } from './public-listing.presenter';

/** A saved listing; the visibility query guarantees ACTIVE or SOLD. */
export interface FavoriteListingSummary extends PublicListingSummary {
  status: 'ACTIVE' | 'SOLD';
}

export interface FavoriteItem {
  favoritedAt: Date;
  listing: FavoriteListingSummary;
}

/** POST /favorites/:listingId response — minimal echo of the saved item. */
export interface FavoriteView {
  listingId: string;
  favoritedAt: Date;
}

export function toFavoriteItem(
  row: { createdAt: Date; listing: ListingWithRefs },
  locale: Locale,
  urlFor: MediaUrlResolver,
): FavoriteItem {
  return {
    favoritedAt: row.createdAt,
    listing: {
      ...toPublicListingSummary(row.listing, locale, urlFor),
      // Rows are filtered to ACTIVE/SOLD in SQL; SOLD is the only other state.
      status: row.listing.status === 'SOLD' ? 'SOLD' : 'ACTIVE',
    },
  };
}
