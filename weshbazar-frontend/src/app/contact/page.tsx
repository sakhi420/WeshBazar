import type { Metadata } from 'next';
import Link from 'next/link';
import { Flag, HelpCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

export const metadata: Metadata = {
  title: 'تماس با ما',
  alternates: { canonical: '/contact' },
};

/**
 * Contact page (HF-FTR-002). WeshBazar has no invented support phone/email in
 * contract, so this page routes users through the support surfaces that DO
 * exist: in-listing reporting and the help center.
 */
export default function ContactPage() {
  return (
    <PageContainer>
      <PageHeading title="تماس با ما" description="راه‌های دریافت پشتیبانی و گزارش مشکلات." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-surface border border-border bg-surface p-4">
          <Flag className="size-6 text-primary" aria-hidden />
          <h2 className="mt-3 text-card-title font-semibold text-foreground">گزارش آگهی تخلف</h2>
          <p className="mt-1 text-body text-muted-foreground">
            اگر با آگهی نامناسب یا متقلبانه مواجه شدید، از دکمهٔ «گزارش» داخل همان آگهی استفاده کنید تا
            تیم نظارتی آن را بررسی کند.
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