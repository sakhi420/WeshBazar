/**
 * Shared analytics merge helpers (spec §72).
 *
 * `ListingDailyStat` rows are grouped per UTC day; both the admin marketplace
 * summary and the seller summary need the same zero-filled daily series and
 * range totals, so the merge lives here exactly once.
 */
import {
  EMPTY_ENGAGEMENT_TOTALS,
  type DailyStatPoint,
  type EngagementTotals,
} from '../../common/presenters/analytics.presenter';
import { Prisma } from '../../generated/prisma/client';
import { formatDay } from './analytics-range';

/** Counter columns summed from ListingDailyStat. */
export const ENGAGEMENT_SUM = {
  views: true,
  phoneClicks: true,
  whatsappClicks: true,
  telegramClicks: true,
  favoriteAdds: true,
  reports: true,
} satisfies Prisma.ListingDailyStatSumAggregateInputType;

/** A `groupBy(['date'])` row over ListingDailyStat. */
export interface DailyStatRow {
  date: Date;
  _sum: {
    views: number | null;
    phoneClicks: number | null;
    whatsappClicks: number | null;
    telegramClicks: number | null;
    favoriteAdds: number | null;
    reports: number | null;
  };
}

/**
 * Merge rows into the full day list (missing days counted as zero) and sum
 * the range totals in the same pass.
 */
export function mergeEngagement(
  days: string[],
  rows: DailyStatRow[],
): { daily: DailyStatPoint[]; totals: EngagementTotals } {
  const byDay = new Map(
    rows.map((row) => [
      formatDay(row.date),
      {
        views: row._sum.views ?? 0,
        phoneClicks: row._sum.phoneClicks ?? 0,
        whatsappClicks: row._sum.whatsappClicks ?? 0,
        telegramClicks: row._sum.telegramClicks ?? 0,
        favoriteAdds: row._sum.favoriteAdds ?? 0,
        reports: row._sum.reports ?? 0,
      },
    ]),
  );
  const daily = days.map((date) => ({ date, ...(byDay.get(date) ?? EMPTY_ENGAGEMENT_TOTALS) }));
  const totals = daily.reduce<EngagementTotals>(
    (acc, point) => ({
      views: acc.views + point.views,
      phoneClicks: acc.phoneClicks + point.phoneClicks,
      whatsappClicks: acc.whatsappClicks + point.whatsappClicks,
      telegramClicks: acc.telegramClicks + point.telegramClicks,
      favoriteAdds: acc.favoriteAdds + point.favoriteAdds,
      reports: acc.reports + point.reports,
    }),
    { ...EMPTY_ENGAGEMENT_TOTALS },
  );
  return { daily, totals };
}
