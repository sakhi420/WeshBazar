import type { Metadata } from 'next';
import Link from 'next/link';
import { ErrorState } from '@/components/feedback/error-state';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { fetchCategoriesServer } from '@/features/categories';
import { fetchListingsServer } from '@/features/listings';
import type { PublicListingSummary } from '@/features/listings';
import { fetchProvincesServer } from '@/features/locations';
import { parseDiscoverySearchParams, toDiscoveryQuery } from '@/features/search';
import { ActiveFilterChips } from '@/features/search/components/active-filter-chips';
import { DiscoveryResults } from '@/features/search/components/discovery-results';
import {
  FilterPanelDesktop,
  MobileFilterSheet,
} from '@/features/search/components/filter-panel';
import { SearchField } from '@/features/search/components/search-field';
import { SortControl } from '@/features/search/components/sort-control';
import { ApiError, type CursorPage } from '@/lib/api';

export const metadata: Metadata = {
  title: 'جست‌وجو',
  alternates: { canonical: '/search' },
};

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildRetryHref(raw: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `/search?${qs}` : '/search';
}

/**
 * Search page (master prompt §21): keyword + filter-driven discovery.
 * URL state is the single source of truth; the first page of results is
 * server-rendered from the same URL grammar the client components write.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = await searchParams;
  const state = parseDiscoverySearchParams(raw);
  const query = toDiscoveryQuery(state);

  const [listings, categories, provinces] = await Promise.all([
    fetchListingsServer(query)
      .then((page): { page: CursorPage<PublicListingSummary> | null; requestId: string | null } => ({
        page,
        requestId: null,
      }))
      .catch((error: unknown) => ({
        page: null,
        requestId: error instanceof ApiError ? (error.requestId ?? null) : null,
      })),
    fetchCategoriesServer().catch(() => []),
    fetchProvincesServer().catch(() => []),
  ]);

  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">جست‌وجو</h1>
      <SearchField className="mt-4 max-w-2xl" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
        <FilterPanelDesktop provinces={provinces} categories={categories} />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MobileFilterSheet
              provinces={provinces}
              categories={categories}
              className="shrink-0"
            />
            <SortControl className="min-w-0 flex-1 sm:max-w-48" />
          </div>

          <ActiveFilterChips
            provinces={provinces}
            categories={categories}
            className="mt-3"
          />

          <div className="mt-4">
            {listings.page !== null ? (
              <DiscoveryResults
                key={JSON.stringify(query)}
                query={query}
                initialPage={listings.page}
                emptyAction={
                  <Button asChild variant="outline">
                    <Link href="/search">پاک کردن فیلترها</Link>
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ErrorState className="w-full" requestId={listings.requestId ?? undefined} />
                <Button asChild variant="outline">
                  <Link href={buildRetryHref(raw)}>تلاش دوباره</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
