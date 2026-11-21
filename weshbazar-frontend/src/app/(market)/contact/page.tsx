import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Flag,
  HelpCircle,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PublicPageHero } from '@/components/layout/public-page-hero';

export const metadata: Metadata = {
  title: 'تماس با ما',
  description:
    'راه‌های تماس با ویش‌بازار: ایمیل و شمارهٔ پشتیبانی، گزارش آگهی متقلبانه و مرکز راهنمایی.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'تماس با ما',
    description: 'راه‌های تماس با ویش‌بازار.',
    type: 'website',
    locale: 'fa_AF',
    siteName: 'ویش‌بازار',
  },
};

// Real, owner-provided support channels — do not replace with invented details.
const supportEmail = 'sakhinezhad@gmail.com';
const supportPhone = '0701063679';

export default function ContactPage() {
  return (
    <PageContainer className="mx-auto max-w-6xl">
      <PublicPageHero
        eyebrow="ارتباط با تیم ویش‌بازار"
        title="در تماس باشید"
        description="برای پرسش‌ها و موضوعات مربوط به ویش‌بازار، از راه‌های ارتباطی زیر استفاده کنید."
        icon={HelpCircle}
      />

      <section aria-label="راه‌های تماس مستقیم" className="grid gap-4 lg:grid-cols-2">
        <a
          href={'mailto:' + supportEmail}
          className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-5 shadow-soft transition-all duration-small hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Mail className="size-6" aria-hidden="true" />
            </span>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-caption font-medium text-primary">
              ارتباط نوشتاری
            </span>
          </div>
          <h2 className="mt-5 text-section font-bold text-foreground">ایمیل پشتیبانی</h2>
          <p className="mt-2 break-all text-body font-medium text-primary bidi-ltr">
            {supportEmail}
          </p>
          <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-ui font-semibold text-primary">
            نوشتن ایمیل
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </span>
        </a>

        <a
          href={'tel:' + supportPhone}
          className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-5 shadow-soft transition-all duration-small hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark">
              <Phone className="size-6" aria-hidden="true" />
            </span>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-caption font-medium text-accent-dark">
              تماس مستقیم
            </span>
          </div>
          <h2 className="mt-5 text-section font-bold text-foreground">شماره تماس</h2>
          <p dir="ltr" className="mt-2 text-body font-bold tracking-wide text-foreground bidi-ltr">
            {supportPhone}
          </p>
          <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-ui font-semibold text-primary">
            تماس گرفتن
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </span>
        </a>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <Flag className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-section font-bold text-foreground">گزارش آگهی تخلف</h2>
          </div>
          <p className="mt-3 text-ui leading-7 text-muted-foreground">
            اگر با آگهی نامناسب یا متقلبانه روبه‌رو شدید، از دکمهٔ «گزارش» داخل همان آگهی استفاده
            کنید تا تیم نظارتی آن را بررسی کند. این روش، آگهی موردنظر را مستقیم مشخص می‌کند.
          </p>
        </article>

        <aside className="rounded-3xl bg-primary-soft/70 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-surface text-primary shadow-soft">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-section font-bold text-foreground">پیش از معامله</h2>
          </div>
          <p className="mt-3 text-ui leading-7 text-muted-foreground">
            ویش‌بازار واسطهٔ پرداخت یا تحویل کالا نیست. برای آشنایی با روش‌های کاهش خطر، نکات ایمنی را
            پیش از معامله بخوانید.
          </p>
          <Link
            href="/help/safety"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/20 bg-surface px-4 py-2.5 text-ui font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            خواندن نکات ایمنی
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </aside>
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-card-title font-bold text-foreground">پاسخ پرسش‌های رایج</h2>
          <p className="mt-1 text-ui leading-7 text-muted-foreground">
            شاید پاسخ پرسش شما در مرکز راهنمایی آماده باشد.
          </p>
        </div>
        <Link
          href="/help"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-ui font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          رفتن به مرکز راهنمایی
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </PageContainer>
  );
}
