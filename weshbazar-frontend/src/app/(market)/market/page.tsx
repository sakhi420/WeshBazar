import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutGrid, ArrowLeft, Plus, ShieldAlert, Search, MessageCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { CategoryShortcutGrid } from '@/components/discovery/category-shortcut-grid';
import { HomeSearchPanel } from '@/components/discovery/home-search-panel';
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
  alternates: { canonical: '/market' },
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

  return (
    <PageContainer className="space-y-5 md:space-y-8">
      <HomeSearchPanel />

      <section aria-label="چطور کار می‌کند" className="grid grid-cols-3 gap-2 md:gap-3 lg:grid-cols-3">
        <HomeStep
          href="/search"
          icon={Search}
          title="جست‌وجو کنید"
          description="با کلمه یا دسته، آگهی‌های نو و دست‌دوم را پیدا کنید."
        />
        <HomeStep
          href="/sell"
          icon={Plus}
          title="رایگان بفروشید"
          description="آگهی بگذارید و مستقیم با خریدار در تماس باشید."
        />
        <HomeStep
          href="/help/safety"
          icon={MessageCircle}
          title="امن معامله کنید"
          description="کالا را از نزدیک ببینید و در مکان عمومی معامله کنید."
        />
      </section>

      {/* Category discovery — subtle panel with a mobile auto-advancing carousel */}
      {catResult.status === 'ok' ? (
        <section
          aria-labelledby="categories-heading"
          className="space-y-3 rounded-2xl bg-primary-soft/25 px-3 py-3 sm:space-y-3 sm:px-4 sm:py-4"
        >
          <h2
            id="categories-heading"
            className="flex items-center gap-2 text-ui font-semibold text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary">
              <LayoutGrid className="size-4" aria-hidden />
            </span>
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
      <section aria-labelledby="latest-heading" className="space-y-2 md:space-y-3">
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

      <section className="relative overflow-hidden rounded-surface bg-accent px-4 py-5 text-center text-accent-foreground shadow-card sm:px-8 sm:py-9">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path fill="none" stroke="#0B2F2B" stroke-width="0.7" d="M14 2l1.6 10L26 14l-10.4 1.6L14 26l-1.6-10.4L2 14l10.4-1.6z"/></svg>`,
            )}")`,
            backgroundSize: '28px 28px',
          }}
        />
        <h2 className="relative text-xl font-bold sm:text-2xl">کالایی برای فروش دارید؟</h2>
        <p className="relative mx-auto mt-2 max-w-prose text-body sm:text-lg">
          آگهی خود را رایگان ثبت کنید و مستقیماً با خریداران در تماس باشید.
        </p>
        <Button asChild size="lg" className="relative mt-5 bg-primary-dark text-primary-foreground hover:bg-primary">
          <Link href="/sell">
            <Plus aria-hidden />
            <span className="font-semibold">ثبت آگهی رایگان</span>
          </Link>
        </Button>
      </section>

      {/* Safety */}
      <section className="rounded-surface border border-warning/25 bg-gradient-to-l from-surface to-warning/5 p-3 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
            <ShieldAlert className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-ui font-semibold text-foreground">
              <Link
                href="/help/safety"
                className="rounded-control hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                نکات ایمنی
              </Link>
            </h2>
            <ul className="mt-2 space-y-1 text-ui text-muted-foreground">
              <li>· قبل از پرداخت، کالا را از نزدیک بررسی کنید.</li>
              <li>· در مکان عمومی و امن معامله کنید.</li>
              <li>· از واریز پیش پرداخت خودداری کنید.</li>
              <li>· در صورت مشاهده تخلف، آگهی را گزارش دهید.</li>
            </ul>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

function HomeStep({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Search;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-surface border border-border bg-surface p-2 shadow-soft transition-all duration-small hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-4"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground md:size-10">
        <Icon className="size-4 md:size-5" aria-hidden />
      </span>
      <h2 className="mt-1 text-caption font-semibold text-foreground md:mt-3 md:text-ui">{title}</h2>
      <p className="mt-1 hidden text-caption text-muted-foreground md:block">{description}</p>
    </Link>
  );
}
