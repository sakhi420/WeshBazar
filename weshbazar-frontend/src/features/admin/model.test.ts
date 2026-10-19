/**
 * Pure-helper tests for the admin view model (master prompt §43–44).
 * No network, no React — bad-data resilience is the point of most cases.
 */

import {
  ADMIN_QUEUE_PAGE_LIMIT,
  buildStatusBreakdown,
  emptyEngagementTotals,
  formatAdminPrice,
  formatContactMethodType,
  formatModerationAction,
  formatPricingTypeLabel,
  formatRejectionReason,
  formatSellerStatus,
  formatSummaryRange,
  isPubliclyViewable,
  queueViewLabel,
  summaryDaySpan,
  sumEngagement,
  sumLastDays,
  toAdminListingsQuery,
  type AdminQueueUrlState,
} from './model';
import type { DailyCount, DailyStatPoint } from './types';

describe('buildStatusBreakdown', () => {
  it('returns every known status in lifecycle order, filling missing with 0', () => {
    const rows = buildStatusBreakdown({ ACTIVE: 20, DRAFT: 3 });
    expect(rows.map((row) => row.status)).toEqual([
      'DRAFT',
      'PENDING_REVIEW',
      'ACTIVE',
      'REJECTED',
      'SOLD',
      'ARCHIVED',
    ]);
    expect(rows[0]).toEqual({ status: 'DRAFT', label: 'پیش‌نویس', count: 3 });
    expect(rows[1]).toEqual({ status: 'PENDING_REVIEW', label: 'در انتظار بررسی', count: 0 });
    expect(rows[2]).toEqual({ status: 'ACTIVE', label: 'فعال', count: 20 });
  });

  it('appends unknown status keys as-is instead of dropping them', () => {
    const rows = buildStatusBreakdown({ ACTIVE: 1, MYSTERY: 7 });
    expect(rows).toHaveLength(7);
    expect(rows[6]).toEqual({ status: 'MYSTERY', label: 'MYSTERY', count: 7 });
  });

  it('never crashes on null input or non-numeric counts', () => {
    expect(buildStatusBreakdown(null).every((row) => row.count === 0)).toBe(true);
    const rows = buildStatusBreakdown({ ACTIVE: Number.NaN } as Record<string, number>);
    expect(rows.find((row) => row.status === 'ACTIVE')?.count).toBe(0);
  });
});

describe('sumLastDays', () => {
  const series: DailyCount[] = [
    { date: '2026-09-01', count: 1 },
    { date: '2026-09-02', count: 2 },
    { date: '2026-09-03', count: 3 },
    { date: '2026-09-04', count: 4 },
    { date: '2026-09-05', count: 5 },
  ];

  it('sums only the trailing window', () => {
    expect(sumLastDays(series, 2)).toBe(9);
    expect(sumLastDays(series, 5)).toBe(15);
  });

  it('windows larger than the series use everything', () => {
    expect(sumLastDays(series, 30)).toBe(15);
  });

  it('returns 0 for empty, non-positive or invalid windows', () => {
    expect(sumLastDays([], 7)).toBe(0);
    expect(sumLastDays(null, 7)).toBe(0);
    expect(sumLastDays(series, 0)).toBe(0);
    expect(sumLastDays(series, Number.NaN)).toBe(0);
  });
});

describe('sumEngagement', () => {
  const day = (date: string, views: number): DailyStatPoint => ({
    date,
    views,
    phoneClicks: 1,
    whatsappClicks: 0,
    telegramClicks: 0,
    favoriteAdds: 2,
    reports: 0,
  });

  it('aggregates every engagement key over the window', () => {
    const series = [day('2026-09-01', 10), day('2026-09-02', 20), day('2026-09-03', 30)];
    expect(sumEngagement(series, 2)).toEqual({
      views: 50,
      phoneClicks: 2,
      whatsappClicks: 0,
      telegramClicks: 0,
      favoriteAdds: 4,
      reports: 0,
    });
  });

  it('returns all zeros for bad input and tolerates missing fields', () => {
    expect(sumEngagement(null, 7)).toEqual(emptyEngagementTotals());
    const partial = [{ date: '2026-09-01' } as DailyStatPoint];
    expect(sumEngagement(partial, 7)).toEqual(emptyEngagementTotals());
  });
});

describe('formatSummaryRange', () => {
  it('counts the inclusive span in Persian digits', () => {
    expect(summaryDaySpan('2026-09-05', '2026-10-04')).toBe(30);
    expect(formatSummaryRange('2026-09-05', '2026-10-04')).toBe('۳۰ روز اخیر');
  });

  it('labels a single day and falls back for bad ranges', () => {
    expect(formatSummaryRange('2026-10-04', '2026-10-04')).toBe('یک روز');
    expect(formatSummaryRange('bad', '2026-10-04')).toBe('bad – 2026-10-04');
    expect(formatSummaryRange('2026-10-04', '2026-09-05')).toBe('2026-10-04 – 2026-09-05');
  });
});

describe('toAdminListingsQuery', () => {
  const base: AdminQueueUrlState = {
    view: 'pending',
    q: null,
    sort: null,
    page: null,
    seller: null,
  };

  it('keeps the pending default minimal (backend owns PENDING_REVIEW FIFO)', () => {
    expect(toAdminListingsQuery(base)).toEqual({ limit: ADMIN_QUEUE_PAGE_LIMIT });
  });

  it('maps the reported view to reported=true without a status filter', () => {
    expect(toAdminListingsQuery({ ...base, view: 'reported' })).toEqual({
      limit: ADMIN_QUEUE_PAGE_LIMIT,
      reported: true,
    });
  });

  it('maps status views onto the frozen status values', () => {
    expect(toAdminListingsQuery({ ...base, view: 'active' }).status).toBe('ACTIVE');
    expect(toAdminListingsQuery({ ...base, view: 'rejected' }).status).toBe('REJECTED');
    expect(toAdminListingsQuery({ ...base, view: 'sold' }).status).toBe('SOLD');
    expect(toAdminListingsQuery({ ...base, view: 'archived' }).status).toBe('ARCHIVED');
  });

  it('trims the search and keeps page>1, seller and explicit sort only', () => {
    expect(
      toAdminListingsQuery({
        view: 'pending',
        q: '  بایسکل ',
        sort: 'newest',
        page: 3,
        seller: 'seller-uuid',
      }),
    ).toEqual({
      limit: ADMIN_QUEUE_PAGE_LIMIT,
      sort: 'newest',
      q: 'بایسکل',
      sellerAccountId: 'seller-uuid',
      page: 3,
    });
    expect(toAdminListingsQuery({ ...base, q: '   ' }).q).toBeUndefined();
    expect(toAdminListingsQuery({ ...base, page: 1 }).page).toBeUndefined();
  });
});

describe('formatAdminPrice', () => {
  it('formats a numeric price with the currency label', () => {
    expect(formatAdminPrice(45000, 'AFN')).toBe('۴۵٬۰۰۰ افغانی');
  });

  it('stays honest for a null price', () => {
    expect(formatAdminPrice(null, 'AFN')).toBe('قیمت اعلام نشده');
  });
});

describe('moderation labels', () => {
  it('maps known actions and passes unknown through', () => {
    expect(formatModerationAction('APPROVE')).toBe('تأیید');
    expect(formatModerationAction('RESTORE')).toBe('بازگردانی');
    expect(formatModerationAction('MYSTERY')).toBe('MYSTERY');
  });

  it('maps known rejection reasons, raw unknown codes, empty for null', () => {
    expect(formatRejectionReason('SPAM')).toBe('هرزنامه یا تبلیغات');
    expect(formatRejectionReason('SOMETHING_NEW')).toBe('SOMETHING_NEW');
    expect(formatRejectionReason(null)).toBe('');
  });

  it('labels contact methods and pricing types with passthrough', () => {
    expect(formatContactMethodType('WHATSAPP')).toBe('واتساپ');
    expect(formatContactMethodType('CARRIER_PIGEON')).toBe('CARRIER_PIGEON');
    expect(formatPricingTypeLabel('CONTACT')).toBe('توافقی');
    expect(formatPricingTypeLabel('BARTER')).toBe('BARTER');
  });

  it('labels seller-account statuses with passthrough', () => {
    expect(formatSellerStatus('SUSPENDED')).toBe('معلق');
    expect(formatSellerStatus('BANNED')).toBe('مسدود');
    expect(formatSellerStatus('ON_VACATION')).toBe('ON_VACATION');
  });
});

describe('isPubliclyViewable', () => {
  it('only ACTIVE and SOLD have a reachable public page', () => {
    expect(isPubliclyViewable('ACTIVE')).toBe(true);
    expect(isPubliclyViewable('SOLD')).toBe(true);
    expect(isPubliclyViewable('DRAFT')).toBe(false);
    expect(isPubliclyViewable('PENDING_REVIEW')).toBe(false);
    expect(isPubliclyViewable('REJECTED')).toBe(false);
    expect(isPubliclyViewable('ARCHIVED')).toBe(false);
  });
});

describe('queueViewLabel', () => {
  it('labels known views and passes unknown through', () => {
    expect(queueViewLabel('pending')).toBe('در انتظار بررسی');
    expect(queueViewLabel('mystery')).toBe('mystery');
  });
});
