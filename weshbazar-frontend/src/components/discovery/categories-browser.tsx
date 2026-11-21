"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Search, X } from 'lucide-react';
import type { CategoryNode } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';

interface CategoriesBrowserProps {
  tree: CategoryNode[];
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
  const normalizedSearch = normalizeCategoryText(search);

  const filteredTree = useMemo(() => {
    const terms = normalizedSearch.split(' ').filter(Boolean);
    if (terms.length === 0) return tree;

    return tree.flatMap((root) => {
      const rootText = normalizeCategoryText(root.name);
      const rootMatches = matchesTerms(rootText, terms);

      if (rootMatches) return [root];

      const matchingChildren = root.children.filter((child) => {
        const childText = normalizeCategoryText(child.name);
        const combinedText = normalizeCategoryText(`${root.name} ${child.name}`);
        return matchesTerms(childText, terms) || matchesTerms(combinedText, terms);
      });

      if (matchingChildren.length > 0) {
        return [{ ...root, children: matchingChildren }];
      }

      return [];
    });
  }, [tree, normalizedSearch]);

  const visibleCategoryCount = filteredTree.length;
  const visibleSubcategoryCount = filteredTree.reduce(
    (total, category) => total + category.children.length,
    0,
  );

  return (
    <div className="mt-5 space-y-6 sm:mt-7 sm:space-y-8">
      <header className="grid gap-5 border-b border-border/70 pb-6 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] lg:items-end">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary">
            <span className="size-2 rounded-full bg-accent" />
            راهنمای دسته‌بندی‌های ویش‌بازار
          </span>
          <h1 className="mt-3 text-3xl font-black leading-[1.35] tracking-tight text-foreground sm:text-4xl">
            از کجا می‌خواهی شروع کنی؟
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            همهٔ بخش‌ها و زیردسته‌ها یک‌جا پیش رویت است؛ دستهٔ دلخواهت را انتخاب کن.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
            <Search className="size-5 shrink-0 text-primary" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی دسته یا زیردسته..."
              aria-label="جست‌وجوی دسته یا زیردسته"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/75"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="پاک کردن جست‌وجو"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </label>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <LayoutGrid className="size-3.5 text-primary" aria-hidden />
              <strong className="font-bold tabular-nums text-foreground">
                {visibleCategoryCount.toLocaleString('fa-AF')}
              </strong>
              دستهٔ اصلی
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent" />
              <strong className="font-bold tabular-nums text-foreground">
                {visibleSubcategoryCount.toLocaleString('fa-AF')}
              </strong>
              زیردسته
            </span>
          </div>
        </div>
      </header>

      <section aria-label="تمام دسته‌بندی‌ها" aria-live="polite" className="space-y-4 sm:space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-primary">
              {normalizedSearch ? 'نتیجهٔ جست‌وجو' : 'فهرست کامل بازار'}
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-foreground sm:text-xl">
              {normalizedSearch ? 'دسته‌های پیدا‌شده' : 'همهٔ دسته‌ها و زیردسته‌ها'}
            </h2>
          </div>
          {normalizedSearch ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="shrink-0 rounded-full px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              پاک کردن جست‌وجو
            </button>
          ) : (
            <span className="rounded-full bg-primary-soft/70 px-3 py-1.5 text-xs font-bold text-primary">
              {tree.length.toLocaleString('fa-AF')} بخش
            </span>
          )}
        </div>

        {filteredTree.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
            {filteredTree.map((category) => {
              const Icon = categoryIcon(category.iconKey);

              return (
                <article
                  key={category.id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[0_5px_20px_rgba(15,76,69,0.035)] transition-shadow duration-200 hover:shadow-[0_10px_28px_rgba(15,76,69,0.07)]"
                >
                  <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="size-5" strokeWidth={1.8} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-extrabold text-foreground sm:text-base">
                        {category.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {category.children.length > 0
                          ? `${category.children.length.toLocaleString('fa-AF')} زیردسته`
                          : 'دستهٔ مستقل'}
                      </p>
                    </div>
                    <Link
                      href={`/category/${category.slug}`}
                      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      همهٔ آگهی‌ها
                      <ArrowLeft className="size-3.5" aria-hidden />
                    </Link>
                  </div>

                  {category.children.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-x-3 px-3 py-2.5 sm:grid-cols-2 sm:px-4">
                      {category.children.map((child) => {
                        const ChildIcon = categoryIcon(child.iconKey);

                        return (
                          <li key={child.id} className="min-w-0">
                            <Link
                              href={`/category/${child.slug}`}
                              className="group flex min-h-11 items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary-soft/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <ChildIcon
                                className="size-4 shrink-0 text-primary/65 transition-colors group-hover:text-primary"
                                strokeWidth={1.8}
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1 truncate">{child.name}</span>
                              <ArrowLeft
                                className="size-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-primary"
                                aria-hidden
                              />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="px-5 py-4 text-xs text-muted-foreground">
                      برای این بخش زیردسته‌ای ثبت نشده است.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-surface/70 px-5 py-14 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
              <Search className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 font-bold text-foreground">دسته‌ای پیدا نشد</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              املای دیگری را امتحان کن یا همهٔ دسته‌ها را ببین.
            </p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              نمایش همهٔ دسته‌ها
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
