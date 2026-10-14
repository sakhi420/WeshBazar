import type { Metadata } from 'next';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

export const metadata: Metadata = {
  title: 'نکات ایمنی',
  alternates: { canonical: '/help/safety' },
};

const buyerTips = [
  'قبل از پرداخت، کالا را از نزدیک بررسی کنید.',
  'در مکان عمومی و امن معامله کنید.',
  'از واریز بیعانه یا پیش‌پرداخت خودداری کنید.',
  'قیمت‌های بسیار پایین‌تر از بازار را جدی نگیرید.',
] as const;

const sellerTips = [
  'مشخصات و وضعیت واقعی کالا را صادقانه بنویسید.',
  'عکس‌های واضح و واقعی از کالا بارگذاری کنید.',
  'اطلاعات تماس را فقط با خریدار جدی در میان بگذارید.',
  'در صورت مشاهدهٔ رفتار مشکوک، آگهی را گزارش دهید.',
] as const;

/** A single tip row with a marker icon. */
function TipList({ icon: Icon, items }: { icon: typeof ShieldCheck; items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-body text-foreground">
          <Icon className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Safety guidance (HF-FTR-002): expands the home-page tips into a full page.
 * Advice is generic marketplace guidance — no invented contacts or claims.
 */
export default function SafetyPage() {
  return (
    <PageContainer>
      <PageHeading
        title="نکات ایمنی"
        description="برای معاملهٔ امن، این راهنما را پیش از خرید یا فروش بخوانید."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-surface border border-border bg-surface p-4">
          <h2 className="text-section font-semibold text-foreground">برای خریداران</h2>
          <div className="mt-3">
            <TipList icon={ShieldCheck} items={buyerTips} />
          </div>
        </section>
        <section className="rounded-surface border border-border bg-surface p-4">
          <h2 className="text-section font-semibold text-foreground">برای فروشندگان</h2>
          <div className="mt-3">
            <TipList icon={ShieldX} items={sellerTips} />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}