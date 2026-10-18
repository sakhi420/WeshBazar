/**
 * Shared listing row include: localized refs for presenters + ownership facts.
 *
 * Kept in its own file so both `ListingsService` (which depends on
 * `SellerAccountsService`) and `SellerAccountsService` can import it without
 * creating a listings↔sellers module cycle that breaks Nest DI metadata.
 */
import { Prisma } from '../../generated/prisma/client';

export const LISTING_ROW_INCLUDE = {
  category: { include: { translations: true } },
  province: { include: { translations: true } },
  city: { include: { translations: true } },
  sellerAccount: { select: { ownerUserId: true, status: true } },
  contactMethods: { orderBy: { type: 'asc' } },
  images: {
    where: { deletedAt: null },
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.ListingInclude;