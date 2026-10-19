import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { AttributeList } from '@/components/listings/attribute-list';
import { ListingGallery } from '@/components/listings/gallery';
import { ListingGrid } from '@/components/listings/listing-grid';
import { SafetyNotice } from '@/components/listings/safety-notice';
import { SellerCard } from '@/components/listings/seller-card';
import { ShareButton } from '@/components/listings/share-button';
import { siteConfig } from '@/config/site';
import { ContactSection } from '@/features/contacts/components/contact-section';
import { FavoriteButton } from '@/features/favorites/components';
import {
  fetchListingDetailServer,
  fetchListingsServer,
  formatCondition,
  formatPrice,
  formatRelativeTime,
  formatStatus,
} from '@/features/listings';
import type { PublicListingDetail, PublicListingSummary } from '@/features/listings';
import { MobileContactBar } from '@/components/listings/mobile-contact-bar';
import { ReportDialog } from '@/features/reports/components/report-dialog';
import { ApiError } from '@/lib/api';

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await fetchListingDetailServer(slug);
    const description =
      detail.description.length > 160 ? `${detail.description.slice(0, 157)}…` : detail.description;
    return {
      title: detail.title,
      description,
      alternates: { canonical: `/listing/${detail.slug}` },
      // Sold listings should not draw search traffic as if they were buyable.
      robots: detail.status === 'SOLD' ? { index: false, follow: true } : undefined,
      openGraph: {
        title: detail.title,
        description,
        type: 'website',
        url: `${siteConfig.url}/listing/${detail.slug}`,
        ...(detail.primaryImage
          ? {
              images: [
                {
                  url: detail.primaryImage.url,
                  width: detail.primaryImage.width,
                  height: detail.primaryImage.height,
                  alt: detail.title,
                },
              ],
            }
          : {}),
      },
    };
  } catch {
    return { title: 'جزئیات آگهی', alternates: { canonical: `/listing/${slug}` } };
  }
}

/**
 * Listing detail contract (master prompt §23, anatomy §58): gallery → price →
 * title → meta → specs → description → seller → contact → share/report →
 * safety → related. Public page, Server Component; contact reveal and report
 * are the only client islands.
 */
export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params;

  let detail: PublicListingDetail;
  try {
    detail = await fetchListingDetailServer(slug);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.code === 'LISTING_NOT_FOUND')) {
      notFound();
    }
    throw error;
  }

  // Related listings: same category, honestly labeled. Degrades to an empty
  // section on failure — never fabricated (§18).
  let related: PublicListingSummary[] = [];
  try {
    const page = await fetchListingsServer({ category: detail.category.slug, limit: 9 });
    related = page.items.filter((item) => item.id !== detail.id).slice(0, 8);
  } catch {
    related = [];
  }

  const isSold = detail.status === 'SOLD';
  const publishedLabel = formatRelativeTime(detail.publishedAt ?? detail.createdAt);
  const absoluteUrl = `${siteConfig.url}/listing/${detail.slug}`;
  const itemCondition =
    detail.condition === 'NEW'
      ? 'https://schema.org/NewCondition'
      : 'https://schema.org/UsedCondition';
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: detail.title,
    description: detail.description,
    url: absoluteUrl,
    category: detail.category.name,
    ...(detail.images.length > 0 ? { image: detail.images.map((image) => image.url) } : {}),
    itemCondition,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl,
      seller: { '@type': 'Person', name: detail.seller.displayName },
      itemCondition,
      // Only assert availability when it is honestly known: a sold one-off is
      // out of stock; an active one-off keeps no stock claim (SEO-007 — no
      // fabricated live inventory).
      ...(isSold ? { availability: 'https://schema.org/OutOfStock' } : {}),
      // State a price/currency only for listings that are actually priced
      // (PAID). FREE / CONTACT listings carry no price claim.
      ...(detail.pricingType === 'PAID' && detail.price != null && detail.price > 0
        ? { price: String(detail.price), priceCurrency: detail.currency }
        : {}),
    },
  };

  return (
    <PageContainer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c') }}
      />
      <Breadcrumbs
        items={[
          { label: 'خانه', href: '/' },
          { label: detail.category.name, href: `/category/${detail.category.slug}` },
          { label: detail.title },
        ]}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <ListingGallery images={detail.images} title={detail.title} sold={isSold} />

          <section
            aria-label="خلاصهٔ آگهی"
            className="rounded-card border border-border bg-surface p-4 lg:p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-heading font-bold text-primary">
                {formatPrice(detail.price, detail.currency, detail.pricingType)}
              </p>
              {detail.negotiable && detail.pricingType === 'PAID' ? (
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-caption font-medium text-primary">
                  قابل مذاکره
                </span>
              ) : null}
              {isSold ? (
                <span className="rounded-full bg-foreground/80 px-2.5 py-1 text-caption font-medium text-surface">
                  {formatStatus(detail.status)}
                  {detail.soldAt ? ` · ${formatRelativeTime(detail.soldAt)}` : ''}
                </span>
              ) : null}
            </div>

            <h1 className="mt-2 break-words text-card-title font-bold text-foreground lg:text-heading">
              {detail.title}
            </h1>

            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground">
              <span>{formatCondition(detail.condition)}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {detail.city.name}، {detail.province.name}
              </span>
              {publishedLabel ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{publishedLabel}</span>
                </>
              ) : null}
            </p>
          </section>

          {detail.attributes.length > 0 ? (
            <section aria-labelledby="listing-attributes">
              <h2 id="listing-attributes" className="text-section font-semibold text-foreground">
                مشخصات
              </h2>
              <AttributeList attributes={detail.attributes} className="mt-3" />
            </section>
          ) : null}

          <section aria-labelledby="listing-description">
            <h2 id="listing-description" className="text-section font-semibold text-foreground">
              توضیحات
            </h2>
            <p className="mt-3 whitespace-pre-line break-words text-body text-foreground">
              {detail.description}
            </p>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-[4.5rem]">
          <SellerCard seller={detail.seller} />

          <section
            id="listing-contact-section"
            aria-labelledby="listing-contact"
            className="rounded-card border border-border bg-surface p-4"
          >
            <h2 id="listing-contact" className="text-card-title font-semibold text-foreground">
              راه‌های تماس
            </h2>
            <ContactSection
              listingId={detail.id}
              status={detail.status}
              contact={detail.contact}
              className="mt-3"
            />
          </section>

          <div className="flex flex-wrap gap-2">
            <ShareButton title={detail.title} url={absoluteUrl} className="flex-1" />
            <FavoriteButton listingId={detail.id} variant="inline" className="flex-1" />
            <ReportDialog listingId={detail.id} className="flex-1" />
          </div>

          <SafetyNotice />
        </aside>
      </div>

      <MobileContactBar
        priceLabel={formatPrice(detail.price, detail.currency, detail.pricingType)}
        isSold={isSold}
      />

      {related.length > 0 ? (
        <section aria-labelledby="related-listings" className="mt-10">
          <h2
            id="related-listings"
            className="text-section font-semibold text-foreground lg:text-heading"
          >
            سایر آگهی‌های {detail.category.name}
          </h2>
          <ListingGrid listings={related} className="mt-4" />
        </section>
      ) : null}
    </PageContainer>
  );
}
