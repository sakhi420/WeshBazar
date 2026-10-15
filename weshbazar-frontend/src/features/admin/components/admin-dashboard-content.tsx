'use client';

/**
 * Dashboard body (master prompt §43): counters + 30-day marketplace summary.
 *
 * The two queries are independent — a failing summary must not blank the
 * counters (and vice versa). A stale-role 403 converges to the access-denied
 * surface; a dead session routes back to login (§42).
 */

import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Flag, ListChecks, RefreshCw, Tag, TrendingUp, Users } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { formatNumber, formatRelativeTime } from '@/features/listings';
import { isForbiddenError, isSessionLostError } from '../errors';
import { useAdminDashboard, useMarketplaceSummary } from '../hooks';
import {
  ENGAGEMENT_ITEMS,
  buildStatusBreakdown,
  formatSummaryRange,
  sumEngagement,
  sumLastDays,
} from '../model';
import type { AdminDashboard, MarketplaceSummary } from '../types';
import { AdminAccessDenied } from './admin-access-denied';

const RECENT_DAYS = 7;

export function AdminDashboardContent({ onSessionLost }: { onSessionLost: () => void }) {
  const dashboard = useAdminDashboard(true);
  const summary = useMarketplaceSummary(true);

  const denied = isForbiddenError(dashboard.error) || isForbiddenError(summary.error);
  const sessionLost = isSessionLostError(dashboard.error) || isSessionLostError(summary.error);

  useEffect(() => {
    if (sessionLost) onSessionLost();
  }, [sessionLost, onSessionLost]);

  // A stale role (UI said admin, backend says 403) lands on the honest gate.
  if (denied) return <AdminAccessDenied />;

  const isRefreshing = dashboard.isFetching || summary.isFetching;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {dashboard.data ? (
          <p className="text-meta text-muted-foreground">
            آخرین به‌روزرسانی: {formatRelativeTime(dashboard.data.generatedAt)}
          </p>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void dashboard.refetch();
            void summary.refetch();
          }}
          disabled={isRefreshing}
        >
          <RefreshCw aria-hidden className={isRefreshing ? 'animate-spin' : undefined} />
          به‌روزرسانی
        </Button>
      </div>

      {dashboard.isPending ? (
        <CountersSkeleton />
      ) : dashboard.isError ? (
        <ErrorState
          title="دریافت آمار داشبورد ناموفق بود"
          description="ارتباط را بررسی کنید و دوباره تلاش کنید."
          onRetry={() => void dashboard.refetch()}
        />
      ) : (
        <>
          <Counters data={dashboard.data} />
          <StatusBreakdown byStatus={dashboard.data.listings.byStatus} />
        </>
      )}

      {summary.isPending ? (
        <SummarySkeleton />
      ) : summary.isError ? (
        <ErrorState
          title="دریافت خلاصهٔ بازار ناموفق بود"
          description="ارتباط را بررسی کنید و دوباره تلاش کنید."
          onRetry={() => void summary.refetch()}
        />
      ) : (
        <MarketplaceSummaryCard data={summary.data} />
      )}
    </div>
  );
}

// --- Counters ------------------------------------------------------------------

function Counters({ data }: { data: AdminDashboard }) {
  const { users, listings, reports } = data;
  const pendingReview = listings.byStatus.PENDING_REVIEW ?? 0;
  const activeListings = listings.byStatus.ACTIVE ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={Users}
        title="کاربران"
        headline={formatNumber(users.total)}
        headlineLabel="کاربر ثبت‌شده"
        rows={[
          ['فعال', users.active],
          ['معلق', users.suspended],
          ['مسدود', users.banned],
        ]}
        footer={`${formatNumber(users.newLast7Days)} کاربر تازه در ۷ روز اخیر`}
      />
      <StatCard
        icon={Tag}
        title="آگهی‌ها"
        headline={formatNumber(activeListings)}
        headlineLabel="آگهی فعال"
        rows={[
          ['تازه در ۷ روز اخیر', listings.newLast7Days],
          ['منتشرشده در ۷ روز اخیر', listings.publishedLast7Days],
          ['فروخته‌شده در ۷ روز اخیر', listings.soldLast7Days],
        ]}
        footer={
          pendingReview > 0
            ? `${formatNumber(pendingReview)} آگهی در انتظار بررسی`
            : 'صف بررسی خالی است'
        }
      />
      <StatCard
        icon={Flag}
        title="گزارش‌ها"
        headline={formatNumber(reports.open)}
        headlineLabel="گزارش باز"
        rows={[
          ['در حال بررسی', reports.underReview],
          ['تازه در ۷ روز اخیر', reports.createdLast7Days],
        ]}
      />
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  headline: string;
  headlineLabel: string;
  rows: Array<[label: string, value: number]>;
  footer?: string;
}

function StatCard({ icon: Icon, title, headline, headlineLabel, rows, footer }: StatCardProps) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="flex items-center gap-2 text-ui font-semibold text-foreground">
        <Icon aria-hidden className="size-4 text-primary" />
        {title}
      </h2>
      <p className="mt-3 text-card-title font-bold text-foreground">{headline}</p>
      <p className="text-caption text-muted-foreground">{headlineLabel}</p>
      <dl className="mt-3 space-y-1.5 border-t border-border pt-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 text-ui">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground">{formatNumber(value)}</dd>
          </div>
        ))}
      </dl>
      {footer ? (
        <p className="mt-3 border-t border-border pt-3 text-caption text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </section>
  );
}

// --- Status breakdown ----------------------------------------------------------

function StatusBreakdown({ byStatus }: { byStatus: Record<string, number> }) {
  const rows = buildStatusBreakdown(byStatus);
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="flex items-center gap-2 text-ui font-semibold text-foreground">
        <ListChecks aria-hidden className="size-4 text-primary" />
        وضعیت آگهی‌ها
      </h2>
      <dl className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.status} className="text-ui">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium text-foreground">{formatNumber(row.count)}</dd>
            </div>
            <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/20">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{ width: `${Math.round((row.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

// --- Marketplace summary -------------------------------------------------------

function MarketplaceSummaryCard({ data }: { data: MarketplaceSummary }) {
  const recent = sumEngagement(data.engagement.daily, RECENT_DAYS);
  const recentCreated = sumLastDays(data.listings.created, RECENT_DAYS);
  const recentPublished = sumLastDays(data.listings.published, RECENT_DAYS);
  const recentUsers = sumLastDays(data.users.registered, RECENT_DAYS);

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="flex items-center gap-2 text-ui font-semibold text-foreground">
        <TrendingUp aria-hidden className="size-4 text-primary" />
        خلاصهٔ بازار — {formatSummaryRange(data.from, data.to)}
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <SummaryStat
          label="آگهی ایجادشده"
          total={data.listings.totalCreated}
          recent={recentCreated}
        />
        <SummaryStat
          label="آگهی منتشرشده"
          total={data.listings.totalPublished}
          recent={recentPublished}
        />
        <SummaryStat
          label="کاربر ثبت‌نام‌شده"
          total={data.users.totalRegistered}
          recent={recentUsers}
        />
      </div>

      <h3 className="mt-5 border-t border-border pt-4 text-ui font-semibold text-foreground">
        تعامل بازار
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ENGAGEMENT_ITEMS.map((item) => (
          <div key={item.key} className="rounded-control border border-border bg-background p-3">
            <dt className="text-caption text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 text-card-title font-bold text-foreground">
              {formatNumber(data.engagement.totals[item.key])}
            </dd>
            <dd className="text-caption text-muted-foreground">
              ۷ روز اخیر: {formatNumber(recent[item.key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SummaryStat({ label, total, recent }: { label: string; total: number; recent: number }) {
  return (
    <div className="rounded-control border border-border bg-background p-3">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 text-card-title font-bold text-foreground">{formatNumber(total)}</p>
      <p className="text-caption text-muted-foreground">۷ روز اخیر: {formatNumber(recent)}</p>
    </div>
  );
}

// --- Loading placeholders ------------------------------------------------------

function CountersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((key) => (
        <div key={key} className="space-y-3 rounded-card border border-border bg-surface p-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
