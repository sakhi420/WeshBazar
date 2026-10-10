'use client';

/**
 * Edit section 3 — location (§42, mirrors the sell location step §38). The
 * pickers run their own reference queries; changing the province always
 * clears the city. Seeded names arrive as labels so the selects stay readable
 * while the lists load or when a stale id is absent from the reference data.
 */

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/api';
import { FormField, INPUT_CLASS } from '@/features/auth/components';
import { fetchCities, fetchProvinces } from '@/features/locations';
import type { EditListingForm } from '../model';

interface EditLocationSectionProps {
  provinceId: string;
  cityId: string;
  /** Names from the seeded record — fallback options for stale ids. */
  provinceLabel: string;
  cityLabel: string;
  errors: Record<string, string>;
  onChange: (patch: Partial<EditListingForm>) => void;
}

export function EditLocationSection({
  provinceId,
  cityId,
  provinceLabel,
  cityLabel,
  errors,
  onChange,
}: EditLocationSectionProps) {
  const provincesQuery = useQuery({
    queryKey: queryKeys.locations.provinces,
    queryFn: () => fetchProvinces(),
    staleTime: 60 * 60_000,
  });

  const citiesQuery = useQuery({
    queryKey: queryKeys.locations.cities(provinceId.length > 0 ? provinceId : 'none'),
    queryFn: () => (provinceId.length === 0 ? Promise.resolve([]) : fetchCities(provinceId)),
    enabled: provinceId.length > 0,
    staleTime: 60 * 60_000,
  });

  const provinces = provincesQuery.data ?? [];
  const cities = citiesQuery.data ?? [];
  const provinceMissing =
    provinceId.length > 0 &&
    provincesQuery.isSuccess &&
    !provinces.some((p) => p.id === provinceId);
  const cityMissing =
    cityId.length > 0 &&
    provinceId.length > 0 &&
    citiesQuery.isSuccess &&
    !cities.some((c) => c.id === cityId);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-ui font-semibold text-foreground">موقعیت آگهی</h2>
        <p className="text-meta text-muted-foreground">
          ولایت و شهر محل آگهی را تعیین کنید تا خریداران نزدیک شما آن را پیدا کنند.
        </p>
      </header>

      <FormField id="edit-province" label="ولایت" error={errors.provinceId}>
        <select
          id="edit-province"
          value={provinceId}
          onChange={(event) => {
            const nextId = event.target.value;
            // A new province always invalidates the previous city.
            onChange({ provinceId: nextId, cityId: '' });
          }}
          aria-invalid={errors.provinceId ? true : undefined}
          aria-describedby={errors.provinceId ? 'edit-province-error' : undefined}
          className={INPUT_CLASS}
        >
          <option value="">انتخاب ولایت…</option>
          {provinceMissing ? <option value={provinceId}>{provinceLabel}</option> : null}
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </FormField>

      {provincesQuery.isError ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-meta text-danger">بارگیری فهرست ولایت‌ها ناموفق بود.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void provincesQuery.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : null}

      <FormField id="edit-city" label="شهر" error={errors.cityId}>
        <select
          id="edit-city"
          value={cityId}
          disabled={provinceId.length === 0 || citiesQuery.isPending}
          onChange={(event) => onChange({ cityId: event.target.value })}
          aria-invalid={errors.cityId ? true : undefined}
          aria-describedby={errors.cityId ? 'edit-city-error' : undefined}
          className={INPUT_CLASS}
        >
          <option value="">
            {provinceId.length === 0
              ? 'ابتدا ولایت را انتخاب کنید'
              : citiesQuery.isPending
                ? 'در حال بارگیری…'
                : citiesQuery.isError
                  ? 'بارگیری شهرها ناموفق بود'
                  : cities.length === 0
                    ? 'شهری ثبت نشده است'
                    : 'انتخاب شهر…'}
          </option>
          {cityMissing ? <option value={cityId}>{cityLabel}</option> : null}
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </FormField>

      {citiesQuery.isError && provinceId.length > 0 ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => void citiesQuery.refetch()}>
          تلاش دوباره برای بارگیری شهرها
        </Button>
      ) : null}
    </section>
  );
}
