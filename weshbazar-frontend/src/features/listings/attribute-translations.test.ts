/**
 * Attribute localization dictionary — the single source of Dari for the
 * registration form and the listing specification table. Unknown keys/values/
 * units must pass through unchanged so future backend data never crashes or
 * mangles the UI.
 */

import {
  translateAttributeLabel,
  translateAttributeUnit,
  translateAttributeValue,
} from './attribute-translations';

describe('translateAttributeLabel', () => {
  it('maps stable slugs to Dari', () => {
    expect(translateAttributeLabel('property_type', 'Property type')).toBe('نوع جایداد');
    expect(translateAttributeLabel('make', 'Make')).toBe('شرکت سازنده');
    expect(translateAttributeLabel('color', 'Color')).toBe('رنگ');
  });

  it('falls back to the English label, then the slug', () => {
    expect(translateAttributeLabel('future_key', 'Future label')).toBe('Future label');
    expect(translateAttributeLabel('future_key')).toBe('future_key');
  });
});

describe('translateAttributeValue', () => {
  it('translates SELECT slugs and passes free text through', () => {
    expect(translateAttributeValue('house', 'SELECT')).toBe('حویلی / خانه');
    expect(translateAttributeValue('sedan', 'SELECT')).toBe('سدان');
    expect(translateAttributeValue('Toyota', 'TEXT')).toBe('Toyota');
  });

  it('always maps boolean-ish yes/no', () => {
    expect(translateAttributeValue('yes', 'SELECT')).toBe('بله');
    expect(translateAttributeValue('no', 'SELECT')).toBe('نخیر');
  });
});

describe('translateAttributeUnit', () => {
  it('maps known units and passes symbols through', () => {
    expect(translateAttributeUnit('km')).toBe('کیلومتر');
    expect(translateAttributeUnit('inch')).toBe('اینچ');
    expect(translateAttributeUnit('years')).toBe('سال');
    expect(translateAttributeUnit('%')).toBe('%');
  });

  it('returns empty for null/blank', () => {
    expect(translateAttributeUnit(null)).toBe('');
    expect(translateAttributeUnit('  ')).toBe('');
  });
});