import { isValidSlugFormat, slugSuffix, slugify } from './slug.utils';

describe('slugify', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('Ahmad Wesh')).toBe('ahmad-wesh');
  });

  it('collapses punctuation and repeated separators', () => {
    expect(slugify('  Kabul  Electronics -- Store!! ')).toBe('kabul-electronics-store');
  });

  it('strips diacritics', () => {
    expect(slugify('André Café')).toBe('andre-cafe');
  });

  it('returns an empty string for non-latin input', () => {
    expect(slugify('احمد ویش')).toBe('');
  });

  it('truncates to a safe base length without trailing hyphens', () => {
    const slug = slugify(`${'a'.repeat(119)} tail`);
    expect(slug.length).toBeLessThanOrEqual(120);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('isValidSlugFormat', () => {
  it('accepts lowercase alphanumeric slugs with single hyphens', () => {
    expect(isValidSlugFormat('ahmad-wesh')).toBe(true);
    expect(isValidSlugFormat('seller-1a2b3c')).toBe(true);
  });

  it('rejects invalid shapes', () => {
    expect(isValidSlugFormat('Ahmad-Wesh')).toBe(false);
    expect(isValidSlugFormat('-lead')).toBe(false);
    expect(isValidSlugFormat('trail-')).toBe(false);
    expect(isValidSlugFormat('double--hyphen')).toBe(false);
    expect(isValidSlugFormat('a')).toBe(false);
    expect(isValidSlugFormat('with space')).toBe(false);
    expect(isValidSlugFormat('x'.repeat(141))).toBe(false);
  });
});

describe('slugSuffix', () => {
  it('produces hex strings of the requested byte length', () => {
    expect(slugSuffix()).toMatch(/^[0-9a-f]{6}$/);
    expect(slugSuffix(2)).toMatch(/^[0-9a-f]{4}$/);
  });
});
