'use client';

/**
 * Sell step 4 — location (master prompt §38). This is where the server draft
 * is born: continuing validates the draft against the live filter schema and
 * either creates the listing (`POST /listings`) or PATCHes the existing one
 * with `expectedVersion`. The refreshed record seeds the owner cache and the
 * version sync keeps later steps free of 409 conflicts (§43).
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { ApiError, queryKeys } from '@/lib/api';
import { FormError, FormField, INPUT_CLASS } from '@/features/auth/components';
import { fetchFilterSchema } from '@/features/categories';
import { fetchCities, fetchProvinces } from '@/features/locations';
import {
  buildListingCreatePayload,
  buildListingUpdatePayload,
  createListing,
  describeSellError,
  fetchMyListing,
  mergeOwnerListing,
  sellStepPath,
  shouldRefreshOwnerListing,
  syncOwnerListing,
  updateListing,
  type SellDraft,
} from '@/features/listings';
import { SellGuard } from '../sell-guard';
import { SellStepActions, SellStepLayout } from '../sell-step-layout';
import { useSell } from '../sell-provider';

export function SellLocationStep() {
  return (
    <SellGuard step="location">
      <LocationForm />
    </SellGuard>
  );
}

const INCOMPLETE_MESSAGE = 'برخی اطلاعات ناقص است؛ گام‌های قبلی را کامل کنید.';
const INCOMPLETE_ERROR = 'sell-flow-incomplete';

/** Pickers gate: a province first, then one of its cities. */
function validateLocation(draft: SellDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.provinceId === null) {
    errors.provinceId = 'ولایت را انتخاب کنید.';
  } else if (draft.cityId === null) {
    errors.cityId = 'شهر را انتخاب کنید.';
  }
  return errors;
}

function LocationForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { draft, replaceDraft, updateDraft } = useSell();
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const provincesQuery = useQuery({
    queryKey: queryKeys.locations.provinces,
    queryFn: () => fetchProvinces(),
    staleTime: 60 * 60_000,
  });

  const provinceId = draft.provinceId;
  const citiesQuery = useQuery({
    queryKey: queryKeys.locations.cities(provinceId ?? 'none'),
    queryFn: () => (provinceId === null ? Promise.resolve([]) : fetchCities(provinceId)),
    enabled: provinceId !== null,
    staleTime: 60 * 60_000,
  });

  const provinces = provincesQuery.data ?? [];
  const cities = citiesQuery.data ?? [];
  const fieldErrors = attempted ? validateLocation(draft) : {};

  const mutation = useMutation({
    mutationFn: async () => {
      const { categoryId, listingId } = draft;
      if (categoryId === null) throw new Error(INCOMPLETE_ERROR);
      // Live schema drives the attribute payload — never a stale form state.
      const fields = await queryClient.fetchQuery({
        queryKey: queryKeys.categories.filterSchema(categoryId),
        queryFn: () => fetchFilterSchema(categoryId),
        staleTime: 5 * 60_000,
      });
      if (listingId === null) {
        const payload = buildListingCreatePayload(draft, fields);
        if (payload === null) throw new Error(INCOMPLETE_ERROR);
        return createListing(payload);
      }
      const payload = buildListingUpdatePayload(draft, fields);
      if (payload === null) throw new Error(INCOMPLETE_ERROR);
      return updateListing(listingId, payload);
    },
    onSuccess: (listing) => {
      syncOwnerListing(queryClient, listing);
      replaceDraft(mergeOwnerListing({ ...draft, completedStep: 'location' }, listing));
      router.push(sellStepPath('contact'));
    },
    onError: async (error) => {
      if (error instanceof Error && error.message === INCOMPLETE_ERROR) {
        setSubmitError(INCOMPLETE_MESSAGE);
        return;
      }
      if (shouldRefreshOwnerListing(error) && draft.listingId !== null) {
        try {
          const fresh = await fetchMyListing(draft.listingId);
          syncOwnerListing(queryClient, fresh);
          updateDraft({ listingVersion: fresh.version });
        } catch {
          // Keep the original conflict message; a retry surfaces it again.
        }
      }
      setSubmitError(describeSellError(error));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    setSubmitError(null);
    if (Object.keys(validateLocation(draft)).length > 0) return;
    mutation.mutate();
  }

  return (
    <SellStepLayout
      step="location"
      title="موقعیت آگهی"
      description="ولایت و شهر خود را انتخاب کنید تا خریداران نزدیک شما آگهی را پیدا کنند."
    >
      {provincesQuery.isPending ? (
        <div className="space-y-4" aria-hidden>
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-control w-full" />
        </div>
      ) : provincesQuery.isError ? (
        <ErrorState
          requestId={
            provincesQuery.error instanceof ApiError ? provincesQuery.error.requestId : undefined
          }
          description="بارگیری فهرست ولایت‌ها ناموفق بود. دوباره تلاش کنید."
          onRetry={() => void provincesQuery.refetch()}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField id="sell-province" label="ولایت" error={fieldErrors.provinceId}>
            <select
              id="sell-province"
              value={draft.provinceId ?? ''}
              onChange={(event) => {
                const nextId = event.target.value;
                if (nextId.length === 0) {
                  updateDraft({
                    provinceId: null,
                    provinceName: null,
                    cityId: null,
                    cityName: null,
                  });
                  return;
                }
                const province = provinces.find((item) => item.id === nextId) ?? null;
                // A new province always invalidates the previous city.
                updateDraft({
                  provinceId: nextId,
                  provinceName: province?.name ?? null,
                  cityId: null,
                  cityName: null,
                });
              }}
              aria-invalid={fieldErrors.provinceId ? true : undefined}
              aria-describedby={fieldErrors.provinceId ? 'sell-province-error' : undefined}
              className={INPUT_CLASS}
            >
              <option value="">انتخاب ولایت…</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="sell-city" label="شهر" error={fieldErrors.cityId}>
            <select
              id="sell-city"
              value={draft.cityId ?? ''}
              disabled={provinceId === null || citiesQuery.isPending}
              onChange={(event) => {
                const nextId = event.target.value;
                if (nextId.length === 0) {
                  updateDraft({ cityId: null, cityName: null });
                  return;
                }
                const city = cities.find((item) => item.id === nextId) ?? null;
                updateDraft({ cityId: nextId, cityName: city?.name ?? null });
              }}
              aria-invalid={fieldErrors.cityId ? true : undefined}
              aria-describedby={fieldErrors.cityId ? 'sell-city-error' : undefined}
              className={INPUT_CLASS}
            >
              <option value="">
                {provinceId === null
                  ? 'ابتدا ولایت را انتخاب کنید'
                  : citiesQuery.isPending
                    ? 'در حال بارگیری…'
                    : citiesQuery.isError
                      ? 'بارگیری شهرها ناموفق بود'
                      : cities.length === 0
                        ? 'شهری ثبت نشده است'
                        : 'انتخاب شهر…'}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </FormField>

          {citiesQuery.isError && provinceId !== null ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void citiesQuery.refetch()}
            >
              تلاش دوباره برای بارگیری شهرها
            </Button>
          ) : null}

          {submitError ? <FormError>{submitError}</FormError> : null}

          <SellStepActions>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => router.push(sellStepPath('basic'))}
            >
              <ChevronRight aria-hidden />
              بازگشت
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 aria-hidden className="animate-spin" />
                  در حال ذخیره…
                </>
              ) : (
                <>
                  ادامه
                  <ChevronLeft aria-hidden />
                </>
              )}
            </Button>
          </SellStepActions>
        </form>
      )}
    </SellStepLayout>
  );
}
