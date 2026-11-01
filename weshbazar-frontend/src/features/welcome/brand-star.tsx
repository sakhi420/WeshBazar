import { cn } from '@/lib/utils';

/**
 * Brand four-point star/sparkle motif reused across welcome decorations.
 * Mirrors the existing home-feed pattern so the landing stays on-brand.
 * Colored through `currentColor` (set `text-*` on the element).
 */
export function BrandStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn('h-6 w-6', className)} aria-hidden>
      <path
        fill="currentColor"
        d="M14 2l1.6 10L26 14l-10.4 1.6L14 26l-1.6-10.4L2 14l10.4-1.6z"
      />
    </svg>
  );
}