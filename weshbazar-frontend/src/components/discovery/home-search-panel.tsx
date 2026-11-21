import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, MapPinned, Sparkles, Tag } from 'lucide-react';
import { LocationPicker } from '@/components/location/location-picker';
import { SearchField } from '@/features/search/components/search-field';

const HERO_IMAGES = {
  vehicle: {
    src: 'https://images.unsplash.com/photo-1760713170685-b67abc3be5ad?auto=format&fit=crop&w=1200&q=82',
    position: 'center 58%',
  },
  home: {
    src: 'https://images.unsplash.com/photo-1781269986378-a2f366df4d0f?auto=format&fit=crop&w=900&q=80',
    position: 'center 52%',
  },
  mobile: {
    src: 'https://images.unsplash.com/photo-1722151954628-c218fbb82710?auto=format&fit=crop&w=700&q=78',
    position: 'center 48%',
  },
  furniture: {
    src: 'https://images.unsplash.com/photo-1776482128012-a47f853abd57?auto=format&fit=crop&w=700&q=78',
    position: 'center 55%',
  },
} as const;

function HeroPhoto({
  photo,
  alt,
  priority = false,
}: {
  photo: (typeof HERO_IMAGES)[keyof typeof HERO_IMAGES];
  alt: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={photo.src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 1023px) 48vw, 24vw"
      className="object-cover"
      style={{ objectPosition: photo.position }}
    />
  );
}

/**
 * Mobile-first marketplace hero.
 *
 * The canvas stays light and open rather than becoming a heavy solid-green
 * banner. Search appears before the photo collage on mobile; on desktop the
 * copy and collage share the first row, with search spanning beneath them.
 */
export function HomeSearchPanel() {
  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative isolate overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-surface via-primary-soft/45 to-accent/10 shadow-card sm:rounded-[2rem]"
    >
      <div aria-hidden className="pointer-events-none absolute -end-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -start-16 bottom-10 size-56 rounded-full bg-accent/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent" />

      <div className="relative grid gap-4 px-4 pb-4 pt-5 sm:gap-5 sm:px-6 sm:pb-6 sm:pt-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:items-center lg:gap-6 lg:px-8 lg:pb-7 lg:pt-8">
        <div className="relative z-10 min-w-0 space-y-3 sm:space-y-4 lg:col-start-1 lg:row-start-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/75 px-3 py-1.5 text-[11px] font-bold text-primary shadow-soft backdrop-blur-sm">
            <Sparkles className="size-3.5 text-accent" aria-hidden />
            بازار آنلاین افغانستان
          </p>
          <div className="space-y-2">
            <h1
              id="home-hero-title"
              className="max-w-xl text-[1.7rem] font-black leading-[1.42] tracking-tight text-foreground sm:text-3xl lg:text-[2.55rem]"
            >
              هر چی می‌خواهی، از همین‌جا پیدا کن
            </h1>
            <p className="max-w-xl text-xs leading-6 text-muted-foreground sm:text-sm sm:leading-7">
              آگهی‌های موتر، خانه، موبایل و نیازهای روزمره را جست‌وجو کن؛ یا کالایت را رایگان به دیگران معرفی کن.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold text-muted-foreground sm:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-4 text-primary" aria-hidden />
              اجناس نو و دست‌دوم
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPinned className="size-4 text-primary" aria-hidden />
              جست‌وجو بر اساس شهر
            </span>
          </div>
          <Link
            href="/sell"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-extrabold text-accent-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            ثبت آگهی رایگان
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="relative z-10 rounded-[1.25rem] border border-white/80 bg-white/75 p-2.5 shadow-card backdrop-blur-sm sm:p-3 lg:col-start-1 lg:col-span-2 lg:row-start-2">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-extrabold text-foreground sm:text-sm">چی دنبالش هستی؟</p>
            <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">جست‌وجو در آگهی‌ها</span>
          </div>
          <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-muted/20" />}>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-stretch">
              <SearchField
                className="w-full min-w-0"
                placeholder="مثلاً موتر، خانه یا موبایل..."
                redirectToSearch
                compact
              />
              <LocationPicker className="w-full sm:w-auto" redirectToSearch />
            </div>
          </Suspense>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:col-start-2 lg:row-start-1 lg:me-0">
          <div aria-hidden className="pointer-events-none absolute -inset-3 rounded-[1.6rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/15 blur-xl" />
          <div className="relative grid h-[124px] grid-cols-[1.05fr_0.95fr] grid-rows-2 gap-1.5 sm:h-[190px] sm:gap-2 lg:h-[228px]">
            <div className="relative row-span-2 overflow-hidden rounded-[1.1rem] border border-white/80 bg-primary-soft shadow-card">
              <HeroPhoto photo={HERO_IMAGES.vehicle} alt="موتر برای خرید و فروش" priority />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
            </div>
            <div className="relative overflow-hidden rounded-[1.1rem] border border-white/80 bg-primary-soft shadow-soft">
              <HeroPhoto photo={HERO_IMAGES.home} alt="خانه برای خرید و کرایه" />
            </div>
            <div className="grid min-h-0 grid-cols-2 gap-1.5 sm:gap-2">
              <div className="relative overflow-hidden rounded-[1rem] border border-white/80 bg-primary-soft shadow-soft">
                <HeroPhoto photo={HERO_IMAGES.mobile} alt="موبایل و وسایل الکترونیکی" />
              </div>
              <div className="relative overflow-hidden rounded-[1rem] border border-white/80 bg-primary-soft shadow-soft">
                <HeroPhoto photo={HERO_IMAGES.furniture} alt="مبلمان و لوازم خانه" />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 end-2 inline-flex items-center gap-2 rounded-full border border-white/80 bg-surface/95 px-3 py-1.5 text-[10px] font-bold text-foreground shadow-card backdrop-blur-sm sm:bottom-2 sm:end-3 sm:py-2 sm:text-xs">
            <span className="size-2 rounded-full bg-success" />
            خرید و فروش در یک‌جا
          </div>
        </div>
      </div>
    </section>
  );
}
