import type { Metadata } from 'next';
import { SellAttributesStep } from '@/features/listings/sell/components/steps/sell-step-attributes';

export const metadata: Metadata = {
  title: 'ویژگی‌های کالا',
  robots: { index: false, follow: false },
};

/** Sell attributes (§37): dynamic category fields from the filter schema. */
export default function SellAttributesPage() {
  return <SellAttributesStep />;
}
