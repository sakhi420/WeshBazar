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
 * Category shortcut pills for homepage (§108): unified single-brand tint for
 * every category icon (audit F-05), honest 12px captions (audit F-11).
 * 
 * Every top-level category renders in-place; on >=lg they stretch to fill the
 * row, on smaller screens the row scrolls horizontally (hidden scrollbar).
 */
export function CategoryShortcutGrid({ categories, className }: CategoryShortcutGridProps) {
  if (categories.length === 0) return null;

  const capsuleClass = cn(
    'flex w-[88px] shrink-0 flex-col items-center gap-2.5 rounded-card border border-border/70 bg-surface px-2.5 py-3.5 text-center shadow-soft transition-all duration-small',
    'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-soft hover:shadow-card',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    'lg:w-auto lg:flex-1',
  );

  return (
    <div className={cn('no-scrollbar flex items-stretch gap-2.5 overflow-x-auto pb-2', className)}>
      {categories.map((cat) => {
        const Icon = categoryIcon(cat.iconKey);
        
        return (
          <Link key={cat.id} href={`/category/${cat.slug}`} className={capsuleClass}>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Icon className="size-6" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="line-clamp-2 text-caption font-medium text-foreground">
              {cat.name}
            </span>
          </Link>
        );
      })}
      <Link href="/categories" className={capsuleClass}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <LayoutGrid className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="line-clamp-2 text-caption font-bold text-accent">همه</span>
      </Link>
    </div>
  );
}