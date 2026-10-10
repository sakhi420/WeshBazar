import type { Metadata } from 'next';
import { SellPhotosStep } from '@/features/listings/sell/components/steps/sell-step-photos';

export const metadata: Metadata = {
  title: 'تصاویر آگهی',
  robots: { index: false, follow: false },
};

/** Sell photos (§35): image selection and ordering. */
export default function SellPhotosPage() {
  return <SellPhotosStep />;
}
