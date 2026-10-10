import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ErrorState } from '@/components/feedback/error-state';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { fetchCategoryDetailServer, fetchFilterSchemaServer } from '@/features/categories';
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
import { SortControl } from '@/features/search/components/sort-control';
import { ApiError, type CursorPage } from '@/lib/api';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await fetchCategoryDetailServer(slug);
    return {
      title: detail.name,
      description: detail.description ?? undefined,
      alternates: { canonical: `/category/${slug}` },
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

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
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
          <ul className="flex flex-wrap gap-2">
            {detail.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/category/${child.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-ui text-foreground transition-colors duration-small hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-9"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
        <FilterPanelDesktop provinces={provinces} filterSchema={filterSchema} />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MobileFilterSheet
              provinces={provinces}
              filterSchema={filterSchema}
              className="shrink-0"
            />
            <SortControl className="min-w-0 flex-1 sm:max-w-48" />
          </div>

          <ActiveFilterChips
            provinces={provinces}
            filterSchema={filterSchema}
            className="mt-3"
          />

          <div className="mt-4">
            {listings.page !== null ? (
              <DiscoveryResults
                key={JSON.stringify(query)}
                query={query}
                initialPage={listings.page}
                emptyTitle="آگهی‌ای در این دسته پیدا نشد"
                emptyDescription="فیلترها را تغییر دهید یا دستهٔ دیگری را ببینید."
                emptyAction={
                  <Button asChild variant="outline">
                    <Link href={`/category/${slug}`}>پاک کردن فیلترها</Link>
                  </Button>
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
