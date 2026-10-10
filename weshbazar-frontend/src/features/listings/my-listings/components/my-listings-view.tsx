'use client';

/**
 * My Listings view (§31) — the seller's management hub: status tabs, cursor
 * pagination and lifecycle actions (renew / mark-sold / archive) that mirror
 * the backend state machine. Session-gated exactly like favorites (§30).
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Loader2, PackageOpen } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthBootstrap } from '@/features/auth';
import { FormError } from '@/features/auth/components';
import { ApiError } from '@/lib/api';
import { describeSellError } from '../../sell';
import { useListingLifecycle, useMyListings } from '../hooks';
import { myListingsStatusParser } from '../params';
import {
  MY_LISTINGS_STATUS_TABS,
  listingLifecycle,
  statusFilterForTab,
  statusTabLabel,
  type MyListingsStatusTab,
} from '../view-model';
import { ListingManageCard } from './listing-manage-card';

export function MyListingsView() {
  const router = useRouter();
  const { status, retry } = useAuthBootstrap();

  // No session → sign-in required before any management UI renders.
  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/auth/login?next=${encodeURIComponent('/my-listings')}`);
    }
  }, [status, router]);

  const [statusParam, setStatusParam] = useQueryState('status', myListingsStatusParser);
  const tab: MyListingsStatusTab = statusParam ?? 'ALL';
  const filter = statusFilterForTab(tab);

  const result = useMyListings(filter ?? null, status === 'ready');
  const lifecycle = useListingLifecycle();

  // Capture the pagination controls while `result` is still the full union —
  // after the status gates narrow it, `isFetchNextPageError` is typed as
  // literal `false` (TanStack v5 narrowing, see favorites-view).
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError: loadMoreFailed,
  } = result;

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
        <Loader2 aria-hidden className="size-4 animate-spin" />
        در حال بررسی نشست…
      </div>
    );
  }

  if (status === 'unreachable') {
    return (
      <ErrorState
        title="ارتباط با سرور برقرار نشد"
        description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
        onRetry={retry}
      />
    );
  }

  if (status === 'anonymous') {
    // The effect above is redirecting to login.
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
        <Loader2 aria-hidden className="size-4 animate-spin" />
        در حال انتقال به صفحهٔ ورود…
      </div>
    );
  }

  const items = result.isSuccess ? result.data.pages.flatMap((page) => page.items) : [];

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <div role="group" aria-label="فیلتر وضعیت" className="flex w-max items-center gap-2">
          {MY_LISTINGS_STATUS_TABS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={tab === item}
              onClick={() => void setStatusParam(item === 'ALL' ? null : item)}
              className={cn(
                'min-h-touch rounded-control border px-3 text-ui outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                tab === item
                  ? 'border-primary bg-primary-soft font-medium text-primary'
                  : 'border-border bg-surface text-muted-foreground hover:bg-muted/50',
              )}
            >
              {statusTabLabel(item)}
            </button>
          ))}
        </div>
      </div>

      {lifecycle.isError ? <FormError>{describeSellError(lifecycle.error)}</FormError> : null}

      {result.isPending ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      ) : result.isError ? (
        <ErrorState
          requestId={result.error instanceof ApiError ? result.error.requestId : undefined}
          description="بارگیری آگهی‌های شما ناموفق بود. دوباره تلاش کنید."
          onRetry={() => void result.refetch()}
        />
      ) : items.length === 0 ? (
        tab === 'ALL' ? (
          <EmptyState
            icon={PackageOpen}
            title="هنوز آگهی‌ای ثبت نکرده‌اید"
            description="اولین آگهی خود را ثبت کنید تا از این‌جا مدیریتش کنید."
            action={
              <Button variant="accent" asChild>
                <Link href="/sell">ثبت آگهی</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={PackageOpen}
            title="آگهی‌ای در این وضعیت نیست"
            description="وضعیت دیگری را از فیلتر بالا انتخاب کنید."
            action={
              <Button variant="outline" onClick={() => void setStatusParam(null)}>
                نمایش همه
              </Button>
            }
          />
        )
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((listing) => (
              <li key={listing.id}>
                <ListingManageCard
                  listing={listing}
                  permissions={listingLifecycle(listing.status)}
                  pendingAction={
                    lifecycle.isPending && lifecycle.variables?.listingId === listing.id
                      ? lifecycle.variables.action
                      : null
                  }
                  locked={lifecycle.isPending}
                  onAction={(action) =>
                    lifecycle.mutate({
                      listingId: listing.id,
                      action,
                      expectedVersion: listing.version,
                    })
                  }
                />
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-2">
            {loadMoreFailed ? (
              <>
                <p className="text-ui text-muted-foreground">بارگیری موارد بیشتر ناموفق بود.</p>
                <Button variant="outline" onClick={() => void fetchNextPage()}>
                  تلاش دوباره
                </Button>
              </>
            ) : hasNextPage ? (
              <Button
                variant="outline"
                className="min-w-40"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? <Loader2 className="animate-spin" aria-hidden /> : null}
                نمایش موارد بیشتر
              </Button>
            ) : (
              <p className="text-caption text-muted-foreground">همهٔ آگهی‌ها نمایش داده شد.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
