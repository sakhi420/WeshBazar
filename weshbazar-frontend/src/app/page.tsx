import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, LayoutGrid, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { ApiError } from '@/lib/api';
import { siteConfig } from '@/config/site';
import { fetchCategoriesServer, type CategorySummary } from '@/features/categories';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: { canonical: '/' },
};

// Revalidate the public home feed; category data changes rarely.
export const revalidate = 300;

type CategoriesResult =
  | { status: 'ok'; categories: CategorySummary[] }
  | { status: 'empty' }
  | { status: 'error'; requestId?: string };

async function loadCategories(): Promise<CategoriesResult> {
  try {
    const categories = await fetchCategoriesServer();
    if (!Array.isArray(categories) || categories.length === 0) return { status: 'empty' };
    return { status: 'ok', categories };
  } catch (error) {
    // Never fabricate data on failure — surface an honest error state (§19).
    return {
      status: 'error',
      requestId: error instanceof ApiError ? error.requestId : undefined,
    };
  }
}

export default async function HomePage() {
  const result = await loadCategories();

  return (
    <PageContainer className="space-y-8">
      {/* Compact, search-first opening viewport (§16). No giant hero banner. */}
      <section className="rounded-surface border border-border bg-surface p-4 sm:p-6">
        <h1 className="text-display-mobile font-bold text-foreground sm:text-heading">
          بازار خرید و فروش در افغانستان
        </h1>
        <p className="mt-2 max-w-prose text-body text-muted-foreground">
          اجناس نو و دست‌دوم را در شهر خود جست‌وجو کنید، یا آگهی خود را رایگان ثبت کنید و مستقیم با
          فروشنده در تماس باشید.
        </p>

        <Link
          href="/search"
          className="mt-4 flex h-control-lg w-full items-center gap-2 rounded-control border border-input bg-background px-4 text-muted-foreground transition-colors duration-small hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Search className="size-5 shrink-0" aria-hidden />
          <span className="text-body">جست‌وجوی آگهی‌ها…</span>
        </Link>
      </section>

      {/* Category discovery */}
      <section aria-labelledby="categories-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="categories-heading" className="flex items-center gap-2 text-section font-semibold">
            <LayoutGrid className="size-5 text-primary" aria-hidden />
            دسته‌بندی‌ها
          </h2>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 rounded-control text-ui text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            مشاهده همه
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>

        {result.status === 'ok' ? (
          <ul className="grid grid-cols-2 gap-card-gap xs:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {result.categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex h-control items-center justify-center rounded-card border border-border bg-surface px-3 text-center text-ui font-medium text-foreground transition-colors duration-small hover:border-primary hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="truncate">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {result.status === 'empty' ? (
          <EmptyState
            icon={LayoutGrid}
            title="هنوز دسته‌بندی‌ای وجود ندارد"
            description="به‌محض فعال شدن دسته‌بندی‌ها از سوی مدیران، اینجا نمایش داده می‌شوند."
          />
        ) : null}

        {result.status === 'error' ? (
          <ErrorState
            title="دسته‌بندی‌ها بارگذاری نشد"
            description="در حال حاضر امکان دریافت دسته‌بندی‌ها از سرور وجود ندارد. کمی بعد دوباره تلاش کنید."
            requestId={result.requestId}
          />
        ) : null}
      </section>
    </PageContainer>
  );
}
