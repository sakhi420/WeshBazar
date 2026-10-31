import { SearchField } from '@/features/search/components/search-field';
import { cn } from '@/lib/utils';

/**
 * Keyword field for discovery pages on viewports below `lg`.
 * Desktop already has SearchField in the header; showing it again duplicates
 * the control. Mobile header only links to /search, so the page must own the input.
 */
export function MobileKeywordSearch({ className }: { className?: string }) {
  return <SearchField className={cn('w-full min-w-0 lg:hidden', className)} />;
}
