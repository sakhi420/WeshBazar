import { Skeleton } from '@/components/feedback/skeleton';
import { PageContainer } from '@/components/layout/page-container';
import { ListingGridSkeleton } from '@/components/listings/listing-grid-skeleton';

/** Category route loading state — shape-matched to the real layout (§48). */
export default function CategoryLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-3 h-8 w-44" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <div className="mt-6 flex items-center gap-2">
        <Skeleton className="h-control w-28 rounded-control" />
        <Skeleton className="h-control w-40 rounded-control" />
      </div>
      <ListingGridSkeleton className="mt-6" />
    </PageContainer>
  );
}
