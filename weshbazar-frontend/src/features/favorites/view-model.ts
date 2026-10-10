/**
 * Favorites view-model helpers (master prompt §30, §112) — pure functions that
 * keep presentation components free of mapping and copy decisions, so button
 * behavior stays testable without DOM or network.
 */

import type { PublicListingSummary } from '@/features/listings';
import type { FavoriteListingSummary } from './types';

/**
 * Adapt a saved-listing DTO to the shared card view model. `status` travels
 * separately (saved listings can be SOLD) so the card keeps its public shape.
 */
export function toCardListing(listing: FavoriteListingSummary): PublicListingSummary {
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    price: listing.price,
    currency: listing.currency,
    pricingType: listing.pricingType,
    negotiable: listing.negotiable,
    condition: listing.condition,
    category: listing.category,
    province: listing.province,
    city: listing.city,
    primaryImage: listing.primaryImage,
    publishedAt: listing.publishedAt ?? null,
  };
}

/** Accessible name of the save button for the current state. */
export function favoriteAriaLabel(isFavorited: boolean): string {
  return isFavorited ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها';
}

/** Visible label on the inline (detail page) variant. */
export function favoriteInlineLabel(isFavorited: boolean): string {
  return isFavorited ? 'ذخیره شد' : 'ذخیره';
}

/** Screen-reader announcement after a successful toggle. */
export function favoriteAnnouncement(nextSaved: boolean): string {
  return nextSaved ? 'به علاقه‌مندی‌ها افزوده شد.' : 'از علاقه‌مندی‌ها حذف شد.';
}

/** Screen-reader announcement after a failed toggle. */
export function favoriteErrorAnnouncement(): string {
  return 'ذخیره‌سازی ناموفق بود؛ دوباره تلاش کنید.';
}
