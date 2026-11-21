"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Search, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CategoryNode } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';
import { cn } from '@/lib/utils';

interface CategoriesBrowserProps {
  tree: CategoryNode[];
}

const FEATURED_COVERS: Record<string, { src: string; alt: string; position?: string }> = {
  vehicles: {
    src: 'https://images.unsplash.com/photo-1760713170685-b67abc3be5ad?auto=format&fit=crop&w=1200&q=82',
    alt: 'نمای سه‌رخ یک موتر شاسی‌بلند آبی در فضای عکاسی',
    position: 'center 58%',
  },
  'real-estate': {
    src: 'https://images.unsplash.com/photo-1781269986378-a2f366df4d0f?auto=format&fit=crop&w=1200&q=82',
    alt: 'خانهٔ مدرن با حویلی سبز و درختان',
    position: 'center 52%',
  },
  'mobiles-electronics': {
    src: 'https://images.unsplash.com/photo-1722151954628-c218fbb82710?auto=format&fit=crop&w=1200&q=82',
    alt: 'موبایل هوشمند در دست کاربر',
    position: 'center 48%',
  },
  'home-furniture': {
    src: 'https://images.unsplash.com/photo-1776482128012-a47f853abd57?auto=format&fit=crop&w=1200&q=82',
    alt: 'اتاق نشیمن روشن با مبلمان مدرن',
    position: 'center 55%',
  },
};

const FEATURED_ORDER = [
  'vehicles',
  'real-estate',
  'mobiles-electronics',
  'home-furniture',
] as const;

const SOFT_ACCENTS = [
  {
    panel: 'from-amber-50 to-orange-50',
    icon: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  {
    panel: 'from-violet-50 to-fuchsia-50',
    icon: 'bg-violet-100 text-violet-800',
    dot: 'bg-violet-500',
  },
  {
    panel: 'from-cyan-50 to-sky-50',
    icon: 'bg-cyan-100 text-cyan-800',
    dot: 'bg-cyan-500',
  },
  {
    panel: 'from-rose-50 to-pink-50',
    icon: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
  {
    panel: 'from-lime-50 to-emerald-50',
    icon: 'bg-lime-100 text-lime-800',
    dot: 'bg-lime-600',
  },
  {
    panel: 'from-blue-50 to-indigo-50',
    icon: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
] as const;

function normalizeCategoryText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u200c\u200dـ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('fa-AF');
}

function matchesTerms(value: string, terms: string[]): boolean {
  return terms.every((term) => value.includes(term));
}

export function CategoriesBrowser({ tree }: CategoriesBrowserProps) {
  const [search, setSearch] = useState('');
  const normalizedSearch = normalizeCategoryText(search);

  const filteredTree = useMemo(() => {
    const terms = normalizedSearch.split(' ').filter(Boolean);
    if (terms.length === 0) return tree;

    return tree.flatMap((root) => {
      const rootMatches = matchesTerms(normalizeCategoryText(root.name), terms);
      if (rootMatches) return [root];

      const matchingChildren = root.children.filter((child) => {
        const childName = normalizeCategoryText(child.name);
        const combinedName = normalizeCategoryText(`${root.name} ${child.name}`);
        return matchesTerms(childName, terms) || matchesTerms(combinedName, terms);
      });

      return matchingChildren.length > 0 ? [{ ...root, children: matchingChildren }] : [];
    });
  }, [tree, normalizedSearch]);

  const featuredCategories = useMemo(
    () =>
      FEATURED_ORDER.flatMap((slug) => {
        const category = filteredTree.find((item) => item.slug === slug);
        return category ? [category] : [];
      }),
    [filteredTree],
  );

  const otherCategories = filteredTree.filter((category) => !(category.slug in FEATURED_COVERS));
  const visibleSubcategoryCount = filteredTree.reduce(
    (total, category) => total + category.children.length,
    0,
  );

  return (
    <div className="mt-5 space-y-7 sm:mt-7 sm:space-y-9">
      <header className="relative isolate overflow-hidden rounded-[1.8rem] bg-[#0b514a] px-5 py-6 text-white shadow-[0_18px_50px_rgba(15,76,69,0.14)] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-16 -top-28 size-80 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -end-2 -top-14 size-52 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 start-[32%] size-64 rounded-full bg-[#f59e0b]/15 blur-3xl"
        />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.82fr)] lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85">
              <Sparkles className="size-3.5 text-amber-300" aria-hidden />
              بازار را کشف کن
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.35] tracking-tight sm:text-4xl lg:text-[2.7rem]">
              هر چی لازم داری، اینجاست
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
              از موتر و خانه تا موبایل و خدمات؛ بخش موردنظرت را پیدا کن و مستقیم به آگهی‌ها برس.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/20 bg-white px-4 text-[#173b37] shadow-xl shadow-black/10 transition-shadow focus-within:ring-4 focus-within:ring-amber-300/60">
              <Search className="size-5 shrink-0 text-primary" aria-hidden />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="مثلاً موتر، خانه یا موبایل..."
                aria-label="جست‌وجوی دسته و زیردسته"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="پاک کردن جست‌وجو"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : (
                <span className="hidden rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 sm:inline-flex">
                  جست‌وجو
                </span>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="size-3.5 text-amber-300" aria-hidden />
                <strong className="font-bold tabular-nums text-white">
                  {filteredTree.length.toLocaleString('fa-AF')}
                </strong>
                دستهٔ اصلی
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-300" />
                <strong className="font-bold tabular-nums text-white">
                  {visibleSubcategoryCount.toLocaleString('fa-AF')}
                </strong>
                زیردسته
              </span>
            </div>
          </div>
        </div>
      </header>

      {filteredTree.length > 0 ? (
        <>
          {featuredCategories.length > 0 ? (
            <section aria-label="دسته‌های پرطرفدار" className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary">
                    {normalizedSearch ? 'دسته‌های پیدا‌شده' : 'از اینجا شروع کن'}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-foreground sm:text-2xl">
                    {normalizedSearch ? 'بخش‌های پرطرفدار' : 'بازارهای پرطرفدار'}
                  </h2>
                </div>
                {!normalizedSearch ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-900">
                    انتخاب‌های محبوب
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {featuredCategories.map((category, index) => {
                  const cover = FEATURED_COVERS[category.slug]!;

                  return (
                    <article
                      key={category.id}
                      className="group min-w-0 overflow-hidden rounded-[1.35rem] border border-border/75 bg-surface shadow-[0_5px_22px_rgba(15,76,69,0.055)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,76,69,0.13)]"
                    >
                      <Link
                        href={`/category/${category.slug}`}
                        className="relative block h-36 overflow-hidden bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:h-44 xl:h-48"
                        aria-label={`دیدن همهٔ آگهی‌های ${category.name}`}
                      >
                        <Image
                          src={cover.src}
                          alt={cover.alt}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 639px) 48vw, (max-width: 1023px) 48vw, 25vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          style={{ objectPosition: cover.position ?? 'center' }}
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-gradient-to-t from-[#082f2d]/90 via-[#082f2d]/10 to-black/5"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                          <span className="mb-1.5 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-2 py-1 text-[9px] font-semibold text-white/90 backdrop-blur-sm sm:text-[10px]">
                            {category.children.length.toLocaleString('fa-AF')} زیردسته
                          </span>
                          <h3 className="text-sm font-black leading-6 drop-shadow-sm sm:text-lg">
                            {category.name}
                          </h3>
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-white/80 sm:text-xs">
                            دیدن آگهی‌ها
                            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-1" aria-hidden />
                          </span>
                        </div>
                      </Link>

                      {category.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 p-2.5 sm:gap-2 sm:p-3">
                          {category.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/category/${child.slug}`}
                              className="inline-flex min-h-9 max-w-full items-center rounded-full border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[11px]"
                            >
                              <span className="truncate">{child.name}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-xs text-muted-foreground">
                          همهٔ آگهی‌های این دسته را ببین.
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {otherCategories.length > 0 ? (
            <section aria-label="دیگر دسته‌بندی‌ها" className="space-y-4">
              <div>
                <p className="text-xs font-bold text-primary">
                  {normalizedSearch ? 'بخش‌های دیگر' : 'بخش‌های بیشتر'}
                </p>
                <h2 className="mt-1 text-xl font-black text-foreground sm:text-2xl">
                  {normalizedSearch ? 'دسته‌بندی‌های مرتبط' : 'بقیهٔ بازار را هم ببین'}
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {otherCategories.map((category, index) => {
                  const Icon = categoryIcon(category.iconKey);
                  const accent = SOFT_ACCENTS[index % SOFT_ACCENTS.length]!;

                  return (
                    <article
                      key={category.id}
                      className="group min-w-0 overflow-hidden rounded-2xl border border-border/75 bg-surface shadow-[0_4px_18px_rgba(15,76,69,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <Link
                        href={`/category/${category.slug}`}
                        className={cn(
                          'relative flex min-h-[88px] items-center gap-3 overflow-hidden bg-gradient-to-br px-3.5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                          accent.panel,
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn('absolute -end-5 -top-8 size-24 rounded-full opacity-40', accent.dot)}
                        />
                        <span
                          className={cn(
                            'relative flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-105',
                            accent.icon,
                          )}
                        >
                          <Icon className="size-6" strokeWidth={1.7} aria-hidden />
                        </span>
                        <span className="relative min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-foreground">
                            {category.name}
                          </span>
                          <span className="mt-1 block text-[11px] font-medium text-slate-600">
                            {category.children.length > 0
                              ? `${category.children.length.toLocaleString('fa-AF')} زیردسته`
                              : 'مشاهدهٔ آگهی‌ها'}
                          </span>
                        </span>
                        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-slate-600 transition-all group-hover:bg-white group-hover:text-primary">
                          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
                        </span>
                      </Link>

                      {category.children.length > 0 ? (
                        <ul className="grid grid-cols-1 gap-x-2 px-3 py-2.5">
                          {category.children.map((child) => (
                            <li key={child.id} className="min-w-0">
                              <Link
                                href={`/category/${child.slug}`}
                                className="group/child flex min-h-10 items-center gap-2 rounded-lg px-1.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <span className={cn('size-1.5 shrink-0 rounded-full', accent.dot)} />
                                <span className="min-w-0 flex-1 truncate">{child.name}</span>
                                <ArrowLeft
                                  className="size-3 shrink-0 opacity-40 transition-all group-hover/child:-translate-x-0.5 group-hover/child:text-primary group-hover/child:opacity-100"
                                  aria-hidden
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-3">
                          <Link
                            href={`/category/${category.slug}`}
                            className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                          >
                            دیدن آگهی‌های این دسته
                            <ArrowLeft className="size-3.5" aria-hidden />
                          </Link>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-surface/80 px-5 py-14 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Search className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-bold text-foreground">چیزی پیدا نشد</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            املای دیگری را امتحان کن یا همهٔ دسته‌ها را ببین.
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            پاک کردن جست‌وجو
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
