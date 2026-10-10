'use client';

/**
 * Desktop density view (§145 contract) — the same queue as a table; the
 * expanded detail renders as a full-width row so the moderation trail stays
 * in place. Presentation-only: the parent owns every piece of state.
 */

import { Fragment } from 'react';
import { ChevronDown, Flag, ImageOff } from 'lucide-react';
import { formatNumber, formatRelativeTime } from '@/features/listings';
import { cn } from '@/lib/utils';
import { formatAdminPrice, formatSellerStatus } from '../model';
import type { AdminListingItem, ModerationAction } from '../types';
import { AdminListingActions, type ModerationRequest } from './admin-listing-actions';
import { AdminListingDetailPanel } from './admin-listing-detail-panel';
import { ListingStatusBadge } from './admin-listing-status-badge';

interface AdminListingTableProps {
  listings: AdminListingItem[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  /** Row id owning the in-flight action, if any. */
  pendingId: string | null;
  /** The in-flight action of that row. */
  pendingAction: ModerationAction | null;
  /** True while any moderation mutation runs — every control locks. */
  locked: boolean;
  onAction: (listing: AdminListingItem, request: ModerationRequest) => void;
  onFilterSeller: (sellerAccountId: string) => void;
  className?: string;
}

export function AdminListingTable({
  listings,
  expandedId,
  onToggle,
  pendingId,
  pendingAction,
  locked,
  onAction,
  onFilterSeller,
  className,
}: AdminListingTableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-card border border-border bg-surface', className)}>
      <table className="w-full min-w-[880px] border-collapse text-ui">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="py-2.5 pe-3 ps-4 text-start text-caption font-medium text-muted-foreground">
              آگهی
            </th>
            <th className="py-2.5 pe-3 text-start text-caption font-medium text-muted-foreground">
              وضعیت
            </th>
            <th className="py-2.5 pe-3 text-start text-caption font-medium text-muted-foreground">
              فروشنده
            </th>
            <th className="py-2.5 pe-3 text-start text-caption font-medium text-muted-foreground">
              قیمت
            </th>
            <th className="py-2.5 pe-3 text-start text-caption font-medium text-muted-foreground">
              گزارش باز
            </th>
            <th className="py-2.5 pe-3 text-start text-caption font-medium text-muted-foreground">
              ثبت
            </th>
            <th className="py-2.5 pe-4 text-start text-caption font-medium text-muted-foreground">
              اقدامات
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => {
            const expanded = expandedId === listing.id;
            return (
              <Fragment key={listing.id}>
                <tr className="border-b border-border align-top">
                  <td className="py-3 pe-3 ps-4">
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-control bg-muted/20">
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
                            <ImageOff className="size-4" aria-hidden />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-foreground">{listing.title}</p>
                        <p className="mt-0.5 text-caption text-muted-foreground">
                          {listing.categoryName} · {listing.provinceName}
                        </p>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => onToggle(listing.id)}
                          className="mt-1 inline-flex items-center gap-1 text-caption text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ChevronDown
                            aria-hidden
                            className={cn(
                              'size-3.5 transition-transform',
                              expanded && 'rotate-180',
                            )}
                          />
                          {expanded ? 'بستن جزئیات' : 'جزئیات و سابقه'}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pe-3">
                    <ListingStatusBadge status={listing.status} />
                  </td>
                  <td className="py-3 pe-3">
                    <p className="text-foreground">{listing.seller.displayName}</p>
                    <p className="text-caption text-muted-foreground">
                      {formatSellerStatus(listing.seller.status)}
                    </p>
                  </td>
                  <td className="py-3 pe-3 text-foreground">
                    {formatAdminPrice(listing.price, listing.currency)}
                  </td>
                  <td className="py-3 pe-3">
                    {listing.openReportCount > 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-danger">
                        <Flag aria-hidden className="size-3.5" />
                        {formatNumber(listing.openReportCount)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 pe-3 text-muted-foreground">
                    {formatRelativeTime(listing.createdAt)}
                  </td>
                  <td className="py-3 pe-4">
                    <AdminListingActions
                      listing={listing}
                      pending={pendingId === listing.id ? pendingAction : null}
                      locked={locked}
                      onAction={(request) => onAction(listing, request)}
                    />
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-border">
                    <td colSpan={7} className="p-0">
                      <AdminListingDetailPanel
                        listingId={listing.id}
                        onFilterSeller={onFilterSeller}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
