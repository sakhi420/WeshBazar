import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Eye,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { BrandStar } from '@/features/welcome/brand-star';
import { EnterMarketCta } from '@/features/welcome/enter-market-cta';
import { HeroIllustration } from '@/features/welcome/hero-illustration';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: { canonical: '/' },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    locale: siteConfig.locale,
    type: 'website',
  },
};

const faNumber = new Intl.NumberFormat('fa-AF');
function toFa(value: number): string {
  return faNumber.format(value);
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft/70 px-3 py-1 text-caption font-semibold text-primary">
      <BrandStar className="h-3.5 w-3.5 text-accent" />
      {children}
    </span>
  );
}

export default function WelcomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <BuyersSellers />
      <Safety />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute start-1/4 top-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute end-0 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container grid items-center gap-12 py-10 lg:grid-cols-2 lg:gap-8 lg:py-20">
        <div className="max-w-xl animate-fade-up">
          <Eyebrow>بازار آنلاین افغانستان</Eyebrow>
          <h1 className="mt-5 text-[2rem] font-bold leading-[1.25] text-foreground sm:text-[2.5rem] lg:text-[3rem]">
            بازار خرید و فروش،
            <br />
            ساده‌تر از همیشه
          </h1>
          <p className="mt-5 max-w-prose text-lg leading-8 text-muted-foreground">
            ویش‌بازار جایی برای پیدا کردن کالاها، مشاهدهٔ آگهی‌ها و معرفی چیزهایی است که برای
            فروش دارید.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <EnterMarketCta size="lg" className="font-semibold">
              ورود به ویش‌بازار
              <ArrowLeft aria-hidden />
            </EnterMarketCta>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-control border border-input bg-surface px-5 py-3 text-ui font-medium text-foreground transition-colors duration-small hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              آشنایی با روش کار
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-caption text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Check className="size-4 text-primary" aria-hidden /> ثبت آگهی رایگان
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="size-4 text-primary" aria-hidden /> تماس مستقیم با فروشنده
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="size-4 text-primary" aria-hidden /> جست‌وجوی ساده
            </li>
          </ul>
        </div>

        <div className="animate-fade-up lg:justify-self-end" style={{ animationDelay: '120ms' }}>
          <HeroIllustration className="mx-auto w-full max-w-md lg:max-w-none" />
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>امکانات</Eyebrow>
          <h2 className="mt-4 text-heading font-bold text-foreground sm:text-display">
            ویش‌بازار چه امکاناتی دارد؟
          </h2>
          <p className="mt-3 text-body text-muted-foreground">
            هر چیزی که برای خرید و فروش نیاز دارید، در یک جای ساده.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <FeatureCard
            icon={Search}
            title="جست‌وجوی آسان"
            desc="آگهی‌ها و دسته‌بندی‌ها را با کلمه یا دسته پیدا کنید."
          />
          <FeatureCard
            icon={ShoppingBag}
            title="خرید و پیدا کردن کالا"
            desc="آگهی‌ها را بررسی کنید و با فروشنده تماس بگیرید."
            highlight
          />
          <FeatureCard
            icon={Tag}
            title="ثبت آگهی و فروش"
            desc="کالا و خدمات خود را به خریداران معرفی کنید."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  highlight = false,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-surface border p-6 shadow-soft transition-all duration-medium hover:-translate-y-1 hover:shadow-card',
        highlight
          ? 'border-primary/20 bg-gradient-to-b from-primary-soft/70 to-surface'
          : 'border-border bg-surface',
      )}
    >
      <BrandStar
        className="absolute -end-3 -top-3 h-9 w-9 text-primary/10 transition-transform duration-medium group-hover:rotate-45"
      />
      <span
        className={cn(
          'flex size-12 items-center justify-center rounded-2xl transition-colors duration-small',
          highlight
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground',
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-5 text-card-title font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-body text-muted-foreground">{desc}</p>
    </article>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 bg-primary-soft/40">
      <div className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>روش کار</Eyebrow>
          <h2 className="mt-4 text-heading font-bold text-foreground sm:text-display">
            استفاده از ویش‌بازار آسان است
          </h2>
          <p className="mt-3 text-body text-muted-foreground">
            در سه قدم ساده به آنچه نیاز دارید برسید یا کالای خود را بفروشید.
          </p>
        </div>

        <ol className="relative mt-12 grid gap-10 lg:grid-cols-3">
          <div
            aria-hidden
            className="absolute inset-x-0 top-7 hidden border-t-2 border-dashed border-primary/20 lg:block"
          />
          <Step
            step={1}
            icon={Search}
            title="جست‌وجو کنید"
            desc="با کلمه یا دسته‌بندی، آگهی مورد نظر خود را پیدا کنید."
          />
          <Step
            step={2}
            icon={Eye}
            title="آگهی را بررسی کنید"
            desc="جزئیات، عکس‌ها و توضیحات آگهی را با دقت ببینید."
          />
          <Step
            step={3}
            icon={MessageCircle}
            title="با فروشنده ارتباط بگیرید"
            desc="برای جزئیات بیشتر و هماهنگی، با فروشنده تماس بگیرید."
          />
        </ol>
      </div>
    </section>
  );
}

function Step({
  step,
  icon: Icon,
  title,
  desc,
}: {
  step: number;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <li className="relative flex flex-col items-center text-center">
      <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-surface shadow-card ring-1 ring-primary/10">
        <Icon className="size-6 text-primary" aria-hidden />
      </div>
      <span className="mt-4 rounded-full bg-accent/15 px-3 py-0.5 text-caption font-bold text-accent-dark">
        قدم {toFa(step)}
      </span>
      <h3 className="mt-2 text-card-title font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-xs text-body text-muted-foreground">{desc}</p>
    </li>
  );
}

function BuyersSellers() {
  return (
    <section className="container py-16">
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="flex flex-col items-start gap-4 rounded-surface border border-border bg-surface p-8 shadow-soft">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Search className="size-6" aria-hidden />
          </span>
          <h2 className="text-heading font-bold text-foreground">آنچه نیاز دارید، پیدا کنید.</h2>
          <p className="text-body text-muted-foreground">
            دسته‌بندی‌ها و آگهی‌ها را بررسی کنید و گزینه‌های مناسب خود را پیدا کنید.
          </p>
          <EnterMarketCta variant="outline" size="default" className="mt-auto">
            مشاهده آگهی‌ها
          </EnterMarketCta>
        </article>

        <article className="relative flex flex-col items-start gap-4 overflow-hidden rounded-surface bg-primary-dark p-8 text-white shadow-card">
          <div aria-hidden className="pointer-events-none absolute -end-8 -top-8 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
          <BrandStar className="absolute end-6 top-6 h-8 w-8 text-accent/60" />
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Store className="size-6" aria-hidden />
          </span>
          <h2 className="text-heading font-bold text-white">چیزی برای فروش دارید؟</h2>
          <p className="text-body text-white/80">
            آگهی خود را ثبت کنید تا دیگران بتوانند آن را پیدا کنند.
          </p>
          <Button asChild variant="accent" size="default" className="mt-auto font-semibold">
            <Link href="/sell">ثبت آگهی رایگان</Link>
          </Button>
        </article>
      </div>
    </section>
  );
}

function Safety() {
  return (
    <section id="safety" className="scroll-mt-24">
      <div className="container pb-16">
        <div className="mx-auto max-w-3xl rounded-surface border border-warning/25 bg-gradient-to-l from-surface to-warning/5 p-6 shadow-card sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-heading font-bold text-foreground">
                با احتیاط و با خیال راحت معامله کنید
              </h2>
              <p className="mt-2 text-body text-muted-foreground">
                ویش‌بازار فضایی برای معرفی و پیدا کردن کالا است؛ معاملهٔ نهایی میان خریدار و فروشنده
                انجام می‌شود. پیش از پرداخت، آگهی را با دقت بررسی کنید و نکات ایمنی را رعایت کنید.
              </p>
            </div>
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <SafetyItem>قبل از پرداخت، کالا را از نزدیک بررسی کنید.</SafetyItem>
            <SafetyItem>در مکان عمومی و امن معامله کنید.</SafetyItem>
            <SafetyItem>از واریز پیش‌پرداخت خودداری کنید.</SafetyItem>
            <SafetyItem>در صورت مشاهدهٔ تخلف، آگهی را گزارش دهید.</SafetyItem>
          </ul>

          <Link
            href="/help/safety"
            className="mt-6 inline-flex items-center gap-1 text-ui font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            مشاهدهٔ راهنمای کامل ایمنی
          </Link>
        </div>
      </div>
    </section>
  );
}

function SafetyItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 rounded-card border border-border bg-surface p-3 text-ui text-foreground">
      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function FinalCta() {
  return (
    <section className="container pb-16">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-primary-dark px-6 py-14 text-center text-white shadow-lift sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path fill="none" stroke="#F59E0B" stroke-width="1" d="M14 2l1.6 10L26 14l-10.4 1.6L14 26l-1.6-10.4L2 14l10.4-1.6z"/></svg>',
            )}")`,
            backgroundSize: '32px 32px',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -end-10 -top-10 h-48 w-48 rounded-full bg-accent/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -start-10 bottom-0 h-48 w-48 rounded-full bg-primary/50 blur-3xl" />

        <div className="relative mx-auto max-w-xl">
          <BrandStar className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mt-5 text-display font-bold sm:text-[2.5rem]">
            آماده‌ای ویش‌بازار را کشف کنی؟
          </h2>
          <p className="mt-3 text-body leading-8 text-white/80">
            همین حالا وارد بازار شوید و آگهی‌ها را ببینید.
          </p>
          <div className="mt-8 flex justify-center">
            <EnterMarketCta variant="accent" size="lg" className="font-semibold">
              ورود به ویش‌بازار
              <ArrowLeft aria-hidden />
            </EnterMarketCta>
          </div>
        </div>
      </div>
    </section>
  );
}