import { Skeleton } from '@/components/feedback/skeleton';
import { PageContainer } from '@/components/layout/page-container';

/** Listing route loading state — shape-matched to the real layout (§48). */
export default function ListingLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-52" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Skeleton className="aspect-[4/3] w-full rounded-card" />
          <div className="rounded-card border border-border bg-surface p-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-3 h-6 w-3/4" />
            <Skeleton className="mt-3 h-4 w-56" />
          </div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-44 w-full rounded-card" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
        <div className="min-w-0 space-y-4">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-11 w-full rounded-control" />
          <Skeleton className="h-28 w-full rounded-card" />
        </div>
      </div>
    </PageContainer>
  );
}
