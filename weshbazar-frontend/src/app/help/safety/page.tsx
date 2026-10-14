import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Ban, ShieldCheck, ShieldX, type LucideIcon } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

export const metadata: Metadata = {
  title: 'نکات ایمنی',
  description:
    'راهنمای معاملهٔ امن در وش‌بازار: نکات خریداران و فروشندگان، علائم خطر و روش گزارش آگهی مشکوک.',
  alternates: { canonical: '/help/safety' },
  openGraph: {
    title: 'نکات ایمنی',
    description: 'راهنمای معاملهٔ امن در وش‌بازار.',
    type: 'website',
    locale: 'fa_AF',
    siteName: 'وش‌بازار',
  },
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
  'پیش از اطمینان از پرداخت، کالا را تحویل یا ارسال نکنید.',
  'اطلاعات تماس را فقط با خریدار جدی در میان بگذارید.',
] as const;

const redFlags = [
  'قیمت بسیار پایین‌تر از بازار یا اصرار فروشنده بر «همین حالا بخرید».',
  'درخواست پیش‌پرداخت یا بیعانه پیش از تحویل کالا.',
  'ارسال لینک پرداخت یا آدرس ناشناس خارج از برنامه.',
  'خودداری فروشنده از معاملهٔ حضوری یا ارائهٔ اطلاعات گویا.',
] as const;

function TipList({ icon: Icon, items }: { icon: LucideIcon; items: readonly string[] }) {
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

      <section className="mt-6 rounded-surface border border-border bg-surface p-4">
        <h2 className="flex items-center gap-2 text-section font-semibold text-foreground">
          <AlertTriangle className="size-5 text-warning" aria-hidden />
          علائم خطر
        </h2>
        <div className="mt-3">
          <TipList icon={Ban} items={redFlags} />
        </div>
        <p className="mt-3 text-ui text-muted-foreground">
          در صورت مشاهدهٔ این علائم، معامله را متوقف کنید. وش‌بازار ضمانت پرداخت، تحویل یا بازپرداخت
          ارائه نمی‌دهد؛ امنیت مالی معامله به عهدهٔ خود طرفین است.
        </p>
      </section>

      <section className="mt-6 rounded-surface border border-border bg-surface p-4">
        <h2 className="text-section font-semibold text-foreground">گزارش آگهی مشکوک</h2>
        <p className="mt-1 text-body text-muted-foreground">
          اگر آگهی نامناسب یا متقلبانه‌ای دیدید، از دکمهٔ «گزارش» داخل همان آگهی استفاده کنید تا تیم
          نظارتی بررسی کند. برای سایر پرسش‌ها از{' '}
          <Link href="/contact" className="text-primary hover:underline">
            صفحهٔ تماس با ما
          </Link>{' '}
          استفاده کنید.
        </p>
      </section>
    </PageContainer>
  );
}