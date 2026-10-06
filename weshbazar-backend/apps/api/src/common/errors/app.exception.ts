/**
 * Domain exception carrying a stable error code from the central catalog.
 *
 * Throw `AppException` everywhere in application code instead of Nest's
 * built-in HTTP exceptions; the global filter (`exception.filter.ts`) prints
 * it as the standard error envelope. The HTTP status is always derived from
 * the code so a given code maps to exactly one status across the API.
 */
import { HttpStatus } from '@nestjs/common';
import { getErrorDefinition, type ErrorCode } from './error-codes';

export interface ErrorResponseBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export interface AppExceptionOptions {
  /** Override the catalog's default message (still safe to expose). */
  message?: string;
  /** Additional machine-readable context (e.g. validation errors, checks). */
  details?: unknown;
  /** Original error, kept for logging; never serialized to the client. */
  cause?: unknown;
}

export class AppException extends Error {
  readonly code: ErrorCode;
  readonly status: HttpStatus;
  readonly details?: unknown;
  override readonly cause?: unknown;

  constructor(code: ErrorCode, options: AppExceptionOptions = {}) {
    const definition = getErrorDefinition(code);
    super(options.message ?? definition.message);
    this.name = 'AppException';
    this.code = code;
    this.status = definition.status;
    this.details = options.details;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
    Error.captureStackTrace?.(this, AppException);
  }

  static isAppException(error: unknown): error is AppException {
    return error instanceof AppException;
  }

  toResponse(requestId: string): ErrorResponseBody {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
      requestId,
    };
  }
}
