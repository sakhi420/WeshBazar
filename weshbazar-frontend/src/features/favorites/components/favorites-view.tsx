'use client';

/**
 * Favorites view (master prompt §30) — saved listings with cursor pagination.
 *
 * Session-gated: guests are routed to login with `next` preserved, bootstrap
 * failures show an honest retry state. The grid reuses the shared listing
 * card; each card carries the save button so unsaving is one tap.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/listings/listing-card';
import { ListingGridSkeleton } from '@/components/listings/listing-grid-skeleton';
import { useAuthBootstrap } from '@/features/auth';
import { queryKeys, ApiError } from '@/lib/api';
import { fetchFavoritesPage } from '../api';
import { toCardListing } from '../view-model';
import { FavoriteButton } from './favorite-button';

const PAGE_LIMIT = 24;
const LIST_KEY_PARAMS = { limit: PAGE_LIMIT } as const;

export function FavoritesView() {
  const router = useRouter();
  const { status, retry } = useAuthBootstrap();

  // No session → sign-in required before favorites can be shown.
  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/auth/login?next=${encodeURIComponent('/favorites')}`);
    }
  }, [status, router]);

  const result = useInfiniteQuery({
    queryKey: queryKeys.favorites.list(LIST_KEY_PARAMS),
    queryFn: ({ pageParam }) =>
      fetchFavoritesPage({ cursor: pageParam ?? undefined, limit: PAGE_LIMIT }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    enabled: status === 'ready',
    staleTime: 30_000,
  });

  // Capture the pagination controls while `result` is still the full union —
  // after the status gates narrow it to the success member,
  // `isFetchNextPageError` is typed as literal `false` and referencing
  // `result` inside the retry branch trips `never` narrowing.
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

  if (result.isPending) {
    return <ListingGridSkeleton count={6} />;
  }

  if (result.isError) {
    const requestId = result.error instanceof ApiError ? result.error.requestId : undefined;
    return (
      <ErrorState
        requestId={requestId}
        description="بارگیری علاقه‌مندی‌ها ناموفق بود. دوباره تلاش کنید."
        onRetry={() => void result.refetch()}
      />
    );
  }

  const items = result.data.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="هنوز آگهی‌ای ذخیره نکرده‌اید"
        description="با زدن نشان قلب روی هر آگهی، آن را برای بعد ذخیره کنید."
        action={
          <Button asChild>
            <Link href="/search">جست‌وجوی آگهی‌ها</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-card-gap lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <li key={item.listing.id} className="flex">
            <ListingCard
              listing={toCardListing(item.listing)}
              sold={item.listing.status !== 'ACTIVE'}
              action={<FavoriteButton listingId={item.listing.id} />}
              className="w-full"
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
    </div>
  );
}
