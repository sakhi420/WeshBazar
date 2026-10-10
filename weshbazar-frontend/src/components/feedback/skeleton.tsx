import { cn } from '@/lib/utils';

/**
 * Skeleton primitive (master prompt §48). Shape-matched placeholders — not a
 * giant spinner. Keep the layout stable to avoid CLS while data loads.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-control bg-muted/20', className)}
    />
  );
}
