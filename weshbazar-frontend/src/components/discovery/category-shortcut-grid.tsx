import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/features/categories';

interface CategoryShortcutGridProps {
  categories: CategorySummary[];
  className?: string;
}

/**
 * Category shortcut pills for homepage (§108): one compact horizontal row.
 * Max 8 items plus an "all categories" link.
 * Hover: border-primary + bg-primary-soft.
 */
export function CategoryShortcutGrid({ categories, className }: CategoryShortcutGridProps) {
  if (categories.length === 0) return null;

  const visible = categories.slice(0, 8);
  const hasMore = categories.length > 8;

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-1', className)}>
      {visible.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className={cn(
            'inline-flex h-control shrink-0 items-center rounded-card border border-border bg-surface px-4 text-ui font-medium text-foreground transition-colors duration-small',
            'hover:border-primary hover:bg-primary-soft hover:text-primary',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          )}
        >
          <span className="truncate max-w-28">{cat.name}</span>
        </Link>
      ))}
      {hasMore ? (
        <Link
          href="/categories"
          className={cn(
            'inline-flex h-control shrink-0 items-center gap-1 rounded-card border border-border bg-surface px-4 text-ui font-medium text-primary transition-colors duration-small',
            'hover:border-primary hover:bg-primary-soft',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          )}
        >
          <span>همه</span>
          <ArrowLeft className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}