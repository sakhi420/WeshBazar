/**
 * Unit tests for validation-error flattening used by the global pipe.
 */
import type { ValidationError } from 'class-validator';
import { flattenValidationErrors, toApiFieldErrors } from './validation.pipe';

function error(
  property: string,
  constraints?: Record<string, string>,
  children?: ValidationError[],
): ValidationError {
  return { property, constraints, children };
}

describe('flattenValidationErrors', () => {
  it('flattens top-level constraint failures', () => {
    const result = flattenValidationErrors([
      error('title', {
        isNotEmpty: 'title should not be empty',
        maxLength: 'title must be shorter than 120 characters',
      }),
    ]);

    expect(result).toEqual([
      {
        field: 'title',
        messages: ['title should not be empty', 'title must be shorter than 120 characters'],
      },
    ]);
  });

  it('walks nested children with dotted field paths', () => {
    const result = flattenValidationErrors([
      error('attributes', undefined, [
        error('price', { isPositive: 'price must be positive' }),
        error('location', undefined, [error('cityId', { isUuid: 'cityId must be a UUID' })]),
      ]),
    ]);

    expect(result).toEqual([
      { field: 'attributes.price', messages: ['price must be positive'] },
      { field: 'attributes.location.cityId', messages: ['cityId must be a UUID'] },
    ]);
  });

  it('ignores nodes without constraints or children', () => {
    expect(flattenValidationErrors([error('noise')])).toEqual([]);
    expect(flattenValidationErrors([])).toEqual([]);
  });
});

describe('toApiFieldErrors', () => {
  it('emits the documented array of field/message pairs', () => {
    const result = toApiFieldErrors([
      error('title', {
        isNotEmpty: 'title should not be empty',
        maxLength: 'title must be shorter than 120 characters',
      }),
      error('attributes', undefined, [
        error('price', { isPositive: 'price must be positive' }),
      ]),
    ]);

    expect(result).toEqual([
      { field: 'title', message: 'title should not be empty' },
      { field: 'title', message: 'title must be shorter than 120 characters' },
      { field: 'attributes.price', message: 'price must be positive' },
    ]);
  });
});
