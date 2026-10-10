/**
 * Favorites feature types (master prompt §30, §43–§44).
 * Mirrors the frozen OpenAPI schemas: FavoriteItemDto, FavoriteListingSummaryDto
 * and FavoriteViewDto. Saved listings are always ACTIVE or SOLD.
 */

import type { ListingCondition } from '@/lib/api';
import type {
  ListingImage,
  ListingRef,
  PricingType,
  PublicListingStatus,
} from '@/features/listings';

/** `FavoriteListingSummaryDto` — reduced listing card data for saved items. */
export interface FavoriteListingSummary {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  pricingType: PricingType;
  negotiable: boolean;
  condition: ListingCondition;
  category: ListingRef;
  province: ListingRef;
  city: ListingRef;
  primaryImage: ListingImage | null;
  publishedAt?: string | null;
  status: PublicListingStatus;
}

/** `FavoriteItemDto` — one saved listing with the save timestamp. */
export interface FavoriteItem {
  favoritedAt: string;
  listing: FavoriteListingSummary;
}

/** `FavoriteViewDto` — response of POST /favorites/{listingId}. */
export interface FavoriteView {
  listingId: string;
  favoritedAt: string;
}
