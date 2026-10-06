/**
 * Generic verification-challenge engine (OTP) shared by every purpose:
 * REGISTER, CHANGE_PHONE and PASSWORD_RESET.
 *
 * Raw codes are never stored — only a peppered HMAC-SHA256 hash. Challenges
 * are single-use, expire quickly, cap attempts and carry a resend cooldown.
 * Issuing a new challenge invalidates the previous open one for the same
 * phone+purpose so exactly one code is ever live.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { AppException } from '../../common/errors/app.exception';
import { generateNumericCode, hmacSha256Hex, safeEqualHex } from '../../common/utils/crypto.utils';
import { SMS_PROVIDER, type SmsProvider } from '../../providers/sms/sms.provider';
import { PrismaService } from '../../database/prisma.service';
import type { VerificationChallenge } from '../../generated/prisma/client';
import type { VerificationPurpose } from '../../generated/prisma/enums';

export interface IssueChallengeInput {
  userId?: string | null;
  /** Normalized (E.164) phone the code is issued for. */
  phone: string;
  purpose: VerificationPurpose;
}

export interface ConsumeChallengeInput {
  /** When provided, the challenge must belong to this user (when it has an owner). */
  userId?: string;
  phone: string;
  purpose: VerificationPurpose;
  code: string;
}

export interface IssuedChallenge {
  id: string;
  expiresAt: Date;
  resendAvailableAt: Date;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly otp: AppConfig['auth']['otp'];
  /** HMAC pepper for code hashes (JWT refresh secret doubles as the app pepper). */
  private readonly pepper: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
    configService: ConfigService<AppConfig, true>,
  ) {
    const auth = configService.get('auth', { infer: true });
    this.otp = auth.otp;
    this.pepper = auth.refreshSecret;
  }

  /** Create (and deliver) a new challenge, invalidating the previous open one. */
  async issue(input: IssueChallengeInput): Promise<IssuedChallenge> {
    const now = new Date();
    const expiresInSeconds =
      input.purpose === 'PASSWORD_RESET'
        ? this.otp.passwordResetExpiresInSeconds
        : this.otp.expiresInSeconds;
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);
    const resendAvailableAt = new Date(now.getTime() + this.otp.resendCooldownSeconds * 1000);

    const code = generateNumericCode(this.otp.length);
    const challenge = await this.prisma.$transaction(async (tx) => {
      await tx.verificationChallenge.updateMany({
        where: {
          phone: input.phone,
          purpose: input.purpose,
          usedAt: null,
          invalidatedAt: null,
        },
        data: { invalidatedAt: now },
      });
      return tx.verificationChallenge.create({
        data: {
          userId: input.userId ?? null,
          phone: input.phone,
          purpose: input.purpose,
          codeHash: hmacSha256Hex(code, this.pepper),
          expiresAt,
          maxAttempts: this.otp.maxAttempts,
          resendAvailableAt,
        },
        select: { id: true },
      });
    });

    try {
      await this.smsProvider.sendVerificationCode({
        phone: input.phone,
        code,
        purpose: input.purpose,
      });
    } catch (error) {
      // Never leave behind a code the user could not receive.
      await this.prisma.verificationChallenge.updateMany({
        where: { id: challenge.id },
        data: { invalidatedAt: new Date() },
      });
      this.logger.error(
        `Delivery of a ${input.purpose} code failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AppException('OTP_DELIVERY_FAILED');
    }

    return { id: challenge.id, expiresAt, resendAvailableAt };
  }

  /** Seconds until a new code may be requested for this phone+purpose (0 = ready). */
  async resendCooldownRemaining(phone: string, purpose: VerificationPurpose): Promise<number> {
    const latest = await this.prisma.verificationChallenge.findFirst({
      where: { phone, purpose },
      orderBy: { createdAt: 'desc' },
      select: { resendAvailableAt: true },
    });
    if (!latest) {
      return 0;
    }
    const remainingMs = latest.resendAvailableAt.getTime() - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  /**
   * Verify a code and mark the challenge used. Throws AppException with the
   * precise OTP_* code on any failure; returns the consumed challenge on
   * success.
   */
  async consume(input: ConsumeChallengeInput): Promise<VerificationChallenge> {
    const now = new Date();
    const challenge = await this.prisma.verificationChallenge.findFirst({
      where: {
        phone: input.phone,
        purpose: input.purpose,
        usedAt: null,
        invalidatedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new AppException('OTP_EXPIRED');
    }
    if (
      input.userId !== undefined &&
      challenge.userId !== null &&
      challenge.userId !== input.userId
    ) {
      // Defensive: one account must never consume another account's challenge.
      throw new AppException('OTP_INVALID');
    }
    if (challenge.expiresAt.getTime() <= now.getTime()) {
      throw new AppException('OTP_EXPIRED');
    }
    if (challenge.attempts >= challenge.maxAttempts) {
      throw new AppException('OTP_MAX_ATTEMPTS_EXCEEDED');
    }

    const matches = safeEqualHex(hmacSha256Hex(input.code, this.pepper), challenge.codeHash);
    if (!matches) {
      const updated = await this.prisma.verificationChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
        select: { attempts: true, maxAttempts: true },
      });
      if (updated.attempts >= updated.maxAttempts) {
        throw new AppException('OTP_MAX_ATTEMPTS_EXCEEDED');
      }
      throw new AppException('OTP_INVALID', {
        details: { attemptsRemaining: updated.maxAttempts - updated.attempts },
      });
    }

    const consumed = await this.prisma.verificationChallenge.updateMany({
      where: { id: challenge.id, usedAt: null },
      data: { usedAt: now },
    });
    if (consumed.count === 0) {
      // Lost a concurrent race: another request already used this code.
      throw new AppException('OTP_INVALID', {
        message: 'This verification code has already been used.',
      });
    }
    return challenge;
  }
}
