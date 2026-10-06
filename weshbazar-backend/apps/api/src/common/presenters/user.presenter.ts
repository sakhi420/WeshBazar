/**
 * Client-safe user projection. NEVER include `passwordHash`, moderation
 * fields, or lockout state here — this shape leaves the API.
 */
import type { User } from '../../generated/prisma/client';

export interface SafeUser {
  id: string;
  /** Raw user-entered formatting (informational; display only). */
  phone: string;
  displayName: string;
  role: User['role'];
  status: User['status'];
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    phoneVerified: user.phoneVerifiedAt !== null,
    phoneVerifiedAt: user.phoneVerifiedAt,
    createdAt: user.createdAt,
  };
}
