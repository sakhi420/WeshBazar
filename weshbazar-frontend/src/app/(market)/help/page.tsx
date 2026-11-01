import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ShieldCheck, Tag } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

export const metadata: Metadata = {
  title: 'مرکز راهنمایی',
  description:
    'راهنمای استفاده از ویش‌بازار: جست‌وجو، بررسی آگهی، تماس با فروشنده، ثبت آگهی و مدیریت حساب.',
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'مرکز راهنمایی',
    description: 'راهنمای استفاده از ویش‌بازار.',
    type: 'website',
    locale: 'fa_AF',
    siteName: 'ویش‌بازار',
  },
};

// Ordered quick-start steps (§4الف). Steps without a standalone route (review,
// contact) stay in-product and omit `href`.
const quickStart = [
  { title: 'جست‌وجو کنید', text: 'در صفحهٔ جست‌وجو، شهر و دسته را فیلتر کنید.', href: '/search' },
  { title: 'جزئیات آگهی را بررسی کنید', text: 'توضیحات، عکس‌ها و اطلاعات فروشنده را با دقت بخوانید.', href: null },
  { title: 'با فروشنده تماس بگیرید', text: 'از گزینهٔ تماس داخل همان آگهی استفاده کنید.', href: null },
  { title: 'آگهی ثبت کنید', text: 'مراحل رایگان ثبت آگهی را دنبال کنید.', href: '/sell' },
  { title: 'آگهی‌های خود را مدیریت کنید', text: 'تمدید، فروخته‌شد و بایگانی در «آگهی‌های من».', href: '/my-listings' },
] as const;

const topics = [
  {
    href: '/help/safety',
    icon: ShieldCheck,
    title: 'نکات ایمنی',
    description: 'راهنمای معاملهٔ امن برای خریداران و فروشندگان.',
  },
  {
    href: '/search',
    icon: MapPin,
    title: 'جست‌وجو و فیلتر',
    description: 'آگهی‌ها را بر اساس شهر، دسته و قیمت پیدا کنید.',
  },
  {
    href: '/sell',
    icon: Tag,
    title: 'ثبت آگهی',
    description: 'مراحل رایگان ثبت آگهی و نکات آن.',
  },
] as const;

export default function HelpPage() {
  return (
    <PageContainer>
      <PageHeading title="مرکز راهنمایی" description="پاسخ پرسش‌های رایج و راهنمای استفاده از ویش‌بازار." />

      <section aria-labelledby="quick-start" className="mt-6">
        <h2 id="quick-start" className="text-section font-semibold text-foreground">
          شروع سریع
        </h2>
        <ol className="mt-3 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickStart.map(({ title, text, href }, index) => {
            const body = (
              <>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-caption font-bold">
                  {index + 1}
                </span>
                <h3 className="mt-2 text-ui font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-caption text-muted-foreground">{text}</p>
              </>
            );
            return (
              <li key={title}>
                {href ? (
                  <Link
                    href={href}
                    className="block h-full rounded-surface border border-border bg-surface p-3 transition-colors duration-small hover:border-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="h-full rounded-surface border border-border bg-surface p-3">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-section font-semibold text-foreground">موضوع‌ها</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="rounded-surface border border-border bg-surface p-4 transition-colors duration-small hover:border-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-card-title font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-ui text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}