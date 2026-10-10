/**
 * Sell wizard validator tests (§36, §37, §39): mirrors of the backend rules —
 * content limits, plain-text only, pricing rules, contact configuration and
 * the dynamic attribute engine.
 */

import type { FilterSchemaField } from '@/features/categories';
import {
  canonicalizeTelegramHandle,
  isValidIsoDate,
  normalizeDigits,
  parsePriceAmount,
  validateAttributeValues,
  validateContactConfig,
  validateDescription,
  validatePhoneOverride,
  validatePriceField,
  validateTelegramHandle,
  validateTitle,
  YEAR_MIN,
  TITLE_MAX_LENGTH,
} from './validation';

function field(
  overrides: Partial<FilterSchemaField> & Pick<FilterSchemaField, 'field' | 'type'>,
): FilterSchemaField {
  return {
    label: overrides.field,
    unit: null,
    placeholder: null,
    required: false,
    filterable: false,
    options: [],
    min: null,
    max: null,
    minLength: null,
    maxLength: null,
    pattern: null,
    operators: [],
    ...overrides,
  };
}

describe('normalizeDigits', () => {
  it('converts Persian and Arabic-Indic digits to ASCII', () => {
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(normalizeDigits('٤٥٦')).toBe('456');
    expect(normalizeDigits('کابل ۱۴۰۳')).toBe('کابل 1403');
  });
});

describe('validateTitle', () => {
  it('accepts a valid Persian title', () => {
    expect(validateTitle('گوشی سامسونگ گلکسی A54')).toBeNull();
  });

  it('rejects short titles with a Persian message', () => {
    expect(validateTitle('گوشی')).toContain('۱۰');
  });

  it('rejects titles over the limit', () => {
    expect(validateTitle('ا'.repeat(TITLE_MAX_LENGTH + 1))).toContain('۱۲۰');
  });

  it('rejects HTML markup', () => {
    expect(validateTitle('<b>گوشی سامسونگ گلکسی</b>')).toContain('HTML');
  });

  it('rejects control characters', () => {
    expect(validateTitle('گوشی موبایل\u0007 سامسونگ')).toContain('کنترلی');
  });
});

describe('validateDescription', () => {
  it('rejects descriptions below 30 chars and accepts 30+', () => {
    expect(validateDescription('توضیح کوتاه')).toContain('۳۰');
    expect(
      validateDescription('این دستگاه کاملاً سالم است و هیچ خط و خش ندارد.'),
    ).toBeNull();
  });

  it('rejects HTML markup', () => {
    expect(validateDescription(`${'متن معتبر کافی برای توضیحات'.repeat(3)}<script>x</script>`)).toContain(
      'HTML',
    );
  });
});

describe('parsePriceAmount / validatePriceField', () => {
  it('parses Persian digits and grouping separators', () => {
    expect(parsePriceAmount('۴۵٬۰۰۰')).toBe(45000);
    expect(parsePriceAmount('45000.50')).toBe(45000.5);
    expect(parsePriceAmount('abc')).toBeNull();
    expect(parsePriceAmount('-5')).toBeNull();
    expect(parsePriceAmount('')).toBeNull();
  });

  it('requires a positive amount for PAID', () => {
    expect(validatePriceField('', 'PAID')).not.toBeNull();
    expect(validatePriceField('۰', 'PAID')).toContain('صفر');
    expect(validatePriceField('۴۵۰۰۰', 'PAID')).toBeNull();
  });

  it('ignores the field for FREE and CONTACT', () => {
    expect(validatePriceField('', 'FREE')).toBeNull();
    expect(validatePriceField('۱۰۰', 'FREE')).toBeNull();
    expect(validatePriceField('', 'CONTACT')).toBeNull();
  });
});

describe('contact rules (§53)', () => {
  it('accepts empty and dialable phone overrides', () => {
    expect(validatePhoneOverride('')).toBeNull();
    expect(validatePhoneOverride('0701234567')).toBeNull();
    expect(validatePhoneOverride('۰۷۰۱۲۳۴۵۶۷')).toBeNull();
    expect(validatePhoneOverride('not-a-number')).not.toBeNull();
    expect(validatePhoneOverride('123')).not.toBeNull();
  });

  it('validates Telegram handles and canonicalizes them', () => {
    expect(validateTelegramHandle('')).not.toBeNull();
    expect(validateTelegramHandle('@weshbazar')).toBeNull();
    expect(validateTelegramHandle('wesh_bazar')).toBeNull();
    expect(validateTelegramHandle('@ab')).not.toBeNull();
    expect(validateTelegramHandle('1abcde')).not.toBeNull();
    expect(canonicalizeTelegramHandle('wesh_bazar')).toBe('@wesh_bazar');
    expect(canonicalizeTelegramHandle('bad handle')).toBeNull();
  });

  it('requires at least one enabled method', () => {
    const errors = validateContactConfig({
      phoneEnabled: false,
      whatsappEnabled: false,
      telegramEnabled: false,
      phoneOverride: '',
      whatsappOverride: '',
      telegramHandle: '',
    });
    expect(errors.contactMethods).toBeDefined();
  });

  it('binds enabled rows to backend-style field keys', () => {
    const errors = validateContactConfig({
      phoneEnabled: true,
      whatsappEnabled: false,
      telegramEnabled: true,
      phoneOverride: 'bad phone',
      whatsappOverride: '',
      telegramHandle: '',
    });
    expect(errors['contactMethods.PHONE']).toBeDefined();
    expect(errors['contactMethods.TELEGRAM']).toBeDefined();
    expect(errors['contactMethods.WHATSAPP']).toBeUndefined();
  });
});

describe('validateAttributeValues (§32, §37)', () => {
  it('enforces required fields with the label in the message', () => {
    const fields = [field({ field: 'brand', type: 'TEXT', label: 'برند', required: true })];
    const errors = validateAttributeValues({}, fields);
    expect(errors.brand).toContain('برند');
    expect(errors.brand).toContain('الزامی');
  });

  it('accepts Persian-digit integers and rejects junk', () => {
    const fields = [field({ field: 'ram', type: 'INTEGER', min: 1, max: 512 })];
    expect(validateAttributeValues({ ram: '۱۲۸' }, fields)).toEqual({});
    expect(validateAttributeValues({ ram: 'abc' }, fields).ram).toBeDefined();
    expect(validateAttributeValues({ ram: '1024' }, fields).ram).toBeDefined();
  });

  it('bounds YEAR attributes between 1900 and next year', () => {
    const fields = [field({ field: 'year', type: 'YEAR' })];
    expect(validateAttributeValues({ year: '1900' }, fields)).toEqual({});
    expect(String(YEAR_MIN)).toBe('1900');
    expect(validateAttributeValues({ year: '1899' }, fields).year).toBeDefined();
    const nextYear = new Date().getFullYear() + 1;
    expect(validateAttributeValues({ year: String(nextYear) }, fields)).toEqual({});
    expect(validateAttributeValues({ year: String(nextYear + 1) }, fields).year).toBeDefined();
  });

  it('checks DECIMAL ranges and BOOLEAN type', () => {
    const fields = [
      field({ field: 'weight', type: 'DECIMAL', min: 0.5, max: 100 }),
      field({ field: 'original', type: 'BOOLEAN' }),
    ];
    expect(validateAttributeValues({ weight: '۱۹.۵' }, fields)).toEqual({});
    expect(validateAttributeValues({ weight: '0.1' }, fields).weight).toBeDefined();
    expect(validateAttributeValues({ original: true }, fields)).toEqual({});
    expect(validateAttributeValues({ original: 'true' }, fields).original).toBeDefined();
  });

  it('validates DATE calendar-safely', () => {
    const fields = [field({ field: 'purchased', type: 'DATE' })];
    expect(validateAttributeValues({ purchased: '2024-02-29' }, fields)).toEqual({});
    expect(validateAttributeValues({ purchased: '2025-02-30' }, fields).purchased).toBeDefined();
    expect(isValidIsoDate('2025-02-30')).toBe(false);
  });

  it('enforces SELECT and MULTI_SELECT option membership', () => {
    const fields = [
      field({
        field: 'color',
        type: 'SELECT',
        options: [{ value: 'black', label: 'مشکی' }],
      }),
      field({
        field: 'tags',
        type: 'MULTI_SELECT',
        options: [
          { value: 'gaming', label: 'گیمینگ' },
          { value: 'office', label: 'اداری' },
        ],
      }),
    ];
    expect(validateAttributeValues({ color: 'black', tags: ['gaming'] }, fields)).toEqual({});
    expect(validateAttributeValues({ color: 'red' }, fields).color).toBeDefined();
    expect(validateAttributeValues({ tags: ['cooking'] }, fields).tags).toBeDefined();
  });

  it('treats empty values as missing and skips optional fields', () => {
    const fields = [
      field({ field: 'note', type: 'TEXT', maxLength: 5 }),
      field({ field: 'tags', type: 'MULTI_SELECT', required: true }),
    ];
    const errors = validateAttributeValues({ note: '' }, fields);
    expect(errors.note).toBeUndefined();
    expect(errors.tags).toBeDefined();
  });

  it('ignores keys that are not part of the schema', () => {
    expect(validateAttributeValues({ ghost: 'x' }, [])).toEqual({});
  });

  it('skips patterns that cannot compile instead of blocking the user', () => {
    const fields = [field({ field: 'code', type: 'TEXT', pattern: '[' })];
    expect(validateAttributeValues({ code: 'anything' }, fields)).toEqual({});
  });
});
