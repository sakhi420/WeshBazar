/**
 * Account feature — data access (master prompt §32, §33).
 *
 * Thin wrappers over the API client; the only place the personal account
 * endpoints are called. Profile responses return the full MyProfileDto.
 */

import type { SessionSummary } from '@/features/auth';
import { del, get, patch, post, request } from '@/lib/api';
import type {
  ChangePasswordPayload,
  ChangePhonePayload,
  ChangePhoneResult,
  LogoutAllResult,
  MyProfile,
  UpdateMePayload,
  VerifyPhoneChangeResult,
} from './types';

const ME_BASE = '/me';
const AUTH_BASE = '/auth';

/** Current user profile (user account + personal seller account). */
export function fetchMyProfile(): Promise<MyProfile> {
  return get<MyProfile>(ME_BASE);
}

/** Update display name / avatar / seller profile; returns the fresh profile. */
export function updateMyProfile(payload: UpdateMePayload): Promise<MyProfile> {
  return patch<MyProfile>(ME_BASE, payload);
}

/** Upload (or replace) the profile photo; returns the fresh profile. */
export function uploadAvatar(file: File): Promise<MyProfile> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return request<MyProfile>('/me/avatar', { method: 'POST', formData }).then(
    (envelope) => envelope.data,
  );
}

// --- Security (§33) ------------------------------------------------------------

/** Active sessions of the account, newest first (server order). */
export function fetchSessions(): Promise<SessionSummary[]> {
  return get<SessionSummary[]>(`${AUTH_BASE}/sessions`);
}

/**
 * Revoke one session. Revoking the CURRENT session also clears the refresh
 * cookie server-side (204, no body) — the caller signs the device out locally.
 */
export function revokeSession(sessionId: string): Promise<void> {
  return del(`${AUTH_BASE}/sessions/${encodeURIComponent(sessionId)}`);
}

/** Revoke every session of the account (includes the current one). */
export function logoutAllSessions(): Promise<LogoutAllResult> {
  return post<LogoutAllResult>(`${AUTH_BASE}/logout-all`);
}

/**
 * Change the password. The backend keeps the current session and revokes every
 * other refresh session (PASSWORD_CHANGED) — refetch sessions on success.
 */
export function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return post<void>(`${AUTH_BASE}/change-password`, payload);
}

/** Start a phone change: password + new number; sends an OTP to the new number. */
export function startPhoneChange(payload: ChangePhonePayload): Promise<ChangePhoneResult> {
  return post<ChangePhoneResult>(`${AUTH_BASE}/change-phone`, payload);
}

/** Confirm the phone change with the SMS code; returns the updated user. */
export function verifyPhoneChange(code: string): Promise<VerifyPhoneChangeResult> {
  return post<VerifyPhoneChangeResult>(`${AUTH_BASE}/change-phone/verify`, { code });
}
