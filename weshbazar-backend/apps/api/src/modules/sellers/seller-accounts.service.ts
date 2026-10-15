/**
 * Seller account lifecycle and public seller profile access (spec §25, §26).
 *
 * Every user owns at most one seller account (currently always INDIVIDUAL).
 * Listings will reference `sellerAccountId` — never raw user IDs — so future
 * business/store accounts can be introduced without touching ownership rows.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { isUniqueViolation } from '../../common/errors/prisma-errors';
import {
  toMySellerAccount,
  toPublicSellerProfile,
  type MySellerAccount,
  type PublicSellerProfile,
} from '../../common/presenters/seller.presenter';
import { isValidSlugFormat, slugSuffix, slugify } from '../../common/utils/slug.utils';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, type SellerAccount, type User } from '../../generated/prisma/client';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import { publiclyVisibleActiveListingWhere } from '../listings/listing-visibility';

/** Fields accepted when creating an individual seller account. */
type OwnerIdentity = Pick<User, 'id' | 'displayName'>;

const MAX_SLUG_ATTEMPTS = 6;

@Injectable()
export class SellerAccountsService {
  private readonly logger = new Logger(SellerAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  // --- Creation ----------------------------------------------------------------

  /**
   * Idempotent lookup-or-create for the owner's seller account. Covers users
   * created outside registration (seeded accounts, admin tooling) — never
   * throws for a missing row unless the user itself does not exist.
   *
   * NOTE: must run on a plain connection (never inside a caller transaction):
   * PostgreSQL aborts a transaction after a failed statement, so slug-retry
   * loops only work here, outside any transaction.
   */
  async ensureForOwner(userId: string): Promise<SellerAccount> {
    const existing = await this.prisma.sellerAccount.findUnique({
      where: { ownerUserId: userId },
    });
    if (existing) {
      return existing;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true },
    });
    if (!user) {
      throw new AppException('UNAUTHORIZED');
    }

    try {
      return await this.createWithUniqueSlug(user);
    } catch (error) {
      // Concurrent ensure calls race on the unique ownerUserId index: the
      // loser simply reads the winner's row.
      if (isUniqueViolation(error, 'ownerUserId')) {
        const winner = await this.prisma.sellerAccount.findUnique({
          where: { ownerUserId: userId },
        });
        if (winner) {
          return winner;
        }
      }
      throw error;
    }
  }

  private async createWithUniqueSlug(owner: OwnerIdentity): Promise<SellerAccount> {
    const base = slugify(owner.displayName) || 'seller';
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = attempt === 0 ? base : `${base}-${slugSuffix()}`;
      const taken = await this.prisma.sellerAccount.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (taken) {
        continue;
      }
      try {
        return await this.prisma.sellerAccount.create({
          data: {
            ownerUserId: owner.id,
            displayName: owner.displayName,
            slug,
          },
        });
      } catch (error) {
        // Lost a race between the pre-check and the insert — try the next
        // candidate (the failed statement taints nothing on a plain
        // connection).
        if (isUniqueViolation(error, 'slug')) {
          continue;
        }
        throw error;
      }
    }
    this.logger.error(`Could not allocate a unique seller slug for user ${owner.id}.`);
    throw new AppException('INTERNAL_ERROR');
  }

  // --- Owner-scoped reads and updates -------------------------------------------

  async getForOwner(userId: string): Promise<MySellerAccount> {
    return toMySellerAccount(await this.ensureForOwner(userId));
  }

  /**
   * Update the owner-editable seller fields. `bio` set to null clears it;
   * the slug is intentionally immutable (stable public URLs, spec §111).
   * The update itself may join the caller's transaction; the
   * lookup-or-create safety net always runs on a plain connection.
   */
  async updateForOwner(
    userId: string,
    input: { displayName?: string; bio?: string | null },
    tx?: Prisma.TransactionClient,
  ): Promise<MySellerAccount> {
    const seller = await this.ensureForOwner(userId);
    const db = tx ?? this.prisma;

    const updated = await db.sellerAccount.update({
      where: { id: seller.id },
      data: {
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
      },
    });
    return toMySellerAccount(updated);
  }

  // --- Public profile -----------------------------------------------------------

  /**
   * Public seller profile by slug. Moderated or deactivated sellers are
   * deliberately indistinguishable from missing ones (404) so moderation
   * state never leaks through the public API.
   */
  async getPublicBySlug(slug: string): Promise<PublicSellerProfile> {
    if (!isValidSlugFormat(slug)) {
      throw new AppException('SELLER_ACCOUNT_NOT_FOUND');
    }

    const seller = await this.prisma.sellerAccount.findUnique({
      where: { slug },
      include: {
        owner: {
          select: { status: true, deletedAt: true, createdAt: true, phoneVerifiedAt: true, avatarKey: true },
        },
      },
    });
    if (
      !seller ||
      seller.status !== 'ACTIVE' ||
      seller.owner.status !== 'ACTIVE' ||
      seller.owner.deletedAt !== null
    ) {
      throw new AppException('SELLER_ACCOUNT_NOT_FOUND');
    }

    // §70/§164: an expired ACTIVE listing is no longer publicly active, so it
    // must not inflate the profile count while the expiration job catches up.
    const activeListingCount = await this.prisma.listing.count({
      where: {
        sellerAccountId: seller.id,
        deletedAt: null,
        ...publiclyVisibleActiveListingWhere(new Date()),
      },
    });
    const avatarUrl = seller.owner.avatarKey ? this.storage.getPublicUrl(seller.owner.avatarKey) : null;
    return toPublicSellerProfile(seller, seller.owner, activeListingCount, avatarUrl);
  }
}
