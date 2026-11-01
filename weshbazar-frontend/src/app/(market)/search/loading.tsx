import { Skeleton } from '@/components/feedback/skeleton';
import { PageContainer } from '@/components/layout/page-container';
import { ListingGridSkeleton } from '@/components/listings/listing-grid-skeleton';

/** Search route loading state — shape-matched to the real layout (§48). */
export default function SearchLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-4 h-control-lg w-full max-w-2xl rounded-control" />
      <div className="mt-6 flex items-center gap-2">
        <Skeleton className="h-control w-28 rounded-control" />
        <Skeleton className="h-control w-40 rounded-control" />
      </div>
      <ListingGridSkeleton className="mt-6" />
    </PageContainer>
  );
}
