import type { EffectiveAttribute } from './attribute.types';
import { validateAttributeValues } from './attribute-validation';

const CATEGORY_ID = '00000000-0000-0000-0000-000000000001';
const NOW = new Date('2026-10-04T12:00:00.000Z');

function attribute(
  overrides: Partial<EffectiveAttribute> & Pick<EffectiveAttribute, 'key' | 'type'>,
): EffectiveAttribute {
  return {
    id: `attr-${overrides.key}`,
    categoryId: CATEGORY_ID,
    label: overrides.key,
    required: false,
    filterable: false,
    searchable: false,
    unit: null,
    placeholder: null,
    minValue: null,
    maxValue: null,
    minLength: null,
    maxLength: null,
    pattern: null,
    sortOrder: 0,
    isActive: true,
    options: [],
    ...overrides,
  };
}

function run(effective: EffectiveAttribute[], payload: Record<string, unknown>) {
  return validateAttributeValues(effective, payload, NOW);
}

describe('validateAttributeValues', () => {
  it('normalizes a fully valid payload', () => {
    const result = run(
      [
        attribute({ key: 'brand', type: 'TEXT' }),
        attribute({ key: 'ram', type: 'INTEGER', minValue: 1, maxValue: 128 }),
        attribute({ key: 'weight', type: 'DECIMAL' }),
        attribute({ key: 'year', type: 'YEAR' }),
        attribute({ key: 'sealed', type: 'BOOLEAN' }),
        attribute({ key: 'purchased_on', type: 'DATE' }),
        attribute({
          key: 'color',
          type: 'SELECT',
          options: [{ value: 'black', label: 'Black', isActive: true, sortOrder: 0 }],
        }),
        attribute({
          key: 'features',
          type: 'MULTI_SELECT',
          options: [
            { value: 'gps', label: 'GPS', isActive: true, sortOrder: 0 },
            { value: 'nfc', label: 'NFC', isActive: true, sortOrder: 1 },
          ],
        }),
      ],
      {
        brand: '  Samsung  ',
        ram: 8,
        weight: 0.19,
        year: 2025,
        sealed: true,
        purchased_on: '2026-01-31',
        color: 'black',
        features: ['gps', 'nfc', 'gps'],
      },
    );

    expect(result.issues).toEqual([]);
    expect(result.normalized).toEqual({
      brand: 'Samsung',
      ram: 8,
      weight: 0.19,
      year: 2025,
      sealed: true,
      purchased_on: '2026-01-31',
      color: 'black',
      features: ['gps', 'nfc'],
    });
  });

  it('reports an unknown key', () => {
    const result = run([attribute({ key: 'brand', type: 'TEXT' })], { colour: 'red' });
    expect(result.issues).toEqual([
      {
        field: 'colour',
        rule: 'UNKNOWN_KEY',
        message: 'Unknown attribute "colour" for this category.',
      },
    ]);
    expect(result.normalized).toEqual({});
  });

  it('rejects values for inactive (retired) attributes', () => {
    const result = run([attribute({ key: 'warranty', type: 'TEXT', isActive: false })], {
      warranty: '12 months',
    });
    expect(result.issues[0]?.rule).toBe('INACTIVE_ATTRIBUTE');
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['empty string', ''],
    ['whitespace-only string', '   '],
  ])('reports a required attribute that is %s', (_label, raw) => {
    const payload: Record<string, unknown> = {};
    if (raw !== undefined) {
      payload.brand = raw;
    }
    const result = run([attribute({ key: 'brand', type: 'TEXT', required: true })], payload);
    expect(result.issues).toEqual([
      { field: 'brand', rule: 'REQUIRED', message: 'The attribute "brand" is required.' },
    ]);
  });

  it('reports a required multi-select attribute that is an empty array', () => {
    const result = run([attribute({ key: 'features', type: 'MULTI_SELECT', required: true })], {
      features: [],
    });
    expect(result.issues).toEqual([
      { field: 'features', rule: 'REQUIRED', message: 'The attribute "features" is required.' },
    ]);
  });

  it('does not double-report a required attribute that already failed validation', () => {
    const result = run([attribute({ key: 'ram', type: 'INTEGER', required: true })], {
      ram: 'eight',
    });
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.rule).toBe('TYPE');
  });

  it('validates TEXT length constraints and trims before measuring', () => {
    const effective = [attribute({ key: 'model', type: 'TEXT', minLength: 2, maxLength: 5 })];
    expect(run(effective, { model: 'ab' }).issues).toEqual([]);
    expect(run(effective, { model: '  a  ' }).issues[0]?.rule).toBe('LENGTH');
    expect(run(effective, { model: 'abcdef' }).issues[0]?.rule).toBe('LENGTH');
  });

  it('validates TEXT patterns and fails closed on invalid stored patterns', () => {
    expect(
      run([attribute({ key: 'code', type: 'TEXT', pattern: '^A-\\d{3}$' })], { code: 'A-123' })
        .issues,
    ).toEqual([]);
    expect(
      run([attribute({ key: 'code', type: 'TEXT', pattern: '^A-\\d{3}$' })], { code: 'B-123' })
        .issues[0]?.rule,
    ).toBe('PATTERN');
    expect(
      run([attribute({ key: 'code', type: 'TEXT', pattern: '([unclosed' })], { code: 'anything' })
        .issues[0]?.rule,
    ).toBe('PATTERN');
  });

  it('rejects non-integer and non-number values for INTEGER', () => {
    const effective = [attribute({ key: 'ram', type: 'INTEGER' })];
    expect(run(effective, { ram: 8 }).issues).toEqual([]);
    expect(run(effective, { ram: 8.5 }).issues[0]?.rule).toBe('TYPE');
    expect(run(effective, { ram: '8' }).issues[0]?.rule).toBe('TYPE');
    expect(run(effective, { ram: Number.NaN }).issues[0]?.rule).toBe('TYPE');
  });

  it('enforces INTEGER/DECIMAL ranges', () => {
    const integer = [attribute({ key: 'ram', type: 'INTEGER', minValue: 1, maxValue: 128 })];
    expect(run(integer, { ram: 0 }).issues[0]?.rule).toBe('RANGE');
    expect(run(integer, { ram: 129 }).issues[0]?.rule).toBe('RANGE');
    expect(run(integer, { ram: 128 }).issues).toEqual([]);

    const decimal = [attribute({ key: 'weight', type: 'DECIMAL', minValue: 0.1, maxValue: 5 })];
    expect(run(decimal, { weight: 0.05 }).issues[0]?.rule).toBe('RANGE');
    expect(run(decimal, { weight: 5.5 }).issues[0]?.rule).toBe('RANGE');
    expect(run(decimal, { weight: 2.75 }).issues).toEqual([]);
    expect(run(decimal, { weight: Number.POSITIVE_INFINITY }).issues[0]?.rule).toBe('TYPE');
  });

  it('bounds YEAR between 1900 and next year', () => {
    const effective = [attribute({ key: 'year', type: 'YEAR' })];
    expect(run(effective, { year: 2027 }).issues).toEqual([]);
    expect(run(effective, { year: 2028 }).issues[0]?.rule).toBe('RANGE');
    expect(run(effective, { year: 1899 }).issues[0]?.rule).toBe('RANGE');
    expect(run(effective, { year: 2025.5 }).issues[0]?.rule).toBe('TYPE');
  });

  it('accepts only valid calendar dates for DATE', () => {
    const effective = [attribute({ key: 'purchased_on', type: 'DATE' })];
    expect(run(effective, { purchased_on: '2024-02-29' }).issues).toEqual([]);
    expect(run(effective, { purchased_on: '2026-02-29' }).issues[0]?.rule).toBe('TYPE');
    expect(run(effective, { purchased_on: '2026-13-01' }).issues[0]?.rule).toBe('TYPE');
    expect(run(effective, { purchased_on: '04/10/2026' }).issues[0]?.rule).toBe('TYPE');
  });

  it('requires real booleans for BOOLEAN', () => {
    const effective = [attribute({ key: 'sealed', type: 'BOOLEAN' })];
    expect(run(effective, { sealed: false }).issues).toEqual([]);
    expect(run(effective, { sealed: 'true' }).issues[0]?.rule).toBe('TYPE');
    expect(run(effective, { sealed: 1 }).issues[0]?.rule).toBe('TYPE');
  });

  it('validates SELECT against active options only', () => {
    const effective = [
      attribute({
        key: 'color',
        type: 'SELECT',
        options: [
          { value: 'black', label: 'Black', isActive: true, sortOrder: 0 },
          { value: 'gold', label: 'Gold', isActive: false, sortOrder: 1 },
        ],
      }),
    ];
    expect(run(effective, { color: 'black' }).issues).toEqual([]);
    expect(run(effective, { color: 'red' }).issues[0]?.rule).toBe('INVALID_OPTION');
    expect(run(effective, { color: 'gold' }).issues[0]?.rule).toBe('INACTIVE_OPTION');
    expect(run(effective, { color: 7 }).issues[0]?.rule).toBe('TYPE');
  });

  it('validates MULTI_SELECT lists, deduplicates, and rejects bad elements', () => {
    const effective = [
      attribute({
        key: 'features',
        type: 'MULTI_SELECT',
        options: [
          { value: 'gps', label: 'GPS', isActive: true, sortOrder: 0 },
          { value: 'nfc', label: 'NFC', isActive: true, sortOrder: 1 },
          { value: 'ir', label: 'IR', isActive: false, sortOrder: 2 },
        ],
      }),
    ];
    expect(run(effective, { features: ['nfc', 'gps', 'nfc'] }).normalized).toEqual({
      features: ['nfc', 'gps'],
    });
    expect(run(effective, { features: 'gps' }).issues[0]?.rule).toBe('TYPE');
    expect(run(effective, { features: ['gps', 3] }).issues[0]?.rule).toBe('TYPE');
    expect(run(effective, { features: ['gps', 'camera'] }).issues[0]?.rule).toBe('INVALID_OPTION');
    expect(run(effective, { features: ['ir'] }).issues[0]?.rule).toBe('INACTIVE_OPTION');
  });

  it('aggregates multiple issues and omits failed keys from the normalized result', () => {
    const effective = [
      attribute({ key: 'ram', type: 'INTEGER', required: true }),
      attribute({ key: 'brand', type: 'TEXT', maxLength: 3 }),
    ];
    const result = run(effective, { ram: 'lots', brand: 'Samsung', mystery: true });
    expect(result.issues.map((issue) => [issue.field, issue.rule])).toEqual([
      ['ram', 'TYPE'],
      ['brand', 'LENGTH'],
      ['mystery', 'UNKNOWN_KEY'],
    ]);
    expect(result.normalized).toEqual({});
  });
});
