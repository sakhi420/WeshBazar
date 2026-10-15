'use client';

/**
 * One row of the My Listings queue (§31).
 *
 * Presentation-only: lifecycle permissions arrive computed, the card reports
 * the chosen action upwards. Irreversible actions (mark-sold) and hiding
 * actions (archive) ask for an inline confirmation first; renew is immediate.
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Archive,
  Check,
  Clock3,
  Eye,
  Heart,
  ImageOff,
  Loader2,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  formatExpiryCountdown,
  formatNumber,
  formatOwnerStatus,
  formatOwnerStatusHint,
  formatPrice,
} from '../../format';
import { pickImageVariant } from '../../images';
import type { OwnerListingStatus, OwnerListingSummary } from '../../types';
import type { ListingLifecycleAction } from '../hooks';
import type { ListingLifecyclePermissions } from '../view-model';

const STATUS_BADGE_CLASSES: Record<OwnerListingStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_REVIEW: 'border border-warning/30 bg-warning/10 text-foreground',
  ACTIVE: 'bg-primary-soft text-primary',
  REJECTED: 'border border-danger/30 bg-danger/5 text-danger',
  SOLD: 'bg-muted text-muted-foreground',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

type ConfirmableAction = Extract<ListingLifecycleAction, 'mark-sold' | 'archive'>;

interface ListingManageCardProps {
  listing: OwnerListingSummary;
  permissions: ListingLifecyclePermissions;
  /** This card's in-flight action, if any. */
  pendingAction: ListingLifecycleAction | null;
  /** True while any lifecycle mutation runs — every control locks. */
  locked: boolean;
  onAction: (action: ListingLifecycleAction) => void;
}

export function ListingManageCard({
  listing,
  permissions,
  pendingAction,
  locked,
  onAction,
}: ListingManageCardProps) {
  const [confirming, setConfirming] = useState<ConfirmableAction | null>(null);

  const image = listing.primaryImage ? pickImageVariant(listing.primaryImage, 'thumbnail') : null;
  const priceLabel = formatPrice(listing.price, listing.currency, listing.pricingType);
  const hint = formatOwnerStatusHint(listing.status);
  const renewLabel = listing.status === 'ARCHIVED' ? 'انتشار دوباره' : 'تمدید';

  const expiryLabel = listing.expiresAt ? formatExpiryCountdown(listing.expiresAt) : '';
  const expiryExpired = expiryLabel === 'منقضی شده';

  const hasAnyAction =
    permissions.canEdit ||
    permissions.canRenew ||
    permissions.canMarkSold ||
    permissions.canArchive ||
    permissions.canViewPublic;

  const confirm = (action: ConfirmableAction) => {
    setConfirming(null);
    onAction(action);
  };

  return (
    <article
      aria-busy={pendingAction !== null}
      className="rounded-card border border-border bg-surface p-3"
    >
      <div className="flex gap-3">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-control bg-muted/20">
          {image ? (
            <Image
              fill
              src={image.url}
              alt=""
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted">
              <ImageOff className="size-6" aria-hidden />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-ui font-medium leading-6 text-foreground">
              {listing.title}
            </h3>
            <span
              className={cn(
                'shrink-0 rounded-control px-2 py-0.5 text-caption font-medium',
                STATUS_BADGE_CLASSES[listing.status] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {formatOwnerStatus(listing.status)}
            </span>
          </div>

          <p className="mt-1 text-ui font-bold text-foreground">{priceLabel}</p>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
            <span>{listing.category.name}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Eye aria-hidden className="size-3.5" />
              {formatNumber(listing.views)} بازدید
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Heart aria-hidden className="size-3.5" />
              {formatNumber(listing.favoriteCount)} علاقه‌مندی
            </span>
          </p>

          {listing.status === 'ACTIVE' && expiryLabel ? (
            <p
              className={cn(
                'mt-1 inline-flex items-center gap-1 text-caption',
                expiryExpired ? 'text-danger' : 'text-muted-foreground',
              )}
            >
              <Clock3 aria-hidden className="size-3.5" />
              {expiryLabel}
            </p>
          ) : null}

          {hint ? (
            <p
              className={cn(
                'mt-1 text-caption',
                listing.status === 'REJECTED' ? 'text-danger' : 'text-muted-foreground',
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
      </div>

      {hasAnyAction ? (
        <div className="mt-3 border-t border-border pt-3">
          {confirming ? (
            <div role="group" aria-label="تأیید عمل" className="flex flex-wrap items-center gap-2">
              <p className="w-full text-ui text-foreground sm:w-auto">
                {confirming === 'mark-sold'
                  ? 'آگهی «فروخته شد» علامت بخورد؟ این کار قابل برگشت نیست.'
                  : 'آگهی بایگانی شود؟ بعداً می‌توانید بازنشرش کنید.'}
              </p>
              <Button
                size="sm"
                variant={confirming === 'mark-sold' ? 'destructive' : 'default'}
                disabled={locked}
                onClick={() => confirm(confirming)}
              >
                {pendingAction === confirming ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : null}
                تأیید
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={locked}
                onClick={() => setConfirming(null)}
              >
                انصراف
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {permissions.canEdit ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/sell/${listing.id}/edit`}>
                    <Pencil aria-hidden />
                    ویرایش
                  </Link>
                </Button>
              ) : null}
              {permissions.canRenew ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={locked}
                  onClick={() => onAction('renew')}
                >
                  {pendingAction === 'renew' ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <RotateCcw aria-hidden />
                  )}
                  {renewLabel}
                </Button>
              ) : null}
              {permissions.canMarkSold ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={locked}
                  onClick={() => setConfirming('mark-sold')}
                >
                  <Check aria-hidden />
                  فروخته شد
                </Button>
              ) : null}
              {permissions.canArchive ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  disabled={locked}
                  onClick={() => setConfirming('archive')}
                >
                  <Archive aria-hidden />
                  بایگانی
                </Button>
              ) : null}
              {permissions.canViewPublic ? (
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/listing/${listing.slug}`}>مشاهده</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
