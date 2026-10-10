'use client';

/**
 * Edit section 5 — the gallery (§42; media contract §63–§67). Unlike the
 * wizard, every operation here is immediate: picks upload one file per
 * request (sequentially, so the version chain never races), and remove /
 * reorder / make-primary call their endpoints right away. Every response is
 * the refreshed owner record, so the shared cache sync updates the view's
 * diff baseline in the same round trip.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { FormError, FormNotice } from '@/features/auth/components';
import {
  MAX_IMAGES_PER_LISTING,
  deleteListingImage,
  reorderListingImage,
  uploadListingImage,
  validateImageSelection,
  type ImageRejection,
} from '@/features/media';
import { formatNumber } from '../../format';
import { pickImageVariant } from '../../images';
import { describeSellError, shouldRefreshOwnerListing, syncOwnerListing } from '../../sell';
import { SellImageTile } from '../../sell/components/steps/sell-image-tile';
import { SellImageUploader } from '../../sell/components/steps/sell-image-uploader';
import type { ListingImage, OwnerListingStatus } from '../../types';
import { fetchMyListing } from '../../api';
import { canMutateListingImages } from '../model';

interface ImageMutationVariables {
  kind: 'remove' | 'primary' | 'move';
  imageId: string;
  sortOrder?: number;
}

interface EditPhotosSectionProps {
  listingId: string;
  images: readonly ListingImage[];
  status: OwnerListingStatus;
}

export function EditPhotosSection({ listingId, images, status }: EditPhotosSectionProps) {
  const queryClient = useQueryClient();
  const [rejections, setRejections] = useState<ImageRejection[]>([]);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const ordered = useMemo(() => [...images].sort((a, b) => a.sortOrder - b.sortOrder), [images]);

  const mutable = canMutateListingImages(status);
  const total = ordered.length;
  const remaining = Math.max(0, MAX_IMAGES_PER_LISTING - total);
  const busyNow = progress !== null;

  /** Conflict recovery: re-read the single record so the next op is in sync. */
  async function refreshOnConflict(error: unknown) {
    if (!shouldRefreshOwnerListing(error)) return;
    try {
      const fresh = await fetchMyListing(listingId);
      syncOwnerListing(queryClient, fresh);
    } catch {
      // Keep the original conflict message; the user can retry the operation.
    }
  }

  const imageMutation = useMutation({
    mutationFn: ({ kind, imageId, sortOrder }: ImageMutationVariables) => {
      if (kind === 'remove') return deleteListingImage(listingId, imageId);
      if (kind === 'primary') return reorderListingImage(listingId, imageId, { isPrimary: true });
      return reorderListingImage(listingId, imageId, { sortOrder: sortOrder ?? 0 });
    },
    onSuccess: (listing) => {
      syncOwnerListing(queryClient, listing);
    },
    onError: async (error) => {
      await refreshOnConflict(error);
      setMutationError(describeSellError(error));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setProgress({ done: 0, total: files.length });
      try {
        let done = 0;
        for (const file of files) {
          const listing = await uploadListingImage(listingId, file);
          syncOwnerListing(queryClient, listing);
          done += 1;
          setProgress({ done, total: files.length });
        }
      } finally {
        setProgress(null);
      }
    },
    onError: async (error) => {
      await refreshOnConflict(error);
      setMutationError(describeSellError(error));
    },
  });

  const busyId = imageMutation.isPending ? imageMutation.variables?.imageId : undefined;

  function handleSelect(files: File[]) {
    setMutationError(null);
    const result = validateImageSelection(files, total);
    setRejections(result.rejected);
    if (result.accepted.length > 0) uploadMutation.mutate(result.accepted);
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-ui font-semibold text-foreground">تصاویر آگهی</h2>
          <p className="text-meta text-muted-foreground">
            تغییر تصاویر بلافاصله ذخیره می‌شود و مانند ویرایش محتوا بر وضعیت بازبینی اثر دارد.
          </p>
        </div>
        <p className="text-meta text-muted-foreground">
          {formatNumber(total)} از {formatNumber(MAX_IMAGES_PER_LISTING)} تصویر
        </p>
      </header>

      {!mutable ? (
        <FormNotice>گالری این آگهی در وضعیت فعلی قابل تغییر نیست.</FormNotice>
      ) : (
        <>
          {total === 0 ? (
            <FormNotice>
              بدون تصویر، آگهی شما کمتر دیده می‌شود؛ افزودن حداقل یک تصویر را توصیه می‌کنیم.
            </FormNotice>
          ) : null}

          {ordered.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ordered.map((image, index) => (
                <SellImageTile
                  key={image.id}
                  src={pickImageVariant(image, 'medium').url}
                  alt="تصویر آگهی"
                  badge={image.isPrimary ? 'تصویر اصلی' : undefined}
                  canMoveEarlier={index > 0}
                  canMoveLater={index < ordered.length - 1}
                  canMakePrimary={!image.isPrimary}
                  busy={busyId === image.id}
                  onMoveEarlier={() =>
                    imageMutation.mutate({
                      kind: 'move',
                      imageId: image.id,
                      sortOrder: index - 1,
                    })
                  }
                  onMoveLater={() =>
                    imageMutation.mutate({
                      kind: 'move',
                      imageId: image.id,
                      sortOrder: index + 1,
                    })
                  }
                  onMakePrimary={() => imageMutation.mutate({ kind: 'primary', imageId: image.id })}
                  onRemove={() => imageMutation.mutate({ kind: 'remove', imageId: image.id })}
                  removeLabel="حذف تصویر"
                />
              ))}
            </ul>
          ) : null}

          <SellImageUploader
            onSelect={handleSelect}
            disabled={remaining === 0 || busyNow || imageMutation.isPending}
          />

          {remaining === 0 ? (
            <FormNotice>
              گنجایش تصاویر این آگهی پر شده است؛ برای افزودن تصویر جدید، یکی را حذف کنید.
            </FormNotice>
          ) : null}

          {progress ? (
            <p className="flex items-center gap-2 text-meta text-muted-foreground" role="status">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              {progress.done < progress.total
                ? `در حال بارگذاری تصویر ${formatNumber(progress.done + 1)} از ${formatNumber(progress.total)}…`
                : 'در حال به‌روزرسانی فهرست تصاویر…'}
            </p>
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
        </>
      )}

      {mutationError ? <FormError>{mutationError}</FormError> : null}
    </section>
  );
}
