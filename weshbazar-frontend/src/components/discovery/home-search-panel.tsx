import Image from 'next/image';
import { Suspense } from 'react';
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
      className="relative isolate w-full min-h-[410px] overflow-hidden bg-[#172521] sm:min-h-[450px] lg:min-h-[500px]"
    >
      <div aria-hidden className="absolute inset-0">
        <Image
          src={HERO_BACKGROUND}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_48%] sm:object-center"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/65 via-black/30 to-black/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/35 to-transparent"
      />

      <div className="relative mx-auto flex min-h-[410px] w-full max-w-[1440px] flex-col justify-center gap-6 px-4 py-10 sm:min-h-[450px] sm:gap-7 sm:px-8 sm:py-12 lg:min-h-[500px] lg:px-12">
        <h1
          id="home-hero-title"
          className="max-w-4xl text-balance text-[1.9rem] font-black leading-[1.4] tracking-tight text-white drop-shadow-lg sm:text-4xl sm:leading-[1.35] lg:text-5xl"
        >
          هر چی می‌خواهی، از همین‌جا پیدا کن
        </h1>

        <Suspense
          fallback={
            <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="h-14 animate-pulse rounded-xl bg-white/85" />
              <div className="h-14 animate-pulse rounded-xl bg-white/85" />
            </div>
          }
        >
          <div className="grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-stretch">
            <SearchField
              className="w-full min-w-0"
              placeholder="چی می‌خواهی پیدا کنی؟"
              redirectToSearch
              compact
            />
            <LocationPicker
              className="w-full min-w-0 sm:w-52"
              redirectToSearch
            />
          </div>
        </Suspense>
      </div>
    </section>
  );
}
