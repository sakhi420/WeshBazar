import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { CategoryShortcutGrid } from '@/components/discovery/category-shortcut-grid';
import { HomeSearchPanel } from '@/components/discovery/home-search-panel';
import { ApiError } from '@/lib/api';
import { siteConfig } from '@/config/site';
import {
  fetchCategoriesServer,
  orderHomeCategories,
  type CategorySummary,
} from '@/features/categories';
import { fetchListingsServer, type PublicListingSummary } from '@/features/listings';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: { canonical: '/market' },
};

// Revalidate the public home feed; category data changes rarely.
export const revalidate = 300;

const ALL_LISTINGS_HREF = '/search?sort=newest';

type CategoriesResult =
  | { status: 'ok'; categories: CategorySummary[] }
  | { status: 'empty' }
  | { status: 'error'; requestId?: string };

type ListingsResult =
  | { status: 'ok'; listings: PublicListingSummary[] }
  | { status: 'empty' }
  | { status: 'error'; requestId?: string };

async function loadCategories(): Promise<CategoriesResult> {
  try {
    const categories = await fetchCategoriesServer();
    if (!Array.isArray(categories) || categories.length === 0) return { status: 'empty' };
    return { status: 'ok', categories };
  } catch (error) {
    // Any failure (network or API) is an error state — never masquerade a
    // broken backend as "no categories yet" (audit F-02).
    return {
      status: 'error',
      requestId: error instanceof ApiError ? error.requestId : undefined,
    };
  }
}

async function loadLatestListings(): Promise<ListingsResult> {
  try {
    const page = await fetchListingsServer({ sort: 'newest', limit: 12 });
    if (!page.items || page.items.length === 0) return { status: 'empty' };
    return { status: 'ok', listings: page.items };
  } catch (error) {
    // Any failure (network or API) is an error state — never masquerade a
    // broken backend as "no listings yet" (audit F-02).
    return {
      status: 'error',
      requestId: error instanceof ApiError ? error.requestId : undefined,
    };
  }
}

export default async function HomePage() {
  const [catResult, listResult] = await Promise.all([loadCategories(), loadLatestListings()]);
  const topCategories = catResult.status === 'ok' ? orderHomeCategories(catResult.categories) : [];
  const latestCount = listResult.status === 'ok' ? listResult.listings.length : 0;
  const latestCountLabel = latestCount.toLocaleString('fa-AF');

  return (
    <PageContainer className="space-y-7 md:space-y-10">
      <HomeSearchPanel />

      {catResult.status === 'ok' ? (
        <CategoryShortcutGrid categories={topCategories} />
      ) : null}
      {catResult.status === 'empty' ? (
        <EmptyState
          icon={Search}
          title="هنوز دسته‌بندی‌ای وجود ندارد"
          description="به‌محض فعال شدن دسته‌بندی‌ها از سوی مدیران، اینجا نمایش داده می‌شوند."
        />
      ) : null}
      {catResult.status === 'error' ? (
        <ErrorState
          title="دسته‌بندی‌ها بارگذاری نشد"
          description="در حال حاضر امکان دریافت دسته‌بندی‌ها از سرور وجود ندارد. کمی بعد دوباره تلاش کنید."
          requestId={catResult.requestId}
        />
      ) : null}

      <section aria-labelledby="latest-heading" className="space-y-4 md:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-primary">تازه از بازار</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id="latest-heading" className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                آخرین آگهی‌ها
              </h2>
              {listResult.status === 'ok' ? (
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary-soft px-3 py-1 text-[11px] font-bold text-primary">
                  {latestCountLabel} آگهی تازه
                </span>
              ) : null}
            </div>
            <p className="text-xs leading-6 text-muted-foreground sm:text-sm">
              تازه‌ترین آگهی‌هایی که در ویش‌بازار ثبت شده‌اند.
            </p>
          </div>

          <Link
            href={ALL_LISTINGS_HREF}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-2.5 text-xs font-bold text-primary transition-colors hover:border-primary/35 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:shrink-0"
          >
            مشاهده همه آگهی‌ها
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>

        {listResult.status === 'ok' ? (
          <>
            <ListingGrid listings={listResult.listings} />

            <div className="relative isolate flex flex-col gap-4 overflow-hidden rounded-[1.4rem] border border-primary/15 bg-gradient-to-l from-primary-soft via-surface to-amber-50/75 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
              <div
                aria-hidden
                className="pointer-events-none absolute -end-8 -top-12 size-36 rounded-full bg-primary/10 blur-2xl"
              />
              <div className="relative flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <Search className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-foreground sm:text-base">
                    هنوز دنبال گزینهٔ مناسب می‌گردی؟
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">
                    این بخش فقط پیش‌نمایشی از {latestCountLabel} آگهی تازه است؛ برای دیدن فهرست کامل و جست‌وجو میان آگهی‌ها ادامه بده.
                  </p>
                </div>
              </div>
              <Link
                href={ALL_LISTINGS_HREF}
                className="relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                رفتن به فهرست کامل
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </>
        ) : null}

        {listResult.status === 'empty' ? (
          <EmptyState title="هنوز آگهی‌ای ثبت نشده است" description="اولین آگهی را شما ثبت کنید!" />
        ) : null}
        {listResult.status === 'error' ? (
          <ErrorState
            title="آگهی‌ها بارگذاری نشد"
            description="در حال حاضر امکان دریافت آگهی‌ها وجود ندارد."
            requestId={listResult.requestId}
          />
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-[1.25rem] border border-warning/25 bg-gradient-to-l from-warning/10 via-surface to-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <ShieldAlert className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">معاملهٔ امن را جدی بگیر</h2>
            <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">
              پیش از پرداخت، کالا را از نزدیک بررسی کن و در مکان عمومی معامله کن.
            </p>
          </div>
        </div>
        <Link
          href="/help/safety"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold text-warning transition-colors hover:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          راهنمای ایمنی
          <ArrowLeft className="size-3.5" aria-hidden />
        </Link>
      </section>
    </PageContainer>
  );
}
