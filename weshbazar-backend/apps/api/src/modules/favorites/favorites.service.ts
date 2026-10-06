/**
 * Favorites (spec §55).
 *
 * Saving is predictable under duplicates: a re-add answers 409
 * FAVORITE_ALREADY_EXISTS, backed by UNIQUE(userId, listingId) — never a
 * frontend-only check — and removing a missing favorite answers 404. The
 * denormalized `Listing.favoriteCount` fast counter (§72) and today's analytic
 * row move in the SAME transaction as the Favorite row, so they cannot drift.
 *
 * The `/me/favorites` feed applies the §110 visibility policy: saved listings
 * whose seller is not active, that were deleted, whose ACTIVE runway expired
 * (§70), or that left the public states (ACTIVE / SOLD) silently drop out.
 */
import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { isUniqueViolation } from '../../common/errors/prisma-errors';
import {
  clampLimit,
  cursorPage,
  decodeCursor,
  encodeCursor,
  type CursorPaginated,
} from '../../common/http/pagination';
import {
  toFavoriteItem,
  type FavoriteItem,
  type FavoriteView,
} from '../../common/presenters/favorite.presenter';
import type { MediaUrlResolver } from '../../common/presenters/listing.presenter';
import type { Locale } from '../../common/utils/locale.utils';
import { isUuid } from '../../common/utils/uuid.utils';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import { ListingStatsService } from '../analytics/listing-stats.service';
import {
  isExpiredActiveListing,
  publiclyVisibleActiveListingWhere,
} from '../listings/listing-visibility';
import { FavoritesQueryDto } from './dto/favorites.dto';

/** Saved rows hydrate the same refs/gallery as public feed cards. */
const FAVORITE_ROW_INCLUDE = {
  listing: {
    include: {
      category: { include: { translations: true } },
      province: { include: { translations: true } },
      city: { include: { translations: true } },
      images: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  },
} satisfies Prisma.FavoriteInclude;

@Injectable()
export class FavoritesService {
  private readonly mediaUrl: MediaUrlResolver = (storageKey: string) =>
    this.storage.getPublicUrl(storageKey);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: ListingStatsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** Save a listing; only publicly visible ACTIVE listings can be favorited. */
  async add(userId: string, listingId: string): Promise<FavoriteView> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        deletedAt: true,
        sellerAccount: { select: { status: true } },
      },
    });
    if (!listing || listing.deletedAt !== null || listing.sellerAccount.status !== 'ACTIVE') {
      throw new AppException('LISTING_NOT_FOUND');
    }
    // §70/§164: an expired ACTIVE listing is no longer publicly visible, so it
    // cannot be saved even before the expiration job flips it to ARCHIVED.
    if (listing.status !== 'ACTIVE' || isExpiredActiveListing(listing, new Date())) {
      throw new AppException('LISTING_NOT_ACTIVE');
    }

    return this.prisma.$transaction(async (tx) => {
      try {
        const favorite = await tx.favorite.create({ data: { userId, listingId } });
        await tx.listing.update({
          where: { id: listingId },
          data: { favoriteCount: { increment: 1 } },
        });
        await this.stats.record(listingId, 'favoriteAdds', favorite.createdAt, tx);
        return { listingId, favoritedAt: favorite.createdAt };
      } catch (error) {
        // The unique constraint is the arbiter — concurrent re-adds lose here.
        if (isUniqueViolation(error, 'Favorite_userId_listingId_key')) {
          throw new AppException('FAVORITE_ALREADY_EXISTS');
        }
        throw error;
      }
    });
  }

  async remove(userId: string, listingId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const result = await tx.favorite.deleteMany({ where: { userId, listingId } });
      if (result.count === 0) {
        throw new AppException('FAVORITE_NOT_FOUND');
      }
      // Guarded decrement respects CHECK (favoriteCount >= 0).
      await tx.listing.updateMany({
        where: { id: listingId, favoriteCount: { gte: 1 } },
        data: { favoriteCount: { decrement: 1 } },
      });
    });
  }

  /** The user's saved listings, newest save first (§55). */
  async listForUser(
    userId: string,
    query: FavoritesQueryDto,
    locale: Locale,
  ): Promise<CursorPaginated<FavoriteItem>> {
    const limit = clampLimit(query.limit, 24, 60);
    const cursor = this.decodeFavoriteCursor(query.cursor);

    const now = new Date();
    const where: Prisma.FavoriteWhereInput = {
      userId,
      listing: {
        deletedAt: null,
        sellerAccount: { status: 'ACTIVE' },
        // §70/§164: SOLD stays reachable (saved for reference), ACTIVE only
        // while its runway lasts — expired rows drop out immediately.
        OR: [{ status: 'SOLD' }, publiclyVisibleActiveListingWhere(now)],
      },
    };
    if (cursor !== null) {
      where.OR = [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ];
    }

    const rows = await this.prisma.favorite.findMany({
      where,
      include: FAVORITE_ROW_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const last = page.at(-1);
    return cursorPage(
      page.map((row) => toFavoriteItem(row, locale, this.mediaUrl)),
      {
        nextCursor:
          hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
        hasMore,
        limit,
      },
    );
  }

  private decodeFavoriteCursor(cursor: string | undefined): { createdAt: Date; id: string } | null {
    if (cursor === undefined) {
      return null;
    }
    const parsed = decodeCursor(cursor);
    const createdAtValue = parsed?.createdAt;
    const createdAt = typeof createdAtValue === 'string' ? new Date(createdAtValue) : null;
    const id = typeof parsed?.id === 'string' && isUuid(parsed.id) ? parsed.id : null;
    if (createdAt === null || Number.isNaN(createdAt.getTime()) || id === null) {
      throw new AppException('VALIDATION_ERROR', {
        details: { errors: [{ field: 'cursor', messages: ['The pagination cursor is invalid.'] }] },
      });
    }
    return { createdAt, id };
  }
}
