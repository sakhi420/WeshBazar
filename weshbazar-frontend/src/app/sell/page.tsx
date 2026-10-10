import type { Metadata } from 'next';
import { SellStartStep } from '@/features/listings/sell/components/steps/sell-step-start';

export const metadata: Metadata = {
  title: 'انتخاب دسته',
  robots: { index: false, follow: false },
};

/** Sell start (§34): leaf-category picker that drives the wizard schema. */
export default function SellStartPage() {
  return <SellStartStep />;
}
