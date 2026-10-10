'use client';

/**
 * Submission outcome (master prompt §41).
 *
 * Reads the submitted listing (owner cache seeded by the submit mutation, or
 * a network read on refresh) and renders honest next steps per backend
 * status: ACTIVE → published, PENDING_REVIEW → in review. Anything else
 * falls back to neutral guidance instead of pretending success.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, FileWarning, Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { ApiError, queryKeys } from '@/lib/api';
import { fetchMyListing, formatOwnerStatus, type OwnerListing } from '@/features/listings';

interface SubmitOutcomeProps {
  listingId: string | null;
}

export function SubmitOutcome({ listingId }: SubmitOutcomeProps) {
  if (listingId === null) {
    return (
      <OutcomeShell
        icon={<FileWarning aria-hidden className="size-7" />}
        title="آگهی موردنظر پیدا نشد"
        description="نشانی این صفحه ناقص است؛ از فهرست آگهی‌های خود دوباره وارد شوید."
        actions={
          <>
            <Button asChild variant="accent">
              <Link href="/my-listings">آگهی‌های من</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sell">ثبت آگهی جدید</Link>
            </Button>
          </>
        }
      />
    );
  }

  return <OutcomeForListing listingId={listingId} />;
}

function OutcomeForListing({ listingId }: { listingId: string }) {
  const query = useQuery({
    queryKey: queryKeys.listings.owner(listingId),
    queryFn: () => fetchMyListing(listingId),
    staleTime: 30_000,
  });

  if (query.isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
        <Loader2 aria-hidden className="size-4 animate-spin" />
        در حال آماده‌سازی…
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        requestId={query.error instanceof ApiError ? query.error.requestId : undefined}
        description="بارگیری اطلاعات آگهی ناموفق بود. دوباره تلاش کنید."
        onRetry={() => void query.refetch()}
      />
    );
  }

  return <OutcomeBody listing={query.data} />;
}

function OutcomeBody({ listing }: { listing: OwnerListing }) {
  const myListingsAction = (
    <Button asChild variant="outline">
      <Link href="/my-listings">آگهی‌های من</Link>
    </Button>
  );
  const newListingAction = (
    <Button asChild variant="ghost">
      <Link href="/sell">ثبت آگهی دیگر</Link>
    </Button>
  );

  if (listing.status === 'ACTIVE') {
    return (
      <OutcomeShell
        icon={<CheckCircle2 aria-hidden className="size-7" />}
        title="آگهی شما منتشر شد"
        description={`«${listing.title}» اکنون برای خریداران قابل مشاهده است.`}
        actions={
          <>
            <Button asChild variant="accent">
              <Link href={`/listing/${encodeURIComponent(listing.slug)}`}>مشاهدهٔ آگهی</Link>
            </Button>
            {myListingsAction}
            {newListingAction}
          </>
        }
      />
    );
  }

  if (listing.status === 'PENDING_REVIEW') {
    return (
      <OutcomeShell
        icon={<Clock3 aria-hidden className="size-7" />}
        title="آگهی شما برای بررسی ارسال شد"
        description="پس از تأیید، آگهی منتشر می‌شود و برای خریداران نمایش داده خواهد شد."
        actions={
          <>
            {myListingsAction}
            {newListingAction}
          </>
        }
      />
    );
  }

  if (listing.status === 'REJECTED') {
    return (
      <OutcomeShell
        icon={<FileWarning aria-hidden className="size-7" />}
        title="آگهی شما تأیید نشد"
        description={
          listing.rejectedReason ??
          listing.rejectedNote ??
          'برای مشاهدهٔ دلیل و اصلاح آگهی، به فهرست آگهی‌های خود مراجعه کنید.'
        }
        actions={
          <>
            {myListingsAction}
            {newListingAction}
          </>
        }
      />
    );
  }

  return (
    <OutcomeShell
      icon={<FileWarning aria-hidden className="size-7" />}
      title="وضعیت آگهی به‌روزرسانی شد"
      description={`وضعیت کنونی این آگهی «${formatOwnerStatus(listing.status)}» است؛ از فهرست آگهی‌های خود می‌توانید آن را پیگیری کنید.`}
      actions={
        <>
          {myListingsAction}
          {newListingAction}
        </>
      }
    />
  );
}

interface OutcomeShellProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
}

/** Centered result hero: state icon, honest copy, next actions. */
function OutcomeShell({ icon, title, description, actions }: OutcomeShellProps) {
  return (
    <div className="mx-auto max-w-xl space-y-6 py-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="space-y-2">
        <h1 className="text-heading font-semibold text-foreground">{title}</h1>
        <p className="text-ui leading-7 text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col justify-center gap-2 sm:flex-row">{actions}</div>
    </div>
  );
}
