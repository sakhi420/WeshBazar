import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatCondition, formatPrice, formatRelativeTime, pickImageVariant } from '@/features/listings';
import type { PublicListingSummary } from '@/features/listings';

interface ListingCardProps {
  listing: PublicListingSummary;
  /** Floating control anchored at the image corner (e.g. §112 FavoriteButton). */
  action?: ReactNode;
  /** Shows the «فروخته شد» badge — favorites can include sold listings (§30). */
  sold?: boolean;
  className?: string;
}

/**
 * Compact product card (master prompt §109, §452, §112): Enhanced visual design
 * with stronger hierarchy, larger price, improved placeholder, and better hover effects.
 * 
 * The card body is one link; the optional `action` slot floats above it as a sibling —
 * no nested interactive elements.
 *
 * Discovery only returns ACTIVE listings; `sold` is set by the favorites view.
 */
export function ListingCard({ listing, action, sold = false, className }: ListingCardProps) {
  const image = listing.primaryImage ? pickImageVariant(listing.primaryImage, 'thumbnail') : null;
  const priceLabel = formatPrice(listing.price, listing.currency, listing.pricingType);

  return (
    <div className={cn('group relative h-full', className)}>
      <Link
        href={`/listing/${listing.slug}`}
        onClick={() => {
          void import('@/features/search/telemetry').then(({ recordSearchEvent }) =>
            recordSearchEvent({ type: 'listing_card_opened', listingId: listing.slug }),
          );
        }}
        className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-soft transition-all duration-small hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* Image Section — Enhanced with gradient overlay for no-image state */}
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gradient-to-br from-primary-soft via-primary-soft/30 to-surface">
          {image ? (
            <>
              <Image
                fill
                src={image.url}
                alt=""
                sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-medium group-hover:scale-105"
                loading="lazy"
              />
              {/* Subtle gradient overlay on hover for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-small group-hover:opacity-100" />
            </>
          ) : (
            <span className="relative flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-soft/70 via-primary-soft/30 to-surface">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 48 48"
                  className="size-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="5" y="9" width="38" height="30" rx="4" />
                  <circle cx="16" cy="18" r="3" />
                  <path d="M9 35l10-10 7 7 7-7 9 9" />
                </svg>
              </span>
              <span className="text-caption font-medium text-muted-foreground">بدون تصویر</span>
            </span>
          )}
          {sold ? (
            <span className="absolute bottom-2 start-2 rounded-control bg-danger/90 px-2.5 py-1 text-caption font-semibold text-white shadow-sm">
              فروخته شد
            </span>
          ) : null}
        </div>

        {/* Content Section — Enhanced typography hierarchy */}
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          {/* Title — Larger and more prominent */}
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
            {listing.title}
          </h3>
          
          {/* Price — Significantly larger and bold for visual impact */}
          <p className="truncate text-[1.25rem] font-bold leading-tight text-primary">
            {priceLabel}
          </p>
          
          {/* Negotiable badge */}
          {listing.negotiable && listing.pricingType === 'PAID' ? (
            <span className="inline-flex w-fit items-center rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
              قابل مذاکره
            </span>
          ) : null}
          
          {/* Metadata — Condition, Location, Time */}
          <p className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-1 text-caption text-muted-foreground">
            <span className="inline-flex items-center rounded bg-muted/50 px-1.5 py-0.5 font-medium">{formatCondition(listing.condition)}</span>
            <span aria-hidden className="text-muted-foreground/60">·</span>
            <span>{listing.city.name}</span>
            {listing.publishedAt ? (
              <>
                <span aria-hidden className="text-muted-foreground/60">·</span>
                <span>{formatRelativeTime(listing.publishedAt)}</span>
              </>
            ) : null}
          </p>
        </div>
      </Link>

      {/* Action button (Favorite) — Floating at top corner */}
      {action ? <div className="absolute end-2 top-2 z-10">{action}</div> : null}
    </div>
  );
}
