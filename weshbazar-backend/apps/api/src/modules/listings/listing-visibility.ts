/**
 * Public listing visibility policy (spec §70, §164; api-contract §152, §153).
 *
 * An ACTIVE listing whose `expiresAt` has passed is no longer visible to the
 * public *immediately* — visitors must never see an expired listing while the
 * expiration job is still queued. The scheduled job later reconciles the row
 * itself to ARCHIVED (with a SYSTEM revision); both layers agree on the same
 * predicate, so reads and writes can never disagree.
 *
 * Owner- and admin-facing views deliberately do NOT use this predicate: the
 * seller must still see status/expiresAt, and the admin dashboard counts raw
 * lifecycle states.
 */
import type { Prisma } from '../../generated/prisma/client';
import type { ListingStatus } from '../../generated/prisma/enums';

/**
 * Prisma filter for an ACTIVE listing that the public may still see. Combine
 * it with the surrounding scope conditions (`deletedAt: null`, seller account
 * ACTIVE, …) — it only pins status + runway.
 */
export function publiclyVisibleActiveListingWhere(now: Date): Prisma.ListingWhereInput {
  return {
    status: 'ACTIVE',
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

/** True when the row is ACTIVE but its runway has already elapsed. */
export function isExpiredActiveListing(
  listing: { status: ListingStatus; expiresAt: Date | null },
  now: Date,
): boolean {
  return listing.status === 'ACTIVE' && listing.expiresAt !== null && listing.expiresAt <= now;
}
