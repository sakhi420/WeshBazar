import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  CarFront,
  Check,
  Compass,
  Eye,
  House,
  Laptop,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  Shirt,
  Sofa,
  Sparkles,
  Store,
  Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

/**
 * Free Pexels photography used as visual backgrounds:
 * - Hero: Ahmet Özcan, "Charming Shopkeeper in a Middle Eastern Bazaar"
 * - Wide shop: Valentina Lara, "Bustling Small Shop with Assorted Products"
 * - Seller: Nowrin Sanjana, "Local Shopkeeper in a Busy Marketplace"
 * - Category photos: Pexels contributors (see category photo URLs).
 * Pexels permits free use on websites and apps; attribution is appreciated.
 */
const photos = {
  heroMobile:
    'https://images.pexels.com/photos/34271392/pexels-photo-34271392/free-photo-of-charming-shopkeeper-in-middle-eastern-bazaar.jpeg?auto=compress&cs=tinysrgb&w=1200',
  heroWide:
    'https://images.pexels.com/photos/37863204/pexels-photo-37863204/free-photo-of-bustling-small-shop-with-assorted-products.jpeg?auto=compress&cs=tinysrgb&w=2200',
  seller:
    'https://images.pexels.com/photos/37115597/pexels-photo-37115597/free-photo-of-local-shopkeeper-in-a-busy-marketplace.jpeg?auto=compress&cs=tinysrgb&w=1600',
  vehicles:
    'https://images.pexels.com/photos/40895082/pexels-photo-40895082/free-photo-of-car-dealership-consultation-with-customers-in-showroom.jpeg?auto=compress&cs=tinysrgb&w=1200',
  realEstate:
    'https://images.pexels.com/photos/7587880/pexels-photo-7587880.jpeg?auto=compress&cs=tinysrgb&w=1000',
  electronics:
    'https://images.pexels.com/photos/20259184/pexels-photo-20259184/free-photo-of-display-of-electronics.jpeg?auto=compress&cs=tinysrgb&w=1000',
  home:
    'https://images.pexels.com/photos/7511701/pexels-photo-7511701.jpeg?auto=compress&cs=tinysrgb&w=1000',
  fashion:
    'https://images.pexels.com/photos/5490963/pexels-photo-5490963.jpeg?auto=compress&cs=tinysrgb&w=1000',
} as const;

export default function WelcomePage() {
  return (
    <>
      <Hero />
      <QuickSearch />
      <CategoryDiscovery />
      <HowItWorks />
      <SellerInvitation />
      <SafetyNote />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Full-bleed hero                                                            */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#102b28] text-white">
      <div aria-hidden className="absolute inset-0 -z-20">
        <div
          className="absolute inset-0 bg-cover bg-[center_34%] lg:hidden"
          style={{ backgroundImage: \`url("\${photos.heroMobile}")\` }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-[center_48%] lg:block"
          style={{ backgroundImage: \`url("\${photos.heroWide}")\` }}
        />
      </div>

      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071c1a] via-[#092a26]/75 to-[#092a26]/15 lg:bg-gradient-to-l lg:from-[#071c1a]/95 lg:via-[#092a26]/72 lg:to-[#092a26]/5"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -end-20 top-20 size-72 rounded-full bg-primary/30 blur-[100px]" />
        <div className="absolute -start-20 bottom-0 size-64 rounded-full bg-accent/15 blur-[90px]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#071c1a]/70 to-transparent" />
      </div>

      <div className="container relative flex min-h-[680px] flex-col justify-end pb-16 pt-20 sm:min-h-[720px] sm:pb-20 lg:min-h-[660px] lg:justify-center lg:pb-16 lg:pt-16 xl:min-h-[720px]">
        <div className="max-w-2xl animate-fade-up text-center lg:me-auto lg:text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-caption font-bold text-white shadow-lg backdrop-blur-md">
            <BrandStar className="size-4 text-accent" />
            بازار آنلاین خرید و فروش افغانستان
          </span>

          <h1 className="mt-5 text-[2.35rem] font-black leading-[1.3] tracking-tight text-white sm:text-[3.1rem] sm:leading-[1.24] lg:text-[3.65rem]">
            چیزهای خوب،
            <span className="mt-1 block text-[#ffc45d]">همین نزدیکی‌ها پیدا می‌شوند</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[15px] font-medium leading-8 text-white/85 sm:text-[17px] sm:leading-9 lg:mx-0">
            از موبایل و موتر تا خانه و وسایل مورد نیاز؛ آگهی‌ها را ببین و برای خرید یا فروش، مستقیم با طرف مقابل در تماس شو.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <EnterMarketCta
              variant="accent"
              size="lg"
              className="min-h-[54px] gap-2 px-7 text-sm font-extrabold shadow-[0_12px_35px_rgba(245,158,11,0.28)] hover:-translate-y-0.5"
            >
              گشت‌وگذار در بازار
              <ArrowLeft aria-hidden className="size-4" />
            </EnterMarketCta>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[54px] border-white/35 bg-white/10 px-7 text-sm font-bold text-white shadow-lg backdrop-blur-md hover:border-white/60 hover:bg-white/20 hover:text-white"
            >
              <Link href="/sell">
                ثبت آگهی رایگان
                <Tag aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-semibold text-white/80 lg:justify-start">
            <HeroPerk icon={Search}>جست‌وجوی آسان</HeroPerk>
            <HeroPerk icon={Eye}>دیدن جزئیات آگهی</HeroPerk>
            <HeroPerk icon={PhoneCall}>تماس مستقیم</HeroPerk>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-10 start-6 hidden items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl xl:flex">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary-dark">
            <Store aria-hidden className="size-5" />
          </span>
          <span className="text-start">
            <span className="block text-sm font-extrabold text-white">بازار برای همه</span>
            <span className="mt-0.5 block text-xs text-white/70">برای خرید و فروش روزمره</span>
          </span>
          <BrandStar className="ms-2 size-4 text-accent" />
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-5 rounded-t-[50%] bg-background/95" />
    </section>
  );
}

function HeroPerk({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-accent">
        <Icon aria-hidden className="size-3.5" />
      </span>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Search entry                                                               */
/* -------------------------------------------------------------------------- */

function QuickSearch() {
  return (
    <div className="container relative z-20 -mt-7 sm:-mt-8">
      <Link
        href="/search"
        aria-label="جست‌وجوی آگهی‌ها"
        className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-white bg-white p-3 shadow-[0_18px_48px_rgba(14,55,49,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:gap-4 sm:p-4"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white sm:size-14 sm:rounded-2xl">
          <Search aria-hidden className="size-5 sm:size-6" />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate text-sm font-extrabold text-foreground sm:text-base">
            دنبال چی می‌گردی؟
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground sm:text-sm">
            نام کالا، موتر، موبایل یا هر چیزی را جست‌وجو کن
          </span>
        </span>
        <span className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-xs font-extrabold text-primary-dark transition-transform duration-200 group-hover:-translate-x-1 sm:px-5 sm:text-sm">
          جست‌وجو
          <ArrowLeft aria-hidden className="size-4" />
        </span>
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Visual category discovery                                                  */
/* -------------------------------------------------------------------------- */

const categories = [
  {
    slug: 'vehicles',
    title: 'وسایط نقلیه',
    caption: 'موتر و انواع وسایط',
    icon: CarFront,
    image: photos.vehicles,
    position: 'center 54%',
    className: 'col-span-2 aspect-[2.08/1] lg:row-span-2 lg:aspect-auto lg:min-h-[390px]',
  },
  {
    slug: 'mobiles-electronics',
    title: 'موبایل و الکترونیک',
    caption: 'موبایل، لپتاپ و وسایل دیجیتال',
    icon: Laptop,
    image: photos.electronics,
    position: 'center 48%',
    className: 'aspect-[1.08/1]',
  },
  {
    slug: 'real-estate',
    title: 'املاک',
    caption: 'خانه، زمین و دکان',
    icon: House,
    image: photos.realEstate,
    position: 'center 52%',
    className: 'aspect-[1.08/1]',
  },
  {
    slug: 'home-furniture',
    title: 'خانه و مبلمان',
    caption: 'مبلمان و لوازم خانه',
    icon: Sofa,
    image: photos.home,
    position: 'center 52%',
    className: 'aspect-[1.08/1]',
  },
  {
    slug: 'fashion-beauty',
    title: 'مد و زیبایی',
    caption: 'لباس و وسایل شخصی',
    icon: Shirt,
    image: photos.fashion,
    position: 'center 42%',
    className: 'aspect-[1.08/1]',
  },
] as const;

function CategoryDiscovery() {
  return (
    <section id="categories" className="scroll-mt-24 bg-background pb-14 pt-14 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20">
      <div className="container">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-xs font-extrabold text-primary">
              <Compass aria-hidden className="size-4" />
              کشف بازار
            </span>
            <h2 className="mt-2 text-[1.55rem] font-black leading-relaxed text-foreground sm:text-3xl">
              از کدام دسته شروع کنیم؟
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-7 text-muted-foreground">
              دستهٔ مورد نظرت را انتخاب کن و آگهی‌های همان بخش را ببین.
            </p>
          </div>

          <Link
            href="/categories"
            className="mb-1 hidden min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-extrabold text-primary transition-colors hover:bg-primary-soft sm:inline-flex sm:text-sm"
          >
            همهٔ دسته‌ها
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {categories.map((category, index) => (
            <CategoryPhotoCard key={category.slug} category={category} index={index} />
          ))}
        </div>

        <Link
          href="/categories"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary-soft/55 px-4 text-sm font-extrabold text-primary transition-colors hover:bg-primary-soft sm:hidden"
        >
          دیدن همهٔ دسته‌بندی‌ها
          <ArrowLeft aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function CategoryPhotoCard({
  category,
  index,
}: {
  category: (typeof categories)[number];
  index: number;
}) {
  const Icon = category.icon;

  return (
    <Link
      href={\`/category/\${category.slug}\`}
      className={cn(
        'group relative isolate block overflow-hidden rounded-[1.35rem] bg-[#263c39] text-white shadow-card transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        category.className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-20 scale-100 bg-cover transition-transform duration-700 ease-out group-hover:scale-110"
        style={{
          backgroundImage: \`url("\${category.image}")\`,
          backgroundPosition: category.position,
        }}
      />
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 -z-10',
          index === 0
            ? 'bg-gradient-to-t from-[#071f1b]/95 via-[#071f1b]/35 to-transparent'
            : 'bg-gradient-to-t from-[#071f1b]/95 via-[#071f1b]/30 to-[#071f1b]/5',
        )}
      />

      <span className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md transition-all duration-300 group-hover:rotate-[-8deg] group-hover:bg-accent group-hover:text-primary-dark sm:end-4 sm:top-4 sm:size-10">
        <Icon aria-hidden className="size-5" />
      </span>

      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 sm:p-4 lg:p-5">
        <span className="min-w-0 text-start">
          <span className="block text-sm font-black leading-6 text-white sm:text-lg">{category.title}</span>
          <span className="mt-0.5 block text-[10px] font-medium leading-5 text-white/75 sm:text-xs">
            {category.caption}
          </span>
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-300 group-hover:-translate-x-1 group-hover:bg-accent group-hover:text-primary-dark sm:size-9">
          <ArrowLeft aria-hidden className="size-4" />
        </span>
      </span>
    </Link>
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
    detail: 'نام کالا را بنویس یا از دسته‌بندی‌ها شروع کن.',
    tone: 'bg-[#e3f3f0] text-primary',
  },
  {
    number: '۰۲',
    icon: Eye,
    title: 'با دقت بررسی کن',
    detail: 'عکس‌ها، توضیحات و شرایط آگهی را ببین.',
    tone: 'bg-[#fff0d5] text-[#a55e00]',
  },
  {
    number: '۰۳',
    icon: MessageCircle,
    title: 'با فروشنده تماس بگیر',
    detail: 'برای پرسش و هماهنگی، مستقیم صحبت کن.',
    tone: 'bg-[#eee8fb] text-[#6546a0]',
  },
] as const;

function HowItWorks() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f0f7f5] py-14 sm:py-16 lg:py-20">
      <div aria-hidden className="pointer-events-none absolute -end-24 top-0 -z-10 size-72 rounded-full bg-primary/10 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -start-24 bottom-0 -z-10 size-72 rounded-full bg-accent/10 blur-[90px]" />

      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-extrabold text-primary shadow-soft">
            <Sparkles aria-hidden className="size-3.5 text-accent" />
            ساده و روشن
          </span>
          <h2 className="mt-3 text-[1.55rem] font-black leading-relaxed text-foreground sm:text-3xl">
            پیدا کن، بررسی کن، تماس بگیر
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
            مسیر خرید و فروش در ویش‌بازار همین‌قدر ساده است.
          </p>
        </div>

        <ol className="mt-8 grid gap-3 sm:mt-10 md:grid-cols-3 md:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="group relative overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/85 p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card sm:p-6"
              >
                <span aria-hidden className="absolute -end-2 -top-7 text-[5.5rem] font-black leading-none text-primary/[0.045] transition-colors duration-300 group-hover:text-primary/[0.09]">
                  {step.number}
                </span>
                <div className="relative flex items-start justify-between gap-3">
                  <span className={cn('flex size-14 items-center justify-center rounded-2xl shadow-inner shadow-white/70 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-5deg]', step.tone)}>
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <span className="rounded-full bg-background px-3 py-1 text-[10px] font-extrabold tracking-wider text-muted-foreground">
                    قدم {index + 1}
                  </span>
                </div>
                <h3 className="relative mt-5 text-lg font-black text-foreground">{step.title}</h3>
                <p className="relative mt-2 text-sm leading-7 text-muted-foreground">{step.detail}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Seller invitation                                                          */
/* -------------------------------------------------------------------------- */

function SellerInvitation() {
  return (
    <section className="container py-14 sm:py-16 lg:py-20">
      <div className="relative isolate min-h-[410px] overflow-hidden rounded-[1.8rem] bg-[#102b28] text-white shadow-lift sm:min-h-[360px] lg:min-h-[400px]">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-cover bg-[center_40%]"
          style={{ backgroundImage: \`url("\${photos.seller}")\` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071c1a]/95 via-[#071c1a]/70 to-[#071c1a]/20 lg:bg-gradient-to-l lg:from-[#071c1a]/95 lg:via-[#071c1a]/65 lg:to-[#071c1a]/10"
        />
        <div className="flex min-h-[410px] flex-col justify-end p-6 sm:min-h-[360px] sm:p-9 lg:min-h-[400px] lg:max-w-[650px] lg:justify-center lg:p-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-extrabold text-white backdrop-blur-md">
            <Store aria-hidden className="size-4 text-accent" />
            برای فروشندگان
          </span>
          <h2 className="mt-4 text-[1.75rem] font-black leading-relaxed text-white sm:text-3xl">
            چیزی برای فروش داری؟
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
            از کالایت عکس بگیر، مشخصاتش را بنویس و آگهی‌ات را در ویش‌بازار معرفی کن تا خریداران آن را ببینند.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg" className="min-h-[52px] gap-2 px-6 font-extrabold">
              <Link href="/sell">
                ثبت آگهی
                <Tag aria-hidden className="size-4" />
              </Link>
            </Button>
            <Link
              href="/about"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-control border border-white/35 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              آشنایی با ویش‌بازار
              <ArrowUpLeft aria-hidden className="size-4" />
            </Link>
          </div>
        </div>

        <span aria-hidden className="pointer-events-none absolute end-6 top-6 hidden size-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-accent backdrop-blur-md lg:flex">
          <BrandStar className="size-7 animate-wb-float-slow" />
        </span>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Honest safety reminder                                                     */
/* -------------------------------------------------------------------------- */

function SafetyNote() {
  return (
    <section className="bg-[#fff8eb] py-8 sm:py-10">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="flex items-start gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#a55e00] shadow-soft">
              <ShieldCheck aria-hidden className="size-6" />
            </span>
            <div>
              <h2 className="text-base font-black text-foreground">پیش از معامله، با دقت بررسی کن</h2>
              <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">
                ویش‌بازار خریدار و فروشنده را وصل می‌کند؛ معاملهٔ نهایی میان خودشان انجام می‌شود.
              </p>
            </div>
          </div>

          <Link
            href="/help/safety"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold text-[#925200] transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a55e00]"
          >
            نکات ایمنی معامله
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
