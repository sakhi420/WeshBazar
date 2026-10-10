import type { Metadata } from 'next';
import { SellLocationStep } from '@/features/listings/sell/components/steps/sell-step-location';

export const metadata: Metadata = {
  title: 'موقعیت آگهی',
  robots: { index: false, follow: false },
};

/** Sell location (§38): province/city — creates the server draft (§45). */
export default function SellLocationPage() {
  return <SellLocationStep />;
}
