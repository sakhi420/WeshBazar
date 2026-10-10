/**
 * Admin feature — pure view-model helpers (master prompt §43–44).
 *
 * No React, no fetching: ordered listing-status breakdown, rolling-window
 * sums over the daily series, Persian range labels, and the moderation-queue
 * mapping (URL state → frozen `GET /admin/listings` query, action/reason
 * labels). Bad data must never crash the surfaces — every helper coerces or
 * falls back.
 */

import type { OwnerListingStatus } from '@/features/listings';
import { formatCurrency, formatNumber, formatOwnerStatus } from '@/features/listings';
import type {
  AdminListingsQuery,
  AdminListingsSort,
  DailyCount,
  DailyStatPoint,
  EngagementTotals,
  ModerationAction,
} from './types';

/** Lifecycle order of the listing-status breakdown. */
export const LISTING_STATUS_ORDER: readonly OwnerListingStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'REJECTED',
  'SOLD',
  'ARCHIVED',
];

export interface StatusBreakdownRow {
  status: string;
  label: string;
  count: number;
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Ordered rows for the dashboard `byStatus` map: every known lifecycle status
 * appears (0 when absent), unknown keys are appended as-is so real data is
 * never silently dropped.
 */
export function buildStatusBreakdown(
  byStatus: Record<string, number> | null | undefined,
): StatusBreakdownRow[] {
  const source = byStatus ?? {};
  const rows: StatusBreakdownRow[] = LISTING_STATUS_ORDER.map((status) => ({
    status,
    label: formatOwnerStatus(status),
    count: toCount(source[status]),
  }));
  for (const [status, count] of Object.entries(source)) {
    if (!(LISTING_STATUS_ORDER as readonly string[]).includes(status)) {
      rows.push({ status, label: status, count: toCount(count) });
    }
  }
  return rows;
}

/**
 * Sum of the last `days` entries of a daily count series (entries are ordered
 * oldest → newest). Non-positive windows and empty input yield 0.
 */
export function sumLastDays(series: DailyCount[] | null | undefined, days: number): number {
  if (!Array.isArray(series) || !Number.isFinite(days) || days <= 0) return 0;
  return series.slice(-days).reduce((total, point) => total + toCount(point?.count), 0);
}

const ENGAGEMENT_KEYS: readonly (keyof EngagementTotals)[] = [
  'views',
  'phoneClicks',
  'whatsappClicks',
  'telegramClicks',
  'favoriteAdds',
  'reports',
];

/** Empty totals object (all zeros) — shared fallback. */
export function emptyEngagementTotals(): EngagementTotals {
  return {
    views: 0,
    phoneClicks: 0,
    whatsappClicks: 0,
    telegramClicks: 0,
    favoriteAdds: 0,
    reports: 0,
  };
}

/** Aggregate the trailing `days` engagement points into one totals object. */
export function sumEngagement(
  series: DailyStatPoint[] | null | undefined,
  days: number,
): EngagementTotals {
  const totals = emptyEngagementTotals();
  if (!Array.isArray(series) || !Number.isFinite(days) || days <= 0) return totals;
  for (const point of series.slice(-days)) {
    for (const key of ENGAGEMENT_KEYS) {
      totals[key] += toCount(point?.[key]);
    }
  }
  return totals;
}

/** Inclusive day span of a YYYY-MM-DD range; null when unparseable/reversed. */
export function summaryDaySpan(from: string, to: string): number | null {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86_400_000) + 1;
}

/** «۳۰ روز اخیر» — falls back to the raw range when the dates are bad. */
export function formatSummaryRange(from: string, to: string): string {
  const span = summaryDaySpan(from, to);
  if (span === null) return `${from} – ${to}`;
  if (span === 1) return 'یک روز';
  return `${formatNumber(span)} روز اخیر`;
}

export interface EngagementItem {
  key: keyof EngagementTotals;
  label: string;
}

/** Display order and Persian labels of the engagement totals. */
export const ENGAGEMENT_ITEMS: readonly EngagementItem[] = [
  { key: 'views', label: 'بازدید آگهی‌ها' },
  { key: 'phoneClicks', label: 'کلیک تماس' },
  { key: 'whatsappClicks', label: 'کلیک واتساپ' },
  { key: 'telegramClicks', label: 'کلیک تلگرام' },
  { key: 'favoriteAdds', label: 'افزودن به علاقه‌مندی' },
  { key: 'reports', label: 'گزارش‌ها' },
];

// --- Moderation queue (§44) ----------------------------------------------------

/** Contract page size for the queue (`AdminListingsQueryDto.limit`). */
export const ADMIN_QUEUE_PAGE_LIMIT = 20;

/** Queue view tabs — each maps onto frozen `GET /admin/listings` parameters. */
export type ListingQueueView = 'pending' | 'reported' | 'active' | 'rejected' | 'sold' | 'archived';

export const LISTING_QUEUE_VIEWS: readonly { key: ListingQueueView; label: string }[] = [
  { key: 'pending', label: 'در انتظار بررسی' },
  { key: 'reported', label: 'دارای گزارش باز' },
  { key: 'active', label: 'فعال' },
  { key: 'rejected', label: 'ردشده' },
  { key: 'sold', label: 'فروخته‌شده' },
  { key: 'archived', label: 'بایگانی‌شده' },
];

export const QUEUE_SORT_OPTIONS: readonly { value: AdminListingsSort; label: string }[] = [
  { value: 'oldest', label: 'قدیمی‌ترین' },
  { value: 'newest', label: 'جدیدترین' },
];

/** URL state of the queue (nuqs-owned; the server never reads it). */
export interface AdminQueueUrlState {
  view: ListingQueueView;
  q: string | null;
  sort: AdminListingsSort | null;
  page: number | null;
  /** Filter to one seller account (`sellerAccountId`). */
  seller: string | null;
}

const VIEW_STATUS: Record<Exclude<ListingQueueView, 'pending' | 'reported'>, OwnerListingStatus> = {
  active: 'ACTIVE',
  rejected: 'REJECTED',
  sold: 'SOLD',
  archived: 'ARCHIVED',
};

/**
 * Map URL state onto the frozen queue query. Defaults stay out of the request
 * — for `pending` the backend owns the PENDING_REVIEW-FIFO default, and its
 * per-view sort default only yields to an explicit override.
 */
export function toAdminListingsQuery(state: AdminQueueUrlState): AdminListingsQuery {
  const query: AdminListingsQuery = { limit: ADMIN_QUEUE_PAGE_LIMIT };
  if (state.view === 'reported') {
    query.reported = true;
  } else if (state.view !== 'pending') {
    query.status = VIEW_STATUS[state.view];
  }
  if (state.sort) query.sort = state.sort;
  const q = state.q?.trim();
  if (q) query.q = q;
  if (state.seller) query.sellerAccountId = state.seller;
  if (state.page !== null && state.page > 1) query.page = state.page;
  return query;
}

/** Persian label of one queue view (tabs + empty states); unknown passes through. */
export function queueViewLabel(view: string): string {
  return LISTING_QUEUE_VIEWS.find((item) => item.key === view)?.label ?? view;
}

/** Queue price label; a null price stays honest («قیمت اعلام نشده»). */
export function formatAdminPrice(price: number | null, currency: string): string {
  if (price === null || !Number.isFinite(price)) return 'قیمت اعلام نشده';
  return `${formatNumber(price)} ${formatCurrency(currency)}`;
}

/** Statuses whose public page is reachable — the queue links «مشاهده آگهی» only then. */
export function isPubliclyViewable(status: OwnerListingStatus): boolean {
  return status === 'ACTIVE' || status === 'SOLD';
}

const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  APPROVE: 'تأیید',
  REJECT: 'رد',
  ARCHIVE: 'بایگانی',
  RESTORE: 'بازگردانی',
};

/** Persian label of a moderation action (buttons + trail); unknown passes through. */
export function formatModerationAction(action: string): string {
  return MODERATION_ACTION_LABELS[action as ModerationAction] ?? action;
}

/**
 * Curated machine-readable rejection reasons (§44/§58). The wire contract is
 * a free string (≤64); values reuse the system report vocabulary where one
 * exists, plus BAD_PHOTO from the media review flow.
 */
export const REJECTION_REASON_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'PROHIBITED_ITEM', label: 'کالای ممنوعه' },
  { value: 'MISLEADING', label: 'اطلاعات گمراه‌کننده' },
  { value: 'SPAM', label: 'هرزنامه یا تبلیغات' },
  { value: 'DUPLICATE', label: 'آگهی تکراری' },
  { value: 'BAD_PHOTO', label: 'تصاویر نامناسب' },
  { value: 'OFFENSIVE', label: 'محتوای توهین‌آمیز' },
  { value: 'OTHER', label: 'دیگر' },
];

/** `RejectListingDto.note` / `ModerationNoteDto.note` cap. */
export const MODERATION_NOTE_MAX_LENGTH = 500;

/** Persian label of a rejection reason; unknown codes pass through as-is. */
export function formatRejectionReason(reason: string | null | undefined): string {
  if (!reason) return '';
  return REJECTION_REASON_OPTIONS.find((option) => option.value === reason)?.label ?? reason;
}

const CONTACT_METHOD_LABELS: Record<string, string> = {
  PHONE: 'تلفن',
  WHATSAPP: 'واتساپ',
  TELEGRAM: 'تلگرام',
};

/** Persian label of a contact method type; unknown passes through. */
export function formatContactMethodType(type: string): string {
  return CONTACT_METHOD_LABELS[type] ?? type;
}

const SELLER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'فعال',
  SUSPENDED: 'معلق',
  BANNED: 'مسدود',
};

/** Persian label of a seller-account status; unknown passes through. */
export function formatSellerStatus(status: string): string {
  return SELLER_STATUS_LABELS[status] ?? status;
}

const PRICING_TYPE_LABELS: Record<string, string> = {
  PAID: 'قیمت مشخص',
  FREE: 'رایگان',
  CONTACT: 'توافقی',
};

/** Persian label of a pricing type (detail header); unknown passes through. */
export function formatPricingTypeLabel(pricingType: string): string {
  return PRICING_TYPE_LABELS[pricingType] ?? pricingType;
}
