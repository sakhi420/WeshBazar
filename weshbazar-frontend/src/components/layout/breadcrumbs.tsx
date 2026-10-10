import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  /** Omit on the current page — it renders as plain text with aria-current. */
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * RTL breadcrumb trail (master prompt §22). Logical layout only; the chevron
 * points left, the reading direction of progress in RTL.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="مسیر صفحه" className={cn(className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-ui text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronLeft className="size-4 shrink-0" aria-hidden /> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="rounded-control transition-colors duration-small hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
