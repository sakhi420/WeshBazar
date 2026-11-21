import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  Store,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { BrandStar } from '@/features/welcome/brand-star';
import { EnterMarketCta } from '@/features/welcome/enter-market-cta';

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

const art = {
  hero: { src: '/images/homepage/hero-art.webp', width: 580, height: 450 },
  seller: { src: '/images/homepage/process-seller-art.webp', width: 310, height: 255 },
  trust: {
    src: '/images/weshbazar-svg/illustrations/trust-shield.svg',
    width: 520,
    height: 410,
  },
  products: {
    src: '/images/weshbazar-svg/illustrations/cta-products.svg',
    width: 760,
    height: 390,
  },
} as const;

export default function WelcomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <SellerInvitation />
      <TrustAndSafety />
      <FinalInvitation />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-primary-soft/90 via-[#f6fbfa] to-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 start-[8%] size-72 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute -bottom-24 end-0 size-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute end-[42%] top-20 size-40 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container grid items-center gap-7 pb-12 pt-8 sm:gap-10 sm:pb-16 sm:pt-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-8 lg:pb-20 lg:pt-16">
        <div className="relative z-10 mx-auto w-full max-w-2xl text-center lg:mx-0 lg:text-start">
          <Eyebrow>بازار آنلاین خرید و فروش افغانستان</Eyebrow>

          <h1 className="mt-5 text-[2.15rem] font-extrabold leading-[1.32] tracking-tight text-foreground sm:text-[2.8rem] sm:leading-[1.25] lg:text-[3.45rem]">
            آنچه دنبالش هستی،
            <span className="relative mt-1 block text-primary">
              نزدیک‌تر از همیشه
              <span
                aria-hidden
                className="absolute -bottom-1 start-1/2 h-2 w-28 -translate-x-1/2 rounded-full bg-accent/35 lg:start-0 lg:translate-x-0"
              />
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-body leading-8 text-muted-foreground sm:text-[17px] sm:leading-9 lg:mx-0">
            آگهی‌ها را ببین، کالای مورد نظرت را پیدا کن و برای جزئیات بیشتر، مستقیم با فروشنده در تماس شو.
          </p>

          <div className="mx-auto mt-7 grid w-full max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:justify-center lg:justify-start">
            <EnterMarketCta
              variant="default"
              size="lg"
              className="min-h-[52px] w-full gap-2 px-3 font-bold shadow-glow sm:w-auto sm:px-6"
            >
              ورود به بازار
              <ArrowLeft aria-hidden className="size-4" />
            </EnterMarketCta>

            <Button
              asChild
              variant="accent"
              size="lg"
              className="min-h-[52px] w-full gap-2 px-3 font-bold shadow-soft sm:w-auto sm:px-6"
            >
              <Link href="/sell">
                ثبت آگهی
                <Tag aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-meta font-medium text-muted-foreground lg:justify-start">
            <HeroPoint icon={Search}>جست‌وجوی آسان</HeroPoint>
            <HeroPoint icon={MessageCircle}>تماس مستقیم</HeroPoint>
            <HeroPoint icon={Eye}>بررسی جزئیات آگهی</HeroPoint>
          </div>
        </div>

        <HeroVisual />
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-background/70 to-transparent" />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[620px] lg:me-0">
      <div aria-hidden className="absolute inset-x-8 top-8 -z-10 aspect-square rounded-full bg-primary/15 blur-3xl" />
      <div className="relative aspect-[58/45] w-full">
        <Image
          src={art.hero.src}
          alt="تصویر بازار ویش‌بازار با کالاهای گوناگون و تلفن همراه"
          width={art.hero.width}
          height={art.hero.height}
          priority
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 80vw, 620px"
          className="h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(15,118,110,0.12)]"
        />
      </div>

      <div className="absolute bottom-2 start-1 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-card sm:bottom-5 sm:start-0 sm:px-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Store aria-hidden className="size-5" />
        </span>
        <span className="text-start">
          <span className="block text-caption font-bold text-foreground">بازار ویش‌بازار</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">برای خرید و فروش آسان</span>
        </span>
      </div>

      <BrandStar className="absolute end-[12%] top-[9%] size-7 text-accent/75 animate-wb-float-slow" />
      <span aria-hidden className="absolute end-[4%] top-[47%] size-3 rounded-full bg-accent/70 shadow-[0_0_0_8px_rgba(245,158,11,0.12)]" />
    </div>
  );
}

function HeroPoint({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon aria-hidden className="size-4 text-primary" />
      {children}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3.5 py-1.5 text-caption font-semibold text-primary shadow-soft">
      <BrandStar className="size-3.5 text-accent" />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                               */
/* -------------------------------------------------------------------------- */

const steps = [
  {
    number: '۰۱',
    icon: Search,
    title: 'جست‌وجو کن',
    description: 'با نام کالا یا دسته‌بندی، آگهی‌های مورد نظرت را پیدا کن.',
  },
  {
    number: '۰۲',
    icon: Eye,
    title: 'جزئیات را ببین',
    description: 'عکس‌ها، قیمت و توضیحات آگهی را با دقت بررسی کن.',
  },
  {
    number: '۰۳',
    icon: PhoneCall,
    title: 'تماس بگیر',
    description: 'برای پرسش و هماهنگی، مستقیم با فروشنده صحبت کن.',
  },
] as const;

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 bg-background py-14 sm:py-16 lg:py-20">
      <div className="container">
        <SectionHeading
          eyebrow="شروع آسان"
          title="از جست‌وجو تا تماس، سه قدم ساده"
          description="بدون پیچیدگی، کالای مورد نظرت را پیدا کن و با فروشنده هماهنگ شو."
        />

        <ol className="mt-10 grid gap-3 md:grid-cols-3 md:gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className={cn(
                  'relative flex items-start gap-4 border-b border-border/80 py-5 first:pt-0 last:border-0 last:pb-0 md:flex-col md:items-center md:border-b-0 md:px-7 md:py-0 md:text-center',
                  index > 0 && 'md:border-s md:border-border/80',
                )}
              >
                <div className="relative shrink-0">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary ring-1 ring-primary/10 sm:size-16">
                    <Icon aria-hidden className="size-6 sm:size-7" />
                  </span>
                  <span className="absolute -end-2 -top-2 flex size-6 items-center justify-center rounded-full border-2 border-background bg-accent text-[10px] font-extrabold text-primary-dark">
                    {step.number}
                  </span>
                </div>

                <div className="pt-1 md:pt-0">
                  <h3 className="text-card-title font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-body leading-7 text-muted-foreground md:mx-auto">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-caption font-bold tracking-wide text-primary">{eyebrow}</span>
      <h2 className="mt-2 text-heading font-extrabold leading-relaxed text-foreground sm:text-display">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-body leading-8 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Seller invitation                                                          */
/* -------------------------------------------------------------------------- */

function SellerInvitation() {
  return (
    <section className="overflow-hidden bg-primary-soft/45 py-12 sm:py-16 lg:py-20">
      <div className="container grid items-center gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
        <div className="relative mx-auto w-full max-w-[420px]">
          <div aria-hidden className="absolute inset-5 rounded-full bg-primary/10 blur-3xl" />
          <Image
            src={art.seller.src}
            alt="فروشنده‌ای که با تلفن همراه آگهی خود را معرفی می‌کند"
            width={art.seller.width}
            height={art.seller.height}
            sizes="(max-width: 1024px) 90vw, 420px"
            className="relative mx-auto h-auto w-full max-w-[360px] object-contain"
          />
        </div>

        <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-start">
          <span className="inline-flex items-center gap-2 text-caption font-bold text-primary">
            <Store aria-hidden className="size-4" />
            برای فروشندگان
          </span>
          <h2 className="mt-3 text-heading font-extrabold leading-relaxed text-foreground sm:text-display">
            کالایت را به خریداران معرفی کن
          </h2>
          <p className="mt-3 text-body leading-8 text-muted-foreground">
            عکس و مشخصات کالایت را ثبت کن تا کسانی که به دنبال آن هستند، آگهی‌ات را ببینند و برای جزئیات بیشتر با تو تماس بگیرند.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild variant="accent" size="lg" className="min-h-[50px] gap-2 px-6 font-bold">
              <Link href="/sell">
                ثبت آگهی
                <Tag aria-hidden className="size-4" />
              </Link>
            </Button>
            <EnterMarketCta variant="outline" size="lg" className="min-h-[50px] gap-2 px-5">
              دیدن بازار
              <ArrowLeft aria-hidden className="size-4" />
            </EnterMarketCta>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Trust and safety                                                           */
/* -------------------------------------------------------------------------- */

function TrustAndSafety() {
  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="container">
        <div className="grid items-center gap-6 rounded-[1.75rem] border border-border/80 bg-white px-5 py-7 shadow-soft sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10 lg:px-10">
          <div className="mx-auto w-full max-w-[230px] lg:max-w-[260px]">
            <Image
              src={art.trust.src}
              alt="تصویر نمادین آگاهی و احتیاط در معامله"
              width={art.trust.width}
              height={art.trust.height}
              unoptimized
              className="h-auto w-full"
            />
          </div>

          <div className="text-center lg:text-start">
            <span className="inline-flex items-center gap-2 text-caption font-bold text-primary">
              <ShieldCheck aria-hidden className="size-4" />
              خرید و فروش آگاهانه
            </span>
            <h2 className="mt-2 text-section font-extrabold text-foreground sm:text-heading">
              پیش از معامله، با دقت بررسی کن
            </h2>
            <p className="mt-3 text-body leading-8 text-muted-foreground">
              ویش‌بازار خریدار و فروشنده را به هم وصل می‌کند؛ معاملهٔ نهایی میان خودشان انجام می‌شود. پیش از پرداخت، کالا و مشخصات آن را بررسی کن و شرایط را روشن بساز.
            </p>
            <Link
              href="/help/safety"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-control font-bold text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              خواندن نکات ایمنی
              <ArrowLeft aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Final invitation                                                           */
/* -------------------------------------------------------------------------- */

function FinalInvitation() {
  return (
    <section className="container pb-12 pt-2 sm:pb-16">
      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-primary-dark px-5 py-8 text-white shadow-lift sm:px-9 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute -end-12 -top-16 -z-10 size-56 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -start-16 bottom-0 -z-10 size-56 rounded-full bg-primary/55 blur-3xl" />

        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:gap-8">
          <div aria-hidden className="mx-auto w-full max-w-[260px] lg:max-w-[300px]">
            <Image
              src={art.products.src}
              alt=""
              width={art.products.width}
              height={art.products.height}
              unoptimized
              className="h-auto w-full"
            />
          </div>

          <div className="text-center lg:text-start">
            <h2 className="text-heading font-extrabold leading-relaxed sm:text-display">
              بازار ویش‌بازار را ببین
            </h2>
            <p className="mt-2 text-body leading-8 text-white/75">
              شاید کالایی که دنبالش هستی، همین‌جا منتظر تو باشد.
            </p>
          </div>

          <div className="flex justify-center lg:justify-start">
            <EnterMarketCta
              variant="accent"
              size="lg"
              className="min-h-[52px] w-full max-w-[240px] gap-2 px-6 font-extrabold sm:w-auto"
            >
              ورود به بازار
              <ArrowLeft aria-hidden className="size-4" />
            </EnterMarketCta>
          </div>
        </div>
      </div>
    </section>
  );
}
