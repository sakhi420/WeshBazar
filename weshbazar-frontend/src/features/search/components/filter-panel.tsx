'use client';

/**
 * Discovery filter panel (master prompt §21–22, §117–118).
 *
 * Desktop: a persistent panel (`FilterPanelDesktop`) at the inline start.
 * Mobile: a trigger button + full-height native `<dialog>` sheet — real focus
 * trap, Esc handling, and backdrop without adding a dependency.
 *
 * All values live in the URL via nuqs, so filters apply immediately and the
 * "apply" action only closes the sheet. Shared internals render twice (panel +
 * sheet), so every control id is prefixed to stay unique.
 */

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useQueryStates } from 'nuqs';
import type { CategorySummary, FilterSchemaField } from '@/features/categories';
import { fetchCities, type Province } from '@/features/locations';
import { CONDITION_OPTIONS, countActiveFilters, discoveryKey, toDiscoveryQuery } from '@/features/search';
import { discoveryParamsParsers } from '@/features/search/parsers';
import { fetchListingFacets, formatCondition, formatNumber } from '@/features/listings';
import { queryKeys, type ListingCondition } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { recordSearchEvent } from '../telemetry';
import { AttributeFilters } from './attribute-filters';
import { NumberInput, SelectInput } from './field-inputs';

export interface FilterPanelProps {
  provinces: Province[];
  /** Search surface only: category picker (category pages own the category). */
  categories?: CategorySummary[];
  /** Category surface only: effective attribute schema. */
  filterSchema?: FilterSchemaField[];
  className?: string;
}

const CLEARED_FILTERS = {
  q: null,
  category: null,
  province: null,
  city: null,
  minPrice: null,
  maxPrice: null,
  condition: null,
  sort: null,
  filter: null,
} as const;

/** «افغانی» — the discovery currency is AFN per the seed/contract. */
const PRICE_SUFFIX = 'افغانی';

function parsePriceInput(raw: string): number | null {
  const cleaned = raw.trim();
  if (cleaned === '') return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

interface FilterFieldsProps {
  provinces: Province[];
  categories?: CategorySummary[];
  filterSchema?: FilterSchemaField[];
  idPrefix: string;
}

function FilterFields({ provinces, categories, filterSchema, idPrefix }: FilterFieldsProps) {
  const [params, setParams] = useQueryStates(discoveryParamsParsers, {
    history: 'replace',
    // Shallow must be off: filters drive the SSR discovery query, so the URL
    // change has to re-render the Server Component and fetch fresh results.
    shallow: false,
  });

  const province = params.province ?? '';
  const city = params.city ?? '';
  const condition = params.condition ?? [];
  const provinceObj = provinces.find((item) => item.slug === province) ?? null;

  const { data: cities = [] } = useQuery({
    queryKey: queryKeys.locations.cities(provinceObj?.id ?? 'none'),
    queryFn: () => (provinceObj ? fetchCities(provinceObj.id) : Promise.resolve([])),
    enabled: provinceObj !== null,
    staleTime: 60 * 60 * 1000,
  });

  const facetsQuery = toDiscoveryQuery({
    q: params.q,
    category: params.category,
    province: params.province,
    city: params.city,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    condition: params.condition,
    sort: params.sort,
    filter: params.filter,
  });
  const { data: facetCounts } = useQuery({
    queryKey: ['listings', 'facets', discoveryKey(facetsQuery)],
    queryFn: () => fetchListingFacets(facetsQuery),
    staleTime: 30_000,
  });

  const urlMin = params.minPrice ?? null;
  const urlMax = params.maxPrice ?? null;
  const [minPrice, setMinPrice] = useState(urlMin !== null ? String(urlMin) : '');
  const [maxPrice, setMaxPrice] = useState(urlMax !== null ? String(urlMax) : '');

  useEffect(() => {
    setMinPrice(urlMin !== null ? String(urlMin) : '');
  }, [urlMin]);
  useEffect(() => {
    setMaxPrice(urlMax !== null ? String(urlMax) : '');
  }, [urlMax]);

  function commitPrice(bound: 'minPrice' | 'maxPrice', raw: string) {
    const parsed = parsePriceInput(raw);
    const current = bound === 'minPrice' ? urlMin : urlMax;
    if (parsed === current) {
      if (bound === 'minPrice') setMinPrice(current !== null ? String(current) : '');
      else setMaxPrice(current !== null ? String(current) : '');
      return;
    }
    void setParams(bound === 'minPrice' ? { minPrice: parsed } : { maxPrice: parsed });
  }

  function toggleCondition(value: ListingCondition, checked: boolean) {
    const next = checked
      ? [...condition, value]
      : condition.filter((item) => item !== value);
    void setParams({ condition: next.length > 0 ? next : null });
  }

  const priceMin = parsePriceInput(minPrice);
  const priceMax = parsePriceInput(maxPrice);
  const priceError =
    priceMin !== null && priceMax !== null && priceMin > priceMax
      ? 'حداقل قیمت نمی‌تواند از حداکثر بزرگ‌تر باشد.'
      : null;
  const priceErrorId = `${idPrefix}-price-error`;

  return (
    <div className="space-y-5">
      {categories && categories.length > 0 ? (
        <SelectInput
          id={`${idPrefix}-category`}
          label="دسته‌بندی"
          value={params.category ?? ''}
          onChange={(value) => void setParams({ category: value || null })}
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </SelectInput>
      ) : null}

      <SelectInput
        id={`${idPrefix}-province`}
        label="ولایت"
        value={province}
        onChange={(value) => void setParams({ province: value || null, city: null })}
      >
        <option value="">همه ولایت‌ها</option>
        {provinces.map((item) => (
          <option key={item.id} value={item.slug}>
            {item.name}
          </option>
        ))}
      </SelectInput>

      <SelectInput
        id={`${idPrefix}-city`}
        label="شهر"
        value={city}
        disabled={!provinceObj || cities.length === 0}
        onChange={(value) => void setParams({ city: value || null })}
      >
        <option value="">همه شهرها</option>
        {cities.map((item) => (
          <option key={item.id} value={item.slug}>
            {item.name}
          </option>
        ))}
      </SelectInput>

      <div className="space-y-1.5">
        <p className="text-ui font-medium text-foreground">قیمت ({PRICE_SUFFIX})</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            id={`${idPrefix}-min-price`}
            label="از"
            value={minPrice}
            onChange={setMinPrice}
            onCommit={(value) => commitPrice('minPrice', value)}
            placeholder="حداقل"
            invalid={priceError !== null}
            describedBy={priceError ? priceErrorId : undefined}
          />
          <NumberInput
            id={`${idPrefix}-max-price`}
            label="تا"
            value={maxPrice}
            onChange={setMaxPrice}
            onCommit={(value) => commitPrice('maxPrice', value)}
            placeholder="حداکثر"
            invalid={priceError !== null}
            describedBy={priceError ? priceErrorId : undefined}
          />
        </div>
        {priceError ? (
          <p id={priceErrorId} role="alert" className="text-caption text-danger">
            {priceError}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-ui font-medium text-foreground">وضعیت کالا</legend>
        {CONDITION_OPTIONS.map((value) => {
          const countEntry = facetCounts?.condition?.find((item) => item.value === value);
          return (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 text-body text-foreground"
            >
              <input
                type="checkbox"
                checked={condition.includes(value)}
                onChange={(event) => toggleCondition(value, event.target.checked)}
                className="size-5 shrink-0 accent-primary"
              />
              {formatCondition(value)}
              {countEntry ? (
                <span className="text-caption text-muted-foreground">({countEntry.count})</span>
              ) : null}
            </label>
          );
        })}
      </fieldset>

      {filterSchema && filterSchema.length > 0 ? (
        <AttributeFilters fields={filterSchema} idPrefix={idPrefix} facetCounts={facetCounts} />
      ) : null}
    </div>
  );
}

function ClearFiltersButton({ className }: { className?: string }) {
  const [params, setParams] = useQueryStates(discoveryParamsParsers, { history: 'replace', shallow: false });
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={() => {
        const hadFilters = countActiveFilters(params) > 0;
        void setParams(CLEARED_FILTERS);
        if (hadFilters) void recordSearchEvent({ type: 'filter_cleared' });
      }}
    >
      پاک کردن همه
    </Button>
  );
}

/** Persistent desktop panel (hidden below lg). */
export function FilterPanelDesktop({ provinces, categories, filterSchema, className }: FilterPanelProps) {
  return (
    <aside
      aria-label="فیلترها"
      className={cn('hidden lg:sticky lg:top-[4.5rem] lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto', className)}
    >
      <div className="rounded-card border border-border bg-surface p-4">
        <h2 className="mb-4 text-section font-semibold text-foreground">فیلترها</h2>
        <FilterFields
          provinces={provinces}
          categories={categories}
          filterSchema={filterSchema}
          idPrefix="filters-desktop"
        />
        <ClearFiltersButton className="mt-4 w-full" />
      </div>
    </aside>
  );
}

/** Mobile trigger + full-height sheet (hidden at lg+). */
export function MobileFilterSheet({ provinces, categories, filterSchema, className }: FilterPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [params] = useQueryStates(discoveryParamsParsers, { history: 'replace' });
  const activeCount = countActiveFilters(params);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <div className={cn('lg:hidden', className)}>
      <Button
        type="button"
        variant="outline"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <SlidersHorizontal aria-hidden />
        فیلترها
        {activeCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-caption text-primary-foreground">
            {formatNumber(activeCount)}
          </span>
        ) : null}
      </Button>

      <dialog
        ref={dialogRef}
        aria-label="فیلترها"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 open:flex backdrop:bg-foreground/40"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="flex h-full w-full flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-section font-semibold text-foreground">فیلترها</h2>
            <Button type="button" variant="ghost" size="icon" aria-label="بستن فیلترها" onClick={close}>
              <X aria-hidden />
            </Button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <FilterFields
              provinces={provinces}
              categories={categories}
              filterSchema={filterSchema}
              idPrefix="filters-mobile"
            />
          </div>
          <footer className="flex items-center gap-2 border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <ClearFiltersButton />
            <Button type="button" className="flex-1" onClick={close}>
              نمایش نتایج
            </Button>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
