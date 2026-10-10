/**
 * Localization configuration (master prompt §8).
 * Persian/Dari (fa-AF) is the default and only shipped locale for MVP.
 * The architecture keeps ps-AF and en ready to add later without rewrites.
 */

export const DEFAULT_LOCALE = 'fa-AF' as const;
export const DEFAULT_DIR = 'rtl' as const;

export type Locale = 'fa-AF';
export type Direction = 'rtl' | 'ltr';

export interface LocaleConfig {
  readonly code: Locale;
  readonly label: string;
  readonly dir: Direction;
  readonly htmlLang: string;
}

export const locales: Record<Locale, LocaleConfig> = {
  'fa-AF': {
    code: 'fa-AF',
    label: 'دری',
    dir: 'rtl',
    htmlLang: 'fa-AF',
  },
};

export const defaultLocaleConfig: LocaleConfig = locales[DEFAULT_LOCALE];
