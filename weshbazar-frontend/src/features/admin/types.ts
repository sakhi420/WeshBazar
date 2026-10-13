/**
 * Admin feature types (master prompt §43–44) — mirrors the frozen admin DTOs
 * in docs/openapi.json (AdminDashboardDto, MarketplaceSummaryDto,
 * AdminListingItemDto, AdminListingDetailDto, …).
 * Hand-written and kept narrow: only fields the UI actually consumes.
 */

import type { OwnerListingStatus, PricingType } from '@/features/listings';

/** One day of a daily series (`DailyCountDto`). */
export interface DailyCount {
  /** YYYY-MM-DD. */
  date: string;
  count: number;
}

/** One engagement day (`DailyStatPointDto`). */
export interface DailyStatPoint {
  date: string;
  views: number;
  phoneClicks: number;
  whatsappClicks: number;
  telegramClicks: number;
  favoriteAdds: number;
  reports: number;
}

/** Range totals for the engagement daily series (`EngagementTotalsDto`). */
export interface EngagementTotals {
  views: number;
  phoneClicks: number;
  whatsappClicks: number;
  telegramClicks: number;
  favoriteAdds: number;
  reports: number;
}

export interface AdminDashboardUsers {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  newLast7Days: number;
}

export interface AdminDashboardListings {
  /** Status → count map; keys are Prisma `ListingStatus` values. */
  byStatus: Record<string, number>;
  newLast7Days: number;
  publishedLast7Days: number;
  soldLast7Days: number;
}

export interface AdminDashboardReports {
  open: number;
  underReview: number;
  createdLast7Days: number;
}

/** `GET /admin/dashboard` (AdminDashboardDto). */
export interface AdminDashboard {
  /** ISO datetime the counters were computed at. */
  generatedAt: string;
  users: AdminDashboardUsers;
  listings: AdminDashboardListings;
  reports: AdminDashboardReports;
}

/** `GET /admin/analytics/summary` (MarketplaceSummaryDto). */
export interface MarketplaceSummary {
  /** Inclusive start day, YYYY-MM-DD. */
  from: string;
  /** Inclusive end day, YYYY-MM-DD. */
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

// --- Moderation queue (§44, AdminListingItemDto / AdminListingDetailDto) ------

/** Moderation command labels a row may permit (`permittedActions`). */
export type ModerationAction = 'APPROVE' | 'REJECT' | 'ARCHIVE' | 'RESTORE';

export type AdminListingsSort = 'oldest' | 'newest';

export interface AdminListingSeller {
  sellerAccountId: string;
  ownerUserId: string;
  displayName: string;
  slug: string;
  /** SellerAccountStatus: ACTIVE | SUSPENDED | BANNED. */
  status: string;
}

/** One queue row (`AdminListingItemDto`). */
export interface AdminListingItem {
  id: string;
  slug: string;
  title: string;
  status: OwnerListingStatus;
  price: number | null;
  currency: string;
  categoryName: string;
  provinceName: string;
  cityName: string;
  seller: AdminListingSeller;
  thumbnailUrl: string | null;
  views: number;
  favoriteCount: number;
  openReportCount: number;
  version: number;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
  /** Actions this principal may perform — resolved by the backend per role. */
  permittedActions: ModerationAction[];
}

export interface AdminListingImage {
  id: string;
  url: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

export interface AdminListingContactMethod {
  /** ListingContactType: PHONE | WHATSAPP | TELEGRAM. */
  type: string;
  enabled: boolean;
  valueOverride: string | null;
}

/** One moderation-trail entry (`AdminModerationActionDto`). */
export interface AdminModerationRecord {
  id: string;
  action: ModerationAction;
  adminUserId: string;
  adminDisplayName: string | null;
  reason: string | null;
  note: string | null;
  createdAt: string;
}

/** `GET /admin/listings/{id}` (AdminListingDetailDto) — item + moderation context. */
export interface AdminListingDetail extends AdminListingItem {
  description: string;
  condition: string;
  pricingType: PricingType;
  negotiable: boolean;
  contactMethods: AdminListingContactMethod[];
  images: AdminListingImage[];
  moderationActions: AdminModerationRecord[];
}

/** Query for `GET /admin/listings` (AdminListingsQueryDto). */
export interface AdminListingsQuery {
  status?: OwnerListingStatus;
  reported?: boolean;
  categoryId?: string;
  sellerAccountId?: string;
  /** Title substring search (case-insensitive). */
  q?: string;
  sort?: AdminListingsSort;
  page?: number;
  limit?: number;
}

// --- Reports queue ---------------------------------------------------------

export interface AdminReportItem {
  id: string;
  listing: { id: string; slug: string; title: string };
  reporter: { id: string; displayName: string };
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface AdminReportsQuery {
  /** ReportStatus filter: OPEN | UNDER_REVIEW | RESOLVED | DISMISSED. */
  status?: string;
  page?: number;
  limit?: number;
}

// --- User management -------------------------------------------------------

export interface AdminUserItem {
  id: string;
  phone: string;
  displayName: string;
  role: string;
  status: string;
  phoneVerified: boolean;
  activeListings: number;
  createdAt: string;
}

export interface AdminUsersQuery {
  /** Title/substring search. */
  q?: string;
  /** UserRole filter: USER | MODERATOR | ADMIN. */
  role?: string;
  /** UserStatus filter: ACTIVE | SUSPENDED | BANNED | DEACTIVATED. */
  status?: string;
  page?: number;
  limit?: number;
}

// --- Taxonomy --------------------------------------------------------------

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  status: string;
  sortOrder: number;
  children?: AdminCategoryItem[];
}
