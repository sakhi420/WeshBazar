/**
 * Admin analytics (spec §71, §72, §106, §162).
 *
 * Two reads, both aggregate-only:
 *
 *   - `dashboard()` — the §161 "basic dashboard statistics": account,
 *     listing and report counters plus last-7-day activity. Cheap COUNTs so
 *     it can be polled.
 *   - `marketplaceSummary(from, to)` — a bounded daily series: listings
 *     created/published, user registrations (raw `date_trunc` over the
 *     indexed timestamps) and the §72 engagement counters summed from
 *     `ListingDailyStat`. Missing days are zero-filled so charts render
 *     without client-side gap handling.
 *
 * No raw event stream is stored or exposed (§72); this stays lightweight by
 * design and can be replaced by a pipeline behind the same API shape.
 */
import { Injectable } from '@nestjs/common';
import type {
  AdminDashboardView,
  DailyCount,
  MarketplaceSummaryView,
} from '../../common/presenters/analytics.presenter';
import { PrismaService } from '../../database/prisma.service';
import type { ListingStatus } from '../../generated/prisma/enums';
import { formatDay, resolveAnalyticsRange, type AnalyticsRange } from './analytics-range';
import { ENGAGEMENT_SUM, mergeEngagement } from './analytics-merge';

const LISTING_STATUSES: readonly ListingStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'REJECTED',
  'SOLD',
  'ARCHIVED',
];

const SEVEN_DAYS_MS = 7 * 86_400_000;

/** Raw `date_trunc` result: pg returns COUNT as bigint. */
interface DailyCountRow {
  day: Date;
  count: bigint;
}

function mergeDailyCounts(days: string[], rows: DailyCountRow[]): DailyCount[] {
  const byDay = new Map(rows.map((row) => [formatDay(row.day), Number(row.count)]));
  return days.map((date) => ({ date, count: byDay.get(date) ?? 0 }));
}

function sumCounts(series: DailyCount[]): number {
  return series.reduce((total, point) => total + point.count, 0);
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(): Promise<AdminDashboardView> {
    const now = new Date();
    const since = new Date(now.getTime() - SEVEN_DAYS_MS);

    const [
      byStatus,
      usersTotal,
      usersActive,
      usersSuspended,
      usersBanned,
      usersNew,
      listingsNew,
      listingsPublished,
      listingsSold,
      reportsOpen,
      reportsUnderReview,
      reportsNew,
    ] = await Promise.all([
      this.prisma.listing.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'BANNED' } }),
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
      this.prisma.listing.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
      this.prisma.listing.count({ where: { deletedAt: null, publishedAt: { gte: since } } }),
      this.prisma.listing.count({ where: { deletedAt: null, soldAt: { gte: since } } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.report.count({ where: { status: 'UNDER_REVIEW' } }),
      this.prisma.report.count({ where: { createdAt: { gte: since } } }),
    ]);

    const statusCounts = new Map(byStatus.map((group) => [group.status, group._count._all]));
    const listingsByStatus = Object.fromEntries(
      LISTING_STATUSES.map((status) => [status, statusCounts.get(status) ?? 0]),
    ) as Record<ListingStatus, number>;

    return {
      generatedAt: now,
      users: {
        total: usersTotal,
        active: usersActive,
        suspended: usersSuspended,
        banned: usersBanned,
        newLast7Days: usersNew,
      },
      listings: {
        byStatus: listingsByStatus,
        newLast7Days: listingsNew,
        publishedLast7Days: listingsPublished,
        soldLast7Days: listingsSold,
      },
      reports: {
        open: reportsOpen,
        underReview: reportsUnderReview,
        createdLast7Days: reportsNew,
      },
    };
  }

  async marketplaceSummary(from?: string, to?: string): Promise<MarketplaceSummaryView> {
    const range = resolveAnalyticsRange(from, to);

    const [createdRows, publishedRows, userRows, statRows] = await Promise.all([
      this.dailyCreatedListings(range),
      this.dailyPublishedListings(range),
      this.dailyRegistrations(range),
      this.prisma.listingDailyStat.groupBy({
        by: ['date'],
        where: { date: { gte: range.fromDay, lte: range.toDay } },
        _sum: ENGAGEMENT_SUM,
        orderBy: { date: 'asc' },
      }),
    ]);

    const created = mergeDailyCounts(range.days, createdRows);
    const published = mergeDailyCounts(range.days, publishedRows);
    const registered = mergeDailyCounts(range.days, userRows);
    const engagement = mergeEngagement(range.days, statRows);

    return {
      from: formatDay(range.fromDay),
      to: formatDay(range.toDay),
      listings: {
        created,
        published,
        totalCreated: sumCounts(created),
        totalPublished: sumCounts(published),
      },
      users: {
        registered,
        totalRegistered: sumCounts(registered),
      },
      engagement: {
        daily: engagement.daily,
        totals: engagement.totals,
      },
    };
  }

  // --- Private helpers ------------------------------------------------------------

  private dailyCreatedListings(range: AnalyticsRange): Promise<DailyCountRow[]> {
    return this.prisma.$queryRaw<DailyCountRow[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
      FROM "Listing"
      WHERE "deletedAt" IS NULL AND "createdAt" >= ${range.fromDay} AND "createdAt" < ${range.until}
      GROUP BY 1 ORDER BY 1`;
  }

  private dailyPublishedListings(range: AnalyticsRange): Promise<DailyCountRow[]> {
    return this.prisma.$queryRaw<DailyCountRow[]>`
      SELECT date_trunc('day', "publishedAt") AS day, COUNT(*) AS count
      FROM "Listing"
      WHERE "deletedAt" IS NULL AND "publishedAt" >= ${range.fromDay} AND "publishedAt" < ${range.until}
      GROUP BY 1 ORDER BY 1`;
  }

  private dailyRegistrations(range: AnalyticsRange): Promise<DailyCountRow[]> {
    return this.prisma.$queryRaw<DailyCountRow[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
      FROM "User"
      WHERE "deletedAt" IS NULL AND "createdAt" >= ${range.fromDay} AND "createdAt" < ${range.until}
      GROUP BY 1 ORDER BY 1`;
  }
}
