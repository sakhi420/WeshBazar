"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';

interface CategoryShortcutGridProps {
  categories: CategorySummary[];
  className?: string;
}

/**
 * Category shortcuts remain a static row on desktop. On mobile they become
 * a gently advancing, touch-scrollable carousel. User interaction pauses
 * autoplay briefly; reduced-motion preferences disable autoplay entirely.
 */
export function CategoryShortcutGrid({ categories, className }: CategoryShortcutGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const pausedUntilRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mobileQuery = window.matchMedia('(max-width: 1023px)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const intervalId = window.setInterval(() => {
      if (
        !mobileQuery.matches ||
        reducedMotionQuery.matches ||
        document.visibilityState !== 'visible' ||
        Date.now() < pausedUntilRef.current
      ) {
        return;
      }

      const items = container.querySelectorAll<HTMLElement>('[data-category-slide]');
      if (items.length < 2) return;

      const nextIndex = (activeIndexRef.current + 1) % items.length;
      activeIndexRef.current = nextIndex;
      items[nextIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [categories.length]);

  if (categories.length === 0) return null;

  const pauseAutoplay = (duration = 5000) => {
    pausedUntilRef.current = Date.now() + duration;
  };

  const syncActiveIndex = () => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const items = container.querySelectorAll<HTMLElement>('[data-category-slide]');
    let nearestIndex = activeIndexRef.current;
    let nearestDistance = Number.POSITIVE_INFINITY;

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      if (rect.left >= containerRect.right || rect.right <= containerRect.left) return;

      const distance = Math.abs(rect.right - containerRect.right);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    activeIndexRef.current = nearestIndex;
  };

  const capsuleClass = cn(
    'flex w-[88px] shrink-0 snap-start flex-col items-center gap-2.5 rounded-card border border-border/70 bg-surface px-2.5 py-3.5 text-center shadow-soft transition-all duration-small',
    'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-soft hover:shadow-card',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    'lg:w-auto lg:flex-1 lg:snap-none',
  );

  return (
    <div
      ref={containerRef}
      dir="rtl"
      onScroll={syncActiveIndex}
      onPointerDown={() => pauseAutoplay()}
      onWheel={() => pauseAutoplay()}
      onMouseEnter={() => {
        pausedUntilRef.current = Number.POSITIVE_INFINITY;
      }}
      onMouseLeave={() => pauseAutoplay(3500)}
      onFocusCapture={() => pauseAutoplay()}
      className={cn(
        'no-scrollbar flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-auto overscroll-x-contain pb-2 scroll-smooth',
        'lg:overflow-visible lg:snap-none',
        className,
      )}
    >
      {categories.map((cat) => {
        const Icon = categoryIcon(cat.iconKey);

        return (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            data-category-slide
            className={capsuleClass}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Icon className="size-6" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="line-clamp-2 text-caption font-medium text-foreground">
              {cat.name}
            </span>
          </Link>
        );
      })}
      <Link href="/categories" data-category-slide className={capsuleClass}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <LayoutGrid className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="line-clamp-2 text-caption font-bold text-accent">همه</span>
      </Link>
    </div>
  );
}
