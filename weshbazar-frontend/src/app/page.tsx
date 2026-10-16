import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutGrid, ArrowLeft, Plus, ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { CategoryShortcutGrid } from '@/components/discovery/category-shortcut-grid';
import { LocationPicker } from '@/components/location/location-picker';
import { SearchField } from '@/features/search/components/search-field';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/layout/section-header';
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
  alternates: { canonical: '/' },
};

// Revalidate the public home feed; category data changes rarely.
export const revalidate = 300;

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
    // Offline/unreachable backend under SSR: degrade to an empty feed instead
    // of letting the node thread hang. Real API failures stay honest.
    if (error instanceof ApiError && error.isNetworkError) return { status: 'empty' };
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
    // Offline/unreachable backend under SSR: degrade to an empty feed instead
    // of letting the node thread hang. Real API failures stay honest.
    if (error instanceof ApiError && error.isNetworkError) return { status: 'empty' };
    return {
      status: 'error',
      requestId: error instanceof ApiError ? error.requestId : undefined,
    };
  }
}

export default async function HomePage() {
  const [catResult, listResult] = await Promise.all([loadCategories(), loadLatestListings()]);
  const topCategories = catResult.status === 'ok' ? orderHomeCategories(catResult.categories) : [];

  return (
    <PageContainer className="space-y-8">
      {/* Search-first opening viewport (§16, §55). Enhanced with stronger gradient and visual hierarchy. */}
      <section className="animate-fade-up relative overflow-hidden rounded-surface border border-primary/20 bg-gradient-to-br from-primary-soft/70 via-primary-soft/30 to-surface p-6 shadow-card sm:p-10">
        {/* Decorative gradient orbs — enhanced visibility */}
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-accent/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -start-16 -bottom-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        
        <h1 className="relative text-3xl font-extrabold leading-tight text-foreground sm:text-4xl lg:text-[2.5rem]">
          بازار خرید و فروش در افغانستان
        </h1>
        <p className="relative mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          اجناس نو و دست‌دوم را در شهر خود جست‌وجو کنید، یا آگهی خود را رایگان ثبت کنید و مستقیم با فروشنده در تماس باشید.
        </p>

        <Suspense fallback={null}>
          <SearchField className="relative mt-6 w-full" redirectToSearch />
          <LocationPicker className="relative mt-3 sm:absolute sm:end-8 sm:top-auto sm:mt-0" redirectToSearch />
        </Suspense>
      </section>

      {/* Category discovery — compact one-row pills (§108) */}
      {catResult.status === 'ok' ? (
        <section aria-labelledby="categories-heading" className="space-y-2">
          <h2
            id="categories-heading"
            className="flex items-center gap-2 text-section font-semibold"
          >
            <LayoutGrid className="size-5 text-primary" aria-hidden />
            دسته‌بندی‌ها
          </h2>
          <CategoryShortcutGrid categories={topCategories} />
        </section>
      ) : null}
      {catResult.status === 'empty' ? (
        <EmptyState
          icon={LayoutGrid}
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

      {/* Latest listings */}
      <section aria-labelledby="latest-heading" className="space-y-3">
        <SectionHeader
          id="latest-heading"
          title="آخرین آگهی‌ها"
          action={
            <Link
              href="/search?sort=newest"
              className="inline-flex items-center gap-1 rounded-control text-ui text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              مشاهده همه
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          }
        />
        {listResult.status === 'ok' ? <ListingGrid listings={listResult.listings} /> : null}
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

      {/* Sell CTA — Enhanced with gradient background and stronger visual presence */}
      <section className="relative overflow-hidden rounded-surface border border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-surface p-6 text-center shadow-card sm:p-8">
        {/* Decorative accent gradient */}
        <div aria-hidden className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-accent/20 blur-2xl" />
        
        <h2 className="relative text-xl font-bold text-foreground sm:text-2xl">
          کالایی برای فروش دارید؟
        </h2>
        <p className="relative mx-auto mt-2 max-w-prose text-body text-muted-foreground sm:text-lg">
          آگهی خود را رایگان ثبت کنید و مستقیماً با خریداران در تماس باشید.
        </p>
        <Button asChild variant="accent" size="lg" className="relative mt-5 shadow-md hover:shadow-lg">
          <Link href="/sell">
            <Plus aria-hidden />
            <span className="font-semibold">ثبت آگهی رایگان</span>
          </Link>
        </Button>
      </section>

      {/* Safety */}
      <section className="rounded-surface border border-border bg-surface p-4 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 shrink-0 text-warning" aria-hidden />
          <div>
            <h2 className="text-ui font-semibold text-foreground">نکات ایمنی</h2>
            <ul className="mt-2 space-y-1 text-ui text-muted-foreground">
              <li>· قبل از پرداخت، کالا را از نزدیک بررسی کنید.</li>
              <li>· در مکان عمومی و امن معامله کنید.</li>
              <li>· از واریز بیعانه خودداری کنید.</li>
              <li>· در صورت مشاهده تخلف، آگهی را گزارش دهید.</li>
            </ul>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
