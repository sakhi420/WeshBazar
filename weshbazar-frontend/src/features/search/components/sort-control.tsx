'use client';

/**
 * Sort selection (master prompt §21, §120). A native select keeps mobile
 * pickers platform-correct and keyboard/AT behavior free.
 */

import { ArrowUpDown } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import type { SortOption } from '@/features/search';
import { discoveryParamsParsers } from '@/features/search/parsers';
import { recordSearchEvent } from '../telemetry';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'تازه‌ترین',
  price_asc: 'ارزان‌ترین',
  price_desc: 'گران‌ترین',
  most_viewed: 'پربازدیدترین',
};

export function SortControl({ className }: { className?: string }) {
  const [sort, setSort] = useQueryState(
    'sort',
    discoveryParamsParsers.sort.withOptions({ history: 'push', shallow: false }),
  );

  return (
    <label className={cn('relative flex items-center', className)}>
      <ArrowUpDown
        className="pointer-events-none absolute start-3 size-4 text-muted-foreground"
        aria-hidden
      />
      <span className="sr-only">ترتیب نمایش</span>
      <select
        value={sort ?? 'newest'}
        onChange={(event) => {
          const next = event.target.value as SortOption;
          void setSort(next === 'newest' ? null : next);
          void recordSearchEvent({ type: 'sort_changed', sort: next });
        }}
        className="h-control w-full appearance-none rounded-control border border-input bg-background ps-9 pe-3 text-ui text-foreground outline-none transition-colors duration-small focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((value) => (
          <option key={value} value={value}>
            {SORT_LABELS[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
