import { ApiError } from './errors';

function validationError(details: unknown): ApiError {
  return new ApiError({
    code: 'VALIDATION_ERROR',
    message: 'Invalid request',
    status: 400,
    details,
  });
}

describe('ApiError.fieldErrors', () => {
  it('reads the frozen API v1 { field, message } array', () => {
    const error = validationError([
      { field: 'phone', message: 'شمارهٔ تلفن الزامی است.' },
      { field: 'password', message: 'رمز عبور کوتاه است.' },
    ]);

    expect(error.fieldErrors).toEqual([
      { field: 'phone', message: 'شمارهٔ تلفن الزامی است.' },
      { field: 'password', message: 'رمز عبور کوتاه است.' },
    ]);
  });

  it('supports the previous nested backend shape during staggered deployments', () => {
    const error = validationError({
      errors: [
        { field: 'phone', messages: ['شماره الزامی است', 'شماره معتبر نیست'] },
        { field: 'password', messages: ['رمز عبور کوتاه است'] },
      ],
    });

    expect(error.fieldErrors).toEqual([
      { field: 'phone', message: 'شماره الزامی است' },
      { field: 'phone', message: 'شماره معتبر نیست' },
      { field: 'password', message: 'رمز عبور کوتاه است' },
    ]);
  });

  it('ignores non-field business details instead of throwing', () => {
    const error = validationError({ attemptsRemaining: 4, retryAfterSeconds: 60 });

    expect(error.fieldErrors).toEqual([]);
  });

  it('ignores malformed entries in an otherwise valid array', () => {
    const error = validationError([
      { field: 'phone', message: 'شماره الزامی است' },
      null,
      { field: 42, message: 'invalid field' },
      { field: 'password', messages: [null, 'رمز عبور کوتاه است'] },
    ]);

    expect(error.fieldErrors).toEqual([
      { field: 'phone', message: 'شماره الزامی است' },
      { field: 'password', message: 'رمز عبور کوتاه است' },
    ]);
  });
});
