import {
  ATTRIBUTE_FILTER_OPERATORS,
  isOperationAllowed,
  operationsFor,
} from './attribute-operations';

describe('ATTRIBUTE_FILTER_OPERATORS', () => {
  it('matches the spec §34 operation table', () => {
    expect(ATTRIBUTE_FILTER_OPERATORS.TEXT).toEqual(['eq', 'contains']);
    expect(ATTRIBUTE_FILTER_OPERATORS.LONG_TEXT).toEqual(['contains']);
    expect(ATTRIBUTE_FILTER_OPERATORS.INTEGER).toEqual(['eq', 'gte', 'lte', 'in']);
    expect(ATTRIBUTE_FILTER_OPERATORS.DECIMAL).toEqual(['eq', 'gte', 'lte', 'in']);
    expect(ATTRIBUTE_FILTER_OPERATORS.YEAR).toEqual(['eq', 'gte', 'lte', 'in']);
    expect(ATTRIBUTE_FILTER_OPERATORS.BOOLEAN).toEqual(['eq']);
    expect(ATTRIBUTE_FILTER_OPERATORS.SELECT).toEqual(['eq', 'in']);
    expect(ATTRIBUTE_FILTER_OPERATORS.MULTI_SELECT).toEqual(['contains', 'in']);
    expect(ATTRIBUTE_FILTER_OPERATORS.DATE).toEqual(['eq', 'gte', 'lte']);
  });

  it('defines at least one operation for every attribute type', () => {
    for (const operations of Object.values(ATTRIBUTE_FILTER_OPERATORS)) {
      expect(operations.length).toBeGreaterThan(0);
    }
  });
});

describe('operationsFor', () => {
  it('returns a defensive copy per call', () => {
    const first = operationsFor('TEXT');
    first.push('injected');
    expect(operationsFor('TEXT')).toEqual(['eq', 'contains']);
  });
});

describe('isOperationAllowed', () => {
  it('allows whitelisted operations per type', () => {
    expect(isOperationAllowed('TEXT', 'contains')).toBe(true);
    expect(isOperationAllowed('INTEGER', 'gte')).toBe(true);
    expect(isOperationAllowed('SELECT', 'in')).toBe(true);
    expect(isOperationAllowed('MULTI_SELECT', 'contains')).toBe(true);
  });

  it('rejects operations that are not in the type table', () => {
    expect(isOperationAllowed('TEXT', 'gte')).toBe(false);
    expect(isOperationAllowed('LONG_TEXT', 'eq')).toBe(false);
    expect(isOperationAllowed('BOOLEAN', 'contains')).toBe(false);
    expect(isOperationAllowed('SELECT', 'contains')).toBe(false);
    expect(isOperationAllowed('DATE', 'in')).toBe(false);
  });

  it('rejects arbitrary/unknown operations', () => {
    expect(isOperationAllowed('TEXT', 'drop-table')).toBe(false);
    expect(isOperationAllowed('INTEGER', '')).toBe(false);
  });
});
