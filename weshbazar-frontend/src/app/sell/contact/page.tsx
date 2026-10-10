import type { Metadata } from 'next';
import { SellContactStep } from '@/features/listings/sell/components/steps/sell-step-contact';

export const metadata: Metadata = {
  title: 'راه‌های تماس',
  robots: { index: false, follow: false },
};

/** Sell contact (§39): phone / WhatsApp / Telegram configuration (§53). */
export default function SellContactPage() {
  return <SellContactStep />;
}
