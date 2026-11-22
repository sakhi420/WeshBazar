import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Compass,
  Handshake,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PublicPageHero } from '@/components/layout/public-page-hero';

export const metadata: Metadata = {
  title: 'درباره ما',
  description:
    'ویش‌بازار بازارگاه آنلاین خرید و فروش اجناس نو و دست‌دوم در افغانستان است؛ ثبت آگهی رایگان و تماس مستقیم با فروشنده، بدون واسطه‌گری مالی.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'دربارهٔ ویش‌بازار',
    description: 'بازارگاه آنلاین خرید و فروش در افغانستان.',
    type: 'website',
    locale: 'fa_AF',
    siteName: 'ویش‌بازار',
  },
};

const pillars = [
  {
    icon: Compass,
    title: 'پیدا کردن آسان',
    description: 'آگهی‌ها را بر اساس شهر، دسته‌بندی و قیمت جست‌وجو کنید.',
  },
  {
    icon: Handshake,
    title: 'ارتباط مستقیم',
    description: 'بدون واسطه با خریدار یا فروشنده گفت‌وگو کنید.',
  },
  {
    icon: ShoppingBag,
    title: 'ثبت رایگان آگهی',
    description: 'برای معرفی کالا یا خدمت خود آگهی ثبت کنید.',
  },
] as const;

export default function AboutPage() {
  return (
    <PageContainer className="mx-auto max-w-6xl">
      <PublicPageHero
        eyebrow="آشنایی با ویش‌بازار"
        title="بازاری برای خرید و فروش آسان‌تر"
        description="ویش‌بازار بازارگاه آنلاین خرید و فروش اجناس نو و دست‌دوم در افغانستان است؛ جایی برای پیدا کردن آگهی‌ها و ارتباط مستقیم با طرف معامله."
        icon={ShoppingBag}
      />

      <section aria-label="ویژگی‌های ویش‌بازار" className="grid gap-3 lg:grid-cols-3 sm:gap-4">
        {pillars.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-soft transition-all duration-small hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift sm:p-6"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -end-8 -top-10 size-28 rounded-full bg-primary/5 transition-transform duration-medium group-hover:scale-125"
            />
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Icon className="size-6" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h2 className="relative mt-4 text-card-title font-bold text-foreground">{title}</h2>
            <p className="relative mt-2 text-ui leading-7 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Compass className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-section font-bold text-foreground">چرا ویش‌بازار ساخته شد؟</h2>
          </div>
          <div className="mt-4 space-y-3 text-body leading-8 text-muted-foreground">
            <p>
              پیدا کردن خریدار یا فروشنده نباید دشوار باشد. هدف ویش‌بازار این است که افراد بتوانند
              آگهی‌های موردنیاز خود را در یک بازارگاه آنلاین جست‌وجو کنند، کالا یا خدمت‌شان را معرفی
              کنند و بدون واسطه با طرف مقابل در تماس شوند.
            </p>
            <p>
              ما می‌خواهیم مسیر پیدا کردن آگهی و ارتباط میان افراد ساده و روشن باشد؛ به همین دلیل
              اطلاعات آگهی و راه تماس مستقیم در مرکز تجربهٔ ویش‌بازار قرار دارد.
            </p>
          </div>
        </article>

        <aside className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark to-primary p-5 text-white shadow-soft sm:p-7">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-14 -end-10 size-44 rounded-full border-[24px] border-white/[0.07]"
          />
          <div className="relative flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <h2 className="relative mt-4 text-section font-bold text-white">
            ویش‌بازار چه کاری انجام نمی‌دهد؟
          </h2>
          <p className="relative mt-3 text-ui leading-7 text-white/80">
            ویش‌بازار واسطهٔ مالی نیست. ما پول معامله را دریافت یا نگهداری نمی‌کنیم، کالا را ارسال
            نمی‌کنیم و ضمانت پرداخت، تحویل یا بازپرداخت نمی‌دهیم. این موارد مستقیماً میان خریدار و
            فروشنده انجام می‌شود.
          </p>
          <Link
            href="/help/safety"
            className="relative mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-ui font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            آشنایی با نکات ایمنی
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </aside>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark">
            <UserRound className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-caption font-medium text-muted-foreground">بنیان‌گذار ویش‌بازار</p>
            <h2 className="mt-1 text-card-title font-bold text-foreground">نثار احمد سخی نژاد</h2>
          </div>
        </div>
        <p className="max-w-xl text-ui leading-7 text-muted-foreground sm:text-end">
          ویش‌بازار با هدف آسان‌تر ساختن خرید و فروش آنلاین در افغانستان بنیان‌گذاری شده است.
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-3xl bg-primary-soft/70 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-7">
        <div>
          <h2 className="text-section font-bold text-foreground">آمادهٔ گشت‌وگذار در بازار هستید؟</h2>
          <p className="mt-1 text-ui leading-7 text-muted-foreground">
            آگهی‌ها را ببینید یا برای کالا و خدمت خود آگهی تازه ثبت کنید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/market"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-ui font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            دیدن آگهی‌ها
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/sell"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/20 bg-surface px-5 py-3 text-ui font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ثبت آگهی
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
