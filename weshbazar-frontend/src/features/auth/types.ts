/**
 * Auth feature types (master prompt §7) — mirrors the frozen auth DTOs in
 * docs/openapi.json (UserSummaryDto, AuthTokensDto, AuthResponseDto, …).
 * Hand-written and kept narrow: only fields the UI actually consumes.
 */

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DEACTIVATED';

export interface UserSummary {
  id: string;
  phone: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  /**
   * Present for non-browser clients only. Browsers rely on the HttpOnly
   * refresh cookie; this field is intentionally never read or stored (§7).
   */
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
}

export interface AuthSessionRef {
  id: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: UserSummary;
  tokens: AuthTokens;
  session: AuthSessionRef;
}

export interface SessionSummary {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  /** True for the session that issued the current access token. */
  current: boolean;
}

export interface MeResponse {
  user: UserSummary;
  session: SessionSummary | null;
}

export interface ResendVerificationResponse {
  sent: boolean;
  phoneVerified: boolean;
  resendAvailableAt?: string | null;
}

export interface GenericMessage {
  message: string;
}

// --- Request payloads --------------------------------------------------------

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  phone: string;
  password: string;
  displayName?: string;
}

export interface ResetPasswordPayload {
  phone: string;
  code: string;
  newPassword: string;
}
