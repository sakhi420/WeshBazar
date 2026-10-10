/**
 * Sellers feature — data access (master prompt §24).
 * Only `GET /sellers/{slug}` exists in the frozen contract — there is no
 * seller-listings read, and nothing here may fake one.
 */

import { get, serverGet } from '@/lib/api';
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
