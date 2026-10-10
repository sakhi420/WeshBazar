/**
 * Account feature types (master prompt §32, §33) — mirrors the frozen profile
 * DTOs in docs/openapi.json (MyProfileDto, MySellerAccountDto, UpdateMeDto,
 * ChangePasswordDto, ChangePhoneDto, LogoutAllResponseDto).
 * Hand-written and kept narrow: only fields the UI actually consumes.
 */

import type { UserRole, UserStatus, UserSummary } from '@/features/auth';

/** Re-exported here so account UI can keep a single import source. */
export type { SessionSummary } from '@/features/auth';

export type SellerAccountType = 'INDIVIDUAL';
export type SellerAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface MySellerAccount {
  id: string;
  type: SellerAccountType;
  displayName: string;
  slug: string;
  bio?: string | null;
  status: SellerAccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MyProfile {
  id: string;
  phone: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  phoneVerified: boolean;
  phoneVerifiedAt?: string | null;
  avatarKey?: string | null;
  createdAt: string;
  seller: MySellerAccount;
}

export interface UpdateSellerProfilePayload {
  displayName?: string;
  bio?: string;
}

/** Request body for PATCH /me — all fields optional (partial update). */
export interface UpdateMePayload {
  displayName?: string;
  avatarKey?: string;
  seller?: UpdateSellerProfilePayload;
}

// --- Security (§33) ------------------------------------------------------------

/** Request body for POST /auth/change-password (ChangePasswordDto). */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Request body for POST /auth/change-phone (ChangePhoneDto). */
export interface ChangePhonePayload {
  password: string;
  newPhone: string;
}

/** Response of POST /auth/change-phone (ChangePhoneResponseDto). */
export interface ChangePhoneResult {
  sent: boolean;
  /** Masked new number echoed by the backend (e.g. `+93*****4321`). */
  newPhone: string;
  resendAvailableAt: string;
}

/**
 * Response of POST /auth/change-phone/verify. The OpenAPI annotation declares
 * MeResponseDto, but the controller returns `{ user }` only — consume the
 * subset that is actually sent.
 */
export interface VerifyPhoneChangeResult {
  user: UserSummary;
}

/** Response of POST /auth/logout-all (LogoutAllResponseDto). */
export interface LogoutAllResult {
  revokedCount: number;
}
