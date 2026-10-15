/**
 * Sellers feature — view models (master prompt §24).
 * Mirror of PublicSellerProfileDto (docs/openapi.json). Do not invent fields.
 *
 * Contract note: the frozen v1.0.0 API exposes no seller-listings endpoint, so
 * the seller page renders profile data only — never a fabricated grid.
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
}
