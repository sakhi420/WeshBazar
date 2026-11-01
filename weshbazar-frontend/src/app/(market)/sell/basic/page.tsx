import type { Metadata } from 'next';
import { SellBasicStep } from '@/features/listings/sell/components/steps/sell-step-basic';

export const metadata: Metadata = {
  title: 'مشخصات کالا',
  robots: { index: false, follow: false },
};

/** Sell basic info (§36): title, description, condition, price. */
export default function SellBasicPage() {
  return <SellBasicStep />;
}
