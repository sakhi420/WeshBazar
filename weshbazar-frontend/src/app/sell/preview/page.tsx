import type { Metadata } from 'next';
import { SellPreviewStep } from '@/features/listings/sell/components/steps/sell-step-preview';

export const metadata: Metadata = {
  title: 'پیش‌نمایش آگهی',
  robots: { index: false, follow: false },
};

/** Sell preview (§40): public-style preview + sequential photo upload + submit. */
export default function SellPreviewPage() {
  return <SellPreviewStep />;
}
