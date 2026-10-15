import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Handshake, ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

export const metadata: Metadata = {
  title: 'درباره ما',
  description:
    'وش‌بازار بازارگاه آنلاین خرید و فروش اجناس نو و دست‌دوم در افغانستان است؛ ثبت آگهی رایگان و تماس مستقیم با فروشنده، بدون واسطه‌گری مالی.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'دربارهٔ وش‌بازار',
    description: 'بازارگاه آنلاین خرید و فروش در افغانستان.',
    type: 'website',
    locale: 'fa_AF',
    siteName: 'وش‌بازار',
  },
};

/**
 * About WeshBazar (§4ب). Honest mission + explicit scope limits (no escrow,
 * payment, delivery, or dispute resolution) and real founder attribution.
 */
export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeading
        title="دربارهٔ وش‌بازار"
        description="بازارگاه آنلاین خرید و فروش اجناس نو و دست‌دوم در افغانستان."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-surface border border-border bg-surface p-4">
          <Compass className="size-6 text-primary" aria-hidden />
          <h2 className="mt-2 text-card-title font-semibold text-foreground">جست‌وجوی ساده</h2>
          <p className="mt-1 text-ui text-muted-foreground">
            آگهی‌ها را بر اساس شهر، دسته و قیمت پیدا کنید.
          </p>
        </div>
        <div className="rounded-surface border border-border bg-surface p-4">
          <Handshake className="size-6 text-primary" aria-hidden />
          <h2 className="mt-2 text-card-title font-semibold text-foreground">تماس مستقیم</h2>
          <p className="mt-1 text-ui text-muted-foreground">
            بی‌واسطه با خریدار یا فروشنده صحبت کنید.
          </p>
        </div>
        <div className="rounded-surface border border-border bg-surface p-4">
          <ShieldCheck className="size-6 text-primary" aria-hidden />
          <h2 className="mt-2 text-card-title font-semibold text-foreground">ثبت رایگان</h2>
          <p className="mt-1 text-ui text-muted-foreground">آگهی‌گذاری در وش‌بازار رایگان است.</p>
        </div>
      </div>

      <div className="mt-6 max-w-3xl space-y-4 text-body text-foreground">
        <p>
          وش‌بازار برای ساده‌کردن خرید و فروش در سراسر افغانستان ساخته شده است. هدف ما این است که هر
          کسی بتواند بدون واسطه، رایگان و به‌سادگی آگهی بگذارد، کالا یا خدمت موردنیازش را پیدا کند و
          مستقیم با طرف مقابل تماس بگیرد.
        </p>

        <div className="rounded-surface border border-border bg-surface p-4">
          <h2 className="text-section font-semibold text-foreground">
            وش‌بازار چه کاری انجام نمی‌دهد؟
          </h2>
          <p className="mt-2 text-ui text-muted-foreground">
            وش‌بازار یک بازارگاه است، نه واسطهٔ مالی. ما نگهداری پول، پرداخت داخلی، ارسال کالا،
            امانت‌داری مالی یا حل اختلاف را انجام نمی‌دهیم؛ پرداخت و تحویل به‌صورت مستقیم میان خریدار و
            فروشنده انجام می‌شود.
          </p>
        </div>

        <p>
          پیش از هر معامله{' '}
          <Link href="/help/safety" className="text-primary hover:underline">
            نکات ایمنی
          </Link>{' '}
          را بخوانید.
        </p>
        <div className="rounded-surface border border-border bg-surface p-4">
          <h2 className="text-section font-semibold text-foreground">بنیان‌گذار</h2>
          <p className="mt-2 text-ui text-muted-foreground">
            وش‌بازار توسط نثار احمد سخی نژاد بنیان‌گذاری شده است.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}