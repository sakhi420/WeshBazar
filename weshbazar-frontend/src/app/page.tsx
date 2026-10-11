import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, LayoutGrid, ArrowLeft, Plus, ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/layout/section-header';
import { ApiError } from '@/lib/api';
import { siteConfig } from '@/config/site';
import { fetchCategoriesServer, type CategorySummary } from '@/features/categories';
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
    return {
      status: 'error',
      requestId: error instanceof ApiError ? error.requestId : undefined,
    };
  }
}

export default async function HomePage() {
  const [catResult, listResult] = await Promise.all([loadCategories(), loadLatestListings()]);
  const topCategories = catResult.status === 'ok' ? catResult.categories.slice(0, 8) : [];
  const hasMoreCategories = catResult.status === 'ok' && catResult.categories.length > 8;

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

        {catResult.status === 'ok' ? (
          <div className="flex flex-wrap gap-2">
            {topCategories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="flex h-control items-center justify-center rounded-card border border-border bg-surface px-3 text-center text-ui font-medium text-foreground transition-colors duration-small hover:border-primary hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="truncate">{cat.name}</span>
                </Link>
              </li>
            ))}
          </div>
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
      </section>

      {/* Latest listings */}
      <section aria-labelledby="latest-heading" className="space-y-3">
        <SectionHeader
          id="latest-heading"
          title="آخرین آگهی‌ها"
          action={
            <Link href="/search?sort=newest" className="inline-flex items-center gap-1 rounded-control text-ui text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              مشاهده همه
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          }
        />
        {listResult.status === 'ok' ? (
          <ListingGrid listings={listResult.listings} />
        ) : null}
        {listResult.status === 'empty' ? (
          <EmptyState title="هنوز آگهی‌ای ثبت نشده است" description="اولین آگهی را شما ثبت کنید!" />
        ) : null}
        {listResult.status === 'error' ? (
          <ErrorState title="آگهی‌ها بارگذاری نشد" description="در حال حاضر امکان دریافت آگهی‌ها وجود ندارد." requestId={listResult.requestId} />
        ) : null}
      </section>

      {/* Sell CTA */}
      <section className="rounded-surface border border-border bg-surface p-4 text-center sm:p-6">
        <h2 className="text-section font-semibold text-foreground">کالایی برای فروش دارید؟</h2>
        <p className="mt-1 mx-auto max-w-prose text-body text-muted-foreground">
          آگهی خود را رایگان ثبت کنید و مستقیماً با خریداران در تماس باشید.
        </p>
        <Button asChild variant="accent" size="lg" className="mt-4">
          <Link href="/sell"><Plus aria-hidden /><span>ثبت آگهی رایگان</span></Link>
        </Button>
      </section>

      {/* Safety */}
      <section className="rounded-surface border border-border bg-surface p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 shrink-0 text-warning" aria-hidden />
          <div>
            <h2 className="text-ui font-semibold text-foreground">نکات ایمنی</h2>
            <ul className="mt-2 space-y-1 text-ui text-muted-foreground">
              <li>·  قبل از پرداخت، کالا را از نزدیک بررسی کنید.</li>
              <li>·  در مکان عمومی و امن معامله کنید.</li>
              <li>·  از واریز بیعانه خودداری کنید.</li>
              <li>·  در صورت مشاهده تخلف، آگهی را گزارش دهید.</li>
            </ul>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
