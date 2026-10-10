'use client';

/**
 * Gallery tile with ordering controls (master prompt §131, §35).
 *
 * Shared by the pending queue (local object URLs) and the server gallery, so
 * every tile exposes move + remove without hover; `onMakePrimary` appears
 * only for server images that are not primary yet. Move direction follows
 * the RTL reading order: «جلو» (ChevronRight) moves the image one slot
 * toward the front, «عقب» (ChevronLeft) one slot back.
 */

import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SellImageTileProps {
  src: string;
  alt: string;
  badge?: string;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  canMakePrimary?: boolean;
  busy?: boolean;
  onMoveEarlier?: () => void;
  onMoveLater?: () => void;
  onMakePrimary?: () => void;
  onRemove: () => void;
  removeLabel: string;
}

export function SellImageTile({
  src,
  alt,
  badge,
  canMoveEarlier,
  canMoveLater,
  canMakePrimary = false,
  busy = false,
  onMoveEarlier,
  onMoveLater,
  onMakePrimary,
  onRemove,
  removeLabel,
}: SellImageTileProps) {
  return (
    <li className="overflow-hidden rounded-card border border-border bg-card">
      <div className="relative aspect-[4/3] bg-muted/20">
        {/* eslint-disable-next-line @next/next/no-img-element -- object URLs and the deploy-time-configurable API origin cannot use next/image here */}
        <img src={src} alt={alt} className="h-full w-full object-cover" />
        {badge ? (
          <span className="absolute start-2 top-2 rounded-full bg-foreground/70 px-2 py-0.5 text-caption text-surface">
            {badge}
          </span>
        ) : null}
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 aria-hidden className="size-5 animate-spin text-primary" />
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-1 p-1.5">
        <div className="flex items-center gap-0.5">
          <IconButton
            label="جابه‌جایی به جلو"
            disabled={!canMoveEarlier || busy}
            onClick={onMoveEarlier}
          >
            <ChevronRight aria-hidden className="size-4" />
          </IconButton>
          <IconButton
            label="جابه‌جایی به عقب"
            disabled={!canMoveLater || busy}
            onClick={onMoveLater}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </IconButton>
        </div>
        <div className="flex items-center gap-0.5">
          {canMakePrimary && onMakePrimary ? (
            <IconButton label="انتخاب به‌عنوان تصویر اصلی" disabled={busy} onClick={onMakePrimary}>
              <Star aria-hidden className="size-4" />
            </IconButton>
          ) : null}
          <IconButton label={removeLabel} disabled={busy} onClick={onRemove} danger>
            <Trash2 aria-hidden className="size-4" />
          </IconButton>
        </div>
      </div>
    </li>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-9 items-center justify-center rounded-control outline-none transition-colors duration-small focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
        danger ? 'text-danger hover:bg-danger/10' : 'text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}
