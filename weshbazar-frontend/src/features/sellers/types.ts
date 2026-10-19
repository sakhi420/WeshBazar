/**
 * Sellers feature — view models (master prompt §24).
 * Mirror of PublicSellerProfileDto (docs/openapi.json). Do not invent fields.
 *
 * Contract note: `GET /sellers/{slug}` returns the profile; the seller's live
 * ACTIVE listings come from `GET /sellers/{slug}/listings` (cursor-paginated).
 */

/** `PublicSellerProfileDto` — public seller profile. */
export interface PublicSellerProfile {
  slug: string;
  displayName: string;
  bio: string | null;
  memberSince: string;
  phoneVerified: boolean;
  /** Number of ACTIVE listings at response time. */
  activeListingCount: number;
  /** Public URL of the seller avatar image, null when none set. */
  avatarUrl: string | null;
}
