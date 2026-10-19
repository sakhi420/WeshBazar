'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { recordSearchEvent } from '@/features/search/telemetry';

/**
 * Client wrapper for the card link. `ListingCard` itself is a Server
 * Component, so the click handler (search telemetry) must live on the client
 * boundary — passing an onClick from a Server Component to `next/link` would
 * break RSC serialization and fail `next build` (audit F-01).
 */
export function ListingCardLink({
  href,
  listingId,
  className,
  children,
}: {
  href: string;
  listingId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        recordSearchEvent({ type: 'listing_card_opened', listingId });
      }}
      className={className}
    >
      {children}
    </Link>
  );
}