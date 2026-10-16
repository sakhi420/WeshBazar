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
 * Category shortcut pills for homepage (§108): Enhanced with color-coded icons,
 * larger capsules for better readability, and improved hover effects.
 * 
 * Every top-level category renders in-place; on >=lg they stretch to fill the
 * row, on smaller screens the row scrolls horizontally (hidden scrollbar).
 */
export function CategoryShortcutGrid({ categories, className }: CategoryShortcutGridProps) {
  if (categories.length === 0) return null;

  // Color mapping for category icons — adds visual variety
  const getCategoryColor = (slug: string) => {
    const colorMap: Record<string, string> = {
      vehicles: 'bg-blue-100 text-blue-600',
      mobiles: 'bg-green-100 text-green-600',
      electronics: 'bg-purple-100 text-purple-600',
      real: 'bg-amber-100 text-amber-600',
      home: 'bg-orange-100 text-orange-600',
      fashion: 'bg-pink-100 text-pink-600',
      kids: 'bg-cyan-100 text-cyan-600',
      books: 'bg-yellow-100 text-yellow-600',
      sports: 'bg-red-100 text-red-600',
      medical: 'bg-teal-100 text-teal-600',
      animals: 'bg-lime-100 text-lime-600',
      jobs: 'bg-indigo-100 text-indigo-600',
      miscellaneous: 'bg-gray-100 text-gray-600',
    };
    // Match partial slug
    const key = Object.keys(colorMap).find(k => slug.includes(k)) || 'miscellaneous';
    return colorMap[key];
  };

  const capsuleClass = cn(
    'flex w-[84px] shrink-0 flex-col items-center gap-2.5 rounded-card border border-transparent bg-surface px-2.5 py-3.5 text-center shadow-soft transition-all duration-small',
    'hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary-soft/50 hover:shadow-card',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    'lg:w-auto lg:flex-1',
  );

  return (
    <div className={cn('no-scrollbar flex items-stretch gap-2.5 overflow-x-auto pb-2', className)}>
      {categories.map((cat) => {
        const Icon = categoryIcon(cat.iconKey);
        const iconColor = getCategoryColor(cat.slug);
        
        return (
          <Link key={cat.id} href={`/category/${cat.slug}`} className={capsuleClass}>
            <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', iconColor)}>
              <Icon className="size-6" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="line-clamp-2 text-[11px] font-medium leading-3.5 text-foreground">
              {cat.name}
            </span>
          </Link>
        );
      })}
      <Link href="/categories" className={capsuleClass}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <LayoutGrid className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="line-clamp-2 text-[11px] font-bold leading-3.5 text-primary">همه</span>
      </Link>
    </div>
  );
}