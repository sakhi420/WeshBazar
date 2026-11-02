/**
 * Centralized API error model.
 * Source of truth: weshbazar-backend/docs/frontend-error-map.md and
 * apps/api/src/common/errors/error-codes.ts. `error.code` is stable — always
 * branch on the code, never on the human-readable message.
 */

import type { ApiErrorEnvelope, ApiFieldError } from './types';

/**
 * Stable error codes emitted by the frozen backend (v1.0.0). Kept as a const
 * object for autocomplete; unknown codes still flow through as raw strings.
 */
export const ApiErrorCode = {
  // Generic / transport
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK: 'NETWORK',

  // Auth & account
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  SESSION_REVOKED: 'SESSION_REVOKED',
  SESSION_REUSE_DETECTED: 'SESSION_REUSE_DETECTED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  PHONE_ALREADY_REGISTERED: 'PHONE_ALREADY_REGISTERED',
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',
  PHONE_UNCHANGED: 'PHONE_UNCHANGED',
  PHONE_NOT_VERIFIED: 'PHONE_NOT_VERIFIED',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  CURRENT_PASSWORD_INCORRECT: 'CURRENT_PASSWORD_INCORRECT',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_NOT_ACTIVE: 'ACCOUNT_NOT_ACTIVE',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS_EXCEEDED: 'OTP_MAX_ATTEMPTS_EXCEEDED',
  OTP_RESEND_TOO_SOON: 'OTP_RESEND_TOO_SOON',
  OTP_DELIVERY_FAILED: 'OTP_DELIVERY_FAILED',
  PASSWORD_RESET_TOKEN_INVALID: 'PASSWORD_RESET_TOKEN_INVALID',
  PASSWORD_RESET_TOKEN_EXPIRED: 'PASSWORD_RESET_TOKEN_EXPIRED',

  // Favorites (error-map §3.8) — both converge the local state to the server truth.
  FAVORITE_ALREADY_EXISTS: 'FAVORITE_ALREADY_EXISTS',
  FAVORITE_NOT_FOUND: 'FAVORITE_NOT_FOUND',

  // Listing state machine & moderation (error-map §3.6) — emitted by the frozen backend.
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  LISTING_INVALID_TRANSITION: 'LISTING_INVALID_TRANSITION',
  LISTING_EDIT_NOT_ALLOWED: 'LISTING_EDIT_NOT_ALLOWED',
  LISTING_VERSION_CONFLICT: 'LISTING_VERSION_CONFLICT',
  LISTING_LIMIT_REACHED: 'LISTING_LIMIT_REACHED',
  MODERATION_ACTION_NOT_ALLOWED: 'MODERATION_ACTION_NOT_ALLOWED',
  USER_MODERATION_FORBIDDEN: 'USER_MODERATION_FORBIDDEN',

  // Idempotency
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
} as const;

export type ApiErrorCodeValue = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** 401 codes that mean "clear the session immediately, do NOT refresh". */
const SESSION_TERMINAL_CODES = new Set<string>([
  ApiErrorCode.TOKEN_INVALID,
  ApiErrorCode.REFRESH_TOKEN_MISSING,
  ApiErrorCode.REFRESH_TOKEN_INVALID,
  ApiErrorCode.SESSION_REVOKED,
  ApiErrorCode.SESSION_REUSE_DETECTED,
  ApiErrorCode.SESSION_NOT_FOUND,
]);

export interface ApiErrorInit {
  code: string;
  message: string;
  status: number;
  requestId?: string;
  details?: ApiFieldError[];
  /** Value of the `Retry-After` header (seconds) when present on 429. */
  retryAfterSeconds?: number;
  cause?: unknown;
}

/**
 * Typed error thrown by the API client for every non-2xx response and for
 * transport failures (code `NETWORK`). Catch and branch on `.code`.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: ApiFieldError[];
  readonly retryAfterSeconds?: number;

  constructor(init: ApiErrorInit) {
    super(init.message, init.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = 'ApiError';
    this.code = init.code;
    this.status = init.status;
    this.requestId = init.requestId;
    this.details = init.details;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  /** Field-level validation details for form binding (frontend-error-map.md §4). */
  get fieldErrors(): ApiFieldError[] {
    return this.details ?? [];
  }

  /** True when this is a transport-level failure (no HTTP response received). */
  get isNetworkError(): boolean {
    return this.code === ApiErrorCode.NETWORK;
  }

  /** True when a silent refresh + replay is allowed (401 TOKEN_EXPIRED). */
  get isTokenExpired(): boolean {
    return this.status === 401 && this.code === ApiErrorCode.TOKEN_EXPIRED;
  }

  /** True when the session must be cleared and the user routed to login. */
  get isSessionTerminal(): boolean {
    return this.status === 401 && SESSION_TERMINAL_CODES.has(this.code);
  }

  /** Safe to auto-retry once for idempotent GETs (5xx / transport). */
  get isRetriableGet(): boolean {
    return this.status >= 500 || this.isNetworkError;
  }
}

/** Build an ApiError from a parsed error envelope. */
export function apiErrorFromEnvelope(
  envelope: ApiErrorEnvelope,
  status: number,
  retryAfterSeconds?: number,
): ApiError {
  return new ApiError({
    code: envelope.error.code,
    message: envelope.error.message,
    status,
    requestId: envelope.requestId,
    details: envelope.error.details,
    retryAfterSeconds,
  });
}

/** Parse the `Retry-After` header (delta-seconds form) when present. */
export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}
