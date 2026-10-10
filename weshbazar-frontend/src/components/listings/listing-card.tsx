import Link from 'next/link';
import type { ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
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
 * Compact product card (master prompt §109, §452, §112): 112px image area,
 * clamped title, price, metadata. The card body is one link; the optional
 * `action` slot floats above it as a sibling — no nested interactive elements.
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
        className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-shadow duration-small hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative h-28 w-full shrink-0 overflow-hidden bg-muted/20">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- API origin is deploy-time configurable; next/image remotePatterns cannot know it
            <img
              src={image.url}
              width={image.width}
              height={image.height}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-medium group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted">
              <ImageOff className="size-6" aria-hidden />
            </span>
          )}
          {sold ? (
            <span className="absolute bottom-2 start-2 rounded-control bg-foreground/85 px-2 py-0.5 text-caption font-medium text-background">
              فروخته شد
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-ui font-medium leading-6 text-foreground">
            {listing.title}
          </h3>
          <p className="truncate text-card-title font-bold text-foreground">{priceLabel}</p>
          {listing.negotiable && listing.pricingType === 'PAID' ? (
            <p className="text-caption text-muted-foreground">قابل مذاکره</p>
          ) : null}
          <p className="mt-auto flex flex-wrap items-center gap-x-1.5 pt-1 text-caption text-muted-foreground">
            <span>{formatCondition(listing.condition)}</span>
            <span aria-hidden>·</span>
            <span>{listing.city.name}</span>
            {listing.publishedAt ? (
              <>
                <span aria-hidden>·</span>
                <span>{formatRelativeTime(listing.publishedAt)}</span>
              </>
            ) : null}
          </p>
        </div>
      </Link>

      {action ? <div className="absolute end-2 top-2 z-10">{action}</div> : null}
    </div>
  );
}
