import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  type LucideIcon,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PublicPageHero } from '@/components/layout/public-page-hero';

export const metadata: Metadata = {
  title: 'نکات ایمنی',
  description:
    'راهنمای معاملهٔ امن در ویش‌بازار: نکات خریداران و فروشندگان، علائم خطر و روش گزارش آگهی مشکوک.',
  alternates: { canonical: '/help/safety' },
  openGraph: {
    title: 'نکات ایمنی',
    description: 'راهنمای معاملهٔ امن در ویش‌بازار.',
    type: 'website',
    locale: 'fa_AF',
    siteName: 'ویش‌بازار',
  },
};

const buyerTips = [
  'پیش از پرداخت، کالا را از نزدیک بررسی کنید.',
  'برای دیدار و معامله، مکان عمومی و امن را انتخاب کنید.',
  'از واریز بیعانه یا پیش‌پرداخت پیش از بررسی کالا خودداری کنید.',
  'قیمت‌های بسیار پایین‌تر از نرخ معمول بازار را با دقت بررسی کنید.',
] as const;

const sellerTips = [
  'مشخصات و وضعیت واقعی کالا را صادقانه بنویسید.',
  'عکس‌های واضح و واقعی از همان کالا بارگذاری کنید.',
  'پیش از اطمینان از دریافت پول، کالا را تحویل یا ارسال نکنید.',
  'اطلاعات شخصی و تماس خود را با احتیاط در اختیار دیگران بگذارید.',
] as const;

const redFlags = [
  'اصرار بر تصمیم‌گیری فوری یا پیشنهاد بیش از حد وسوسه‌کننده.',
  'درخواست بیعانه یا واریز پول پیش از دیدن و بررسی کالا.',
  'فرستادن پیوند ناشناس برای پرداخت یا دریافت اطلاعات شخصی.',
  'خودداری از پاسخ‌گویی روشن یا نپذیرفتن دیدار در مکان امن.',
] as const;

function TipList({ icon: Icon, items }: { icon: LucideIcon; items: readonly string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-ui leading-7 text-foreground">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Icon className="size-4" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SafetyPage() {
  return (
    <PageContainer className="mx-auto max-w-6xl">
      <PublicPageHero
        eyebrow="پیش از هر معامله"
        title="امنیت را جدی بگیرید"
        description="چند بررسی ساده پیش از خرید یا فروش، خطر فریب و از دست‌دادن پول را کمتر می‌کند. این نکات را پیش از معامله مرور کنید."
        icon={ShieldCheck}
      />

      <aside
        role="note"
        className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950 sm:p-5"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-bold">نکتهٔ مهم دربارهٔ پرداخت و تحویل</h2>
          <p className="mt-1 text-ui leading-7 text-amber-900/90">
            ویش‌بازار پول معامله را دریافت یا نگهداری نمی‌کند و کالا را نیز تحویل یا ارسال نمی‌کند.
            پرداخت و تحویل مستقیماً میان خریدار و فروشنده انجام می‌شود؛ بنابراین پیش از پرداخت یا
            تحویل، همه‌چیز را شخصاً بررسی کنید.
          </p>
        </div>
      </aside>

      <section aria-label="توصیه‌های خریداران و فروشندگان" className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-caption text-muted-foreground">پیش از خرید</p>
              <h2 className="text-section font-bold text-foreground">برای خریداران</h2>
            </div>
          </div>
          <div className="pt-4">
            <TipList icon={Check} items={buyerTips} />
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark">
              <ShieldX className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-caption text-muted-foreground">پیش از فروش</p>
              <h2 className="text-section font-bold text-foreground">برای فروشندگان</h2>
            </div>
          </div>
          <div className="pt-4">
            <TipList icon={Check} items={sellerTips} />
          </div>
        </article>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-danger/20 bg-gradient-to-br from-danger/[0.06] to-surface p-5 shadow-soft sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-caption font-medium text-danger">با دیدن این موارد مکث کنید</p>
            <h2 className="text-section font-bold text-foreground">علائم خطر در معامله</h2>
          </div>
        </div>
        <div className="mt-5">
          <TipList icon={Ban} items={redFlags} />
        </div>
        <p className="mt-5 rounded-2xl bg-danger/[0.06] p-4 text-ui font-medium leading-7 text-foreground">
          اگر با یکی از این موارد روبه‌رو شدید، معامله را متوقف کنید، پول یا اطلاعات شخصی نفرستید و
          آگهی مشکوک را گزارش دهید.
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-3xl bg-primary-dark p-5 text-white shadow-soft xl:flex-row xl:items-center xl:justify-between sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-section font-bold text-white">چطور آگهی مشکوک را گزارش کنیم؟</h2>
            <p className="mt-1 max-w-2xl text-ui leading-7 text-white/75">
              از دکمهٔ «گزارش» در همان آگهی استفاده کنید تا تیم نظارتی آن را بررسی کند. برای پرسش‌های
              دیگر می‌توانید به مرکز راهنمایی یا صفحهٔ تماس مراجعه کنید.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/help"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-ui font-semibold text-primary-dark transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            مرکز راهنمایی
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-4 py-2.5 text-ui font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            تماس با ما
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
