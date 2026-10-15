import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Unified avatar presentation.
 *
 * Shows a user's photo when `src` is set, otherwise a brand-tinted circle with
 * the person's initials. Used by the header, account page and public seller
 * page so identity always renders the same way (fixes the header↔account↔
 * seller avatar inconsistency).
 *
 * Accessibility: the image is decorative (`alt=""`) because the person's name
 * is always rendered alongside; the initials fallback is `aria-hidden`.
 * `width`/`height` map the intrinsic size and prevent layout shift (CLS, §411).
 */

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts[1]?.charAt(0) ?? '';
  return `${first}${second}` || '؟';
}

const SIZES = {
  sm: 'size-7 text-caption',
  md: 'size-10 text-ui',
  lg: 'size-14 text-card-title',
  xl: 'size-16 text-heading',
} as const;

/** Rendered pixel size per variant (mirrors the `size-*` values in SIZES). */
const SIZES_PX: Record<keyof typeof SIZES, number> = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 64,
};

export interface AvatarProps {
  /** Person's display name — source of the initials fallback. */
  name: string;
  /** Absolute server URL of the avatar (backend `avatarUrl`); initials when null. */
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    const px = SIZES_PX[size];
    return (
      <Image
        src={src}
        alt=""
        width={px}
        height={px}
        className={cn(
          'shrink-0 rounded-full object-cover ring-2 ring-primary-soft',
          SIZES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground ring-2 ring-primary-soft',
        SIZES[size],
        className,
      )}
    >
      {initialsFor(name)}
    </span>
  );
}