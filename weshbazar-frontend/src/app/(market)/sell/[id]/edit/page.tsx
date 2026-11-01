import type { Metadata } from 'next';
import { EditListingView } from '@/features/listings/edit/components';

export const metadata: Metadata = {
  title: 'ویرایش آگهی',
  robots: { index: false, follow: false },
};

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit Listing page (master prompt §42): the seller-facing editor at
 * `/sell/[id]/edit`. The `/sell` layout already provides the container
 * (and the wizard provider, which is harmless here); the client view owns
 * the session gate, loading states and the diff-based save.
 */
export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  return <EditListingView listingId={id} />;
}
