/**
 * Authentication orchestration: registration, sign-in, phone verification,
 * session management, password reset/change and phone change.
 *
 * Security invariants enforced here:
 * - Sign-in never reveals whether a phone number exists (timing-equalized
 *   password verification, identical INVALID_CREDENTIALS).
 * - Forgot-password always answers with the same generic message.
 * - Password reset / phone change revoke every other refresh session.
 * - OTP flows are rate-limited per IP, per phone and per user.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { AppException } from '../../common/errors/app.exception';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { toSafeUser, type SafeUser } from '../../common/presenters/user.presenter';
import { maskPhone, normalizePhone } from '../../common/utils/phone.utils';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PrismaService } from '../../database/prisma.service';
import type { RefreshSession, User } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { SellerAccountsService } from '../sellers/seller-accounts.service';
import type { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import type { ChangePhoneDto } from './dto/phone.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { SessionService, type IssuedSession, type SessionContext } from './session.service';
import { TokenService } from './token.service';
import { VerificationService } from './verification.service';

/** Transport facts collected by the controller from the request. */
export interface ClientContext {
  ip: string;
  userAgent?: string;
  deviceName?: string;
}

export interface AuthOutcome {
  user: SafeUser;
  tokens: {
    accessToken: string;
    accessTokenExpiresInSeconds: number;
    refreshToken: string;
    refreshTokenExpiresInSeconds: number;
  };
  session: { id: string; expiresAt: Date };
}

export interface SafeSession {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  current: boolean;
}

const GENERIC_RESET_MESSAGE =
  'If an account exists for this phone number, a reset code has been sent.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly rateLimit: AppConfig['rateLimit'];
  private readonly lockout: AppConfig['auth']['lockout'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: RateLimitService,
    private readonly sessions: SessionService,
    private readonly verification: VerificationService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly sellerAccounts: SellerAccountsService,
    private readonly audit: AuditService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.rateLimit = configService.get('rateLimit', { infer: true });
    this.lockout = configService.get('auth.lockout', { infer: true });
  }

  // --- Registration & sign-in -------------------------------------------------

  async register(dto: RegisterDto, context: ClientContext): Promise<AuthOutcome> {
    const phoneNormalized = this.normalizeOrThrow(dto.phone);
    this.rateLimitService.enforce('auth:register:ip', context.ip, this.rateLimit.registerPerWindow);
    this.rateLimitService.enforce(
      'auth:register:phone',
      phoneNormalized,
      this.rateLimit.registerPerWindow,
    );
    this.passwords.validateOrThrow(dto.password);

    const existing = await this.prisma.user.findUnique({
      where: { phoneNormalized },
      select: { id: true },
    });
    if (existing) {
      throw new AppException('PHONE_ALREADY_REGISTERED');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    // Unverified accounts are created immediately but cannot publish listings
    // until `phoneVerifiedAt` is set (enforced in the listings phase).
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone.trim(),
        phoneNormalized,
        passwordHash,
        displayName: (dto.displayName ?? '').trim() || 'WeshBazar User',
      },
    });

    // Personal seller account (spec §25), provisioned right after the user
    // row. Deliberately NOT part of a transaction: slug-collision retries
    // need fresh statements, and PostgreSQL aborts a transaction after any
    // failed statement (a retry would fail with 25P02). If provisioning
    // fails, the account self-heals on the next `GET /me`.
    await this.sellerAccounts.ensureForOwner(user.id);

    await this.verification.issue({
      userId: user.id,
      phone: phoneNormalized,
      purpose: 'REGISTER',
    });

    const issued = await this.sessions.create(user.id, this.sessionContext(context));
    return this.buildOutcome(user, issued);
  }

  async login(dto: LoginDto, context: ClientContext): Promise<AuthOutcome> {
    const phoneNormalized = this.normalizeOrThrow(dto.phone);
    this.rateLimitService.enforce('auth:login:ip', context.ip, this.rateLimit.loginPerWindow);
    this.rateLimitService.enforce(
      'auth:login:phone',
      phoneNormalized,
      this.rateLimit.loginPerWindow,
    );

    const user = await this.prisma.user.findUnique({ where: { phoneNormalized } });
    if (!user || user.deletedAt !== null) {
      // Same cost as a real verification so response time does not reveal
      // whether the account exists.
      await this.passwords.verifyDummy();
      throw new AppException('INVALID_CREDENTIALS');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppException('ACCOUNT_NOT_ACTIVE');
    }

    const now = new Date();
    if (user.lockedUntil !== null && user.lockedUntil.getTime() > now.getTime()) {
      throw new AppException('ACCOUNT_LOCKED', {
        details: { lockedUntil: user.lockedUntil.toISOString() },
      });
    }

    const passwordMatches = await this.passwords.verify(dto.password, user.passwordHash);
    if (!passwordMatches) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= this.lockout.threshold;
      if (shouldLock) {
        const lockedUntil = new Date(now.getTime() + this.lockout.durationSeconds * 1000);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil },
        });
        this.logger.warn(`Account locked after repeated failed sign-ins (user ${user.id}).`);
        throw new AppException('ACCOUNT_LOCKED', {
          details: { lockedUntil: lockedUntil.toISOString(), threshold: this.lockout.threshold },
        });
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts },
      });
      throw new AppException('INVALID_CREDENTIALS', {
        details: { attemptsRemaining: this.lockout.threshold - failedAttempts },
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    const issued = await this.sessions.create(user.id, this.sessionContext(context));
    return this.buildOutcome(updated, issued);
  }

  async refresh(rawRefreshToken: string | undefined, context: ClientContext): Promise<AuthOutcome> {
    if (!rawRefreshToken) {
      throw new AppException('REFRESH_TOKEN_MISSING');
    }
    const { user, sessionId, issued } = await this.sessions.rotate(
      rawRefreshToken,
      this.sessionContext(context),
    );
    const accessToken = await this.tokens.signAccessToken(user, sessionId);
    return this.buildOutcome(
      user,
      {
        sessionId,
        familyId: issued.familyId,
        refreshToken: issued.refreshToken,
        expiresAt: issued.expiresAt,
      },
      accessToken,
    );
  }

  // --- Session management ------------------------------------------------------

  async logout(user: AuthenticatedUser): Promise<void> {
    // Plain sign-out is routine and stays out of the audit trail; one-device
    // revocation (revokeSession) and logout-all are the security events.
    await this.sessions.revokeForUser(user.sessionId, user.id, 'LOGOUT');
  }

  async logoutAll(
    user: AuthenticatedUser,
    context: ClientContext,
  ): Promise<{ revokedCount: number }> {
    const revokedCount = await this.sessions.revokeAllForUser(user.id, 'LOGOUT_ALL');
    await this.audit.recordBestEffort({
      actorUserId: user.id,
      action: 'SECURITY_LOGOUT_ALL',
      entityType: 'User',
      entityId: user.id,
      metadata: { revokedCount },
      ipAddress: context.ip,
      userAgent: context.userAgent ?? null,
    });
    return { revokedCount };
  }

  async listSessions(user: AuthenticatedUser): Promise<SafeSession[]> {
    const sessions = await this.sessions.listActive(user.id);
    return sessions.map((session) => this.toSafeSession(session, user.sessionId));
  }

  async revokeSession(
    user: AuthenticatedUser,
    sessionId: string,
    context: ClientContext,
  ): Promise<{ revokedCurrent: boolean }> {
    await this.sessions.ensureOwned(sessionId, user.id);
    const revoked = await this.sessions.revokeForUser(sessionId, user.id, 'LOGOUT');
    if (revoked) {
      await this.audit.recordBestEffort({
        actorUserId: user.id,
        action: 'SECURITY_SESSION_REVOKED',
        entityType: 'RefreshSession',
        entityId: sessionId,
        metadata: { revokedCurrent: sessionId === user.sessionId },
        ipAddress: context.ip,
        userAgent: context.userAgent ?? null,
      });
    }
    return { revokedCurrent: revoked && sessionId === user.sessionId };
  }

  async me(user: AuthenticatedUser): Promise<{ user: SafeUser; session: SafeSession | null }> {
    const [record, session] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: user.id } }),
      this.prisma.refreshSession.findUnique({ where: { id: user.sessionId } }),
    ]);
    if (!record || record.deletedAt !== null) {
      throw new AppException('UNAUTHORIZED', { message: 'This account is no longer available.' });
    }
    if (record.status !== 'ACTIVE') {
      throw new AppException('ACCOUNT_NOT_ACTIVE');
    }
    return {
      user: toSafeUser(record),
      session: session ? this.toSafeSession(session, user.sessionId) : null,
    };
  }

  // --- Phone verification ---------------------------------------------------------

  async verifyPhone(
    user: AuthenticatedUser,
    code: string,
    context: ClientContext,
  ): Promise<{ user: SafeUser }> {
    const record = await this.requireUser(user.id);
    if (record.phoneVerifiedAt !== null) {
      return { user: toSafeUser(record) };
    }
    this.rateLimitService.enforce(
      'auth:otp-verify:ip',
      context.ip,
      this.rateLimit.otpVerifyPerWindow,
    );
    this.rateLimitService.enforce(
      'auth:otp-verify:user',
      user.id,
      this.rateLimit.otpVerifyPerWindow,
    );
    this.rateLimitService.enforce(
      'auth:otp-verify:phone',
      record.phoneNormalized,
      this.rateLimit.otpVerifyPerWindow,
    );

    await this.verification.consume({
      userId: user.id,
      phone: record.phoneNormalized,
      purpose: 'REGISTER',
      code,
    });
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date() },
    });
    return { user: toSafeUser(updated) };
  }

  async resendPhoneVerification(
    user: AuthenticatedUser,
    context: ClientContext,
  ): Promise<{ sent: boolean; phoneVerified: boolean; resendAvailableAt: string | null }> {
    const record = await this.requireUser(user.id);
    if (record.phoneVerifiedAt !== null) {
      return { sent: false, phoneVerified: true, resendAvailableAt: null };
    }
    this.enforceOtpSendLimits(context, user.id, record.phoneNormalized);

    const remaining = await this.verification.resendCooldownRemaining(
      record.phoneNormalized,
      'REGISTER',
    );
    if (remaining > 0) {
      throw new AppException('OTP_RESEND_TOO_SOON', { details: { retryAfterSeconds: remaining } });
    }

    const issued = await this.verification.issue({
      userId: user.id,
      phone: record.phoneNormalized,
      purpose: 'REGISTER',
    });
    return {
      sent: true,
      phoneVerified: false,
      resendAvailableAt: issued.resendAvailableAt.toISOString(),
    };
  }

  // --- Password change / reset ------------------------------------------------------

  async changePassword(
    user: AuthenticatedUser,
    dto: ChangePasswordDto,
    context: ClientContext,
  ): Promise<void> {
    const record = await this.requireUser(user.id);
    const currentMatches = await this.passwords.verify(dto.currentPassword, record.passwordHash);
    if (!currentMatches) {
      throw new AppException('CURRENT_PASSWORD_INCORRECT');
    }
    this.passwords.validateOrThrow(dto.newPassword);
    if (await this.passwords.verify(dto.newPassword, record.passwordHash)) {
      throw new AppException('WEAK_PASSWORD', {
        message: 'The new password must be different from the current password.',
      });
    }

    const passwordHash = await this.passwords.hash(dto.newPassword);
    const now = new Date();
    const [, revoked] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      // Documented policy (spec §19): keep the session performing the change,
      // revoke every other refresh session.
      this.prisma.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null, id: { not: user.sessionId } },
        data: { revokedAt: now, revokedReason: 'PASSWORD_CHANGED' },
      }),
    ]);
    await this.audit.recordBestEffort({
      actorUserId: user.id,
      action: 'AUTH_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
      metadata: { revokedSessions: revoked.count },
      ipAddress: context.ip,
      userAgent: context.userAgent ?? null,
    });
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    context: ClientContext,
  ): Promise<{ message: string }> {
    this.rateLimitService.enforce(
      'auth:forgot:ip',
      context.ip,
      this.rateLimit.passwordResetPerWindow,
    );

    const phoneNormalized = normalizePhone(dto.phone);
    if (phoneNormalized !== null) {
      this.rateLimitService.enforce(
        'auth:forgot:phone',
        phoneNormalized,
        this.rateLimit.passwordResetPerWindow,
      );
      const user = await this.prisma.user.findUnique({ where: { phoneNormalized } });
      if (user && user.deletedAt === null) {
        const remaining = await this.verification.resendCooldownRemaining(
          phoneNormalized,
          'PASSWORD_RESET',
        );
        if (remaining === 0) {
          await this.verification.issue({
            userId: user.id,
            phone: phoneNormalized,
            purpose: 'PASSWORD_RESET',
          });
        }
      }
    }
    // Identical response whether or not the account exists.
    return { message: GENERIC_RESET_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto, context: ClientContext): Promise<void> {
    const phoneNormalized = this.normalizeOrThrow(dto.phone);
    this.rateLimitService.enforce(
      'auth:reset:ip',
      context.ip,
      this.rateLimit.passwordResetPerWindow,
    );
    this.rateLimitService.enforce(
      'auth:reset:phone',
      phoneNormalized,
      this.rateLimit.passwordResetPerWindow,
    );

    const user = await this.prisma.user.findUnique({ where: { phoneNormalized } });
    if (!user || user.deletedAt !== null) {
      throw new AppException('PASSWORD_RESET_TOKEN_INVALID');
    }
    this.passwords.validateOrThrow(dto.newPassword);
    await this.verification.consume({
      userId: user.id,
      phone: phoneNormalized,
      purpose: 'PASSWORD_RESET',
      code: dto.code,
    });

    const passwordHash = await this.passwords.hash(dto.newPassword);
    const now = new Date();
    const [, revoked] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      // Every session dies on password reset: the old password may be leaked.
      this.prisma.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'PASSWORD_RESET' },
      }),
    ]);
    await this.audit.recordBestEffort({
      actorUserId: user.id,
      action: 'AUTH_PASSWORD_RESET',
      entityType: 'User',
      entityId: user.id,
      metadata: { revokedSessions: revoked.count },
      ipAddress: context.ip,
      userAgent: context.userAgent ?? null,
    });
  }

  // --- Phone change --------------------------------------------------------------

  async changePhone(
    user: AuthenticatedUser,
    dto: ChangePhoneDto,
    context: ClientContext,
  ): Promise<{ sent: boolean; newPhone: string; resendAvailableAt: string }> {
    const record = await this.requireUser(user.id);
    const passwordMatches = await this.passwords.verify(dto.password, record.passwordHash);
    if (!passwordMatches) {
      throw new AppException('CURRENT_PASSWORD_INCORRECT');
    }

    const newPhone = this.normalizeOrThrow(dto.newPhone);
    if (newPhone === record.phoneNormalized) {
      throw new AppException('PHONE_UNCHANGED');
    }
    const taken = await this.prisma.user.findUnique({
      where: { phoneNormalized: newPhone },
      select: { id: true },
    });
    if (taken) {
      throw new AppException('PHONE_ALREADY_REGISTERED');
    }

    this.enforceOtpSendLimits(context, user.id, newPhone);
    const remaining = await this.verification.resendCooldownRemaining(newPhone, 'CHANGE_PHONE');
    if (remaining > 0) {
      throw new AppException('OTP_RESEND_TOO_SOON', { details: { retryAfterSeconds: remaining } });
    }

    const issued = await this.verification.issue({
      userId: user.id,
      phone: newPhone,
      purpose: 'CHANGE_PHONE',
    });
    return {
      sent: true,
      newPhone: maskPhone(newPhone),
      resendAvailableAt: issued.resendAvailableAt.toISOString(),
    };
  }

  async verifyPhoneChange(
    user: AuthenticatedUser,
    code: string,
    context: ClientContext,
  ): Promise<{ user: SafeUser }> {
    const record = await this.requireUser(user.id);
    this.rateLimitService.enforce(
      'auth:otp-verify:ip',
      context.ip,
      this.rateLimit.otpVerifyPerWindow,
    );
    this.rateLimitService.enforce(
      'auth:otp-verify:user',
      user.id,
      this.rateLimit.otpVerifyPerWindow,
    );

    const challenge = await this.prisma.verificationChallenge.findFirst({
      where: { userId: user.id, purpose: 'CHANGE_PHONE', usedAt: null, invalidatedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { phone: true },
    });
    if (!challenge) {
      throw new AppException('OTP_EXPIRED');
    }

    const taken = await this.prisma.user.findUnique({
      where: { phoneNormalized: challenge.phone },
      select: { id: true },
    });
    if (taken && taken.id !== user.id) {
      throw new AppException('PHONE_ALREADY_REGISTERED');
    }

    await this.verification.consume({
      userId: user.id,
      phone: challenge.phone,
      purpose: 'CHANGE_PHONE',
      code,
    });

    const now = new Date();
    const { updated, revokedSessions } = await this.prisma.$transaction(async (tx) => {
      const next = await tx.user.update({
        where: { id: user.id },
        data: {
          phone: challenge.phone,
          phoneNormalized: challenge.phone,
          phoneVerifiedAt: now,
        },
      });
      // Phone change is security-sensitive: other devices must re-authenticate.
      const revoked = await tx.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null, id: { not: user.sessionId } },
        data: { revokedAt: now, revokedReason: 'PHONE_CHANGED' },
      });
      return { updated: next, revokedSessions: revoked.count };
    });
    await this.audit.recordBestEffort({
      actorUserId: user.id,
      action: 'AUTH_PHONE_CHANGED',
      entityType: 'User',
      entityId: user.id,
      // Masked numbers only: an audit row is not a phone directory (§62).
      metadata: {
        from: maskPhone(record.phoneNormalized),
        to: maskPhone(challenge.phone),
        revokedSessions,
      },
      ipAddress: context.ip,
      userAgent: context.userAgent ?? null,
    });
    return { user: toSafeUser(updated) };
  }

  // --- Internals -------------------------------------------------------------------

  private enforceOtpSendLimits(context: ClientContext, userId: string, phone: string): void {
    this.rateLimitService.enforce('auth:otp-send:ip', context.ip, this.rateLimit.otpSendPerWindow);
    this.rateLimitService.enforce('auth:otp-send:user', userId, this.rateLimit.otpSendPerWindow);
    this.rateLimitService.enforce('auth:otp-send:phone', phone, this.rateLimit.otpSendPerWindow);
  }

  private sessionContext(context: ClientContext): SessionContext {
    return {
      ipAddress: context.ip,
      userAgent: context.userAgent,
      deviceName: context.deviceName,
    };
  }

  private normalizeOrThrow(phone: string): string {
    const normalized = normalizePhone(phone);
    if (normalized === null) {
      throw new AppException('INVALID_PHONE_NUMBER');
    }
    return normalized;
  }

  private async requireUser(userId: string): Promise<User> {
    const record = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!record || record.deletedAt !== null) {
      throw new AppException('UNAUTHORIZED', { message: 'This account is no longer available.' });
    }
    return record;
  }

  private toSafeSession(session: RefreshSession, currentSessionId: string): SafeSession {
    return {
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastUsedAt: session.lastUsedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceName: session.deviceName,
      current: session.id === currentSessionId,
    };
  }

  private async buildOutcome(
    user: User,
    issued: IssuedSession,
    accessToken?: string,
  ): Promise<AuthOutcome> {
    const token = accessToken ?? (await this.tokens.signAccessToken(user, issued.sessionId));
    return {
      user: toSafeUser(user),
      tokens: {
        accessToken: token,
        accessTokenExpiresInSeconds: this.tokens.accessTokenTtlSeconds,
        refreshToken: issued.refreshToken,
        refreshTokenExpiresInSeconds: this.tokens.refreshTokenTtlSeconds,
      },
      session: { id: issued.sessionId, expiresAt: issued.expiresAt },
    };
  }
}
