import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, BadgeCheck, MapPinned, Sparkles } from 'lucide-react';
import { LocationPicker } from '@/components/location/location-picker';
import { SearchField } from '@/features/search/components/search-field';

const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1760713170685-b67abc3be5ad?auto=format&fit=crop&w=1200&q=82',
    position: 'center 58%',
  },
  {
    src: 'https://images.unsplash.com/photo-1781269986378-a2f366df4d0f?auto=format&fit=crop&w=1200&q=82',
    position: 'center 52%',
  },
  {
    src: 'https://images.unsplash.com/photo-1722151954628-c218fbb82710?auto=format&fit=crop&w=1200&q=82',
    position: 'center 48%',
  },
  {
    src: 'https://images.unsplash.com/photo-1776482128012-a47f853abd57?auto=format&fit=crop&w=1200&q=82',
    position: 'center 55%',
  },
] as const;

/**
 * Search-first homepage hero with a photographic marketplace collage.
 * The dark teal gradient protects text contrast while the four photos hint
 * at the range of goods available across the marketplace.
 */
export function HomeSearchPanel() {
  return (
    <section className="relative isolate overflow-hidden rounded-[1.8rem] bg-[#0b514a] text-white shadow-[0_18px_50px_rgba(15,76,69,0.16)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 opacity-80 sm:gap-2 sm:p-2 lg:inset-y-0 lg:end-0 lg:w-[58%] lg:gap-2.5 lg:p-3"
      >
        {HERO_IMAGES.map((photo, index) => (
          <div key={photo.src} className="relative min-h-0 overflow-hidden rounded-[1.1rem]">
            <Image
              src={photo.src}
              alt=""
              fill
              priority={index < 2}
              sizes="(max-width: 1023px) 50vw, 29vw"
              className="object-cover"
              style={{ objectPosition: photo.position }}
            />
          </div>
        ))}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b514a]/70 via-[#0b514a]/88 to-[#0b514a] lg:bg-gradient-to-l lg:from-[#0b514a] lg:via-[#0b514a]/88 lg:to-[#0b514a]/25"
      />
      <div aria-hidden className="pointer-events-none absolute -start-20 -top-24 size-64 rounded-full border border-white/10" />
      <div aria-hidden className="pointer-events-none absolute -start-8 -top-12 size-40 rounded-full border border-white/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 end-[28%] size-64 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative max-w-3xl space-y-4 px-4 py-5 sm:space-y-5 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-amber-300" aria-hidden />
            بازار آنلاین افغانستان
          </p>
          <h1 className="mt-3 max-w-2xl text-2xl font-black leading-[1.4] tracking-tight sm:text-3xl lg:text-4xl">
            هر چی می‌خواهی، در ویش‌بازار پیدا کن
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-6 text-white/80 sm:text-sm sm:leading-7">
            از موتر و خانه تا موبایل و وسایل روزمره؛ آگهی‌ها را جست‌وجو کن یا کالایت را رایگان بفروش.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/60 bg-white p-2.5 text-foreground shadow-[0_14px_38px_rgba(0,0,0,0.18)] sm:p-3">
          <p className="mb-2 px-1 text-xs font-bold text-slate-600">چی دنبالش هستی؟</p>
          <Suspense fallback={null}>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
              <SearchField
                className="w-full min-w-0 flex-1"
                placeholder="مثلاً موتر، خانه یا موبایل..."
                redirectToSearch
              />
              <LocationPicker className="w-full shrink-0 lg:w-auto" redirectToSearch />
            </div>
          </Suspense>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-white/85 sm:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-amber-300" aria-hidden />
            ثبت آگهی رایگان
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPinned className="size-3.5 text-amber-300" aria-hidden />
            جست‌وجو بر اساس شهر
          </span>
          <Link
            href="/sell"
            className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 font-bold text-amber-950 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b514a]"
          >
            کالایت را ثبت کن
            <ArrowLeft className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
