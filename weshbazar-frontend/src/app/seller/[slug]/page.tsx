import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, SearchX, UserRound } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { formatMonthYear, formatNumber } from '@/features/listings';
import { fetchSellerProfileServer } from '@/features/sellers';
import type { PublicSellerProfile } from '@/features/sellers';
import { ApiError } from '@/lib/api';

interface SellerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const profile = await fetchSellerProfileServer(slug);
    const description =
      profile.bio ?? `پروفایل فروشنده ${profile.displayName} در ویش‌بازار.`;
    return {
      title: profile.displayName,
      description: description.length > 160 ? `${description.slice(0, 157)}…` : description,
      alternates: { canonical: `/seller/${profile.slug}` },
    };
  } catch {
    return { title: 'پروفایل فروشنده', alternates: { canonical: `/seller/${slug}` } };
  }
}

/**
 * Seller profile contract (master prompt §24). The frozen v1.0.0 contract
 * exposes only GET /sellers/{slug} — no seller-listings read — so this page
 * renders the profile honestly and routes browsing to discovery instead of
 * fabricating a listing grid (AGENTS.md: never invent unsupported features).
 */
export default async function SellerPage({ params }: SellerPageProps) {
  const { slug } = await params;

  let profile: PublicSellerProfile;
  try {
    profile = await fetchSellerProfileServer(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const memberSinceLabel = formatMonthYear(profile.memberSince);
  const hasActiveListings = profile.activeListingCount > 0;

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: 'خانه', href: '/' }, { label: profile.displayName }]}
      />

      <section
        aria-labelledby="seller-profile-title"
        className="mt-4 rounded-card border border-border bg-surface p-5"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserRound className="size-8" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <h1
              id="seller-profile-title"
              className="break-words text-heading font-bold text-foreground"
            >
              {profile.displayName}
            </h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground">
              {memberSinceLabel ? <span>عضو از {memberSinceLabel}</span> : null}
              {profile.phoneVerified ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  شماره تأییدشده
                </span>
              ) : null}
              <span aria-hidden>·</span>
              <span>
                {hasActiveListings
                  ? `${formatNumber(profile.activeListingCount)} آگهی فعال`
                  : 'بدون آگهی فعال'}
              </span>
            </p>
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-4 whitespace-pre-line break-words text-body text-foreground">
            {profile.bio}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="seller-listings-title" className="mt-6">
        <h2
          id="seller-listings-title"
          className="text-section font-semibold text-foreground lg:text-heading"
        >
          آگهی‌های فروشنده
        </h2>
        <EmptyState
          className="mt-4"
          icon={SearchX}
          title={
            hasActiveListings
              ? 'فهرست آگهی‌ها در این صفحه نمایش داده نمی‌شود'
              : 'این فروشنده در حال حاضر آگهی فعالی ندارد'
          }
          description={
            hasActiveListings
              ? `این فروشنده ${formatNumber(profile.activeListingCount)} آگهی فعال دارد؛ برای دیدن آن‌ها از جست‌وجو استفاده کنید.`
              : 'می‌توانید سایر آگهی‌های بازار را در صفحهٔ جست‌وجو ببینید.'
          }
          action={
            <Button asChild>
              <Link href="/search">جست‌وجوی آگهی‌ها</Link>
            </Button>
          }
        />
      </section>
    </PageContainer>
  );
}
