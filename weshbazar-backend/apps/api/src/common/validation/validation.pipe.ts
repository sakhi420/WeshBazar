/**
 * Global validation pipe factory.
 *
 * DTOs are validated with class-validator/class-transformer; unknown fields are
 * rejected (`forbidNonWhitelisted`), values are transformed to DTO instances,
 * and the failure shape is normalized into a `VALIDATION_ERROR` AppException
 * whose `details` is the API v1 array of `{ field, message }` entries.
 */
import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { AppException } from '../errors/app.exception';
import { toApiFieldErrors, type FieldValidationIssue } from './field-issues';

export type { FieldValidationIssue } from './field-issues';

export function flattenValidationErrors(
  errors: readonly ValidationError[],
  parentPath = '',
): FieldValidationIssue[] {
  const issues: FieldValidationIssue[] = [];
  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    if (error.constraints && Object.keys(error.constraints).length > 0) {
      issues.push({ field: path, messages: Object.values(error.constraints) });
    }
    if (error.children && error.children.length > 0) {
      issues.push(...flattenValidationErrors(error.children, path));
    }
  }
  return issues;
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    stopAtFirstError: false,
    validationError: { target: false, value: false },
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (errors: ValidationError[]) =>
      new AppException('VALIDATION_ERROR', {
        details: toApiFieldErrors(flattenValidationErrors(errors)),
      }),
  });
}
