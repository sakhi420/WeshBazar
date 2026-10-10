'use client';

/**
 * Expanded queue-row detail (§44/§106): the any-state read with the moderation
 * trail, so a decision is made on the full record, not just the row. Owns its
 * own loading/error states — a failing detail never breaks the queue.
 */

import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { formatCondition, formatNumber, formatRelativeTime } from '@/features/listings';
import { useAdminListingDetail } from '../hooks';
import {
  formatAdminPrice,
  formatContactMethodType,
  formatModerationAction,
  formatPricingTypeLabel,
  formatRejectionReason,
  formatSellerStatus,
} from '../model';

interface AdminListingDetailPanelProps {
  listingId: string;
  /** Narrow the queue to this seller's rows (`sellerAccountId` filter, §44). */
  onFilterSeller?: (sellerAccountId: string) => void;
}

export function AdminListingDetailPanel({
  listingId,
  onFilterSeller,
}: AdminListingDetailPanelProps) {
  const detail = useAdminListingDetail(listingId, true);

  if (detail.isPending) {
    return (
      <div className="space-y-3 p-3 sm:p-4" aria-hidden>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    );
  }

  if (detail.isError) {
    return (
      <div className="p-3 sm:p-4">
        <ErrorState
          title="دریافت جزئیات آگهی ناموفق بود"
          description="ارتباط را بررسی کنید و دوباره تلاش کنید."
          onRetry={() => void detail.refetch()}
        />
      </div>
    );
  }

  const data = detail.data;

  return (
    <div className="space-y-4 border-t border-border bg-muted/10 p-3 sm:p-4">
      {data.images.length > 0 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="تصاویر آگهی">
          {data.images.map((image) => (
            <li key={image.id} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- API origin is deploy-time configurable; next/image remotePatterns cannot know it */}
              <img
                src={image.url}
                width={image.width}
                height={image.height}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-20 w-28 rounded-control border border-border object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}

      <p className="whitespace-pre-line break-words text-ui leading-6 text-foreground">
        {data.description}
      </p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-ui sm:grid-cols-3">
        <DetailItem label="وضعیت کالا" value={formatCondition(data.condition)} />
        <DetailItem label="نوع قیمت" value={formatPricingTypeLabel(data.pricingType)} />
        <DetailItem label="قیمت" value={formatAdminPrice(data.price, data.currency)} />
        <DetailItem label="قابل مذاکره" value={data.negotiable ? 'بله' : 'خیر'} />
        <DetailItem label="دسته" value={data.categoryName} />
        <DetailItem label="مکان" value={`${data.provinceName} — ${data.cityName}`} />
        <DetailItem
          label="فروشنده"
          value={`${data.seller.displayName} (${formatSellerStatus(data.seller.status)})`}
        />
        <DetailItem
          label="بازدید / علاقه‌مندی"
          value={`${formatNumber(data.views)} / ${formatNumber(data.favoriteCount)}`}
        />
      </dl>

      {data.contactMethods.length > 0 ? (
        <div>
          <h4 className="text-caption font-medium text-muted-foreground">راه‌های تماس</h4>
          <ul className="mt-1 flex flex-wrap gap-2">
            {data.contactMethods.map((method) => (
              <li
                key={method.type}
                className={
                  method.enabled
                    ? 'rounded-control border border-border bg-surface px-2 py-0.5 text-caption text-foreground'
                    : 'rounded-control border border-border px-2 py-0.5 text-caption text-muted line-through'
                }
              >
                {formatContactMethodType(method.type)}
                {method.valueOverride ? ` · ${method.valueOverride}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-caption font-medium text-muted-foreground">سابقهٔ بازبینی</h4>
          {onFilterSeller ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onFilterSeller(data.seller.sellerAccountId)}
            >
              آگهی‌های این فروشنده
            </Button>
          ) : null}
        </div>
        {data.moderationActions.length === 0 ? (
          <p className="mt-2 text-ui text-muted-foreground">هنوز سابقه‌ای ثبت نشده است.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.moderationActions.map((record) => (
              <li
                key={record.id}
                className="rounded-control border border-border bg-surface p-2.5 text-ui"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {formatModerationAction(record.action)}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {record.adminDisplayName ?? 'مدیر'} · {formatRelativeTime(record.createdAt)}
                  </span>
                </div>
                {record.reason ? (
                  <p className="mt-1 text-caption text-muted-foreground">
                    دلیل: {formatRejectionReason(record.reason)}
                  </p>
                ) : null}
                {record.note ? (
                  <p className="mt-1 text-caption text-muted-foreground">یادداشت: {record.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}
