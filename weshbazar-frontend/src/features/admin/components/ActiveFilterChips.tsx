"use client";

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: Chip[];
  className?: string;
  /** When true, show a "clear all" button that calls onClearAll. */
  onClearAll?: () => void;
}

export function ActiveFilterChips({ chips, className, onClearAll }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)} aria-label="فیلترهای فعال">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-caption font-medium text-primary"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="ms-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
            aria-label={`حذف فیلتر ${chip.label}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full border border-muted-foreground/30 px-2.5 py-1 text-caption text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          پاک‌کردن همه
        </button>
      )}
    </div>
  );
}