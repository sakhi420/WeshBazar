'use client';

/**
 * Active filter summary (master prompt §21–22, §119).
 * Every chip is a one-tap removal; the row also offers clear-all. City names
 * resolve from the same cached cities query the filter panel uses.
 */

import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useQueryStates } from 'nuqs';
import type { CategorySummary, FilterSchemaField } from '@/features/categories';
import { fetchCities, type Province } from '@/features/locations';
import { formatCurrency, formatCondition, formatNumber } from '@/features/listings';
import { parseFilterExpression, type FilterExpression } from '@/features/search';
import { discoveryParamsParsers } from '@/features/search/parsers';
import { recordSearchEvent } from '@/features/search/telemetry';
import { queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface ActiveFilterChipsProps {
  provinces: Province[];
  categories?: CategorySummary[];
  filterSchema?: FilterSchemaField[];
  className?: string;
}

interface Chip {
  key: string;
  label: string;
  remove: () => void;
}

/**
 * Reduce a chip key to its telemetry facet key: `condition-NEW` → `condition`,
 * `filter-year:gte:2020` → `year`; everything else passes through unchanged.
 */
function cleanTelemKey(chipKey: string): string {
  if (chipKey.startsWith('condition-')) return 'condition';
  if (chipKey.startsWith('filter-')) {
    return parseFilterExpression(chipKey.slice('filter-'.length))?.key ?? 'filter';
  }
  return chipKey;
}

function formatExpressionValue(
  expression: FilterExpression,
  field: FilterSchemaField | undefined,
): string {
  let display = expression.value;
  const options = field?.options ?? [];
  if (options.length > 0) {
    const map = new Map(options.map((option) => [option.value, option.label]));
    display = expression.value
      .split(',')
      .map((part) => map.get(part) ?? part)
      .join('، ');
  } else if (expression.operator === 'in') {
    display = expression.value.split(',').join('، ');
  }
  if (expression.operator === 'gte') return `≥ ${display}`;
  if (expression.operator === 'lte') return `≤ ${display}`;
  return display;
}

export function ActiveFilterChips({
  provinces,
  categories,
  filterSchema,
  className,
}: ActiveFilterChipsProps) {
  const [params, setParams] = useQueryStates(discoveryParamsParsers, { history: 'push', shallow: false });

  const provinceSlug = params.province ?? '';
  const provinceObj = provinces.find((item) => item.slug === provinceSlug) ?? null;
  const { data: cities = [] } = useQuery({
    queryKey: queryKeys.locations.cities(provinceObj?.id ?? ''),
    queryFn: () => fetchCities(provinceObj!.id),
    enabled: provinceObj !== null,
    staleTime: 60 * 60 * 1000,
  });

  const condition = params.condition ?? [];
  const rawFilters = params.filter ?? [];
  const minPrice = params.minPrice ?? null;
  const maxPrice = params.maxPrice ?? null;

  const chips: Chip[] = [];

  if (params.category) {
    const name = categories?.find((item) => item.slug === params.category)?.name;
    if (name) {
      chips.push({
        key: 'category',
        label: name,
        remove: () => void setParams({ category: null }),
      });
    }
  }

  if (params.province) {
    chips.push({
      key: 'province',
      label: provinceObj?.name ?? params.province,
      remove: () => void setParams({ province: null, city: null }),
    });
  }

  if (params.city) {
    const cityName = cities.find((item) => item.slug === params.city)?.name;
    chips.push({
      key: 'city',
      label: cityName ?? params.city,
      remove: () => void setParams({ city: null }),
    });
  }

  if (minPrice !== null) {
    chips.push({
      key: 'minPrice',
      label: `از ${formatNumber(minPrice)} ${formatCurrency('AFN')}`,
      remove: () => void setParams({ minPrice: null }),
    });
  }

  if (maxPrice !== null) {
    chips.push({
      key: 'maxPrice',
      label: `تا ${formatNumber(maxPrice)} ${formatCurrency('AFN')}`,
      remove: () => void setParams({ maxPrice: null }),
    });
  }

  for (const value of condition) {
    chips.push({
      key: `condition-${value}`,
      label: formatCondition(value),
      remove: () =>
        void setParams({
          condition: condition.filter((item) => item !== value).length
            ? condition.filter((item) => item !== value)
            : null,
        }),
    });
  }

  for (const raw of rawFilters) {
    const expression = parseFilterExpression(raw);
    if (!expression) continue;
    const field = filterSchema?.find((item) => item.field === expression.key);
    chips.push({
      key: `filter-${raw}`,
      label: `${field?.label ?? expression.key}: ${formatExpressionValue(expression, field)}`,
      remove: () => {
        const next = rawFilters.filter((item) => item !== raw);
        void setParams({ filter: next.length > 0 ? next : null });
      },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="فیلترهای فعال"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => {
            chip.remove();
            void recordSearchEvent({ type: 'filter_removed', filterKey: cleanTelemKey(chip.key) });
          }}
          aria-label={`حذف فیلتر ${chip.label}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-ui text-foreground transition-colors duration-small hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-9"
        >
          {chip.label}
          <X className="size-3.5 shrink-0" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          void setParams({
            q: null,
            category: null,
            province: null,
            city: null,
            minPrice: null,
            maxPrice: null,
            condition: null,
            sort: null,
            filter: null,
          });
          void recordSearchEvent({ type: 'filter_cleared' });
        }}
        className="min-h-11 px-2 text-ui text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-9"
      >
        پاک کردن همه
      </button>
    </div>
  );
}
