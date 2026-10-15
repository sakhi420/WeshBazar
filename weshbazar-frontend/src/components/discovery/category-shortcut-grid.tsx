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
 * Category shortcut pills for homepage (§108): one compact horizontal row.
 * Every top-level category renders in-place; on >=lg they stretch to fill the
 * row, on smaller screens the row scrolls horizontally (hidden scrollbar).
 * Hover: border-primary + bg-primary-soft.
 */
export function CategoryShortcutGrid({ categories, className }: CategoryShortcutGridProps) {
  if (categories.length === 0) return null;

  const capsuleClass = cn(
    'flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-card border border-transparent bg-surface px-2 py-3 text-center shadow-soft transition-all duration-small',
    'hover:border-primary/20 hover:bg-primary-soft/60 hover:shadow-card',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    'lg:w-auto lg:flex-1',
  );
  const iconClass =
    'flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary';

  return (
    <div className={cn('no-scrollbar flex items-stretch gap-2 overflow-x-auto pb-2', className)}>
      {categories.map((cat) => {
        const Icon = categoryIcon(cat.iconKey);
        return (
          <Link key={cat.id} href={`/category/${cat.slug}`} className={capsuleClass}>
            <span className={iconClass}>
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="line-clamp-2 text-caption leading-4 text-muted-foreground">
              {cat.name}
            </span>
          </Link>
        );
      })}
      <Link href="/categories" className={capsuleClass}>
        <span className={iconClass}>
          <LayoutGrid className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="line-clamp-2 text-caption font-medium leading-4 text-primary">همه</span>
      </Link>
    </div>
  );
}