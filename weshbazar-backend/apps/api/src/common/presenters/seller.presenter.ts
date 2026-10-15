/**
 * Client-safe seller projections.
 *
 * `PublicSellerProfile` is what anonymous callers see (spec §26/#109): never
 * internal IDs, phone numbers, security metadata, or moderation state.
 * `MySellerAccount` is the owner-scoped view used by `/me`.
 */
import type { SellerAccount, User } from '../../generated/prisma/client';

export interface PublicSellerProfile {
  slug: string;
  displayName: string;
  bio: string | null;
  /** User account creation date — when the member joined the marketplace. */
  memberSince: Date;
  phoneVerified: boolean;
  activeListingCount: number;
  /** Public URL of the seller's profile photo, or null when none is set. */
  avatarUrl: string | null;
}

export interface MySellerAccount {
  id: string;
  type: SellerAccount['type'];
  displayName: string;
  slug: string;
  bio: string | null;
  status: SellerAccount['status'];
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicSellerProfile(
  seller: Pick<SellerAccount, 'slug' | 'displayName' | 'bio'>,
  owner: Pick<User, 'createdAt' | 'phoneVerifiedAt'>,
  activeListingCount: number,
  avatarUrl: string | null,
): PublicSellerProfile {
  return {
    slug: seller.slug,
    displayName: seller.displayName,
    bio: seller.bio,
    memberSince: owner.createdAt,
    phoneVerified: owner.phoneVerifiedAt !== null,
    activeListingCount,
    avatarUrl,
  };
}

export function toMySellerAccount(seller: SellerAccount): MySellerAccount {
  return {
    id: seller.id,
    type: seller.type,
    displayName: seller.displayName,
    slug: seller.slug,
    bio: seller.bio,
    status: seller.status,
    createdAt: seller.createdAt,
    updatedAt: seller.updatedAt,
  };
}
