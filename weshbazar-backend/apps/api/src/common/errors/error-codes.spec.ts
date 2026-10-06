/**
 * Unit tests pinning down the error-code catalog contract:
 * every code maps to one of the policy HTTP statuses and a non-empty,
 * client-safe default message.
 */
import { HttpStatus } from '@nestjs/common';
import { ERROR_CATALOG, ERROR_CODES, getErrorDefinition, isErrorCode } from './error-codes';

/** The HTTP status policy from the specification. */
const ALLOWED_STATUSES: readonly number[] = [
  HttpStatus.BAD_REQUEST,
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
  HttpStatus.METHOD_NOT_ALLOWED,
  HttpStatus.CONFLICT,
  HttpStatus.PAYLOAD_TOO_LARGE,
  HttpStatus.UNSUPPORTED_MEDIA_TYPE,
  HttpStatus.UNPROCESSABLE_ENTITY,
  HttpStatus.TOO_MANY_REQUESTS,
  HttpStatus.INTERNAL_SERVER_ERROR,
  HttpStatus.SERVICE_UNAVAILABLE,
];

describe('error-code catalog', () => {
  it('is not empty and exposes codes matching the catalog keys', () => {
    expect(ERROR_CODES.length).toBeGreaterThan(50);
    for (const code of ERROR_CODES) {
      expect(ERROR_CATALOG[code]).toBeDefined();
    }
  });

  it('maps every code to a policy status and a non-empty default message', () => {
    for (const code of ERROR_CODES) {
      const definition = getErrorDefinition(code);
      expect(ALLOWED_STATUSES).toContain(definition.status);
      expect(definition.message.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses uppercase snake-case codes', () => {
    for (const code of ERROR_CODES) {
      expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });

  it('identifies known and unknown codes', () => {
    expect(isErrorCode('LISTING_NOT_FOUND')).toBe(true);
    expect(isErrorCode('NOT_A_REAL_CODE')).toBe(false);
    expect(isErrorCode(undefined)).toBe(false);
    expect(isErrorCode(42)).toBe(false);
  });

  it('locks the status contract for critical codes', () => {
    expect(getErrorDefinition('VALIDATION_ERROR').status).toBe(400);
    expect(getErrorDefinition('UNAUTHORIZED').status).toBe(401);
    expect(getErrorDefinition('LISTING_NOT_FOUND').status).toBe(404);
    expect(getErrorDefinition('LISTING_INVALID_TRANSITION').status).toBe(409);
    expect(getErrorDefinition('RATE_LIMITED').status).toBe(429);
    expect(getErrorDefinition('INTERNAL_ERROR').status).toBe(500);
    expect(getErrorDefinition('SERVICE_UNAVAILABLE').status).toBe(503);
  });
});
