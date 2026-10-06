/**
 * Seller analytics (spec §72, §107, §162 "seller listing summaries").
 *
 * Aggregates the authenticated seller's own listings only — the caller's
 * userId scopes every query through the seller account, so one account can
 * never read another's numbers (the §110 boundary applies to analytics too).
 *
 * The response combines the fast lifetime counters (`Listing.views`,
 * `Listing.favoriteCount` — §72 "maintain fast counters") with the ranged
 * `ListingDailyStat` engagement series, plus the seller's top listings by
 * views inside the range. Aggregate-only: no per-visitor data exists here.
 */
import { Injectable } from '@nestjs/common';
import type {
  SellerSummaryView,
  SellerTopListing,
} from '../../common/presenters/analytics.presenter';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { ListingStatus } from '../../generated/prisma/enums';
import { formatDay, resolveAnalyticsRange } from './analytics-range';
import { ENGAGEMENT_SUM, mergeEngagement } from './analytics-merge';

const LISTING_STATUSES: readonly ListingStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'REJECTED',
  'SOLD',
  'ARCHIVED',
];

/** §162 stays lightweight: five standouts are enough for the seller view. */
const TOP_LISTINGS_LIMIT = 5;

@Injectable()
export class SellerAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, from?: string, to?: string): Promise<SellerSummaryView> {
    const range = resolveAnalyticsRange(from, to);

    const sellerListings: Prisma.ListingWhereInput = {
      deletedAt: null,
      sellerAccount: { ownerUserId: userId },
    };
    const sellerStats: Prisma.ListingDailyStatWhereInput = {
      date: { gte: range.fromDay, lte: range.toDay },
      listing: { deletedAt: null, sellerAccount: { ownerUserId: userId } },
    };

    const [byStatus, aggregate, statRows, topGroups] = await Promise.all([
      this.prisma.listing.groupBy({
        by: ['status'],
        where: sellerListings,
        _count: { _all: true },
      }),
      this.prisma.listing.aggregate({
        where: sellerListings,
        _count: { _all: true },
        _sum: { views: true, favoriteCount: true },
      }),
      this.prisma.listingDailyStat.groupBy({
        by: ['date'],
        where: sellerStats,
        _sum: ENGAGEMENT_SUM,
        orderBy: { date: 'asc' },
      }),
      this.prisma.listingDailyStat.groupBy({
        by: ['listingId'],
        where: sellerStats,
        _sum: { views: true },
        orderBy: { _sum: { views: 'desc' } },
        take: TOP_LISTINGS_LIMIT,
      }),
    ]);

    const topRows =
      topGroups.length === 0
        ? []
        : await this.prisma.listing.findMany({
            where: { id: { in: topGroups.map((group) => group.listingId) } },
            select: { id: true, title: true, status: true, views: true },
          });
    const topById = new Map(topRows.map((row) => [row.id, row]));
    const topListings: SellerTopListing[] = topGroups.flatMap((group) => {
      const row = topById.get(group.listingId);
      if (row === undefined) {
        return [];
      }
      return [
        {
          id: row.id,
          title: row.title,
          status: row.status,
          lifetimeViews: row.views,
          rangeViews: group._sum.views ?? 0,
        },
      ];
    });

    const statusCounts = new Map(byStatus.map((group) => [group.status, group._count._all]));
    const listingsByStatus = Object.fromEntries(
      LISTING_STATUSES.map((status) => [status, statusCounts.get(status) ?? 0]),
    ) as Record<ListingStatus, number>;
    const engagement = mergeEngagement(range.days, statRows);

    return {
      from: formatDay(range.fromDay),
      to: formatDay(range.toDay),
      listings: {
        byStatus: listingsByStatus,
        total: aggregate._count._all,
      },
      lifetime: {
        views: aggregate._sum.views ?? 0,
        favoriteCount: aggregate._sum.favoriteCount ?? 0,
      },
      rangeEngagement: {
        totals: engagement.totals,
        daily: engagement.daily,
      },
      topListings,
    };
  }
}
