import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ErrorState } from '@/components/feedback/error-state';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { fetchCategoryDetailServer, fetchFilterSchemaServer } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';
import { fetchListingsServer } from '@/features/listings';
import type { PublicListingSummary } from '@/features/listings';
import { fetchProvincesServer } from '@/features/locations';
import { parseDiscoverySearchParams, toDiscoveryQuery, discoveryKey } from '@/features/search';
import { buildZeroResultRecovery, formatResultCount } from '@/features/search/zero-result';
import { ActiveFilterChips } from '@/features/search/components/active-filter-chips';
import { DiscoveryResults } from '@/features/search/components/discovery-results';
import {
  FilterPanelDesktop,
  MobileFilterSheet,
} from '@/features/search/components/filter-panel';
import { MobileKeywordSearch } from '@/features/search/components/mobile-keyword-search';
import { SortControl } from '@/features/search/components/sort-control';
import { ApiError, type CursorPage } from '@/lib/api';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const raw = await searchParams;
  const hasFacetParams = Object.keys(raw ?? {}).length > 0;
  try {
    const detail = await fetchCategoryDetailServer(slug);
    return {
      title: detail.name,
      description: detail.description ?? undefined,
      alternates: { canonical: `/category/${slug}` },
      // Faceted category URLs are crawl-noise: keep the canonical clean and the
      // facet variants out of the index (URL-003).
      robots: hasFacetParams ? { index: false, follow: true } : undefined,
    };
  } catch {
    return { title: 'دسته‌بندی' };
  }
}

function buildRetryHref(slug: string, raw: Record<string, string | string[] | undefined>): string {
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
  return qs ? `/category/${slug}?${qs}` : `/category/${slug}`;
}

/**
 * Category page (master prompt §22): category discovery with dynamic filters
 * built from the category's effective filter-schema. The route owns the
 * category; the URL owns every other filter.
 */
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);

  let detail;
  try {
    detail = await fetchCategoryDetailServer(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const state = parseDiscoverySearchParams(raw);
  const query = toDiscoveryQuery(state, { category: slug });

  const [listings, provinces, filterSchema] = await Promise.all([
    fetchListingsServer(query)
      .then((page): { page: CursorPage<PublicListingSummary> | null; requestId: string | null } => ({
        page,
        requestId: null,
      }))
      .catch((error: unknown) => ({
        page: null,
        requestId: error instanceof ApiError ? (error.requestId ?? null) : null,
      })),
    fetchProvincesServer().catch(() => []),
    fetchFilterSchemaServer(detail.id).catch(() => []),
  ]);

  const recovery =
    listings.page && listings.page.items.length === 0
      ? buildZeroResultRecovery(query, {
          basePath: `/category/${slug}`,
          categoryOwnedByRoute: true,
        })
      : [];

  const breadcrumbItems = [
    { label: 'خانه', href: '/market' },
    ...detail.ancestors.map((ancestor) => ({
      label: ancestor.name,
      href: `/category/${ancestor.slug}`,
    })),
    { label: detail.name },
  ];

  return (
    <PageContainer>
      <Breadcrumbs items={breadcrumbItems} />
      <h1 className="mt-3 text-heading font-bold text-foreground">{detail.name}</h1>
      {detail.description ? (
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">{detail.description}</p>
      ) : null}

      {detail.children.length > 0 ? (
        <section aria-label="زیردسته‌ها" className="mt-4">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {detail.children.map((child) => {
              const Icon = categoryIcon(child.iconKey);
              return (
                <li key={child.id}>
                  <Link
                    href={`/category/${child.slug}`}
                    className="flex w-full flex-col items-center justify-center gap-1.5 rounded-card border border-border bg-surface px-2 py-3 text-center shadow-soft transition-all duration-small hover:border-primary/20 hover:bg-primary-soft/60 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="line-clamp-2 text-caption leading-4 text-foreground">
                      {child.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
        <FilterPanelDesktop provinces={provinces} filterSchema={filterSchema} />

        <div className="min-w-0">
          <Suspense fallback={null}>
            <div className="space-y-3">
              <MobileKeywordSearch />
              <div className="flex items-center gap-2">
                <MobileFilterSheet
                  provinces={provinces}
                  filterSchema={filterSchema}
                  className="shrink-0"
                />
                <SortControl className="min-w-0 flex-1 sm:max-w-48" />
              </div>
            </div>
          </Suspense>

          <ActiveFilterChips
            provinces={provinces}
            filterSchema={filterSchema}
            className="mt-3"
          />

          {listings.page && listings.page.items.length > 0 ? (
            <p className="mt-4 text-ui text-muted-foreground">
              {formatResultCount(listings.page.items.length, listings.page.hasMore, listings.page.total)}
            </p>
          ) : null}

          <div className="mt-4">
            {listings.page !== null ? (
              <DiscoveryResults
                key={discoveryKey(query)}
                query={query}
                initialPage={listings.page}
                emptyTitle="آگهی‌ای در این دسته پیدا نشد"
                emptyDescription="فیلترها را تغییر دهید یا دستهٔ دیگری را ببینید."
                emptyAction={
                  recovery.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {recovery.map((action, index) => (
                        <Button
                          key={action.href}
                          asChild
                          variant={index === recovery.length - 1 ? 'default' : 'outline'}
                        >
                          <Link href={action.href}>{action.label}</Link>
                        </Button>
                      ))}
                    </div>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ErrorState className="w-full" requestId={listings.requestId ?? undefined} />
                <Button asChild variant="outline">
                  <Link href={buildRetryHref(slug, raw)}>تلاش دوباره</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
