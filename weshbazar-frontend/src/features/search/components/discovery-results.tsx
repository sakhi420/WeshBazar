'use client';

/**
 * Cursor-paginated discovery results (master prompt §21–22, §121).
 *
 * The first page is server-rendered and handed in as `initialData`; "load
 * more" follows the opaque cursor via TanStack Query. The parent re-keys this
 * component with the resolved query, so a URL change starts a clean session.
 */

import type { ReactNode } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/listings/listing-grid';
import { fetchListings } from '@/features/listings';
import type { DiscoveryQuery, PublicListingSummary } from '@/features/listings';
import { queryKeys, type CursorPage } from '@/lib/api';

interface DiscoveryResultsProps {
  /** Resolved API query without a cursor — doubles as the query-key identity. */
  query: DiscoveryQuery;
  initialPage: CursorPage<PublicListingSummary>;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

export function DiscoveryResults({
  query,
  initialPage,
  emptyTitle = 'آگهی‌ای پیدا نشد',
  emptyDescription = 'کلیدواژه یا فیلترها را تغییر دهید و دوباره تلاش کنید.',
  emptyAction,
}: DiscoveryResultsProps) {
  const result = useInfiniteQuery({
    queryKey: queryKeys.listings.discovery(query),
    queryFn: ({ pageParam }) => fetchListings({ ...query, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    initialData: { pages: [initialPage], pageParams: [null] },
    staleTime: 30_000,
  });

  const listings = result.data.pages.flatMap((page) => page.items);

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ListingGrid listings={listings} />
      <div className="flex flex-col items-center gap-2">
        {result.isFetchNextPageError ? (
          <>
            <p className="text-ui text-muted-foreground">بارگیری موارد بیشتر ناموفق بود.</p>
            <Button variant="outline" onClick={() => void result.fetchNextPage()}>
              تلاش دوباره
            </Button>
          </>
        ) : result.hasNextPage ? (
          <Button
            variant="outline"
            className="min-w-40"
            disabled={result.isFetchingNextPage}
            onClick={() => void result.fetchNextPage()}
          >
            {result.isFetchingNextPage ? <Loader2 className="animate-spin" aria-hidden /> : null}
            نمایش موارد بیشتر
          </Button>
        ) : (
          <p className="text-caption text-muted-foreground">همهٔ آگهی‌ها نمایش داده شد.</p>
        )}
      </div>
    </div>
  );
}
