'use client';

/**
 * Sell step 6 — preview + final submit (master prompt §40–§41, §43).
 *
 * On entry every queued photo uploads sequentially (one file per request —
 * the frozen media contract); each answer seeds the owner cache and bumps
 * the draft version, so the final `POST …/submit` carries the current
 * `expectedVersion`. The panel below mirrors what buyers will see, and the
 * submit button stays locked until no queued photo is outstanding.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AttributeList } from '@/components/listings/attribute-list';
import { ListingGallery } from '@/components/listings/gallery';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { ApiError, queryKeys } from '@/lib/api';
import { FormError, FormNotice } from '@/features/auth/components';
import { fetchFilterSchema } from '@/features/categories';
import { uploadListingImage } from '@/features/media';
import {
  contactMethodsFromDraft,
  describeSellError,
  fetchMyListing,
  formatCondition,
  formatContactMethod,
  formatNumber,
  formatPrice,
  parsePriceAmount,
  sellStepPath,
  shouldRefreshOwnerListing,
  submitListing,
  syncOwnerListing,
  toPreviewAttributes,
} from '@/features/listings';
import { SellGuard } from '../sell-guard';
import { SellStepActions, SellStepLayout } from '../sell-step-layout';
import { useSell } from '../sell-provider';

export function SellPreviewStep() {
  return (
    <SellGuard step="preview">
      <PreviewStep />
    </SellGuard>
  );
}

interface UploadProgress {
  status: 'idle' | 'uploading' | 'done' | 'error';
  total: number;
  done: number;
}

const INCOMPLETE_ERROR = 'sell-flow-incomplete';

function PreviewStep() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { draft, updateDraft, resetDraft, pendingImages, removePendingImage } = useSell();
  const [upload, setUpload] = useState<UploadProgress>({ status: 'idle', total: 0, done: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const uploadStartedRef = useRef(false);

  const listingId = draft.listingId;
  const ownerQuery = useQuery({
    queryKey: queryKeys.listings.owner(listingId ?? 'none'),
    queryFn: () => (listingId === null ? Promise.resolve(null) : fetchMyListing(listingId)),
    enabled: listingId !== null,
  });

  const categoryId = draft.categoryId;
  const schemaQuery = useQuery({
    queryKey: queryKeys.categories.filterSchema(categoryId ?? 'none'),
    queryFn: () => (categoryId === null ? Promise.resolve([]) : fetchFilterSchema(categoryId)),
    enabled: categoryId !== null,
    staleTime: 5 * 60_000,
  });

  const serverImages = useMemo(() => {
    const images = ownerQuery.data?.images ?? [];
    return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [ownerQuery.data]);

  const previewAttributes = useMemo(
    () => toPreviewAttributes(draft.attributes, schemaQuery.data ?? []),
    [draft.attributes, schemaQuery.data],
  );

  // Upload queued photos one at a time; the tail stays queued on failure so
  // the retry button resumes exactly where it stopped.
  const uploadPending = useCallback(async () => {
    const targetListingId = draft.listingId;
    if (targetListingId === null || pendingImages.length === 0) return;
    const queue = [...pendingImages];
    setUploadError(null);
    setUpload({ status: 'uploading', total: queue.length, done: 0 });
    let done = 0;
    for (const item of queue) {
      try {
        const listing = await uploadListingImage(targetListingId, item.file);
        syncOwnerListing(queryClient, listing);
        updateDraft({ listingId: listing.id, listingVersion: listing.version });
        removePendingImage(item.id);
        done += 1;
        setUpload({ status: 'uploading', total: queue.length, done });
      } catch (error) {
        setUpload({ status: 'error', total: queue.length, done });
        setUploadError(describeSellError(error));
        return;
      }
    }
    setUpload({ status: 'done', total: queue.length, done });
  }, [draft.listingId, pendingImages, queryClient, removePendingImage, updateDraft]);

  // Auto-start once per mount; `File` handles only exist in this session.
  useEffect(() => {
    if (uploadStartedRef.current) return;
    if (draft.listingId === null || pendingImages.length === 0) return;
    uploadStartedRef.current = true;
    void uploadPending();
  }, [draft.listingId, pendingImages.length, uploadPending]);

  const submitMutation = useMutation({
    mutationFn: () => {
      const { listingId: id, listingVersion } = draft;
      if (id === null || listingVersion === null) throw new Error(INCOMPLETE_ERROR);
      return submitListing(id, listingVersion);
    },
    onSuccess: (listing) => {
      syncOwnerListing(queryClient, listing);
      resetDraft();
      router.push(`/sell/submit?id=${encodeURIComponent(listing.id)}`);
    },
    onError: async (error) => {
      if (error instanceof Error && error.message === INCOMPLETE_ERROR) {
        setSubmitError('اطلاعات آگهی هنوز کامل نیست؛ مراحل را بازبینی کنید.');
        return;
      }
      if (shouldRefreshOwnerListing(error) && draft.listingId !== null) {
        try {
          const fresh = await fetchMyListing(draft.listingId);
          syncOwnerListing(queryClient, fresh);
          updateDraft({ listingVersion: fresh.version });
        } catch {
          // Keep the original conflict message; a retry surfaces it again.
        }
      }
      setSubmitError(describeSellError(error));
    },
  });

  const uploading = upload.status === 'uploading';
  const hasQueued = pendingImages.length > 0;
  const submitDisabled = uploading || hasQueued || submitMutation.isPending;

  const priceLabel = formatPrice(
    draft.pricingType === 'PAID' ? parsePriceAmount(draft.price) : null,
    'AFN',
    draft.pricingType,
  );
  const negotiableNote = draft.pricingType === 'PAID' && draft.negotiable;
  const conditionLabel = draft.condition !== null ? formatCondition(draft.condition) : '';
  const locationParts = [draft.cityName, draft.provinceName].filter(
    (part): part is string => part !== null && part.length > 0,
  );
  const locationLabel = locationParts.length > 0 ? locationParts.join('، ') : 'مکان ثبت نشده';
  const enabledMethods = contactMethodsFromDraft(draft.contact)
    .filter((method) => method.enabled === true)
    .map((method) => method.type);

  return (
    <SellStepLayout
      step="preview"
      title="پیش‌نمایش آگهی"
      description="آگهی شما همان‌طور که خریداران می‌بینند؛ پیش از ثبت نهایی یک بار مرور کنید."
    >
      <div className="space-y-5">
        <UploadStatusCard
          upload={upload}
          error={uploadError}
          onRetry={() => void uploadPending()}
        />

        {listingId !== null && ownerQuery.isPending ? (
          <Skeleton className="aspect-[4/3] w-full rounded-card" />
        ) : listingId !== null && ownerQuery.isError ? (
          <ErrorState
            requestId={
              ownerQuery.error instanceof ApiError ? ownerQuery.error.requestId : undefined
            }
            description="بارگیری اطلاعات آگهی ناموفق بود. دوباره تلاش کنید."
            onRetry={() => void ownerQuery.refetch()}
          />
        ) : (
          <>
            <ListingGallery images={serverImages} title={draft.title || 'آگهی'} />

            <section className="space-y-3 rounded-card border border-border bg-card p-4">
              <h2 className="text-ui font-medium text-foreground">{draft.title}</h2>
              <p className="text-ui font-medium text-primary">
                {priceLabel}
                {negotiableNote ? (
                  <span className="text-meta font-normal text-muted-foreground">
                    {' '}
                    · قابل مذاکره
                  </span>
                ) : null}
              </p>
              <p className="text-meta text-muted-foreground">
                {conditionLabel ? `${conditionLabel} · ` : ''}
                {locationLabel}
              </p>
              <p className="whitespace-pre-line text-ui leading-7 text-foreground/90">
                {draft.description}
              </p>
            </section>
          </>
        )}

        {previewAttributes.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-ui font-medium text-foreground">ویژگی‌ها</h2>
            <AttributeList attributes={previewAttributes} />
          </section>
        ) : null}

        <section className="space-y-2 rounded-card border border-border bg-card p-4">
          <h2 className="text-ui font-medium text-foreground">موقعیت</h2>
          <p className="text-ui text-foreground/90">{locationLabel}</p>
          <h2 className="pt-2 text-ui font-medium text-foreground">راه‌های تماس</h2>
          <ul className="flex flex-wrap gap-2">
            {enabledMethods.map((method) => (
              <li
                key={method}
                className="rounded-full bg-primary-soft px-3 py-1 text-meta text-primary"
              >
                {formatContactMethod(method)}
              </li>
            ))}
          </ul>
          <p className="text-caption text-muted-foreground">
            شماره‌ها و نام کاربری شما فقط پس از درخواست خریدار نمایش داده می‌شوند.
          </p>
        </section>

        {submitError ? <FormError>{submitError}</FormError> : null}
        {hasQueued && !uploading ? (
          <FormNotice>برای ثبت نهایی، ابتدا بارگذاری تصاویر در انتظار را کامل کنید.</FormNotice>
        ) : null}
      </div>

      <SellStepActions>
        <Button
          type="button"
          variant="outline"
          disabled={submitMutation.isPending}
          onClick={() => router.push(sellStepPath('contact'))}
        >
          <ChevronRight aria-hidden />
          بازگشت
        </Button>
        <Button
          type="button"
          variant="accent"
          disabled={submitDisabled}
          onClick={() => submitMutation.mutate()}
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 aria-hidden className="animate-spin" />
              در حال ثبت…
            </>
          ) : (
            <>
              ثبت نهایی آگهی
              <ChevronLeft aria-hidden />
            </>
          )}
        </Button>
      </SellStepActions>
    </SellStepLayout>
  );
}

interface UploadStatusCardProps {
  upload: UploadProgress;
  error: string | null;
  onRetry: () => void;
}

/** Upload progress / failure card — explicit states for §35 uploads. */
function UploadStatusCard({ upload, error, onRetry }: UploadStatusCardProps) {
  if (upload.status === 'idle') return null;

  if (upload.status === 'error') {
    return (
      <div className="space-y-2">
        <FormError>{error ?? 'بارگذاری تصویر ناموفق بود؛ دوباره تلاش کنید.'}</FormError>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          تکرار بارگذاری تصاویر
        </Button>
      </div>
    );
  }

  const percent = upload.total === 0 ? 0 : Math.round((upload.done / upload.total) * 100);
  const inFlight = Math.min(upload.done + 1, upload.total);
  const label =
    upload.status === 'done'
      ? `بارگذاری ${formatNumber(upload.total)} تصویر کامل شد.`
      : `در حال بارگذاری تصویر ${formatNumber(inFlight)} از ${formatNumber(upload.total)}…`;

  return (
    <div role="status" className="space-y-2 rounded-card border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-ui text-foreground">
        {upload.status === 'uploading' ? (
          <Loader2 aria-hidden className="size-4 animate-spin text-primary" />
        ) : (
          <Check aria-hidden className="size-4 text-primary" />
        )}
        {label}
      </p>
      <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
