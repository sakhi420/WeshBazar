"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';

interface CategoryShortcutGridProps {
  categories: CategorySummary[];
  className?: string;
}

const MARQUEE_SPEED = 24;
const RESUME_DELAY_MS = 2200;

const CATEGORY_TONES = [
  'from-primary-soft to-emerald-50 text-primary',
  'from-amber-50 to-orange-50 text-amber-800',
  'from-violet-50 to-fuchsia-50 text-violet-800',
  'from-sky-50 to-cyan-50 text-sky-800',
  'from-rose-50 to-pink-50 text-rose-800',
  'from-lime-50 to-emerald-50 text-emerald-800',
] as const;

export function CategoryShortcutGrid({ categories, className }: CategoryShortcutGridProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const groupWidthRef = useRef(0);
  const hasOverflowRef = useRef(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const userPausedRef = useRef(false);
  const [userPaused, setUserPaused] = useState(false);
  const startLoopRef = useRef<(() => void) | null>(null);

  const pauseMotion = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastFrameTimeRef.current = 0;
  }, []);

  const resumeMotionSoon = useCallback((delay = RESUME_DELAY_MS) => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      resumeTimerRef.current = null;
      if (userPausedRef.current) return;
      pausedRef.current = false;
      lastFrameTimeRef.current = 0;
      startLoopRef.current?.();
    }, delay);
  }, []);

  const toggleUserPause = useCallback(() => {
    const nextPaused = !userPausedRef.current;
    userPausedRef.current = nextPaused;
    setUserPaused(nextPaused);

    if (nextPaused) {
      pauseMotion();
      return;
    }

    pausedRef.current = false;
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    lastFrameTimeRef.current = 0;
    startLoopRef.current?.();
  }, [pauseMotion]);

  const pauseForKeyboard = useCallback(() => {
    userPausedRef.current = true;
    setUserPaused(true);
    pauseMotion();
  }, [pauseMotion]);

  const normalizeScrollPosition = useCallback(() => {
    const viewport = viewportRef.current;
    const width = groupWidthRef.current;
    if (!viewport || width <= 0 || !hasOverflowRef.current) return;

    // The duplicate groups are mounted after React commits hasOverflow=true.
    // Until the full belt exists, the browser clamps scrollLeft to the first
    // group and normalization must not try to move it beyond that limit.
    if (viewport.scrollWidth < width * 2.9) return;

    // Three identical groups provide room on both sides. One bounded shift is
    // enough: the browser cannot scroll beyond the end of the three-group belt.
    if (viewport.scrollLeft >= width * 2) {
      viewport.scrollLeft -= width;
    } else if (viewport.scrollLeft < width) {
      viewport.scrollLeft += width;
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstGroup = firstGroupRef.current;
    if (!viewport || !firstGroup) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileViewport = window.matchMedia('(max-width: 1279px)');
    let disposed = false;

    const measure = () => {
      const width = firstGroup.getBoundingClientRect().width;
      if (width <= 0) return;

      const overflowing = width > viewport.clientWidth + 1;
      const geometryChanged =
        Math.abs(width - groupWidthRef.current) > 1 ||
        overflowing !== hasOverflowRef.current;

      if (geometryChanged) {
        groupWidthRef.current = width;
        hasOverflowRef.current = overflowing;
        setHasOverflow(overflowing);
        // Initial positioning is handled in useLayoutEffect after duplicate
        // groups have mounted; setting scrollLeft here can be clamped too soon.
      }
    };

    const canRun = () =>
      !disposed &&
      !pausedRef.current &&
      !userPausedRef.current &&
      !reducedMotion.matches &&
      hasOverflowRef.current &&
      mobileViewport.matches &&
      document.visibilityState === 'visible';

    const tick = (time: number) => {
      if (!canRun()) {
        animationFrameRef.current = null;
        lastFrameTimeRef.current = 0;
        return;
      }

      if (lastFrameTimeRef.current > 0) {
        const deltaSeconds = Math.min((time - lastFrameTimeRef.current) / 1000, 0.05);
        viewport.scrollLeft += MARQUEE_SPEED * deltaSeconds;
        normalizeScrollPosition();
      }

      lastFrameTimeRef.current = time;
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (animationFrameRef.current === null && canRun()) {
        lastFrameTimeRef.current = 0;
        animationFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    startLoopRef.current = startLoop;

    const syncEnvironment = () => {
      if (canRun()) {
        startLoop();
      } else if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        lastFrameTimeRef.current = 0;
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(firstGroup);
    observer.observe(viewport);
    mobileViewport.addEventListener('change', syncEnvironment);
    reducedMotion.addEventListener('change', syncEnvironment);
    document.addEventListener('visibilitychange', syncEnvironment);
    window.addEventListener('resize', syncEnvironment);
    syncEnvironment();

    return () => {
      disposed = true;
      observer.disconnect();
      mobileViewport.removeEventListener('change', syncEnvironment);
      reducedMotion.removeEventListener('change', syncEnvironment);
      document.removeEventListener('visibilitychange', syncEnvironment);
      window.removeEventListener('resize', syncEnvironment);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
      animationFrameRef.current = null;
      resumeTimerRef.current = null;
      startLoopRef.current = null;
    };
  }, [categories.length, normalizeScrollPosition]);

  // Wait until all three identical groups are in the DOM before centering
  // the initial position; this avoids a first-render blank edge on hydration.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const width = groupWidthRef.current;
    if (!viewport || width <= 0) return;
    viewport.scrollLeft = hasOverflow ? width * 1.5 : 0;
  }, [hasOverflow]);

  if (categories.length === 0) return null;

  const categoryLinkClass = cn(
    'group flex w-[88px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-border/65 bg-white/90 px-1.5 py-2.5 text-center shadow-soft',
    'text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  );

  const renderCategoryLinks = (duplicate = false) => (
    <>
      {categories.map((category, index) => {
        const Icon = categoryIcon(category.iconKey);
        const tone = CATEGORY_TONES[index % CATEGORY_TONES.length]!;
        return (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            tabIndex={duplicate ? -1 : undefined}
            className={categoryLinkClass}
          >
            <span className={cn('relative flex size-11 shrink-0 items-center justify-center rounded-[1rem] border border-white/80 bg-gradient-to-br shadow-inner shadow-white/70 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-[1.04]', tone)}>
              <Icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
            </span>
            <span className="line-clamp-2 min-h-8 text-[11px] font-bold leading-4 text-foreground/90 transition-colors group-hover:text-primary">
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
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-100 text-accent-dark shadow-inner shadow-white/70 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-[1.04]">
          <LayoutGrid className="size-[21px]" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="line-clamp-2 min-h-8 text-[11px] font-extrabold leading-4 text-accent-dark">
          همه دسته‌ها
        </span>
      </Link>
    </>
  );

  const desktopItemClass = cn(
    'group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center',
    'border border-border/65 bg-surface/85 shadow-soft transition-all duration-200',
    'hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary-soft/35 hover:shadow-card',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );

  return (
    <section
      aria-labelledby="categories-heading"
      className={cn(
        'relative w-full space-y-3',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="categories-heading" className="text-base font-black tracking-tight text-foreground sm:text-lg">
            دسته‌بندی‌ها
          </h2>
          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
            {categories.length.toLocaleString('fa-AF')} دسته برای گشت‌وگذار
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleUserPause}
            aria-pressed={userPaused}
            aria-label={userPaused ? 'ادامه حرکت دسته‌بندی‌ها' : 'توقف حرکت دسته‌بندی‌ها'}
            title={userPaused ? 'ادامه حرکت دسته‌بندی‌ها' : 'توقف حرکت دسته‌بندی‌ها'}
            className="inline-flex size-9 items-center justify-center rounded-full border border-primary/15 bg-primary-soft/70 text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
          >
            {userPaused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            <span className="sr-only">{userPaused ? 'ادامه حرکت دسته‌بندی‌ها' : 'توقف حرکت دسته‌بندی‌ها'}</span>
          </button>
          <Link
            href="/categories"
            className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            همه دسته‌ها
            <ArrowLeft className="size-3.5" aria-hidden />
          </Link>
        </div>
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
        onFocusCapture={pauseForKeyboard}
        onScroll={normalizeScrollPosition}
        className={cn(
          'category-marquee-viewport no-scrollbar w-full overflow-x-auto overflow-y-hidden overscroll-x-contain',
          'touch-manipulation select-none xl:hidden',
        )}
      >
        <div className="flex w-max items-start">
          <div
            ref={firstGroupRef}
            dir="rtl"
            className="flex w-max shrink-0 items-start gap-2.5 pe-3"
          >
            {renderCategoryLinks()}
          </div>
          {hasOverflow ? (
            <>
              <div
                dir="rtl"
                aria-hidden="true"
                inert
                className="flex w-max shrink-0 items-start gap-2.5 pe-3"
              >
                {renderCategoryLinks(true)}
              </div>
              <div
                dir="rtl"
                aria-hidden="true"
                inert
                className="flex w-max shrink-0 items-start gap-2.5 pe-3"
              >
                {renderCategoryLinks(true)}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <nav aria-label="دسته‌بندی‌های بازار" className="hidden items-stretch gap-2 xl:flex">
        {categories.map((category, index) => {
          const Icon = categoryIcon(category.iconKey);
          const tone = CATEGORY_TONES[index % CATEGORY_TONES.length]!;
          return (
            <Link key={category.id} href={`/category/${category.slug}`} className={desktopItemClass}>
              <span className={cn('flex size-11 items-center justify-center rounded-[1rem] border border-white/80 bg-gradient-to-br shadow-inner shadow-white/70', tone)}>
                <Icon className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="line-clamp-2 text-caption font-medium leading-[18px]">
                {category.name}
              </span>
            </Link>
          );
        })}
        <Link href="/categories" className={cn(desktopItemClass, 'text-accent')}>
          <span className="flex size-11 items-center justify-center rounded-[1rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-100 text-accent-dark shadow-inner shadow-white/70">
            <LayoutGrid className="size-5" aria-hidden />
          </span>
          <span className="line-clamp-2 text-caption font-semibold leading-[18px]">همه دسته‌ها</span>
        </Link>
      </nav>
    </section>
  );
}
