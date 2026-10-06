/**
 * Shared types for seed datasets.
 *
 * All user-facing seed content carries names in the three locales the
 * marketplace supports: `en` (English), `fa` (Dari) and `ps` (Pashto).
 */

export interface LocaleNames {
  en: string;
  fa: string;
  ps: string;
}

export interface CitySeed {
  slug: string;
  names: LocaleNames;
}

export interface ProvinceSeed {
  /** ISO 3166-2:AF code, e.g. "AF-KAB". */
  code: string;
  slug: string;
  names: LocaleNames;
  cities: CitySeed[];
}

export type SeedAttributeType =
  | 'TEXT'
  | 'LONG_TEXT'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'YEAR'
  | 'DATE';

export interface AttributeOptionSeed {
  value: string;
  label: string;
}

export interface AttributeSeed {
  key: string;
  label: string;
  type: SeedAttributeType;
  required?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  unit?: string;
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  options?: AttributeOptionSeed[];
}

export interface CategorySeed {
  slug: string;
  iconKey?: string;
  names: LocaleNames;
  attributes?: AttributeSeed[];
  children?: CategorySeed[];
}
