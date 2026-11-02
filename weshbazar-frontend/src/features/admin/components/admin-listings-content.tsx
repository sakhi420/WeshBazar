'use client';

/**
 * Moderation queue body (§44): URL-state filters (view / sort / search /
 * seller / page), the page-paginated read, and the four moderation commands.
 * A stale-role 403 converges to the access-denied gate; a dead session routes
 * back to login (§42). Row actions render exactly what `permittedActions`
 * allows — the backend re-checks every command.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { useQueryState } from 'nuqs';
import { ListChecks, RefreshCw, Search, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/features/listings';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { describeModerationError, isForbiddenError, isSessionLostError } from '../errors';
import { useAdminListings, useListingModeration } from '../hooks';
import {
  LISTING_QUEUE_VIEWS,
  QUEUE_SORT_OPTIONS,
  queueViewLabel,
  toAdminListingsQuery,
  type AdminQueueUrlState,
} from '../model';
import {
  queuePageParser,
  queueSearchParser,
  queueSellerParser,
  queueSortParser,
  queueViewParser,
} from '../params';
import type { AdminListingItem } from '../types';
import { ActiveFilterChips } from './ActiveFilterChips';
import { AdminAccessDenied } from './admin-access-denied';
import { AdminListingCard } from './admin-listing-card';
import { AdminListingTable } from './admin-listing-table';
import type { ModerationRequest } from './admin-listing-actions';

export function AdminListingsContent({ onSessionLost }: { onSessionLost: () => void }) {
  const [viewParam, setViewParam] = useQueryState('view', queueViewParser);
  const [searchParam, setSearchParam] = useQueryState('q', queueSearchParser);
  const [sortParam, setSortParam] = useQueryState('sort', queueSortParser);
  const [pageParam, setPageParam] = useQueryState('page', queuePageParser);
  const [sellerParam, setSellerParam] = useQueryState('seller', queueSellerParser);

  const view = viewParam ?? 'pending';
  const urlState: AdminQueueUrlState = {
    view,
    q: searchParam,
    sort: sortParam,
    page: pageParam,
    seller: sellerParam,
  };
  const query = toAdminListingsQuery(urlState);
  const listings = useAdminListings(query, true);
  const moderation = useListingModeration();

  const denied = isForbiddenError(listings.error);
  const sessionLost = isSessionLostError(listings.error) || isSessionLostError(moderation.error);

  useEffect(() => {
    if (sessionLost) onSessionLost();
  }, [sessionLost, onSessionLost]);

  // Search is local while typing; the submitted value is what lands in the URL.
  const [search, setSearch] = useState(searchParam ?? '');
  useEffect(() => {
    setSearch(searchParam ?? '');
  }, [searchParam]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // A stale role (UI said moderator, backend says 403) lands on the honest gate.
  if (denied) return <AdminAccessDenied />;

  const resetNavigation = () => {
    setExpandedId(null);
    void setPageParam(null);
  };

  const switchView = (next: (typeof LISTING_QUEUE_VIEWS)[number]['key']) => {
    void setViewParam(next === 'pending' ? null : next);
    resetNavigation();
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = search.trim();
    void setSearchParam(next ? next : null);
    resetNavigation();
  };

  const filterSeller = (sellerAccountId: string) => {
    void setSellerParam(sellerAccountId);
    resetNavigation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSellerFilter = () => {
    void setSellerParam(null);
    resetNavigation();
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const goToPage = (next: number) => {
    setExpandedId(null);
    void setPageParam(next <= 1 ? null : next);
  };

  const handleAction = (listing: AdminListingItem, request: ModerationRequest) => {
    // Ignore a second click while a command is already in flight: a fast
    // double-click otherwise fires two approve/reject requests, and the second
    // one hits a 409 once the first already changed the listing's state.
    if (moderation.isPending) return;
    moderation.mutate({
      listingId: listing.id,
      action: request.action,
      reason: request.reason,
      note: request.note,
    });
  };

  const data = listings.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.max(1, data.totalPages) : 1;
  const page = data?.page ?? (pageParam !== null && pageParam > 1 ? pageParam : 1);

  const mutationPending = moderation.isPending;
  const pendingId = mutationPending ? (moderation.variables?.listingId ?? null) : null;
  const pendingAction = mutationPending ? (moderation.variables?.action ?? null) : null;

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <div role="group" aria-label="نمایش فهرست" className="flex w-max items-center gap-2">
          {LISTING_QUEUE_VIEWS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={view === item.key}
              onClick={() => switchView(item.key)}
              className={cn(
                'min-h-touch rounded-control border px-3 text-ui outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                view === item.key
                  ? 'border-primary bg-primary-soft font-medium text-primary'
                  : 'border-border bg-surface text-muted-foreground hover:bg-muted/50',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          role="search"
          onSubmit={submitSearch}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted"
            />
            <label className="sr-only" htmlFor="admin-queue-search">
              جست‌وجوی عنوان آگهی
            </label>
            <input
              id="admin-queue-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی عنوان آگهی…"
              className="h-control w-full rounded-control border border-border bg-surface pe-3 ps-9 text-ui outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-control">
            جست‌وجو
          </Button>
        </form>

        <label className="inline-flex items-center">
          <span className="sr-only">ترتیب نمایش</span>
          <select
            value={sortParam ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              void setSortParam(value === 'oldest' || value === 'newest' ? value : null);
              resetNavigation();
            }}
            className="h-control rounded-control border border-border bg-surface px-3 text-ui outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">ترتیب پیش‌فرض</option>
            {QUEUE_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-control"
          onClick={() => void listings.refetch()}
          disabled={listings.isFetching}
        >
          <RefreshCw aria-hidden className={listings.isFetching ? 'animate-spin' : undefined} />
          به‌روزرسانی
        </Button>
      </div>
<ActiveFilterChips
        chips={[
          ...(searchParam ? [{ key: 'q', label: `جست‌وجو: ${searchParam}`, onRemove: () => { void setSearchParam(null); resetNavigation(); } }] : []),
          ...(sortParam ? [{ key: 'sort', label: sortParam === 'newest' ? 'جدیدترین' : 'قدیمی‌ترین', onRemove: () => { void setSortParam(null); resetNavigation(); } }] : []),
          ...(sellerParam ? [{ key: 'seller', label: 'فیلتر فروشنده', onRemove: clearSellerFilter }] : []),
        ]}
        onClearAll={() => { void setSearchParam(null); void setSortParam(null); clearSellerFilter(); }}
      />

      {sellerParam ? (
        <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
          <span>فقط آگهی‌های فروشندهٔ انتخاب‌شده</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-caption"
            onClick={clearSellerFilter}
          >
            حذف فیلتر فروشنده
          </Button>
        </div>
      ) : null}
{/* Live region for moderation success */}
      <div aria-live="polite" className="sr-only">
        {moderation.isSuccess ? 'عملیات با موفقیت انجام شد.' : ''}
      </div>

      {moderation.isError && !sessionLost ? (
        <div
          role="alert"
          className="rounded-card border border-danger/30 bg-danger/5 p-3 text-ui text-danger"
        >
          {describeModerationError(moderation.error)}
        </div>
      ) : null}

      {listings.isPending ? (
        <QueueSkeleton />
      ) : listings.isError ? (
        <ErrorState
          requestId={listings.error instanceof ApiError ? listings.error.requestId : undefined}
          title="دریافت صف بازبینی ناموفق بود"
          description="ارتباط را بررسی کنید و دوباره تلاش کنید."
          onRetry={() => void listings.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={view === 'pending' ? ListChecks : SearchX}
          title={
            view === 'pending' ? 'صف بررسی خالی است' : `آگهی‌ای در «${queueViewLabel(view)}» نیست`
          }
          description={
            view === 'pending'
              ? 'همهٔ آگهی‌های در انتظار بررسی، بررسی شده‌اند.'
              : 'نمای دیگری را از فهرست بالا انتخاب کنید.'
          }
        />
      ) : (
        <>
          <ul className={cn('space-y-3 md:hidden', listings.isPlaceholderData && 'opacity-60')}>
            {items.map((listing) => (
              <li key={listing.id}>
                <AdminListingCard
                  listing={listing}
                  expanded={expandedId === listing.id}
                  onToggle={() => toggleExpanded(listing.id)}
                  pending={pendingId === listing.id ? pendingAction : null}
                  locked={mutationPending}
                  onAction={(request) => handleAction(listing, request)}
                  onFilterSeller={filterSeller}
                />
              </li>
            ))}
          </ul>

          <AdminListingTable
            className={cn('hidden md:block', listings.isPlaceholderData && 'opacity-60')}
            listings={items}
            expandedId={expandedId}
            onToggle={toggleExpanded}
            pendingId={pendingId}
            pendingAction={pendingAction}
            locked={mutationPending}
            onAction={handleAction}
            onFilterSeller={filterSeller}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption text-muted-foreground">{formatNumber(total)} آگهی</p>
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || listings.isFetching}
                  onClick={() => goToPage(page - 1)}
                >
                  قبلی
                </Button>
                <span className="text-caption text-muted-foreground">
                  صفحهٔ {formatNumber(page)} از {formatNumber(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || listings.isFetching}
                  onClick={() => goToPage(page + 1)}
                >
                  بعدی
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-44 w-full md:h-20" />
      ))}
    </div>
  );
}
