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
      className="relative isolate min-h-[390px] w-full overflow-hidden bg-[#172521] sm:min-h-[440px] lg:min-h-[480px]"
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
        className="pointer-events-none absolute inset-0 bg-[#073b37]/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#092f2b]/65 via-[#092f2b]/25 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent"
      />

      <div className="relative mx-auto flex min-h-[390px] w-full max-w-[1440px] flex-col justify-center gap-5 px-4 py-8 sm:min-h-[440px] sm:gap-6 sm:px-8 sm:py-10 lg:min-h-[480px] lg:px-12">
        <h1
          id="home-hero-title"
          className="max-w-4xl text-balance text-[1.7rem] font-black leading-[1.4] tracking-tight text-white drop-shadow-md sm:text-4xl sm:leading-[1.35] lg:text-5xl"
        >
          هر چی می‌خواهی، از همین‌جا پیدا کن
        </h1>

        <Suspense
          fallback={
            <div className="grid w-full max-w-4xl grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="h-14 animate-pulse rounded-xl bg-white/90" />
              <div className="h-14 animate-pulse rounded-xl bg-white/90" />
            </div>
          }
        >
          <div className="grid w-full max-w-4xl grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-stretch">
            <SearchField
              className="w-full min-w-0"
              placeholder="چی می‌خواهی پیدا کنی؟"
              redirectToSearch
              compact
            />
            <LocationPicker
              className="w-full min-w-0 lg:w-52"
              redirectToSearch
            />
          </div>
        </Suspense>
      </div>
    </section>
  );
}
