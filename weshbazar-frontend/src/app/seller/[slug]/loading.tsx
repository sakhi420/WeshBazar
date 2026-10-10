import { Skeleton } from '@/components/feedback/skeleton';
import { PageContainer } from '@/components/layout/page-container';

/** Seller route loading state — shape-matched to the real layout (§48). */
export default function SellerLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-40" />
      <div className="mt-4 rounded-card border border-border bg-surface p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="mt-4 h-16 w-full" />
      </div>
      <Skeleton className="mt-6 h-7 w-40" />
      <Skeleton className="mt-4 h-40 w-full rounded-card" />
    </PageContainer>
  );
}
