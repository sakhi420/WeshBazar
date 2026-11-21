"use client";

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';

interface CategoryShortcutGridProps {
  categories: CategorySummary[];
  className?: string;
}

const MARQUEE_SPEED = 24;
const RESUME_DELAY_MS = 2200;

export function CategoryShortcutGrid({ categories, className }: CategoryShortcutGridProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const groupWidthRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  const pauseMotion = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const resumeMotionSoon = useCallback((delay = RESUME_DELAY_MS) => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false;
      lastFrameTimeRef.current = 0;
      resumeTimerRef.current = null;
    }, delay);
  }, []);

  const normalizeScrollPosition = useCallback(() => {
    const viewport = viewportRef.current;
    const width = groupWidthRef.current;
    if (!viewport || width <= 0) return;

    // Keep the viewport in the middle half of the two-copy belt. Both
    // copies are identical, so shifting by one group is visually invisible.
    if (viewport.scrollLeft >= width * 1.5) {
      viewport.scrollLeft -= width;
    } else if (viewport.scrollLeft <= width * 0.5) {
      viewport.scrollLeft += width;
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstGroup = firstGroupRef.current;
    if (!viewport || !firstGroup) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;

    const measure = () => {
      const width = firstGroup.getBoundingClientRect().width;
      if (width <= 0) return;

      if (Math.abs(width - groupWidthRef.current) > 1) {
        groupWidthRef.current = width;
        // Start in the middle copy so manual scrolling has room in both
        // directions before the invisible wrap-around normalizes the offset.
        viewport.scrollLeft = width;
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(firstGroup);

    const tick = (time: number) => {
      if (disposed) return;

      const canAnimate =
        !pausedRef.current &&
        !reducedMotion.matches &&
        document.visibilityState === 'visible' &&
        window.matchMedia('(max-width: 1023px)').matches;

      if (canAnimate && lastFrameTimeRef.current > 0) {
        const deltaSeconds = Math.min((time - lastFrameTimeRef.current) / 1000, 0.05);
        viewport.scrollLeft += MARQUEE_SPEED * deltaSeconds;
        normalizeScrollPosition();
      }

      lastFrameTimeRef.current = time;
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, [categories.length, normalizeScrollPosition]);

  if (categories.length === 0) return null;

  const categoryLinkClass = cn(
    'group flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-xl px-1 py-1 text-center',
    'text-foreground transition-colors duration-200 hover:text-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  );

  const renderCategoryLinks = (duplicate = false) => (
    <>
      {categories.map((category) => {
        const Icon = categoryIcon(category.iconKey);
        return (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            tabIndex={duplicate ? -1 : undefined}
            className={categoryLinkClass}
          >
            <span className="relative flex size-[52px] shrink-0 items-center justify-center rounded-full border border-primary/10 bg-gradient-to-br from-white to-primary-soft text-primary shadow-[0_3px_12px_rgba(15,118,110,0.08)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-[0_7px_18px_rgba(15,118,110,0.14)]">
              <Icon className="size-[23px]" strokeWidth={1.7} aria-hidden />
            </span>
            <span className="line-clamp-2 min-h-9 text-[11px] font-medium leading-[18px] text-foreground/90 transition-colors group-hover:text-primary">
              {category.name}
            </span>
          </Link>
        );
      })}
      <Link
        href="/categories"
        tabIndex={duplicate ? -1 : undefined}
        className={categoryLinkClass}
      >
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-accent/20 bg-gradient-to-br from-white to-amber-50 text-accent-dark shadow-[0_3px_12px_rgba(245,158,11,0.10)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_7px_18px_rgba(245,158,11,0.16)]">
          <LayoutGrid className="size-[22px]" strokeWidth={1.7} aria-hidden />
        </span>
        <span className="line-clamp-2 min-h-9 text-[11px] font-semibold leading-[18px] text-accent-dark">
          همه دسته‌ها
        </span>
      </Link>
    </>
  );

  const desktopItemClass = cn(
    'group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl px-2 py-3 text-center',
    'border border-border/60 bg-surface/70 transition-all duration-200',
    'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-soft/50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );

  return (
    <section aria-labelledby="categories-heading" className={cn('space-y-3', className)}>
      <header className="flex items-center justify-between gap-3">
        <h2
          id="categories-heading"
          className="flex items-center gap-2 text-ui font-semibold tracking-tight text-foreground"
        >
          <LayoutGrid className="size-[18px] text-primary" aria-hidden />
          دسته‌بندی‌ها
        </h2>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          همه دسته‌ها
          <ArrowLeft className="size-3.5" aria-hidden />
        </Link>
        {/* Keyboard-accessible pause; invisible unless focused. */}
        <button
          type="button"
          onClick={pauseMotion}
          onFocus={pauseMotion}
          onBlur={() => resumeMotionSoon()}
          className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:start-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ui focus:text-foreground focus:shadow-card focus:ring-2 focus:ring-primary"
        >
          توقف حرکت دسته‌بندی‌ها
        </button>
      </header>

      <div
        ref={viewportRef}
        dir="ltr"
        role="region"
        aria-label="دسته‌بندی‌های بازار"
        onPointerDown={pauseMotion}
        onPointerUp={() => resumeMotionSoon()}
        onPointerCancel={() => resumeMotionSoon()}
        onWheel={() => {
          pauseMotion();
          resumeMotionSoon(1800);
        }}
        onMouseEnter={pauseMotion}
        onMouseLeave={() => resumeMotionSoon(1200)}
        onFocusCapture={pauseMotion}
        onBlurCapture={() => resumeMotionSoon()}
        onScroll={normalizeScrollPosition}
        className={cn(
          'category-marquee-viewport no-scrollbar w-full overflow-x-auto overflow-y-hidden overscroll-x-contain',
          'touch-pan-x select-none xl:hidden',
        )}
      >
        <div className="flex w-max items-start">
          <div
            ref={firstGroupRef}
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

      <nav aria-label="دسته‌بندی‌های بازار" className="hidden items-stretch gap-2 xl:flex">
        {categories.map((category) => {
          const Icon = categoryIcon(category.iconKey);
          return (
            <Link key={category.id} href={`/category/${category.slug}`} className={desktopItemClass}>
              <span className="flex size-11 items-center justify-center rounded-full border border-primary/10 bg-gradient-to-br from-white to-primary-soft text-primary">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="line-clamp-2 text-caption font-medium leading-[18px]">
                {category.name}
              </span>
            </Link>
          );
        })}
        <Link href="/categories" className={cn(desktopItemClass, 'text-accent')}>
          <span className="flex size-11 items-center justify-center rounded-full border border-accent/20 bg-gradient-to-br from-white to-amber-50 text-accent-dark">
            <LayoutGrid className="size-5" aria-hidden />
          </span>
          <span className="line-clamp-2 text-caption font-semibold leading-[18px]">همه دسته‌ها</span>
        </Link>
      </nav>
    </section>
  );
}
