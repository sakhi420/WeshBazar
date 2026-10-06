import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  pickTranslation,
  resolveLocale,
} from './locale.utils';

describe('normalizeLocale', () => {
  it('accepts the supported primary subtags as-is', () => {
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('fa')).toBe('fa');
    expect(normalizeLocale('ps')).toBe('ps');
  });

  it('normalizes BCP-47 regional forms to the stored subtag', () => {
    expect(normalizeLocale('fa-AF')).toBe('fa');
    expect(normalizeLocale('ps_AF')).toBe('ps');
    expect(normalizeLocale('EN-us')).toBe('en');
    expect(normalizeLocale('fa-Arab-AF')).toBe('fa');
  });

  it('trims whitespace before normalizing', () => {
    expect(normalizeLocale('  fa-AF  ')).toBe('fa');
  });

  it('rejects unsupported or non-string input', () => {
    expect(normalizeLocale('ur')).toBeNull();
    expect(normalizeLocale('de-DE')).toBeNull();
    expect(normalizeLocale('')).toBeNull();
    expect(normalizeLocale('  ')).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
    expect(normalizeLocale(undefined)).toBeNull();
    expect(normalizeLocale(42)).toBeNull();
  });
});

describe('resolveLocale', () => {
  it('returns the normalized locale when supported', () => {
    expect(resolveLocale('fa-AF')).toBe('fa');
    expect(resolveLocale('ps')).toBe('ps');
  });

  it('falls back to the default locale for unknown input', () => {
    expect(resolveLocale('de-DE')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
  });
});

describe('pickTranslation', () => {
  const rows = [
    { locale: 'en', name: 'Mobile Phones' },
    { locale: 'fa', name: 'موبایل' },
  ];

  it('prefers the requested locale', () => {
    expect(pickTranslation(rows, 'fa')?.name).toBe('موبایل');
  });

  it('falls back to English when the requested locale is missing', () => {
    expect(pickTranslation(rows, 'ps')?.name).toBe('Mobile Phones');
  });

  it('falls back to the first row when English is missing', () => {
    expect(pickTranslation([{ locale: 'ps', name: 'موبایل' }], 'fa')?.name).toBe('موبایل');
  });

  it('returns undefined for an empty list', () => {
    expect(pickTranslation([], 'en')).toBeUndefined();
  });
});

describe('SUPPORTED_LOCALES', () => {
  it('exposes exactly the three marketplace locales', () => {
    expect([...SUPPORTED_LOCALES]).toEqual(['en', 'fa', 'ps']);
  });
});
