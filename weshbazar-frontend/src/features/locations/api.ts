/**
 * Locations feature — data access (master prompt §38).
 * Provinces/cities change rarely → long revalidate window, shared cache tag.
 */

import { get, serverGet } from '@/lib/api';
import type { City, Province } from './types';

const LOCALE = 'fa-AF';

/** Server Component: active provinces (localized names). */
export function fetchProvincesServer(locale = LOCALE): Promise<Province[]> {
  return serverGet<Province[]>('/locations/provinces', {
    query: { locale },
    revalidate: 3600,
    tags: ['locations'],
  });
}

/** Browser: active provinces (filter pickers). */
export function fetchProvinces(locale = LOCALE): Promise<Province[]> {
  return get<Province[]>('/locations/provinces', { query: { locale } });
}

/** Server Component: active cities of one province (by province id). */
export function fetchCitiesServer(provinceId: string, locale = LOCALE): Promise<City[]> {
  return serverGet<City[]>(
    `/locations/provinces/${encodeURIComponent(provinceId)}/cities`,
    {
      query: { locale },
      revalidate: 3600,
      tags: ['locations'],
    },
  );
}

/** Browser: active cities of one province (cascading picker). */
export function fetchCities(provinceId: string, locale = LOCALE): Promise<City[]> {
  return get<City[]>(`/locations/provinces/${encodeURIComponent(provinceId)}/cities`, {
    query: { locale },
  });
}
