/**
 * Listing status chip shared by the moderation queue surfaces (§145/§146) —
 * mirrors the owner-side badge palette so a status reads the same everywhere.
 */

import { formatOwnerStatus, type OwnerListingStatus } from '@/features/listings';
import { cn } from '@/lib/utils';

const STATUS_BADGE_CLASSES: Record<OwnerListingStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_REVIEW: 'border border-warning/30 bg-warning/10 text-foreground',
  ACTIVE: 'bg-primary-soft text-primary',
  REJECTED: 'border border-danger/30 bg-danger/5 text-danger',
  SOLD: 'bg-muted text-muted-foreground',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

export function ListingStatusBadge({
  status,
  className,
}: {
  status: OwnerListingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-control px-2 py-0.5 text-caption font-medium',
        STATUS_BADGE_CLASSES[status] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {formatOwnerStatus(status)}
    </span>
  );
}
