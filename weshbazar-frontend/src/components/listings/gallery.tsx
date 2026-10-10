'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, pickImageVariant } from '@/features/listings';
import type { ListingImage } from '@/features/listings';

interface ListingGalleryProps {
  images: ListingImage[];
  /** Listing title — used as the main image alt text. */
  title: string;
  className?: string;
}

/**
 * Listing detail gallery (master prompt §58 block 2, §452): one framed main
 * image with prev/next and a thumbnail strip. RTL-aware arrows (previous sits
 * at the reading start). Media reserves geometry to avoid CLS (§48).
 */
export function ListingGallery({ images, title, className }: ListingGalleryProps) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  const active = count > 0 ? (images[safeIndex] ?? null) : null;
  const mainVariant = active ? pickImageVariant(active, 'large') : null;

  function step(delta: number) {
    if (count <= 1) return;
    setIndex((current) => (current + delta + count) % count);
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative overflow-hidden rounded-card border border-border bg-muted/20">
        <div className="aspect-[4/3] w-full">
          {mainVariant ? (
            // eslint-disable-next-line @next/next/no-img-element -- API origin is deploy-time configurable; next/image remotePatterns cannot know it
            <img
              src={mainVariant.url}
              width={mainVariant.width}
              height={mainVariant.height}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
              <ImageOff className="size-8" aria-hidden />
              <span className="text-caption">تصویری برای این آگهی ثبت نشده است</span>
            </span>
          )}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="تصویر قبلی"
              className="absolute start-2 top-1/2 flex size-touch -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-sm transition-colors duration-small hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="تصویر بعدی"
              className="absolute end-2 top-1/2 flex size-touch -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-sm transition-colors duration-small hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <p
              aria-hidden
              className="bidi-isolate absolute bottom-2 end-2 rounded-full bg-foreground/70 px-2.5 py-0.5 text-caption text-surface"
            >
              {formatNumber(safeIndex + 1)} / {formatNumber(count)}
            </p>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => {
            const thumb = pickImageVariant(image, 'thumbnail');
            const isActive = imageIndex === safeIndex;
            return (
              <li key={image.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(imageIndex)}
                  aria-label={`نمایش تصویر ${formatNumber(imageIndex + 1)}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'block size-16 overflow-hidden rounded-control border transition-all duration-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border opacity-80 hover:opacity-100',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- same as the main image note above */}
                  <img
                    src={thumb.url}
                    width={thumb.width}
                    height={thumb.height}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
