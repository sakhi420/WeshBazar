import { cn } from '@/lib/utils';
import { ListingCard } from '@/components/listings/listing-card';
import type { PublicListingSummary } from '@/features/listings';
import { FavoriteButton } from '@/features/favorites/components';

interface ListingGridProps {
  listings: PublicListingSummary[];
  className?: string;
}

/**
 * Responsive discovery grid (master prompt §110, §112): 2 columns mobile,
 * denser at desktop. Every card carries the save button at its image corner —
 * the button resolves its own session state and never blocks browsing.
 */
export function ListingGrid({ listings, className }: ListingGridProps) {
  return (
    <ul className={cn('grid grid-cols-2 gap-card-gap lg:grid-cols-3 xl:grid-cols-4', className)}>
      {listings.map((listing) => (
        <li key={listing.id} className="flex">
          <ListingCard
            listing={listing}
            action={<FavoriteButton listingId={listing.id} />}
            className="w-full"
          />
        </li>
      ))}
    </ul>
  );
}
