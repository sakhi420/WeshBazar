import { Suspense } from 'react';
import { BadgeCheck, MapPinned, Sparkles } from 'lucide-react';
import { LocationPicker } from '@/components/location/location-picker';
import { SearchField } from '@/features/search/components/search-field';

/**
 * Search-first homepage hero. Keyword and city stay stacked until `lg`
 * (768px). The theme's `md` is 430px — a row at that width collapses the
 * input and leaves only the city control.
 */
export function HomeSearchPanel() {
  return (
    <section className="relative rounded-surface bg-primary-dark text-primary-foreground shadow-lift">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-surface" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path fill="none" stroke="#F59E0B" stroke-width="0.8" d="M20 3l2.4 14.2L37 20l-14.6 2.8L20 37l-2.4-14.2L3 20l14.6-2.8z"/></svg>`,
            )}")`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -start-20 -top-24 h-56 w-56 rounded-full bg-primary/50 blur-3xl" />
        <div className="absolute -end-16 bottom-0 h-48 w-48 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="relative space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-caption font-medium text-accent">
          <Sparkles className="size-3.5" aria-hidden />
          بازار افغانستان
        </p>
        <h1 className="max-w-xl text-heading font-bold leading-tight sm:text-display-mobile">
          بازار خرید و فروش در افغانستان
        </h1>
        <p className="max-w-prose text-body text-white/80">
          آنچه می‌خواهید را پیدا کنید؛ آنچه دارید را رایگان بفروشید. جست‌وجو، شهر، و تماس مستقیم با فروشنده.
        </p>

        <Suspense fallback={null}>
          <div className="rounded-surface bg-surface p-3 shadow-glow sm:p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
              <SearchField
                className="w-full min-w-0 flex-1"
                placeholder="چی می‌خواهی پیدا کنی؟"
                redirectToSearch
              />
              <LocationPicker className="w-full shrink-0 lg:w-auto" redirectToSearch />
            </div>
          </div>
        </Suspense>

        <ul className="flex flex-wrap gap-2 text-caption text-white/85">
          <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <BadgeCheck className="size-3.5 text-accent" aria-hidden />
            ثبت آگهی رایگان
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <MapPinned className="size-3.5 text-accent" aria-hidden />
            تماس مستقیم با فروشنده
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            اجناس نو و دست‌دوم
          </li>
        </ul>
      </div>
    </section>
  );
}
