import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { ListingGrid } from '@/components/listings/listing-grid';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { formatMonthYear, formatNumber } from '@/features/listings';
import type { PublicListingSummary } from '@/features/listings';
import { fetchSellerListingsServer, fetchSellerProfileServer } from '@/features/sellers';
import type { PublicSellerProfile } from '@/features/sellers';
import { ApiError } from '@/lib/api';

interface SellerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [profile, listings] = await Promise.all([
      fetchSellerProfileServer(slug),
      fetchSellerListingsServer(slug, { limit: 12 }),
    ]);
    const description =
      profile.bio ?? `پروفایل فروشنده ${profile.displayName} در ویش‌بازار.`;
    const cover = listings.items[0]?.primaryImage?.url;
    return {
      title: profile.displayName,
      description: description.length > 160 ? `${description.slice(0, 157)}…` : description,
      alternates: { canonical: `/seller/${profile.slug}` },
      openGraph: {
        title: profile.displayName,
        description,
        type: 'website',
        url: `${siteConfig.url}/seller/${profile.slug}`,
        ...(cover ? { images: [{ url: cover, alt: profile.displayName }] } : {}),
      },
    };
  } catch {
    return { title: 'پروفایل فروشنده', alternates: { canonical: `/seller/${slug}` } };
  }
}

/**
 * Seller profile + ACTIVE listings (master prompt §24). `GET /sellers/{slug}`
 * returns the profile; `GET /sellers/{slug}/listings` returns the first page of
 * the seller's live listings. The grid degrades to EmptyState on failure and is
 * never fabricated (AGENTS.md: never invent unsupported features).
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

  // The seller's live ACTIVE listings (first page). Degrades to an empty grid
  // on a backend failure — never fabricated.
  let listings: PublicListingSummary[] = [];
  try {
    const page = await fetchSellerListingsServer(slug);
    listings = page.items;
  } catch {
    listings = [];
  }

  const memberSinceLabel = formatMonthYear(profile.memberSince);
  const hasActiveListings = profile.activeListingCount > 0;

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: 'خانه', href: '/market' }, { label: profile.displayName }]}
      />

      <section
        aria-labelledby="seller-profile-title"
        className="mt-4 rounded-card border border-border bg-surface p-5"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar name={profile.displayName} src={profile.avatarUrl ?? null} size="xl" />
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
        {listings.length > 0 ? (
          <ListingGrid listings={listings} className="mt-4" />
        ) : (
          <EmptyState
            className="mt-4"
            icon={SearchX}
            title="این فروشنده در حال حاضر آگهی فعالی ندارد"
            description="می‌توانید سایر آگهی‌های بازار را در صفحهٔ جست‌وجو ببینید."
            action={
              <Button asChild>
                <Link href="/search">جست‌وجوی آگهی‌ها</Link>
              </Button>
            }
          />
        )}
      </section>
    </PageContainer>
  );
}
