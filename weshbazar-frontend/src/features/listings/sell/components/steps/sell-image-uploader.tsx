'use client';

/**
 * Image file picker (master prompt §130, §35).
 *
 * A native multi-select input behind a visible button; clearing the input
 * value afterwards lets the same file be re-picked after a rejection. File
 * fast-fail validation belongs to the step — this component only forwards
 * the picked files.
 */

import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/features/listings';
import {
  IMAGE_ACCEPT_ATTRIBUTE,
  MAX_IMAGES_PER_LISTING,
  MAX_UPLOAD_SIZE_LABEL,
} from '@/features/media';

interface SellImageUploaderProps {
  onSelect: (files: File[]) => void;
  disabled?: boolean;
}

export function SellImageUploader({ onSelect, disabled = false }: SellImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-input bg-muted/20 px-4 py-6 text-center">
      <ImagePlus aria-hidden className="size-6 text-muted-foreground" />
      <p className="text-ui font-medium text-foreground">افزودن تصویر</p>
      <p className="text-meta text-muted-foreground">
        JPEG، PNG یا WebP — هر تصویر حداکثر {MAX_UPLOAD_SIZE_LABEL}، تا{' '}
        {formatNumber(MAX_IMAGES_PER_LISTING)} تصویر
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        انتخاب تصویر
      </Button>
      <p className="text-caption text-muted-foreground">
        ترتیب چیدمان، همان ترتیب نمایش تصاویر در آگهی است.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT_ATTRIBUTE}
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length > 0) onSelect(files);
        }}
      />
    </div>
  );
}
