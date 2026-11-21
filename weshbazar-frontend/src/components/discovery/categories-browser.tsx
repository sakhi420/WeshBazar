"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, LayoutGrid, Search, X } from 'lucide-react';
import type { CategoryNode } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';
import { cn } from '@/lib/utils';

interface CategoriesBrowserProps {
  tree: CategoryNode[];
}

interface CategorySearchResult {
  category: CategoryNode;
  parentName: string | null;
  isRoot: boolean;
}

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
  const [selectedId, setSelectedId] = useState(tree[0]?.id ?? '');
  const normalizedSearch = normalizeCategoryText(search);

  const selectedCategory = tree.find((category) => category.id === selectedId) ?? tree[0];
  const totalSubcategories = tree.reduce((total, category) => total + category.children.length, 0);

  const searchResults = useMemo<CategorySearchResult[]>(() => {
    const searchTerms = normalizedSearch.split(' ').filter(Boolean);
    if (searchTerms.length === 0) return [];

    return tree.flatMap((root) => {
      const rootName = normalizeCategoryText(root.name);
      const rootMatches = matchesTerms(rootName, searchTerms);
      const results: CategorySearchResult[] = [];

      if (rootMatches) {
        results.push({ category: root, parentName: null, isRoot: true });
      }

      for (const child of root.children) {
        const childName = normalizeCategoryText(child.name);
        const matchesChildName = matchesTerms(childName, searchTerms);
        const matchesParentAndChild =
          !rootMatches &&
          matchesTerms(normalizeCategoryText(`${root.name} ${child.name}`), searchTerms);

        if (matchesChildName || matchesParentAndChild) {
          results.push({ category: child, parentName: root.name, isRoot: false });
        }
      }

      return results;
    });
  }, [tree, normalizedSearch]);

  return (
    <div className="mt-5 space-y-7 sm:mt-7 sm:space-y-9">
      <header className="grid gap-6 border-b border-border/70 pb-7 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)] md:items-end sm:pb-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary">
            <span className="size-2 rounded-full bg-accent" />
            راهنمای دسته‌بندی‌های ویش‌بازار
          </div>
          <h1 className="mt-3 text-3xl font-black leading-[1.35] tracking-tight text-foreground sm:text-4xl lg:text-[2.7rem]">
            هر چیزی، در بخش خودش
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            دستهٔ موردنظرت را انتخاب کن یا نام کالا، خدمات و موضوع دلخواهت را جست‌وجو کن.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
            <Search className="size-5 shrink-0 text-primary" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="مثلاً موتر، خانه یا موبایل..."
              aria-label="جست‌وجوی دسته و زیردسته"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/75"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="پاک کردن جست‌وجو"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : (
              <span className="hidden rounded-lg bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                جست‌وجو
              </span>
            )}
          </label>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <LayoutGrid className="size-3.5 text-primary" aria-hidden />
              <strong className="font-bold tabular-nums text-foreground">
                {tree.length.toLocaleString('fa-AF')}
              </strong>
              دستهٔ اصلی
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent" />
              <strong className="font-bold tabular-nums text-foreground">
                {totalSubcategories.toLocaleString('fa-AF')}
              </strong>
              زیردسته
            </span>
          </div>
        </div>
      </header>

      {normalizedSearch ? (
        <section aria-label="نتایج جست‌وجوی دسته‌بندی‌ها" aria-live="polite" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-primary">نتیجهٔ جست‌وجو</p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">
                {searchResults.length.toLocaleString('fa-AF')} مورد پیدا شد
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              نمایش همهٔ دسته‌ها
              <X className="size-3.5" aria-hidden />
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((result) => {
                const Icon = categoryIcon(result.category.iconKey);

                return (
                  <Link
                    key={result.category.id}
                    href={`/category/${result.category.slug}`}
                    className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-border/75 bg-surface p-3 transition-all hover:border-primary/35 hover:bg-primary-soft/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft/70 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="size-5" strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground">
                        {result.category.name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {result.isRoot ? 'همهٔ آگهی‌های این دسته' : `در دستهٔ ${result.parentName}`}
                      </span>
                    </span>
                    <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" aria-hidden />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-surface/70 px-5 py-14 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                <Search className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-bold text-foreground">چیزی پیدا نشد</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                املای دیگری را امتحان کن یا از فهرست دسته‌ها استفاده کن.
              </p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                دیدن همهٔ دسته‌ها
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-surface shadow-[0_16px_48px_rgba(15,76,69,0.055)]">
          <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="min-w-0 border-b border-border/70 bg-muted/20 p-3 sm:p-4 lg:border-b-0 lg:border-l">
              <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:px-2">
                <div>
                  <p className="text-[11px] font-bold text-primary">از اینجا شروع کن</p>
                  <h2 className="mt-0.5 text-sm font-extrabold text-foreground">دسته‌های اصلی</h2>
                </div>
                <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold tabular-nums text-muted-foreground ring-1 ring-border/70">
                  {tree.length.toLocaleString('fa-AF')}
                </span>
              </div>

              <nav
                aria-label="انتخاب دستهٔ اصلی"
                className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
              >
                {tree.map((category) => {
                  const Icon = categoryIcon(category.iconKey);
                  const isSelected = selectedCategory?.id === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedId(category.id)}
                      aria-pressed={isSelected}
                      aria-controls="category-detail-panel"
                      className={cn(
                        'group flex min-h-[68px] min-w-[148px] snap-start items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-start transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:min-w-0 lg:px-3.5',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_rgba(15,118,110,0.2)]'
                          : 'border-transparent bg-surface/75 text-foreground hover:border-border hover:bg-surface hover:shadow-sm',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                          isSelected
                            ? 'bg-white/15 text-white'
                            : 'bg-primary-soft/70 text-primary group-hover:bg-primary-soft',
                        )}
                      >
                        <Icon className="size-5" strokeWidth={1.8} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold sm:text-sm">
                          {category.name}
                        </span>
                        <span
                          className={cn(
                            'mt-1 block text-[10px] font-medium',
                            isSelected ? 'text-white/70' : 'text-muted-foreground',
                          )}
                        >
                          {category.children.length.toLocaleString('fa-AF')} زیردسته
                        </span>
                      </span>
                      <ChevronLeft
                        className={cn(
                          'size-4 shrink-0 transition-transform',
                          isSelected ? 'text-white/80' : 'text-muted-foreground group-hover:-translate-x-0.5',
                        )}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div id="category-detail-panel" className="min-w-0 p-4 sm:p-6 lg:p-8">
              {selectedCategory ? (
                <>
                  <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
                    <div className="flex min-w-0 items-center gap-3.5">
                      {(() => {
                        const Icon = categoryIcon(selectedCategory.iconKey);
                        return (
                          <span className="relative flex size-[68px] shrink-0 items-center justify-center rounded-[1.35rem] bg-primary-soft text-primary sm:size-[76px]">
                            <span className="absolute -end-1 -top-1 size-3 rounded-full border-2 border-surface bg-accent" />
                            <Icon className="size-8 sm:size-9" strokeWidth={1.6} aria-hidden />
                          </span>
                        );
                      })()}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary">دستهٔ انتخاب‌شده</p>
                        <h2 className="mt-1 truncate text-xl font-black text-foreground sm:text-2xl">
                          {selectedCategory.name}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {selectedCategory.children.length > 0
                            ? `برای دیدن آگهی‌ها، یکی از ${selectedCategory.children.length.toLocaleString('fa-AF')} زیردسته را انتخاب کن.`
                            : 'آگهی‌های این بخش را مستقیم ببین.'}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/category/${selectedCategory.slug}`}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b5f57] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#084d47] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      دیدن همهٔ آگهی‌ها
                      <ArrowLeft className="size-4" aria-hidden />
                    </Link>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-foreground">زیردسته‌ها</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        مستقیم وارد بخش موردنظرت شو
                      </p>
                    </div>
                    <span className="rounded-full bg-primary-soft/70 px-3 py-1.5 text-xs font-bold tabular-nums text-primary">
                      {selectedCategory.children.length.toLocaleString('fa-AF')} مورد
                    </span>
                  </div>

                  {selectedCategory.children.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-2">
                      {selectedCategory.children.map((child) => {
                        const Icon = categoryIcon(child.iconKey);

                        return (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="group flex min-h-[76px] min-w-0 items-center gap-3 rounded-2xl border border-border/75 bg-surface p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary-soft/15 hover:shadow-[0_8px_22px_rgba(15,76,69,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf6f3] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                              <Icon className="size-5" strokeWidth={1.8} aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-foreground">
                                {child.name}
                              </span>
                              <span className="mt-1 block text-[11px] text-muted-foreground">
                                مشاهدهٔ آگهی‌ها
                              </span>
                            </span>
                            <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" aria-hidden />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        برای این بخش زیردسته‌ای ثبت نشده است.
                      </p>
                      <Link
                        href={`/category/${selectedCategory.slug}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                      >
                        دیدن آگهی‌های این دسته
                        <ArrowLeft className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </section>
      )}

      <p className="text-center text-[11px] leading-6 text-muted-foreground">
        دسته‌بندی مناسب را انتخاب کن تا سریع‌تر به آگهی‌های مرتبط برسی.
      </p>
    </div>
  );
}
