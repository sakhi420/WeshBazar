/**
 * Presenters for the public and admin location APIs (spec §36).
 */
import type {
  City,
  CityTranslation,
  Province,
  ProvinceTranslation,
} from '../../generated/prisma/client';
import { pickTranslation, type Locale } from '../utils/locale.utils';

export type ProvinceWithTranslations = Province & { translations: ProvinceTranslation[] };
export type CityWithTranslations = City & { translations: CityTranslation[] };

export interface PublicProvinceSummary {
  id: string;
  code: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface PublicCitySummary {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface AdminProvince {
  id: string;
  code: string;
  slug: string;
  status: Province['status'];
  sortOrder: number;
  name: string;
  translations: Array<{ locale: string; name: string }>;
  cityCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCity {
  id: string;
  provinceId: string;
  slug: string;
  status: City['status'];
  sortOrder: number;
  name: string;
  translations: Array<{ locale: string; name: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicProvince(
  row: ProvinceWithTranslations,
  locale: Locale,
): PublicProvinceSummary {
  const translation = pickTranslation(row.translations, locale);
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: translation?.name ?? row.slug,
    sortOrder: row.sortOrder,
  };
}

export function toPublicCity(row: CityWithTranslations, locale: Locale): PublicCitySummary {
  const translation = pickTranslation(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    name: translation?.name ?? row.slug,
    sortOrder: row.sortOrder,
  };
}

export function toAdminProvince(
  row: ProvinceWithTranslations,
  locale: Locale,
  cityCount: number,
): AdminProvince {
  const translation = pickTranslation(row.translations, locale);
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    status: row.status,
    sortOrder: row.sortOrder,
    name: translation?.name ?? row.slug,
    translations: [...row.translations]
      .sort((a, b) => a.locale.localeCompare(b.locale))
      .map((item) => ({ locale: item.locale, name: item.name })),
    cityCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAdminCity(row: CityWithTranslations, locale: Locale): AdminCity {
  const translation = pickTranslation(row.translations, locale);
  return {
    id: row.id,
    provinceId: row.provinceId,
    slug: row.slug,
    status: row.status,
    sortOrder: row.sortOrder,
    name: translation?.name ?? row.slug,
    translations: [...row.translations]
      .sort((a, b) => a.locale.localeCompare(b.locale))
      .map((item) => ({ locale: item.locale, name: item.name })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
