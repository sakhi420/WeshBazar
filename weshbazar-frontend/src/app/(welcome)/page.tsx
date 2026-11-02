import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  Handshake,
  ShieldCheck,
  ShoppingCart,
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

const faNumber = new Intl.NumberFormat('fa-AF');
function toFa(value: number): string {
  return faNumber.format(value);
}

/**
 * Homepage art assets. Per the design review, Hero + Seller keep the original
 * raster art (superior illustration quality); Trust + CTA use the kit's
 * independent, transparent SVG illustrations. `width`/`height` record the
 * files' intrinsic px sizes so aspect ratios are preserved (no crop/stretch).
 */
const art = {
  hero: { src: '/images/homepage/hero-art.webp', width: 580, height: 450 },
  processSeller: { src: '/images/homepage/process-seller-art.webp', width: 310, height: 255 },
  trustShield: {
    src: '/images/weshbazar-svg/illustrations/trust-shield.svg',
    width: 520,
    height: 410,
  },
  ctaProducts: {
    src: '/images/weshbazar-svg/illustrations/cta-products.svg',
    width: 760,
    height: 390,
  },
} as const;

/** Section icons pulled from the kit's `icons/` folder (120×120 transparent SVG). */
const sectionIcon = {
  pin: '/images/weshbazar-svg/icons/pin.svg',
  users: '/images/weshbazar-svg/icons/users.svg',
  scale: '/images/weshbazar-svg/icons/scale.svg',
  search: '/images/weshbazar-svg/icons/search.svg',
  listing: '/images/weshbazar-svg/icons/listing.svg',
  handshake: '/images/weshbazar-svg/icons/handshake.svg',
  lock: '/images/weshbazar-svg/icons/lock.svg',
  shieldCheck: '/images/weshbazar-svg/icons/shield-check.svg',
} as const;

export default function WelcomePage() {
  return (
    <>
      <Hero />
      <WhyWeshBazar />
      <HowItWorks />
      <TrustSafety />
      <CtaBanner />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative isolate overflow-x-clip bg-gradient-to-b from-primary-soft via-primary-soft/55 to-background">
      <SectionBackdrop />

      <div className="container relative grid items-center gap-10 py-10 lg:grid-cols-2 lg:gap-8 lg:py-20">
        {/* Copy — first child renders on the right in RTL */}
        <div className="max-w-xl animate-fade-up">
          <Eyebrow>بازار بزرگ آنلاین افغانستان</Eyebrow>
          <h1 className="mt-5 text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-[3.25rem] lg:text-[3.75rem]">
            ویش‌بازار
          </h1>
          <p className="mt-3 text-card-title font-semibold text-primary sm:text-section">
            بازار خرید و فروش آسان در افغانستان
          </p>
          <p className="mt-4 max-w-prose text-body leading-8 text-muted-foreground">
            هر آنچه نیاز دارید، جست‌وجو کنید؛ هر آنچه برای فروش دارید، معرفی کنید.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <EnterMarketCta variant="accent" size="lg" className="font-semibold">
              ورود به ویش‌بازار
              <ArrowLeft aria-hidden />
            </EnterMarketCta>
            <a
              href="#how"
              className="group inline-flex items-center gap-2 rounded-control border border-input bg-surface px-5 py-3 text-ui font-medium text-foreground transition-colors duration-small hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              بیشتر بدانید
              <ArrowDown aria-hidden className="size-4 transition-transform duration-small group-hover:translate-y-0.5" />
            </a>
          </div>
        </div>

        {/* Art — second child renders on the left in RTL */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <HeroArt />
        </div>
      </div>

      {/* Curved wave joining the white section below */}
      <HeroWave />
    </section>
  );
}

function HeroArt() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[620px]">
      {/* layered soft glow so the illustration melts into the hero (no cut-and-paste look) */}
      <div className="pointer-events-none absolute -inset-12 rounded-[3rem] bg-gradient-to-bl from-primary/25 via-primary-soft/40 to-accent/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 start-0 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -top-4 end-8 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />

      {/* Raster hero blended into the hero gradient — soft edge mask, no crop */}
      <div className="relative aspect-[58/45] w-full [mask-image:radial-gradient(ellipse_115%_115%_at_50%_45%,#000_62%,transparent_97%)] [-webkit-mask-image:radial-gradient(ellipse_115%_115%_at_50%_45%,#000_62%,transparent_97%)]">
        <Image
          src={art.hero.src}
          alt="تصویر هنری بازار آنلاین ویش‌بازار"
          fill
          sizes="(max-width: 1024px) 100vw, 620px"
          priority
          className="object-contain mix-blend-multiply"
        />
      </div>

      <BrandStar className="absolute -top-1 start-16 h-7 w-7 text-accent/60 animate-wb-float-slow" />

      <FloatingChip
        icon={ShoppingCart}
        label="سبد خرید"
        className="absolute -top-5 start-0 animate-wb-float"
      />
      <FloatingChip
        icon={Tag}
        label="برچسب کالا"
        className="absolute top-1/3 end-0 animate-wb-float-delay"
      />
      <FloatingChip
        icon={Handshake}
        label="معامله‌ای ساده"
        className="absolute bottom-1/4 -start-4 animate-wb-float-delay"
      />
      <FloatingChip
        icon={ShieldCheck}
        label="معاملهٔ آگاهانه"
        className="absolute -bottom-4 end-10 animate-wb-float-slow"
      />
    </div>
  );
}

function FloatingChip({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 shadow-card',
        className,
      )}
    >
      <Icon className="size-4 text-primary" aria-hidden />
      <span className="text-caption font-semibold text-foreground">{label}</span>
    </div>
  );
}

/** Renders a kit icon SVG as a crisp, unoptimized vector (mirrors `BrandLogo`). */
function KitIcon({ src, className }: { src: string; className?: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={120}
      height={120}
      unoptimized
      className={cn('size-6', className)}
    />
  );
}

function HeroWave() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 text-surface">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="block h-[52px] w-full sm:h-[88px]">
        <path
          fill="currentColor"
          d="M0,60 C240,112 480,0 720,30 C960,60 1200,88 1440,40 L1440,90 L0,90 Z"
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Why WeshBazar                                                      */
/* ------------------------------------------------------------------ */

function WhyWeshBazar() {
  return (
    <section id="why" className="scroll-mt-24">
      <div className="container py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <TitleWithLines>چرا ویش‌بازار؟</TitleWithLines>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <WhyCard
            icon={sectionIcon.pin}
            title="پوشش و دسترسی بازار"
            desc="آگهی‌ها را بر اساس شهر و محل جست‌وجو کنید و کالای مورد نظر را در نزدیکی خود بیابید."
          />
          <WhyCard
            icon={sectionIcon.users}
            title="جامعهٔ کاربران"
            desc="فضایی مشترک برای خریداران و فروشندگان؛ هر آگهی در دسترس جست‌وجوکنندگان قرار می‌گیرد."
          />
          <WhyCard
            icon={sectionIcon.scale}
            title="خرید و فروش آگاهانه"
            desc="جزئیات آگهی را پیش از معامله بررسی کنید و با آگاهی کامل تصمیم بگیرید."
          />
          <WhyCard
            icon={sectionIcon.search}
            title="جست‌وجوی سریع و آسان"
            desc="با کلمهٔ کلیدی یا دسته‌بندی، آگهی مورد نظر را به‌سادگی پیدا کنید."
          />
        </div>
      </div>
    </section>
  );
}

function WhyCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <article className="group rounded-surface border border-border bg-surface p-6 shadow-soft transition-all duration-medium hover:-translate-y-1 hover:shadow-card">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft transition-colors duration-small group-hover:bg-primary">
        <KitIcon src={icon} className="size-6" />
      </span>
      <h3 className="mt-5 text-card-title font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-body leading-7 text-muted-foreground">{desc}</p>
    </article>
  );
}

/** Centered heading with thin teal rules on both sides (§3.2). */
function TitleWithLines({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span aria-hidden className="h-px w-10 bg-primary/30 sm:w-16" />
      <h2 className="text-heading font-bold text-foreground sm:text-display">{children}</h2>
      <span aria-hidden className="h-px w-10 bg-primary/30 sm:w-16" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                       */
/* ------------------------------------------------------------------ */

const howSteps = [
  {
    icon: sectionIcon.search,
    title: 'جست‌وجوی کالا',
    desc: 'با کلمهٔ کلیدی یا دسته‌بندی، آگهی مورد نظر خود را پیدا کنید.',
  },
  {
    icon: sectionIcon.listing,
    title: 'بررسی آگهی',
    desc: 'عکس‌ها، توضیحات و شرایط آگهی را با دقت ببینید.',
  },
  {
    icon: sectionIcon.handshake,
    title: 'تماس با فروشنده',
    desc: 'برای جزئیات بیشتر و هماهنگی، با فروشنده در تماس شوید.',
  },
] as const;

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 overflow-x-clip bg-primary-soft/40">
      <div className="container py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <TitleWithLines>چگونه کار می‌کند؟</TitleWithLines>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
          {/* Steps — first child renders on the right in RTL */}
          <ol className="mx-auto w-full max-w-lg space-y-2">
            {howSteps.map((step, index) => (
              <li key={step.title}>
                <HowStep
                  step={index + 1}
                  icon={step.icon}
                  title={step.title}
                  desc={step.desc}
                  isLast={index === howSteps.length - 1}
                />
              </li>
            ))}
          </ol>

          {/* Art — second child renders on the left in RTL */}
          <ProcessArt />
        </div>
      </div>
    </section>
  );
}

function HowStep({
  step,
  icon,
  title,
  desc,
  isLast,
}: {
  step: number;
  icon: string;
  title: string;
  desc: string;
  isLast: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-surface shadow-card ring-1 ring-primary/15">
          <KitIcon src={icon} className="size-6" />
        </span>
        {!isLast && (
          <span className="my-1 flex h-9 items-center text-primary/40" aria-hidden>
            <ArrowDown className="size-4" />
          </span>
        )}
      </div>
      <div className="pt-1.5">
        <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-0.5 text-caption font-bold text-accent-dark">
          قدم {toFa(step)}
        </span>
        <h3 className="mt-2 text-card-title font-bold text-foreground">{title}</h3>
        <p className="mt-1.5 text-body leading-7 text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function ProcessArt() {
  return (
    <div aria-hidden className="relative mx-auto flex w-full max-w-md items-center justify-center">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-primary/10 blur-3xl" />
      <Leaf className="absolute -top-3 -start-2 h-10 w-10 -rotate-12 text-primary/30" />
      <Leaf className="absolute bottom-4 end-0 h-12 w-12 rotate-12 text-accent/40" />
      <Leaf className="absolute top-1/2 -end-3 h-8 w-8 -rotate-45 text-primary/40" />

      <div className="relative aspect-[62/51] w-full max-w-[360px]">
        <Image
          src={art.processSeller.src}
          alt="فروشنده‌ای که با موبایل آگهی خود را مدیریت می‌کند"
          fill
          sizes="(max-width: 1024px) 100vw, 360px"
          className="object-contain mix-blend-multiply"
        />
      </div>
    </div>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('absolute', className)}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
        <path d="M12 3C6.5 6.5 3.5 11.5 4.5 17c.3 1.5.9 2.5 1.5 3C11 22.5 19.5 17.5 21 9c-4.5-2-7-4-9-6z" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Trust & safety                                                     */
/* ------------------------------------------------------------------ */

const safetyFeatures = [
  {
    icon: sectionIcon.listing,
    title: 'بررسی کامل آگهی',
    desc: 'جزئیات، عکس‌ها و توضیحات آگهی را با دقت بخوانید.',
  },
  {
    icon: sectionIcon.scale,
    title: 'معاملهٔ منصفانه',
    desc: 'شرایط قیمت و تحویل را پیش از معامله روشن کنید.',
  },
  {
    icon: sectionIcon.lock,
    title: 'احتیاط در پرداخت',
    desc: 'پیش از واریز هر مبلغ، کالا و فروشنده را ارزیابی کنید.',
  },
  {
    icon: sectionIcon.shieldCheck,
    title: 'آگاهی از قوانین',
    desc: 'نکات ایمنی و راهنمای معامله را مطالعه کنید.',
  },
] as const;

function TrustSafety() {
  return (
    <section id="safety" className="scroll-mt-24 bg-primary-soft/30 py-16 lg:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <TitleWithLines>اعتماد و امنیت</TitleWithLines>
          <p className="mt-4 text-body leading-8 text-muted-foreground">
            پیش از هر معامله، آگاهی و دقت را در اولویت قرار دهید.
          </p>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Shield art — first child renders on the right in RTL */}
          <div aria-hidden className="relative mx-auto w-full max-w-[340px]">
            <div className="pointer-events-none absolute inset-4 rounded-full bg-primary/10 blur-3xl" />
            <Image
              src={art.trustShield.src}
              alt="سپر امنیت با نمای شهری و روبان نارنجی"
              width={art.trustShield.width}
              height={art.trustShield.height}
              unoptimized
              className="relative h-auto w-full"
            />
          </div>

          <div className="rounded-surface border border-border bg-surface p-6 shadow-soft sm:p-8">
            <h3 className="text-heading font-bold text-foreground">معاملهٔ آگاهانه</h3>
            <p className="mt-3 text-body leading-8 text-muted-foreground">
              ویش‌بازار فضایی برای معرفی و پیدا کردن کالاست؛ معاملهٔ نهایی میان خریدار و فروشنده انجام می‌شود.
              پیش از پرداخت، آگهی را با دقت بررسی کنید و در مکان امن معامله کنید.
            </p>
            <Link
              href="/help/safety"
              className="mt-5 inline-flex items-center gap-1.5 text-ui font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              مشاهدهٔ نکات ایمنی کامل
              <ArrowLeft aria-hidden className="size-4" />
            </Link>
          </div>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {safetyFeatures.map((feature) => (
            <li
              key={feature.title}
              className="rounded-surface border border-border bg-surface p-5 shadow-soft"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft">
                <KitIcon src={feature.icon} className="size-6" />
              </span>
              <h3 className="mt-4 text-ui font-bold text-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-meta leading-6 text-muted-foreground">{feature.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA banner                                                         */
/* ------------------------------------------------------------------ */

function CtaBanner() {
  return (
    <section className="container pb-16 pt-2 lg:pb-20">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-primary-dark px-6 py-10 text-white shadow-lift sm:px-10">
        <div aria-hidden className="pointer-events-none absolute -end-10 -top-10 h-48 w-48 rounded-full bg-accent/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -start-16 bottom-0 h-52 w-52 rounded-full bg-primary/60 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
          {/* Products art — first child → right in RTL */}
          <div aria-hidden className="relative mx-auto w-full max-w-[380px]">
            <Image
              src={art.ctaProducts.src}
              alt="مجموعه‌ای از کالاهای قابل معامله در ویش‌بازار"
              width={art.ctaProducts.width}
              height={art.ctaProducts.height}
              unoptimized
              className="h-auto w-full"
            />
          </div>

          <div className="text-center lg:text-start">
            <h2 className="text-display font-bold sm:text-[2rem]">کالایی برای فروش دارید؟</h2>
            <p className="mt-3 text-body leading-8 text-white/80">
              همین حالا به ویش‌بازار بپیوندید و آگهی خود را ثبت کنید.
            </p>
          </div>

          <div className="flex justify-center lg:justify-start">
            <Button asChild variant="accent" size="lg" className="font-semibold">
              <Link href="/sell">ثبت آگهی</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared design primitives                                           */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface/80 px-3 py-1 text-caption font-semibold text-primary shadow-soft">
      <BrandStar className="h-3.5 w-3.5 text-accent" />
      {children}
    </span>
  );
}

function SectionBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute start-1/4 top-24 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
      <div className="absolute end-0 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
    </div>
  );
}