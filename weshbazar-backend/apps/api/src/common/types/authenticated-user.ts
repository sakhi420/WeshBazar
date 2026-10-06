/**
 * Shape of the authenticated principal attached to a request by the JWT
 * authentication guard (Phase 3). Guards populate `request.user`; controllers
 * read it through the `@CurrentUser()` decorator.
 */
import type { FastifyRequest } from 'fastify';
import type { UserRole, UserStatus } from '../../generated/prisma/enums';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  status: UserStatus;
  /** Refresh-session id the access token was issued under. */
  sessionId: string;
  /**
   * Whether the phone was verified when the access token was issued. Guards
   * that gate verified-only actions must re-check the database for actions
   * where a stale claim (≤ access-token TTL) would be unsafe.
   */
  phoneVerified: boolean;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: AuthenticatedUser;
}

/**
 * Decoded payload of an access token. `sub`/`sid` identify the user and the
 * refresh session the token was issued under; `pv` mirrors phone verification
 * state at issuance time.
 */
export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: UserRole;
  status: UserStatus;
  pv: boolean;
  iat?: number;
  exp?: number;
}
