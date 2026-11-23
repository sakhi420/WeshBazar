/**
 * Auth feature — data access (master prompt §7, §25–29).
 *
 * Thin wrappers over the API client; the only place auth endpoints are called.
 * The refresh cookie is managed by the browser and never touched here. Login
 * and register store the returned access token in the in-memory store only.
 */

import {
  ApiError,
  ApiErrorCode,
  clearAccessToken,
  clearLocalLogoutMarker,
  publishAuthSessionEvent,
  get,
  hasAccessToken,
  hasLocalLogoutMarker,
  post,
  refreshAccessToken,
  setAccessToken,
} from '@/lib/api';
import type {
  AuthResponse,
  GenericMessage,
  LoginPayload,
  MeResponse,
  RegisterPayload,
  ResendVerificationResponse,
  ResetPasswordPayload,
} from './types';

const AUTH_BASE = '/auth';

/** Sign in with phone + password; stores the access token in memory only. */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await post<AuthResponse>(`${AUTH_BASE}/login`, payload);
  clearLocalLogoutMarker();
  setAccessToken(data.tokens.accessToken);
  publishAuthSessionEvent('login');
  return data;
}

/** Create an account (also signs in: the response carries tokens + session). */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await post<AuthResponse>(`${AUTH_BASE}/register`, payload);
  clearLocalLogoutMarker();
  setAccessToken(data.tokens.accessToken);
  publishAuthSessionEvent('login');
  return data;
}

/** Revoke the current session server-side, then drop the local token. */
export async function logout(): Promise<void> {
  try {
    await post<void>(`${AUTH_BASE}/logout`);
  } finally {
    clearAccessToken();
  }
}

/** Current user snapshot for a held access token. */
export function fetchCurrentUser(): Promise<MeResponse> {
  return get<MeResponse>(`${AUTH_BASE}/me`);
}

/**
 * Bootstrap the session for protected UI: when no access token is held (fresh
 * tab / reload after register), rotate one via the HttpOnly refresh cookie
 * before reading the current user. Throws 401 UNAUTHORIZED when there is no
 * refreshable session.
 */
export async function bootstrapCurrentUser(): Promise<MeResponse> {
  // An explicit local sign-out wins over a still-present HttpOnly refresh
  // cookie. Only a successful explicit login/register clears this marker.
  if (hasLocalLogoutMarker()) {
    clearAccessToken();
    throw new ApiError({
      code: ApiErrorCode.UNAUTHORIZED,
      message: 'No active session',
      status: 401,
    });
  }

  if (!hasAccessToken()) {
    const token = await refreshAccessToken();
    if (!token) {
      throw new ApiError({
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'No active session',
        status: 401,
      });
    }
  }
  return fetchCurrentUser();
}

/** Confirm the account phone with the SMS code (requires a session). */
export function verifyPhone(code: string): Promise<MeResponse> {
  return post<MeResponse>(`${AUTH_BASE}/verify-phone`, { code });
}

/** Request a fresh verification code (backend enforces the 60s cooldown). */
export function resendPhoneVerification(): Promise<ResendVerificationResponse> {
  return post<ResendVerificationResponse>(`${AUTH_BASE}/verify-phone/resend`);
}

/** Start password recovery; the response is intentionally generic. */
export function requestPasswordReset(phone: string): Promise<GenericMessage> {
  return post<GenericMessage>(`${AUTH_BASE}/forgot-password`, { phone });
}

/** Complete password recovery with the SMS code (204 No Content). */
export function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  return post<void>(`${AUTH_BASE}/reset-password`, payload);
}
