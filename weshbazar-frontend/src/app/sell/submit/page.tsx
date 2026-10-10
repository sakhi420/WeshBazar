import type { Metadata } from 'next';
import { SubmitOutcome } from '@/features/listings/sell/components/steps/submit-outcome';

export const metadata: Metadata = {
  title: 'نتیجهٔ ثبت آگهی',
  robots: { index: false, follow: false },
};

interface SellSubmitPageProps {
  /** `?id=` — the submitted listing; absent on direct visits. */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Submission outcome (§41): reads the listing id from the query (the wizard
 * navigates here only after a successful `POST …/submit`) and lets the client
 * view render the honest result for the backend status.
 */
export default async function SellSubmitPage({ searchParams }: SellSubmitPageProps) {
  const params = await searchParams;
  const rawId = params.id;
  const listingId = typeof rawId === 'string' && rawId.length > 0 ? rawId : null;
  return <SubmitOutcome listingId={listingId} />;
}
