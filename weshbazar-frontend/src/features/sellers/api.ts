/**
 * Sellers feature — data access (master prompt §24 + owner decision D1).
 * `GET /sellers/{slug}` returns the profile; `GET /sellers/{slug}/listings`
 * returns the seller's ACTIVE listings (cursor-paginated).
 */

import { get, serverGet, serverGetCursorPage } from '@/lib/api';
import type { CursorPage } from '@/lib/api';
import type { PublicListingSummary } from '@/features/listings';
import type { PublicSellerProfile } from './types';

/** Server Component: public seller profile by slug. */
export function fetchSellerProfileServer(slug: string): Promise<PublicSellerProfile> {
  return serverGet<PublicSellerProfile>(`/sellers/${encodeURIComponent(slug)}`, {
    revalidate: 60,
    tags: ['sellers', `seller:${slug}`],
  });
}

/** Browser: public seller profile by slug. */
export function fetchSellerProfile(slug: string): Promise<PublicSellerProfile> {
  return get<PublicSellerProfile>(`/sellers/${encodeURIComponent(slug)}`);
}

/** Server Component: one cursor page of a seller's ACTIVE listings. */
export function fetchSellerListingsServer(
  slug: string,
  options: { cursor?: string; limit?: number; locale?: string } = {},
): Promise<CursorPage<PublicListingSummary>> {
  return serverGetCursorPage<PublicListingSummary>(`/sellers/${encodeURIComponent(slug)}/listings`, {
    query: {
      locale: options.locale ?? 'fa-AF',
      cursor: options.cursor,
      limit: options.limit,
    },
    revalidate: 60,
    tags: ['sellers', `seller:${slug}:listings`],
  });
}
