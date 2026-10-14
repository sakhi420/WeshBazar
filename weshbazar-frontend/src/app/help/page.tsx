import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ShieldCheck, Tag } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

export const metadata: Metadata = {
  title: 'مرکز راهنمایی',
  alternates: { canonical: '/help' },
};

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

/**
 * Help center landing (HF-FTR-002): entry point to the support topics that
 * exist in the product — safety, search, and selling.
 */
export default function HelpPage() {
  return (
    <PageContainer>
      <PageHeading
        title="مرکز راهنمایی"
        description="پاسخ پرسش‌های رایج و راهنمای استفاده از وش‌بازار."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="rounded-surface border border-border bg-surface p-4 transition-colors duration-small hover:border-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon className="size-6 text-primary" aria-hidden />
            <h2 className="mt-3 text-card-title font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-ui text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}