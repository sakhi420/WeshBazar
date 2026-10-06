/**
 * Password hashing and policy enforcement.
 *
 * - Hashing: Argon2id with OWASP-recommended parameters (19 MiB memory,
 *   t=2, p=1). Passwords are never logged, returned, or stored reversibly.
 * - Policy: centralized and configurable (`PASSWORD_*` env vars); violations
 *   are reported per-rule so clients can render precise guidance.
 */
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { argon2id, hash as argon2Hash, verify as argon2Verify, type HashOptions } from 'argon2';
import type { AppConfig } from '../../config/config.types';
import { AppException } from '../../common/errors/app.exception';
import { generateOpaqueToken } from '../../common/utils/crypto.utils';

export interface PasswordViolation {
  /** Stable machine-readable rule id ("minLength", "digit", …). */
  rule: string;
  message: string;
}

@Injectable()
export class PasswordService implements OnModuleInit {
  private static readonly ARGON2_OPTIONS: HashOptions = {
    type: argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  };

  private readonly policy: AppConfig['auth']['password'];
  private dummyHash: string | null = null;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.policy = configService.get('auth.password', { infer: true });
  }

  async onModuleInit(): Promise<void> {
    // Pre-hash a throwaway value so sign-in attempts against unknown accounts
    // burn the same CPU time as real verifications (timing equalization).
    this.dummyHash = await this.hash(generateOpaqueToken(16));
  }

  /** Throws WEAK_PASSWORD (with per-rule details) when the policy is not met. */
  validateOrThrow(password: string): void {
    const violations = this.collectViolations(password);
    if (violations.length > 0) {
      throw new AppException('WEAK_PASSWORD', { details: { violations } });
    }
  }

  collectViolations(password: string): PasswordViolation[] {
    const { minLength, maxLength, requireLetter, requireDigit, requireSymbol, requireUppercase } =
      this.policy;

    const violations: PasswordViolation[] = [];
    if (password.length < minLength) {
      violations.push({
        rule: 'minLength',
        message: `Must be at least ${String(minLength)} characters long.`,
      });
    }
    if (password.length > maxLength) {
      violations.push({
        rule: 'maxLength',
        message: `Must be at most ${String(maxLength)} characters long.`,
      });
    }
    if (requireLetter && !/[A-Za-z]/.test(password)) {
      violations.push({ rule: 'letter', message: 'Must contain at least one letter.' });
    }
    if (requireDigit && !/\d/.test(password)) {
      violations.push({ rule: 'digit', message: 'Must contain at least one digit.' });
    }
    if (requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
      violations.push({ rule: 'symbol', message: 'Must contain at least one symbol.' });
    }
    if (requireUppercase && !/[A-Z]/.test(password)) {
      violations.push({
        rule: 'uppercase',
        message: 'Must contain at least one uppercase letter.',
      });
    }
    return violations;
  }

  hash(password: string): Promise<string> {
    return argon2Hash(password, PasswordService.ARGON2_OPTIONS);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    try {
      return await argon2Verify(passwordHash, password);
    } catch {
      // Malformed stored hash must never authenticate anyone.
      return false;
    }
  }

  /** Constant-cost verification used when the account does not exist. */
  async verifyDummy(): Promise<void> {
    if (this.dummyHash === null) {
      return;
    }
    await this.verify('timing-equalization-value', this.dummyHash);
  }
}
