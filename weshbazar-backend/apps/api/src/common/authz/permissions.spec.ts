/**
 * Permission catalog + guard behavior (spec §59, §61).
 *
 * The guard is the only place that turns route metadata into access
 * decisions; these tests pin the role boundaries the moderation surface
 * relies on (moderators never manage users/taxonomy/audit).
 */
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../guards/permissions.guard';
import type { AuthenticatedUser } from '../types/authenticated-user';
import {
  hasAllPermissions,
  hasPermission,
  type Permission,
  permissionsForRole,
} from './permissions';

function makeGuard(required: Permission[] | undefined): PermissionsGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
  return new PermissionsGuard(reflector);
}

function makeContext(user?: Partial<AuthenticatedUser>): ExecutionContext {
  const request = { user };
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function principal(role: AuthenticatedUser['role']): AuthenticatedUser {
  return {
    id: 'user-1',
    role,
    status: 'ACTIVE',
    sessionId: 'session-1',
    phoneVerified: true,
  };
}

/** `expect.objectContaining` returns `any`; `toThrow` needs a typed matcher. */
const errorWithCode = (code: string): Error => expect.objectContaining({ code }) as Error;

describe('permission catalog', () => {
  it('grants USER no admin permissions', () => {
    expect(permissionsForRole('USER')).toHaveLength(0);
    expect(hasPermission('USER', 'LISTING_REVIEW')).toBe(false);
  });

  it('grants MODERATOR the content queues but not user/taxonomy/audit management', () => {
    expect(permissionsForRole('MODERATOR')).toEqual([
      'LISTING_REVIEW',
      'LISTING_REJECT',
      'REPORT_REVIEW',
      'USER_READ',
      'ANALYTICS_READ',
    ]);
    expect(hasPermission('MODERATOR', 'LISTING_ARCHIVE')).toBe(false);
    expect(hasPermission('MODERATOR', 'USER_READ')).toBe(true);
    expect(hasPermission('MODERATOR', 'USER_SUSPEND')).toBe(false);
    expect(hasPermission('MODERATOR', 'USER_BAN')).toBe(false);
    expect(hasPermission('MODERATOR', 'CATEGORY_MANAGE')).toBe(false);
    expect(hasPermission('MODERATOR', 'LOCATION_MANAGE')).toBe(false);
    expect(hasPermission('MODERATOR', 'AUDIT_READ')).toBe(false);
  });

  it('grants ADMIN every permission', () => {
    for (const permission of permissionsForRole('ADMIN')) {
      expect(hasPermission('ADMIN', permission)).toBe(true);
    }
    expect(hasPermission('ADMIN', 'USER_BAN')).toBe(true);
    expect(hasPermission('ADMIN', 'AUDIT_READ')).toBe(true);
  });

  it('requires every requested permission (all-of semantics)', () => {
    expect(hasAllPermissions('MODERATOR', ['LISTING_REVIEW', 'LISTING_REJECT'])).toBe(true);
    expect(hasAllPermissions('MODERATOR', ['LISTING_REVIEW', 'LISTING_ARCHIVE'])).toBe(false);
  });
});

describe('PermissionsGuard', () => {
  it('passes routes without permission metadata', () => {
    expect(makeGuard(undefined).canActivate(makeContext(principal('USER')))).toBe(true);
    expect(makeGuard([]).canActivate(makeContext())).toBe(true);
  });

  it('rejects anonymous principals with UNAUTHORIZED', () => {
    expect(() => makeGuard(['LISTING_REVIEW']).canActivate(makeContext())).toThrow(
      errorWithCode('UNAUTHORIZED'),
    );
  });

  it('rejects users below the required role with FORBIDDEN', () => {
    expect(() => makeGuard(['REPORT_REVIEW']).canActivate(makeContext(principal('USER')))).toThrow(
      errorWithCode('FORBIDDEN'),
    );

    expect(() =>
      makeGuard(['USER_SUSPEND']).canActivate(makeContext(principal('MODERATOR'))),
    ).toThrow(errorWithCode('FORBIDDEN'));
  });

  it('rejects suspended staff accounts even with a stale token', () => {
    const suspended = { ...principal('ADMIN'), status: 'SUSPENDED' as const };
    expect(() => makeGuard(['AUDIT_READ']).canActivate(makeContext(suspended))).toThrow(
      errorWithCode('ACCOUNT_NOT_ACTIVE'),
    );
  });

  it('allows principals holding every required permission', () => {
    expect(
      makeGuard(['LISTING_REVIEW', 'LISTING_REJECT']).canActivate(
        makeContext(principal('MODERATOR')),
      ),
    ).toBe(true);
    expect(makeGuard(['CATEGORY_MANAGE']).canActivate(makeContext(principal('ADMIN')))).toBe(true);
  });
});
