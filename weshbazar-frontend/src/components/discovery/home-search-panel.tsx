import { Suspense } from 'react';
import { MapPinned, Search, Sparkles } from 'lucide-react';
import { LocationPicker } from '@/components/location/location-picker';
import { SearchField } from '@/features/search/components/search-field';

// Pexels: Mirwais Mohammadi — panoramic view of Kabul cityscape with mountains.
// Free-to-use photo: https://www.pexels.com/photo/panoramic-view-of-kabul-cityscape-with-mountains-38407564/
const HERO_BACKGROUND =
  'https://images.pexels.com/photos/38407564/pexels-photo-38407564/free-photo-of-panoramic-view-of-kabul-cityscape-with-mountains.jpeg?auto=compress&cs=tinysrgb&w=2200';

export function HomeSearchPanel() {
  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative isolate min-h-[430px] overflow-hidden rounded-[1.5rem] border border-primary/15 shadow-card sm:min-h-[410px] sm:rounded-[2rem] lg:min-h-[450px]"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${HERO_BACKGROUND}")`, backgroundPosition: 'center 46%' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#073b37]/95 via-[#0F766E]/80 to-[#073b37]/65"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_12%,rgba(245,158,11,0.24),transparent_42%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -start-24 size-80 rounded-full bg-primary/25 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[430px] w-full max-w-5xl flex-col justify-center gap-5 px-4 py-6 sm:min-h-[410px] sm:gap-6 sm:px-7 sm:py-8 lg:min-h-[450px] lg:px-10">
        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-primary shadow-soft backdrop-blur-sm sm:text-xs">
            <Sparkles className="size-3.5 text-accent" aria-hidden />
            بازار آنلاین افغانستان
          </p>

          <div className="space-y-2">
            <h1
              id="home-hero-title"
              className="max-w-3xl text-[1.8rem] font-black leading-[1.35] tracking-tight text-white drop-shadow-sm sm:text-3xl sm:leading-[1.4] lg:text-[2.8rem]"
            >
              هر چی می‌خواهی، از همین‌جا پیدا کن
            </h1>
            <p className="max-w-2xl text-xs leading-7 text-white/90 sm:text-sm sm:leading-8 lg:text-base">
              موتر، خانه، موبایل و نیازهای روزمره را در آگهی‌های ویش‌بازار جست‌وجو کن.
            </p>
          </div>

          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/85 sm:text-xs">
            <MapPinned className="size-4 text-[#FBBF24]" aria-hidden />
            جست‌وجو بر اساس ولایت و شهر
          </p>
        </div>

        <div className="relative z-10 w-full max-w-3xl rounded-[1.25rem] border border-white/75 bg-white/95 p-3 shadow-[0_18px_55px_rgba(3,35,33,0.26)] backdrop-blur-xl sm:rounded-[1.5rem] sm:p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5 sm:mb-3 sm:px-1">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-foreground sm:text-sm">
              <Search className="size-4 text-primary" aria-hidden />
              چی دنبالش هستی؟
            </p>
            <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">
              جست‌وجو در آگهی‌ها
            </span>
          </div>

          <Suspense
            fallback={
              <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <div className="h-12 animate-pulse rounded-xl bg-muted/30" />
                <div className="h-12 animate-pulse rounded-xl bg-muted/30" />
              </div>
            }
          >
            <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-stretch">
              <SearchField
                className="w-full min-w-0"
                placeholder="مثلاً موتر، خانه یا موبایل..."
                redirectToSearch
                compact
              />
              <LocationPicker
                className="w-full min-w-0 sm:w-48"
                redirectToSearch
              />
            </div>
          </Suspense>
        </div>
      </div>
    </section>
  );
}
