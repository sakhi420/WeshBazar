'use client';

/**
 * One queue row as a mobile card (§146 contract) — thumbnail, status, price,
 * seller and report load at a glance, then the permission-aware action row
 * and the expandable detail (§106). Presentation-only: the parent owns every
 * piece of state.
 */

import { ChevronDown, Eye, Flag, Heart, ImageOff, Store } from 'lucide-react';
import { formatNumber, formatRelativeTime } from '@/features/listings';
import { cn } from '@/lib/utils';
import { formatAdminPrice, formatRejectionReason, formatSellerStatus } from '../model';
import type { AdminListingItem, ModerationAction } from '../types';
import { AdminListingActions, type ModerationRequest } from './admin-listing-actions';
import { AdminListingDetailPanel } from './admin-listing-detail-panel';
import { ListingStatusBadge } from './admin-listing-status-badge';

interface AdminListingCardProps {
  listing: AdminListingItem;
  expanded: boolean;
  onToggle: () => void;
  /** This row's in-flight action, if any. */
  pending: ModerationAction | null;
  /** True while any moderation mutation runs — every control locks. */
  locked: boolean;
  onAction: (request: ModerationRequest) => void;
  onFilterSeller: (sellerAccountId: string) => void;
}

export function AdminListingCard({
  listing,
  expanded,
  onToggle,
  pending,
  locked,
  onAction,
  onFilterSeller,
}: AdminListingCardProps) {
  return (
    <article
      aria-busy={pending !== null}
      className="overflow-hidden rounded-card border border-border bg-surface"
    >
      <div className="p-3">
        <div className="flex gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-control bg-muted/20">
            {listing.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- API origin is deploy-time configurable; next/image remotePatterns cannot know it
              <img
                src={listing.thumbnailUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted">
                <ImageOff className="size-5" aria-hidden />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-ui font-medium leading-6 text-foreground">
                {listing.title}
              </h3>
              <ListingStatusBadge status={listing.status} />
            </div>

            <p className="mt-1 text-ui font-bold text-foreground">
              {formatAdminPrice(listing.price, listing.currency)}
            </p>

            <p className="mt-1 text-caption text-muted-foreground">
              {listing.categoryName} · {listing.provinceName}، {listing.cityName}
            </p>

            <p className="mt-1 inline-flex items-center gap-1 text-caption text-muted-foreground">
              <Store aria-hidden className="size-3.5" />
              {listing.seller.displayName}
              {listing.seller.status !== 'ACTIVE'
                ? ` · ${formatSellerStatus(listing.seller.status)}`
                : ''}
            </p>

            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Eye aria-hidden className="size-3.5" />
                {formatNumber(listing.views)}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Heart aria-hidden className="size-3.5" />
                {formatNumber(listing.favoriteCount)}
              </span>
              {listing.openReportCount > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-danger">
                    <Flag aria-hidden className="size-3.5" />
                    {formatNumber(listing.openReportCount)} گزارش باز
                  </span>
                </>
              ) : null}
            </p>

            <p className="mt-1 text-caption text-muted">{formatRelativeTime(listing.createdAt)}</p>

            {listing.status === 'REJECTED' && listing.rejectedReason ? (
              <p className="mt-1 text-caption text-danger">
                دلیل رد: {formatRejectionReason(listing.rejectedReason)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <AdminListingActions
            listing={listing}
            pending={pending}
            locked={locked}
            onAction={onAction}
          />
          <button
            type="button"
            aria-expanded={expanded}
            onClick={onToggle}
            className="inline-flex min-h-touch items-center gap-1 text-ui text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown
              aria-hidden
              className={cn('size-4 transition-transform', expanded && 'rotate-180')}
            />
            {expanded ? 'بستن جزئیات' : 'جزئیات و سابقهٔ بازبینی'}
          </button>
        </div>
      </div>

      {expanded ? (
        <AdminListingDetailPanel listingId={listing.id} onFilterSeller={onFilterSeller} />
      ) : null}
    </article>
  );
}
