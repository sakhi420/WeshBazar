import type { Metadata } from 'next';
import Link from 'next/link';
import { Flag, HelpCircle, Mail, Phone } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

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

// Real, owner-provided support channels (§4د) — no invented contact data.
const supportEmail = 'sakhinezhad@gmail.com';
const supportPhone = '0701063679';

export default function ContactPage() {
  return (
    <PageContainer>
      <PageHeading title="تماس با ما" description="راه‌های تماس با تیم ویش‌بازار و دریافت پشتیبانی." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-surface border border-border bg-surface p-4">
          <Mail className="size-6 text-primary" aria-hidden />
          <h2 className="mt-3 text-card-title font-semibold text-foreground">ایمیل پشتیبانی</h2>
          <p className="mt-1 text-body text-muted-foreground">
            <a href={`mailto:${supportEmail}`} className="bidi-ltr text-primary hover:underline">
              {supportEmail}
            </a>
          </p>
        </section>
        <section className="rounded-surface border border-border bg-surface p-4">
          <Phone className="size-6 text-primary" aria-hidden />
          <h2 className="mt-3 text-card-title font-semibold text-foreground">شماره تماس</h2>
          <p className="mt-1 text-body text-muted-foreground">
            <a href={`tel:${supportPhone}`} className="bidi-ltr text-primary hover:underline">
              {supportPhone}
            </a>
          </p>
        </section>

        <section className="rounded-surface border border-border bg-surface p-4">
          <Flag className="size-6 text-primary" aria-hidden />
          <h2 className="mt-3 text-card-title font-semibold text-foreground">گزارش آگهی تخلف</h2>
          <p className="mt-1 text-body text-muted-foreground">
            اگر با آگهی نامناسب یا متقلبانه روبه‌رو شدید، از دکمهٔ «گزارش» داخل همان آگهی استفاده کنید
            تا تیم نظارتی آن را بررسی کند.
          </p>
        </section>
        <section className="rounded-surface border border-border bg-surface p-4">
          <HelpCircle className="size-6 text-primary" aria-hidden />
          <h2 className="mt-3 text-card-title font-semibold text-foreground">مرکز راهنمایی</h2>
          <p className="mt-1 text-body text-muted-foreground">
            پاسخ بیشتر پرسش‌ها را در{' '}
            <Link href="/help" className="text-primary hover:underline">
              مرکز راهنمایی
            </Link>{' '}
            پیدا خواهید کرد.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}