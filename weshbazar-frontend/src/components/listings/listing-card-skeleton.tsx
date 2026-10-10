import { Skeleton } from '@/components/feedback/skeleton';

/**
 * Shape-matched placeholder for ListingCard (master prompt §48): same 112px
 * image area, title lines, price line, and metadata geometry.
 */
export function ListingCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-card border border-border bg-surface">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}
