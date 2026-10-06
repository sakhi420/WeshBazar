import type { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { AppException } from '../../common/errors/app.exception';
import { PasswordService } from './password.service';

type PasswordPolicy = AppConfig['auth']['password'];

const basePolicy: PasswordPolicy = {
  minLength: 8,
  maxLength: 64,
  requireLetter: true,
  requireDigit: true,
  requireSymbol: false,
  requireUppercase: false,
};

function buildService(overrides: Partial<PasswordPolicy> = {}): PasswordService {
  const policy = { ...basePolicy, ...overrides };
  const configService = {
    get: () => policy,
  } as unknown as ConfigService<AppConfig, true>;
  return new PasswordService(configService);
}

function violationRules(error: unknown): string[] {
  expect(AppException.isAppException(error)).toBe(true);
  const exception = error as AppException;
  expect(exception.code).toBe('WEAK_PASSWORD');
  const details = exception.details as { violations: Array<{ rule: string; message: string }> };
  return details.violations.map((violation) => violation.rule);
}

describe('PasswordService', () => {
  describe('policy validation', () => {
    it('accepts a password that satisfies the policy', () => {
      const service = buildService();
      expect(() => service.validateOrThrow('Passw0rd')).not.toThrow();
    });

    it('rejects passwords below the minimum length', () => {
      const service = buildService();
      try {
        service.validateOrThrow('Pa0');
        throw new Error('expected WEAK_PASSWORD');
      } catch (error) {
        expect(violationRules(error)).toContain('minLength');
      }
    });

    it('reports every violated rule at once', () => {
      const service = buildService({ requireSymbol: true, requireUppercase: true });
      try {
        service.validateOrThrow('aaaaaaaa');
        throw new Error('expected WEAK_PASSWORD');
      } catch (error) {
        const rules = violationRules(error);
        expect(rules).toEqual(expect.arrayContaining(['digit', 'symbol', 'uppercase']));
        expect(rules).not.toContain('minLength');
        expect(rules).not.toContain('letter');
      }
    });

    it('rejects passwords above the maximum length', () => {
      const service = buildService({ minLength: 4, maxLength: 10 });
      try {
        service.validateOrThrow('Passw0rd123');
        throw new Error('expected WEAK_PASSWORD');
      } catch (error) {
        expect(violationRules(error)).toContain('maxLength');
      }
    });

    it('skips optional rules when they are disabled', () => {
      const service = buildService({ requireLetter: false, requireDigit: false });
      expect(service.collectViolations('!!!!!!!!')).toEqual([]);
    });
  });

  describe('hashing', () => {
    it('hashes to an argon2id string and verifies round-trip', async () => {
      const service = buildService();
      const digest = await service.hash('Passw0rd');
      expect(digest.startsWith('$argon2id$')).toBe(true);

      await expect(service.verify('Passw0rd', digest)).resolves.toBe(true);
      await expect(service.verify('Passw0rD', digest)).resolves.toBe(false);
    });

    it('never authenticates against a malformed stored hash', async () => {
      const service = buildService();
      await expect(service.verify('Passw0rd', 'not-a-hash')).resolves.toBe(false);
    });

    it('supports dummy verification for timing equalization', async () => {
      const service = buildService();
      await expect(service.verifyDummy()).resolves.toBeUndefined();

      await service.onModuleInit();
      await expect(service.verifyDummy()).resolves.toBeUndefined();
    });
  });
});
