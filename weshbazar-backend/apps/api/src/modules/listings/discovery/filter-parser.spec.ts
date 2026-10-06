/**
 * Unit tests for discovery attribute-filter parsing (spec §34, §49, §79).
 *
 * The parser is the only gate between client expressions and the search
 * provider: it must whitelist keys against the effective category schema,
 * enforce per-type operations, coerce values into the stored shapes, and
 * aggregate every violation — while keeping `in` lists and the per-request
 * filter budget bounded.
 */
import type { EffectiveAttribute } from '../../taxonomy/attribute.types';
import { buildAttributeCriteria, MAX_IN_VALUES } from './filter-parser';

const CATEGORY_ID = '00000000-0000-0000-0000-000000000001';

function attribute(
  overrides: Partial<EffectiveAttribute> & Pick<EffectiveAttribute, 'key' | 'type'>,
): EffectiveAttribute {
  return {
    id: `attr-${overrides.key}`,
    categoryId: CATEGORY_ID,
    label: overrides.key,
    required: false,
    filterable: true,
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

function run(expressions: string[], attributes: EffectiveAttribute[], maxFilters = 8) {
  return buildAttributeCriteria(expressions, attributes, maxFilters);
}

/** All-types schema shared by the coercion and whitelisting tests. */
const SCHEMA: EffectiveAttribute[] = [
  attribute({ key: 'brand', type: 'TEXT' }),
  attribute({ key: 'description', type: 'LONG_TEXT' }),
  attribute({ key: 'ram', type: 'INTEGER' }),
  attribute({ key: 'weight', type: 'DECIMAL' }),
  attribute({ key: 'year', type: 'YEAR' }),
  attribute({ key: 'sealed', type: 'BOOLEAN' }),
  attribute({ key: 'purchased', type: 'DATE' }),
  attribute({ key: 'color', type: 'SELECT' }),
  attribute({ key: 'features', type: 'MULTI_SELECT' }),
];

describe('buildAttributeCriteria', () => {
  it('whitelists and coerces one expression per attribute type', () => {
    const result = run(
      [
        'ram:gte:8',
        'weight:lte:0.19',
        'year:in:2024,2025',
        'sealed:eq:TRUE',
        'purchased:gte:2025-01-31',
        'brand:contains:iPh',
        'description:contains:café',
        'color:in:black,blue',
        'features:contains:gps',
      ],
      SCHEMA,
      9,
    );

    expect(result.issues).toEqual([]);
    expect(result.criteria).toEqual([
      { key: 'ram', operation: 'gte', type: 'INTEGER', values: [8] },
      { key: 'weight', operation: 'lte', type: 'DECIMAL', values: [0.19] },
      { key: 'year', operation: 'in', type: 'YEAR', values: [2024, 2025] },
      { key: 'sealed', operation: 'eq', type: 'BOOLEAN', values: [true] },
      { key: 'purchased', operation: 'gte', type: 'DATE', values: ['2025-01-31'] },
      { key: 'brand', operation: 'contains', type: 'TEXT', values: ['iPh'] },
      { key: 'description', operation: 'contains', type: 'LONG_TEXT', values: ['café'] },
      { key: 'color', operation: 'in', type: 'SELECT', values: ['black', 'blue'] },
      { key: 'features', operation: 'contains', type: 'MULTI_SELECT', values: ['gps'] },
    ]);
  });

  it('rejects operations that are not allowed for the attribute type', () => {
    const result = run(
      [
        'brand:gte:x',
        'description:eq:x',
        'sealed:contains:x',
        'ram:contains:8',
        'purchased:in:2024-01-01',
      ],
      SCHEMA,
    );

    expect(result.criteria).toEqual([]);
    expect(result.issues.map((issue) => issue.message)).toEqual([
      'Operator "gte" is not allowed for attribute "brand".',
      'Operator "eq" is not allowed for attribute "description".',
      'Operator "contains" is not allowed for attribute "sealed".',
      'Operator "contains" is not allowed for attribute "ram".',
      'Operator "in" is not allowed for attribute "purchased".',
    ]);
  });

  it('reports values that do not coerce to the attribute type', () => {
    const result = run(
      [
        'ram:eq:4.5',
        'ram:eq:abc',
        'weight:eq:heavy',
        'sealed:eq:maybe',
        'purchased:gte:2025-1-31',
        'purchased:gte:2025-02-30',
        'purchased:gte:2025-13-01',
      ],
      SCHEMA,
    );

    expect(result.criteria).toEqual([]);
    expect(result.issues.map((issue) => issue.message)).toEqual([
      '"4.5" is not a whole number.',
      '"abc" is not a whole number.',
      '"heavy" is not a number.',
      '"maybe" is not a boolean (use true or false).',
      '"2025-1-31" is not a date (expected YYYY-MM-DD).',
      '"2025-02-30" is not a date (expected YYYY-MM-DD).',
      '"2025-13-01" is not a date (expected YYYY-MM-DD).',
    ]);
  });

  it('rejects malformed expressions with the expected shape messages', () => {
    const result = run(['ram', 'Ram:eq:1', 'ram:matches:8', 'ram:gte:', 'ram:gte:   '], SCHEMA);

    expect(result.criteria).toEqual([]);
    expect(result.issues.map((issue) => issue.message)).toEqual([
      'Filters use the form key:operator:value.',
      '"Ram" is not a valid attribute key.',
      'Operator "matches" is not supported (eq, contains, gte, lte, in).',
      'The filter value is empty.',
      'The filter value is empty.',
    ]);
  });

  it('keeps colons inside the value (contains with times)', () => {
    const result = run(['description:contains:10:30'], SCHEMA);

    expect(result.issues).toEqual([]);
    expect(result.criteria).toEqual([
      { key: 'description', operation: 'contains', type: 'LONG_TEXT', values: ['10:30'] },
    ]);
  });

  it('splits, trims and dedupes "in" lists', () => {
    const result = run(['color:in:black, blue ,black,,red'], SCHEMA);

    expect(result.issues).toEqual([]);
    expect(result.criteria[0]?.values).toEqual(['black', 'blue', 'red']);
  });

  it('requires at least one value for "in"', () => {
    const result = run(['color:in:,,'], SCHEMA);

    expect(result.criteria).toEqual([]);
    expect(result.issues[0]?.message).toBe('Operator "in" requires at least one value.');
  });

  it('bounds "in" lists after deduplication', () => {
    const distinct = Array.from({ length: MAX_IN_VALUES }, (_value, index) => `v${index}`);
    const accepted = run([`color:in:${[...distinct, ...distinct].join(',')}`], SCHEMA);
    expect(accepted.issues).toEqual([]);
    expect(accepted.criteria[0]?.values).toHaveLength(MAX_IN_VALUES);

    const overflow = run([`color:in:${[...distinct, 'extra'].join(',')}`], SCHEMA);
    expect(overflow.criteria).toEqual([]);
    expect(overflow.issues[0]?.message).toBe(
      `Operator "in" accepts at most ${MAX_IN_VALUES} values.`,
    );
  });

  it('rejects unknown, inactive and non-filterable attribute keys', () => {
    const result = run(
      ['camera:eq:x', 'legacy:eq:x', 'notes:eq:x'],
      [
        ...SCHEMA,
        attribute({ key: 'legacy', type: 'TEXT', isActive: false }),
        attribute({ key: 'notes', type: 'TEXT', filterable: false }),
      ],
    );

    expect(result.criteria).toEqual([]);
    expect(result.issues.map((issue) => issue.message)).toEqual([
      '"camera" is not an attribute of the selected category.',
      'Attribute "legacy" is no longer available for filtering.',
      'Attribute "notes" cannot be used as a filter.',
    ]);
  });

  it('aggregates violations while keeping the valid expressions', () => {
    const result = run([' bogus:eq:x ', 'ram:gte:8', 'ram:matches:8'], SCHEMA);

    expect(result.criteria).toEqual([
      { key: 'ram', operation: 'gte', type: 'INTEGER', values: [8] },
    ]);
    expect(result.issues).toEqual([
      {
        expression: 'bogus:eq:x',
        message: '"bogus" is not an attribute of the selected category.',
      },
      {
        expression: 'ram:matches:8',
        message: 'Operator "matches" is not supported (eq, contains, gte, lte, in).',
      },
    ]);
  });

  it('treats exact duplicates as idempotent regardless of surrounding whitespace', () => {
    const result = run(['ram:gte:8', '  ram:gte:8  ', 'ram:gte:8'], SCHEMA);

    expect(result.issues).toEqual([]);
    expect(result.criteria).toEqual([
      { key: 'ram', operation: 'gte', type: 'INTEGER', values: [8] },
    ]);
  });

  it('keeps different operations on the same key as distinct criteria', () => {
    const result = run(['ram:gte:8', 'ram:lte:16'], SCHEMA);

    expect(result.issues).toEqual([]);
    expect(result.criteria.map((criterion) => criterion.operation)).toEqual(['gte', 'lte']);
  });

  it('enforces the filter budget on accepted criteria only', () => {
    const result = run(['bogus:eq:x', 'ram:gte:8', 'year:gte:2020'], SCHEMA, 1);

    expect(result.criteria).toEqual([
      { key: 'ram', operation: 'gte', type: 'INTEGER', values: [8] },
    ]);
    expect(result.issues.map((issue) => issue.message)).toEqual([
      '"bogus" is not an attribute of the selected category.',
      'At most 1 attribute filters are allowed per request.',
    ]);
  });

  it('does not charge duplicates against a full budget', () => {
    const result = run(['ram:gte:8', 'year:gte:2020', 'ram:gte:8'], SCHEMA, 1);

    expect(result.criteria).toEqual([
      { key: 'ram', operation: 'gte', type: 'INTEGER', values: [8] },
    ]);
    expect(result.issues.map((issue) => issue.message)).toEqual([
      'At most 1 attribute filters are allowed per request.',
    ]);
  });

  it('returns empty results for no expressions', () => {
    expect(run([], SCHEMA)).toEqual({ criteria: [], issues: [] });
  });
});
