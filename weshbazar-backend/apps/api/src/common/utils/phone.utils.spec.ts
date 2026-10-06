import { maskPhone, normalizePhone } from './phone.utils';

describe('normalizePhone', () => {
  it('normalizes Afghan national format to E.164', () => {
    expect(normalizePhone('0701234567')).toBe('+93701234567');
  });

  it('normalizes international formats with spaces', () => {
    expect(normalizePhone('+93 70 123 4567')).toBe('+93701234567');
    expect(normalizePhone('0093 701234567')).toBe('+93701234567');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizePhone(' 0701234567 ')).toBe('+93701234567');
  });

  it('rejects invalid numbers', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('not-a-phone')).toBeNull();
    expect(normalizePhone('')).toBeNull();
  });
});

describe('maskPhone', () => {
  it('masks the middle digits of an E.164 number', () => {
    expect(maskPhone('+93701234567')).toBe('+93*****4567');
  });

  it('returns short values unchanged', () => {
    expect(maskPhone('+93701')).toBe('+93701');
  });
});
