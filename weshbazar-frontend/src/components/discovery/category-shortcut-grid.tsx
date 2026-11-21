"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';

interface CategoryShortcutGridProps {
  categories: CategorySummary[];
  className?: string;
}

type MarqueeStyle = React.CSSProperties & {
  '--category-marquee-duration': string;
};

/**
 * Mobile: a continuous, seamless category marquee with native touch scrolling.
 * Desktop: the existing static category row.
 *
 * The duplicated visual group is hidden from assistive technology and inert.
 * Movement pauses on hover, touch, wheel, or keyboard focus and has an explicit
 * stop/start control. Reduced-motion users get a static, manually scrollable row.
 */
export function CategoryShortcutGrid({ categories, className }: CategoryShortcutGridProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(32);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const group = measureRef.current;
    if (!group) return;

    const updateDuration = () => {
      const width = group.getBoundingClientRect().width;
      if (width > 0) {
        // Keep a near-constant, calm speed regardless of category count/labels.
        setDuration(Math.max(22, width / 28));
      }
    };

    updateDuration();
    const observer = new ResizeObserver(updateDuration);
    observer.observe(group);
    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) return null;

  const handleToggleMotion = () => {
    if (isPaused) {
      // Resume from a predictable seam after the user has manually browsed.
      if (viewportRef.current) viewportRef.current.scrollLeft = 0;
      setIsPaused(false);
      return;
    }
    setIsPaused(true);
  };

  const renderCategoryLinks = (copy = false) => (
    <>
      {categories.map((category) => {
        const Icon = categoryIcon(category.iconKey);
        return (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            tabIndex={copy ? -1 : undefined}
            className={cn(
              'flex w-[76px] shrink-0 flex-col items-center justify-start gap-2 rounded-xl px-1 py-1 text-center',
              'text-foreground transition-colors duration-small hover:text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            )}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors duration-small hover:bg-primary hover:text-primary-foreground">
              <Icon className="size-[21px]" strokeWidth={1.8} aria-hidden />
            </span>
            <span className="line-clamp-2 min-h-9 text-[11px] font-medium leading-[18px]">
              {category.name}
            </span>
          </Link>
        );
      })}
      <Link
        href="/categories"
        tabIndex={copy ? -1 : undefined}
        className={cn(
          'flex w-[76px] shrink-0 flex-col items-center justify-start gap-2 rounded-xl px-1 py-1 text-center',
          'text-foreground transition-colors duration-small hover:text-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-dark">
          <LayoutGrid className="size-[21px]" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="line-clamp-2 min-h-9 text-[11px] font-semibold leading-[18px]">
          همه دسته‌ها
        </span>
      </Link>
    </>
  );

  const desktopItemClass = cn(
    'flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl px-2 py-3 text-center',
    'border border-border/60 bg-surface/70 transition-all duration-small',
    'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-soft/50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );

  return (
    <section aria-labelledby="categories-heading" className={cn('space-y-3', className)}>
      <header className="flex items-center justify-between gap-3">
        <h2
          id="categories-heading"
          className="flex items-center gap-2 text-ui font-semibold text-foreground"
        >
          <LayoutGrid className="size-[18px] text-primary" aria-hidden />
          دسته‌بندی‌ها
        </h2>
        <button
          type="button"
          onClick={handleToggleMotion}
          aria-label={isPaused ? 'ادامه حرکت دسته‌بندی‌ها' : 'توقف حرکت دسته‌بندی‌ها'}
          aria-pressed={isPaused}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
        >
          {isPaused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
          {isPaused ? 'ادامه' : 'توقف'}
        </button>
      </header>

      {/* Seamless continuous loop, only on mobile/tablet. */}
      <div
        ref={viewportRef}
        dir="ltr"
        role="region"
        aria-label="دسته‌بندی‌های بازار"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={() => setIsPaused(true)}
        onWheel={() => setIsPaused(true)}
        onFocusCapture={() => setIsPaused(true)}
        className={cn(
          'category-marquee-viewport no-scrollbar w-full overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x',
          'xl:hidden',
          className,
        )}
      >
        <div
          className="category-marquee-track flex w-max items-start"
          style={
            {
              '--category-marquee-duration': `${duration}s`,
              animationPlayState: isPaused || isHovered ? 'paused' : 'running',
            } as MarqueeStyle & React.CSSProperties
          }
        >
          <div
            ref={measureRef}
            dir="rtl"
            className="flex w-max shrink-0 items-start gap-3 pe-3"
          >
            {renderCategoryLinks()}
          </div>
          <div
            dir="rtl"
            aria-hidden="true"
            inert
            className="flex w-max shrink-0 items-start gap-3 pe-3"
          >
            {renderCategoryLinks(true)}
          </div>
        </div>
      </div>

      {/* Desktop keeps the familiar, non-moving category shortcuts. */}
      <nav aria-label="دسته‌بندی‌های بازار" className="hidden items-stretch gap-2 xl:flex">
        {categories.map((category) => {
          const Icon = categoryIcon(category.iconKey);
          return (
            <Link key={category.id} href={`/category/${category.slug}`} className={desktopItemClass}>
              <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="line-clamp-2 text-caption font-medium leading-[18px]">
                {category.name}
              </span>
            </Link>
          );
        })}
        <Link href="/categories" className={cn(desktopItemClass, 'text-accent')}>
          <span className="flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent-dark">
            <LayoutGrid className="size-5" aria-hidden />
          </span>
          <span className="line-clamp-2 text-caption font-semibold leading-[18px]">همه دسته‌ها</span>
        </Link>
      </nav>
    </section>
  );
}
