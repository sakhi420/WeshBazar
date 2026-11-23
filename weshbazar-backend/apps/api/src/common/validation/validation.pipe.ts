/**
 * Global validation pipe factory.
 *
 * DTOs are validated with class-validator/class-transformer; unknown fields are
 * rejected (`forbidNonWhitelisted`), values are transformed to DTO instances,
 * and the failure shape is normalized into a `VALIDATION_ERROR` AppException
 * whose `details` is the API-contract array of `{ field, message }` entries.
 */
import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { AppException } from '../errors/app.exception';

export interface FieldValidationIssue {
  field: string;
  messages: string[];
}

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

/**
 * Convert the internal validation tree to the stable public API error shape.
 * Keep one entry per constraint so clients can bind every message to its field.
 */
export interface ApiFieldValidationError {
  field: string;
  message: string;
}

export function toApiFieldErrors(
  errors: readonly ValidationError[],
): ApiFieldValidationError[] {
  return flattenValidationErrors(errors).flatMap(({ field, messages }) =>
    messages.map((message) => ({ field, message })),
  );
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
        details: toApiFieldErrors(errors),
      }),
  });
}
