import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PublicPageHero } from '@/components/layout/public-page-hero';

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

const quickStart = [
  { title: 'جست‌وجو کنید', text: 'در بخش جست‌وجو، آگهی‌ها را بر اساس شهر و دسته پیدا کنید.', href: '/search' },
  {
    title: 'جزئیات آگهی را بررسی کنید',
    text: 'توضیحات، عکس‌ها، قیمت و اطلاعات فروشنده را با دقت بخوانید.',
    href: null,
  },
  {
    title: 'با فروشنده تماس بگیرید',
    text: 'از راه تماس درج‌شده در همان آگهی برای گفت‌وگو استفاده کنید.',
    href: null,
  },
  { title: 'آگهی ثبت کنید', text: 'مراحل ثبت رایگان آگهی را دنبال کنید.', href: '/sell' },
  {
    title: 'آگهی‌های خود را مدیریت کنید',
    text: 'وضعیت، تمدید و بایگانی آگهی‌ها را از بخش آگهی‌های من مدیریت کنید.',
    href: '/my-listings',
  },
] as const;

const topics = [
  {
    href: '/help/safety',
    icon: ShieldCheck,
    title: 'نکات ایمنی',
    description: 'پیش از پرداخت یا تحویل کالا، این توصیه‌ها را بخوانید.',
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
    description: 'کالا یا خدمت خود را در چند مرحله معرفی کنید.',
  },
  {
    href: '/my-listings',
    icon: ClipboardList,
    title: 'مدیریت آگهی‌ها',
    description: 'آگهی‌های ثبت‌شدهٔ خود را ببینید و مدیریت کنید.',
  },
] as const;

const faqs = [
  {
    question: 'ثبت آگهی در ویش‌بازار هزینه دارد؟',
    answer: 'خیر، ثبت آگهی در ویش‌بازار رایگان است.',
  },
  {
    question: 'چطور آگهی موردنظرم را پیدا کنم؟',
    answer: 'از بخش جست‌وجو استفاده کنید و آگهی‌ها را بر اساس شهر و دسته‌بندی محدود سازید.',
  },
  {
    question: 'چگونه با فروشنده تماس بگیرم؟',
    answer: 'راه تماس درج‌شده در صفحهٔ همان آگهی را باز کنید و پیش از معامله، جزئیات کالا را بررسی کنید.',
  },
  {
    question: 'آیا ویش‌بازار پول معامله را دریافت یا نگهداری می‌کند؟',
    answer: 'خیر، ویش‌بازار واسطهٔ مالی نیست. پرداخت و تحویل کالا مستقیماً میان خریدار و فروشنده انجام می‌شود.',
  },
  {
    question: 'چطور یک آگهی مشکوک را گزارش کنم؟',
    answer: 'از دکمهٔ «گزارش» داخل همان آگهی استفاده کنید تا تیم نظارتی بتواند مورد مشخص‌شده را بررسی کند.',
  },
] as const;

export default function HelpPage() {
  return (
    <PageContainer className="mx-auto max-w-6xl">
      <PublicPageHero
        eyebrow="راهنمای استفاده"
        title="پاسخ پرسش‌هایتان را پیدا کنید"
        description="از جست‌وجوی آگهی تا ثبت و مدیریت آن؛ راهنماهای زیر کمک می‌کنند ویش‌بازار را ساده‌تر استفاده کنید."
        icon={MessageCircle}
      />

      <section aria-labelledby="quick-start">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-caption font-semibold text-primary">از کجا شروع کنم؟</p>
            <h2 id="quick-start" className="mt-1 text-section font-bold text-foreground">
              راهنمای قدم‌به‌قدم
            </h2>
          </div>
          <span className="text-caption text-muted-foreground">۵ گام ساده</span>
        </div>

        <ol className="mt-4 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickStart.map(({ title, text, href }, index) => {
            const body = (
              <>
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-caption font-bold text-primary-foreground shadow-soft">
                  {['۱', '۲', '۳', '۴', '۵'][index] ?? index + 1}
                </span>
                <h3 className="mt-4 text-card-title font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-ui leading-7 text-muted-foreground">{text}</p>
                {href ? (
                  <span className="mt-4 inline-flex items-center gap-2 text-ui font-semibold text-primary">
                    رفتن به بخش مربوط
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </span>
                ) : null}
              </>
            );

            return (
              <li key={title}>
                {href ? (
                  <Link
                    href={href}
                    className="group block h-full rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all duration-small hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="h-full rounded-2xl border border-border bg-surface p-4 shadow-soft sm:p-5">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-9" aria-labelledby="help-topics">
        <p className="text-caption font-semibold text-primary">دسترسی سریع</p>
        <h2 id="help-topics" className="mt-1 text-section font-bold text-foreground">
          راهنماهای پرکاربرد
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex h-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all duration-small hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-ui font-bold text-foreground">{title}</span>
                <span className="mt-1 block text-caption leading-6 text-muted-foreground">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-9" aria-labelledby="common-questions">
        <p className="text-caption font-semibold text-primary">پاسخ‌های کوتاه و روشن</p>
        <h2 id="common-questions" className="mt-1 text-section font-bold text-foreground">
          پرسش‌های رایج
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {faqs.map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-2xl border border-border bg-surface shadow-soft open:border-primary/25"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 p-4 text-ui font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <ChevronDown
                  className="size-5 shrink-0 text-primary transition-transform duration-small group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="border-t border-border px-4 py-3 text-ui leading-7 text-muted-foreground">
                {answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-4 rounded-3xl bg-primary-soft/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-primary shadow-soft">
            <MessageCircle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-section font-bold text-foreground">هنوز پرسشی دارید؟</h2>
            <p className="mt-1 text-ui leading-7 text-muted-foreground">
              راه‌های ارتباط با تیم ویش‌بازار را در صفحهٔ تماس ببینید.
            </p>
          </div>
        </div>
        <Link
          href="/contact"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-ui font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          تماس با ما
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </PageContainer>
  );
}
