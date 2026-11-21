import type { LucideIcon } from 'lucide-react';

interface PublicPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Shared visual introduction for public information pages.
 * Keeps the pages visually related without introducing external imagery.
 */
export function PublicPageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
}: PublicPageHeroProps) {
  return (
    <section className="relative isolate mb-8 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary-dark via-primary to-teal-700 px-5 py-7 text-white shadow-lift sm:mb-10 sm:rounded-[2rem] sm:px-8 sm:py-9 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-20 -top-28 size-72 rounded-full border-[34px] border-white/[0.06]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 start-1/3 size-80 rounded-full bg-accent/15 blur-3xl"
      />
      <div className="relative flex items-start gap-4 sm:items-center sm:gap-6">
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner sm:size-20 sm:rounded-[1.5rem]">
          <span
            aria-hidden="true"
            className="absolute inset-1 rounded-xl border border-white/10 sm:rounded-2xl"
          />
          <Icon className="size-7 sm:size-9" strokeWidth={1.7} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-caption font-medium text-white/85">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            {eyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-ui leading-7 text-white/80 sm:text-body">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
