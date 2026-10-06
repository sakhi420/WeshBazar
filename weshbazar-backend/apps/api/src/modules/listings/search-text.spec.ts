/**
 * Unit tests for the Persian/Dari-safe search text normalization (spec §47).
 *
 * The folding must make the common script inconsistencies indistinguishable
 * while never destroying legitimate user text (lowercasing only affects
 * Latin, the original text is stored separately on the listing).
 */
import { normalizeSearchText } from './search-text';

describe('normalizeSearchText', () => {
  it('lowercases latin text and collapses whitespace', () => {
    expect(normalizeSearchText('  iPhone   13\n\nPro Max ')).toBe('iphone 13 pro max');
  });

  it('folds Arabic yeh variants to Persian yeh', () => {
    expect(normalizeSearchText('كتابي')).toBe(normalizeSearchText('کتابی'));
    expect(normalizeSearchText('مصطفى')).toBe('مصطفی');
  });

  it('folds Arabic kaf and teh marbuta', () => {
    expect(normalizeSearchText('كتاب')).toBe('کتاب');
    expect(normalizeSearchText('مكة')).toBe('مکه');
    expect(normalizeSearchText('\u06C0')).toBe('\u0647');
  });

  it('folds Arabic-Indic and extended Arabic-Indic digits to ASCII', () => {
    expect(normalizeSearchText('١٢٣')).toBe('123');
    expect(normalizeSearchText('۹۹۹')).toBe('999');
    expect(normalizeSearchText('مدل ۱۴')).toBe('مدل 14');
  });

  it('removes zero-width and bidi-control characters', () => {
    expect(normalizeSearchText('می\u200Cروم')).toBe('میروم');
    expect(normalizeSearchText('a\u200Bb\u202Ec')).toBe('abc');
  });

  it('removes harakat and tatweel', () => {
    expect(normalizeSearchText('كَتاب')).toBe('کتاب');
    expect(normalizeSearchText('محـمـد')).toBe('محمد');
  });

  it('applies NFKC so presentation forms fold with the rest', () => {
    expect(normalizeSearchText('\uFB01ne')).toBe('fine'); // ﬁ ligature
  });

  it('is idempotent', () => {
    const input = 'آيفون ١٢ برو';
    const once = normalizeSearchText(input);
    expect(normalizeSearchText(once)).toBe(once);
  });
});
