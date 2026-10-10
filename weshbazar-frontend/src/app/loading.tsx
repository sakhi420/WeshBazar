import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/feedback/skeleton';

/** Root loading UI: shape-matched skeletons for the home layout (§17, §48). */
export default function Loading() {
  return (
    <PageContainer className="space-y-8">
      <Skeleton className="h-40 w-full rounded-surface" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-card-gap xs:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className="h-control w-full rounded-card" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
