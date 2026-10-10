'use client';

/**
 * Sell step 1 — photos (master prompt §35, §130–131). Two sources feed one
 * ordered gallery: pending picks (kept in memory; uploaded after final
 * approval at the preview step) and server images when the draft already has
 * a listing — a returning seller. Reordering server images uses the
 * single-call move semantics of `PATCH …/images/{id}/order` (remove → insert
 * → dense renumber), so a move is simply the target index.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { ApiError, queryKeys } from '@/lib/api';
import { FormError, FormNotice } from '@/features/auth/components';
import {
  MAX_IMAGES_PER_LISTING,
  deleteListingImage,
  reorderListingImage,
  validateImageSelection,
  type ImageRejection,
} from '@/features/media';
import {
  describeSellError,
  fetchMyListing,
  formatNumber,
  mergeOwnerListing,
  pickImageVariant,
  sellStepPath,
  shouldRefreshOwnerListing,
  syncOwnerListing,
} from '@/features/listings';
import { SellGuard } from '../sell-guard';
import { SellStepActions, SellStepLayout } from '../sell-step-layout';
import { useSell } from '../sell-provider';
import { SellImageTile } from './sell-image-tile';
import { SellImageUploader } from './sell-image-uploader';

export function SellPhotosStep() {
  return (
    <SellGuard step="photos">
      <PhotosStep />
    </SellGuard>
  );
}

interface ImageMutationVariables {
  kind: 'remove' | 'primary' | 'move';
  imageId: string;
  sortOrder?: number;
}

function PhotosStep() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    draft,
    updateDraft,
    replaceDraft,
    pendingImages,
    addPendingImages,
    removePendingImage,
    movePendingImage,
  } = useSell();
  const [rejections, setRejections] = useState<ImageRejection[]>([]);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const listingId = draft.listingId;
  const ownerQuery = useQuery({
    queryKey: queryKeys.listings.owner(listingId ?? 'none'),
    queryFn: () => (listingId === null ? Promise.resolve(null) : fetchMyListing(listingId)),
    enabled: listingId !== null,
  });

  const serverImages = useMemo(() => {
    const images = ownerQuery.data?.images ?? [];
    return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [ownerQuery.data]);

  const total = serverImages.length + pendingImages.length;
  const remaining = Math.max(0, MAX_IMAGES_PER_LISTING - total);

  const imageMutation = useMutation({
    mutationFn: ({ kind, imageId, sortOrder }: ImageMutationVariables) => {
      if (listingId === null) return Promise.reject(new Error('sell-flow-incomplete'));
      if (kind === 'remove') return deleteListingImage(listingId, imageId);
      if (kind === 'primary') return reorderListingImage(listingId, imageId, { isPrimary: true });
      return reorderListingImage(listingId, imageId, { sortOrder: sortOrder ?? 0 });
    },
    onSuccess: (listing) => {
      syncOwnerListing(queryClient, listing);
      replaceDraft(mergeOwnerListing(draft, listing));
    },
    onError: async (error) => {
      if (shouldRefreshOwnerListing(error) && listingId !== null) {
        try {
          const fresh = await fetchMyListing(listingId);
          syncOwnerListing(queryClient, fresh);
          updateDraft({ listingVersion: fresh.version });
        } catch {
          // Keep the original message; a retry surfaces the conflict again.
        }
      }
      setMutationError(describeSellError(error));
    },
  });

  const busyId = imageMutation.isPending ? imageMutation.variables?.imageId : undefined;

  function handleSelect(files: File[]) {
    setMutationError(null);
    const result = validateImageSelection(files, total);
    setRejections(result.rejected);
    if (result.accepted.length > 0) addPendingImages(result.accepted);
  }

  function handleContinue() {
    updateDraft({ completedStep: 'photos' });
    router.push(sellStepPath('basic'));
  }

  return (
    <SellStepLayout
      step="photos"
      title="تصاویر آگهی"
      description="چند تصویر واضح از زوایای مختلف، بیشترین تأثیر را بر خریداران دارد."
    >
      <div className="space-y-5">
        {listingId !== null && ownerQuery.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : listingId !== null && ownerQuery.isError ? (
          <ErrorState
            requestId={
              ownerQuery.error instanceof ApiError ? ownerQuery.error.requestId : undefined
            }
            description="بارگیری تصاویر ثبت‌شدهٔ آگهی ناموفق بود. دوباره تلاش کنید."
            onRetry={() => void ownerQuery.refetch()}
          />
        ) : (
          <>
            {serverImages.length > 0 ? (
              <section className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-ui font-medium text-foreground">تصاویر ثبت‌شده</h2>
                  <p className="text-meta text-muted-foreground">
                    {formatNumber(total)} از {formatNumber(MAX_IMAGES_PER_LISTING)} تصویر
                  </p>
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {serverImages.map((image, index) => (
                    <SellImageTile
                      key={image.id}
                      src={pickImageVariant(image, 'medium').url}
                      alt="تصویر ثبت‌شدهٔ آگهی"
                      badge={image.isPrimary ? 'تصویر اصلی' : undefined}
                      canMoveEarlier={index > 0}
                      canMoveLater={index < serverImages.length - 1}
                      canMakePrimary={!image.isPrimary}
                      busy={busyId === image.id}
                      onMoveEarlier={() =>
                        imageMutation.mutate({ kind: 'move', imageId: image.id, sortOrder: index - 1 })
                      }
                      onMoveLater={() =>
                        imageMutation.mutate({ kind: 'move', imageId: image.id, sortOrder: index + 1 })
                      }
                      onMakePrimary={() =>
                        imageMutation.mutate({ kind: 'primary', imageId: image.id })
                      }
                      onRemove={() => imageMutation.mutate({ kind: 'remove', imageId: image.id })}
                      removeLabel="حذف تصویر"
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            {pendingImages.length > 0 ? (
              <section className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-ui font-medium text-foreground">در انتظار بارگذاری</h2>
                  {serverImages.length === 0 ? (
                    <p className="text-meta text-muted-foreground">
                      {formatNumber(total)} از {formatNumber(MAX_IMAGES_PER_LISTING)} تصویر
                    </p>
                  ) : null}
                </div>
                <p className="text-meta text-muted-foreground">
                  این تصاویر پس از ثبت نهایی آگهی، خودکار بارگذاری می‌شوند.
                </p>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {pendingImages.map((image, index) => (
                    <SellImageTile
                      key={image.id}
                      src={image.url}
                      alt={`پیش‌نمایش تصویر ${formatNumber(index + 1)}`}
                      canMoveEarlier={index > 0}
                      canMoveLater={index < pendingImages.length - 1}
                      onMoveEarlier={() => movePendingImage(image.id, -1)}
                      onMoveLater={() => movePendingImage(image.id, 1)}
                      onRemove={() => removePendingImage(image.id)}
                      removeLabel="حذف تصویر"
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            <SellImageUploader onSelect={handleSelect} disabled={remaining === 0} />
            {remaining === 0 ? (
              <FormNotice>
                گنجایش تصاویر این آگهی پر شده است؛ برای افزودن تصویر جدید، یکی را حذف کنید.
              </FormNotice>
            ) : null}

            {rejections.length > 0 ? (
              <div role="alert" className="space-y-1">
                {rejections.map((item, index) => (
                  <p key={`${item.fileName}-${index}`} className="text-meta text-danger">
                    «{item.fileName}» — {item.message}
                  </p>
                ))}
              </div>
            ) : null}

            {mutationError ? <FormError>{mutationError}</FormError> : null}

            {total === 0 ? (
              <FormNotice>
                بدون تصویر، آگهی شما کمتر دیده می‌شود؛ افزودن حداقل یک تصویر را توصیه می‌کنیم.
              </FormNotice>
            ) : null}
          </>
        )}
      </div>

      <SellStepActions>
        <Button asChild variant="outline">
          <Link href={sellStepPath('start')}>
            <ChevronRight aria-hidden />
            بازگشت
          </Link>
        </Button>
        <Button type="button" onClick={handleContinue}>
          ادامه
          <ChevronLeft aria-hidden />
        </Button>
      </SellStepActions>
    </SellStepLayout>
  );
}
