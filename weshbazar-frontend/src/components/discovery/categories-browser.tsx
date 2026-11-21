"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpLeft, Search, X } from 'lucide-react';
import type { CategoryNode } from '@/features/categories';
import { categoryIcon } from '@/features/categories/icon';
import { cn } from '@/lib/utils';

interface CategoriesBrowserProps {
  tree: CategoryNode[];
}

const accents = [
  'from-teal-50 to-emerald-100 text-teal-800 ring-teal-200/70',
  'from-orange-50 to-amber-100 text-orange-800 ring-orange-200/70',
  'from-sky-50 to-cyan-100 text-sky-800 ring-sky-200/70',
  'from-violet-50 to-purple-100 text-violet-800 ring-violet-200/70',
  'from-rose-50 to-pink-100 text-rose-800 ring-rose-200/70',
  'from-lime-50 to-green-100 text-green-800 ring-green-200/70',
];

export function CategoriesBrowser({ tree }: CategoriesBrowserProps) {
  const [search, setSearch] = useState('');
  const normalized = search.trim().toLocaleLowerCase('fa-AF');

  const filtered = useMemo(() => {
    if (!normalized) return tree;
    return tree.flatMap((node) => {
      const rootMatches = node.name.toLocaleLowerCase('fa-AF').includes(normalized);
      const children = node.children.filter((child) =>
        child.name.toLocaleLowerCase('fa-AF').includes(normalized),
      );
      if (rootMatches) return [node];
      if (children.length > 0) return [{ ...node, children }];
      return [];
    });
  }, [tree, normalized]);

  const visibleCount = filtered.reduce((count, node) => count + 1 + node.children.length, 0);

  return (
    <div className="mt-5 space-y-6 sm:mt-7 sm:space-y-8">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#0b4f49] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,76,69,0.16)] sm:px-8 sm:py-9 lg:px-10">
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-24 size-72 rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -end-2 -top-10 size-48 rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 start-[28%] size-64 rounded-full bg-[#f59e0b]/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85">
            <span className="size-1.5 rounded-full bg-[#fbbf24]" />
            راهنمای بازار ویش‌بازار
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            دنبال چی می‌گردی؟
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-7 text-white/75 sm:text-base">
            از میان دسته‌بندی‌ها انتخاب کن و مستقیم به آگهی‌های موردنظرت برس.
          </p>
          <label className="mt-5 flex max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-white px-4 py-3 text-[#173b37] shadow-lg shadow-black/10 focus-within:ring-2 focus-within:ring-[#f59e0b]">
            <Search className="size-5 shrink-0 text-[#0f766e]" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="نام دسته یا زیردسته را بنویس..."
              aria-label="جست‌وجوی دسته‌بندی"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="پاک کردن جست‌وجو"
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <p className="mt-3 text-xs text-white/60">
            {tree.length.toLocaleString('fa-AF')} دستهٔ اصلی
            <span className="mx-2 text-white/30">•</span>
            {tree.reduce((n, item) => n + item.children.length, 0).toLocaleString('fa-AF')} زیردسته
          </p>
        </div>
      </section>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary">همهٔ بخش‌ها</p>
          <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">کاوش دسته‌بندی‌ها</h2>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          {visibleCount.toLocaleString('fa-AF')} مورد
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((node, index) => {
            const Icon = categoryIcon(node.iconKey);
            const accent = accents[index % accents.length];
            return (
              <article
                key={node.id}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_32px_rgba(15,76,69,0.08)] sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/category/${node.slug}`}
                    aria-label={`دیدن آگهی‌های ${node.name}`}
                    className={cn(
                      'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 transition-transform duration-200 group-hover:scale-105 sm:size-16',
                      accent,
                    )}
                  >
                    <Icon className="size-7 sm:size-8" strokeWidth={1.65} aria-hidden />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/category/${node.slug}`}
                      className="inline-flex items-center gap-1 text-base font-bold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {node.name}
                      <ArrowUpLeft className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {node.children.length
                        ? `${node.children.length.toLocaleString('fa-AF')} زیردسته`
                        : 'مشاهده آگهی‌ها'}
                    </p>
                  </div>
                  <Link
                    href={`/category/${node.slug}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                    aria-label={`ورود به ${node.name}`}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                  </Link>
                </div>

                {node.children.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    {node.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/category/${child.slug}`}
                        className="rounded-lg bg-muted/55 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 border-t border-border/60 pt-3">
                    <Link href={`/category/${node.slug}`} className="text-xs font-semibold text-primary hover:underline">
                      دیدن آگهی‌های این دسته
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center">
          <Search className="mx-auto size-8 text-muted-foreground/60" aria-hidden />
          <p className="mt-3 font-semibold text-foreground">دسته‌ای پیدا نشد</p>
          <p className="mt-1 text-sm text-muted-foreground">نام دیگری را جست‌وجو کن.</p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-4 rounded-full bg-primary-soft px-4 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
          >
            پاک کردن جست‌وجو
          </button>
        </div>
      )}
    </div>
  );
}
