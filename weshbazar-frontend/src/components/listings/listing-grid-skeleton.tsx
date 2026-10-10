import { cn } from '@/lib/utils';
import { ListingCardSkeleton } from '@/components/listings/listing-card-skeleton';

interface ListingGridSkeletonProps {
  count?: number;
  className?: string;
}

/** Grid of card-shaped skeletons — stable geometry while results load (§48). */
export function ListingGridSkeleton({ count = 8, className }: ListingGridSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('grid grid-cols-2 gap-card-gap lg:grid-cols-3 xl:grid-cols-4', className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}
