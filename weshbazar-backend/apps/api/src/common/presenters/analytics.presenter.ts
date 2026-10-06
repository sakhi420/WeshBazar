/**
 * Analytics presenters (spec §71, §72, §106, §162).
 *
 * Shapes for the admin dashboard / marketplace summary and the seller's own
 * listing summary. They expose aggregates only — never per-user tracking —
 * in line with §71's "avoid storing unnecessary personal information in
 * analytics".
 */
import type { ListingStatus } from '../../generated/prisma/enums';

// -----------------------------------------------------------------------------
// Shared building blocks
// -----------------------------------------------------------------------------

/** One point of a per-day series; `date` is the UTC day (`YYYY-MM-DD`). */
export interface DailyCount {
  date: string;
  count: number;
}

/** One point of the engagement series (ListingDailyStat counters, §72). */
export interface DailyStatPoint {
  date: string;
  views: number;
  phoneClicks: number;
  whatsappClicks: number;
  telegramClicks: number;
  favoriteAdds: number;
  reports: number;
}

/** Sum of ListingDailyStat counters over a range. */
export interface EngagementTotals {
  views: number;
  phoneClicks: number;
  whatsappClicks: number;
  telegramClicks: number;
  favoriteAdds: number;
  reports: number;
}

// -----------------------------------------------------------------------------
// Admin dashboard (§106 dashboard summary, §161)
// -----------------------------------------------------------------------------

export interface AdminDashboardView {
  generatedAt: Date;
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    newLast7Days: number;
  };
  listings: {
    /** Every listing status, zero-filled. */
    byStatus: Record<ListingStatus, number>;
    newLast7Days: number;
    publishedLast7Days: number;
    soldLast7Days: number;
  };
  reports: {
    open: number;
    underReview: number;
    createdLast7Days: number;
  };
}

// -----------------------------------------------------------------------------
// Admin marketplace summary (§162 admin marketplace summaries)
// -----------------------------------------------------------------------------

export interface MarketplaceSummaryView {
  from: string;
  to: string;
  listings: {
    created: DailyCount[];
    published: DailyCount[];
    totalCreated: number;
    totalPublished: number;
  };
  users: {
    registered: DailyCount[];
    totalRegistered: number;
  };
  engagement: {
    daily: DailyStatPoint[];
    totals: EngagementTotals;
  };
}

// -----------------------------------------------------------------------------
// Seller summary (§162 seller listing summaries)
// -----------------------------------------------------------------------------

export interface SellerTopListing {
  id: string;
  title: string;
  status: ListingStatus;
  /** Lifetime Listing.views counter. */
  lifetimeViews: number;
  /** Views inside the requested range (ListingDailyStat). */
  rangeViews: number;
}

export interface SellerSummaryView {
  from: string;
  to: string;
  listings: {
    byStatus: Record<ListingStatus, number>;
    total: number;
  };
  /** Fast counters on Listing (§72: "maintain fast counters where useful"). */
  lifetime: {
    views: number;
    favoriteCount: number;
  };
  rangeEngagement: {
    totals: EngagementTotals;
    daily: DailyStatPoint[];
  };
  /** Top listings of the range by views, newest activity first. */
  topListings: SellerTopListing[];
}

export const EMPTY_ENGAGEMENT_TOTALS: EngagementTotals = {
  views: 0,
  phoneClicks: 0,
  whatsappClicks: 0,
  telegramClicks: 0,
  favoriteAdds: 0,
  reports: 0,
};
