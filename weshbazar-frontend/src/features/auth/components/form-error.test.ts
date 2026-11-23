import { ApiError, ApiErrorCode } from '@/lib/api';
import { bindFieldErrors } from './form-error';

describe('bindFieldErrors', () => {
  it('binds API field errors and keeps multiple messages for the same field', () => {
    const error = new ApiError({
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'The request payload contains invalid fields.',
      status: 400,
      details: [
        { field: 'title', message: 'Title is required.' },
        { field: 'title', message: 'Title is too long.' },
        { field: 'attributes.price', message: 'Price must be positive.' },
      ],
    });

    expect(bindFieldErrors(error)).toEqual({
      title: 'Title is required.؛ Title is too long.',
      'attributes.price': 'Price must be positive.',
    });
  });

  it('returns an empty record for non-validation errors', () => {
    const error = new ApiError({
      code: ApiErrorCode.FORBIDDEN,
      message: 'Forbidden.',
      status: 403,
    });

    expect(bindFieldErrors(error)).toEqual({});
    expect(bindFieldErrors(new Error('offline'))).toEqual({});
  });
});
