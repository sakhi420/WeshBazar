/**
 * Mock SMS provider — the development/test delivery channel.
 *
 * In non-production the "delivery" is the server console (debug level) so
 * developers can complete verification flows locally; the spec explicitly
 * allows exposing OTPs in development logs only. In production nothing is
 * logged — the most recent code is still tracked in memory so e2e tests can
 * read it via `getLastCode`, but this provider performs no real delivery.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import type { VerificationPurpose } from '../../generated/prisma/enums';
import type { SendVerificationCodeInput, SmsProvider } from './sms.provider';

interface DeliveredCode {
  code: string;
  sentAt: Date;
}

@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);
  private readonly delivered = new Map<string, DeliveredCode>();
  private readonly isProduction: boolean;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.isProduction = configService.get('app.isProduction', { infer: true });
  }

  sendVerificationCode({ phone, code, purpose }: SendVerificationCodeInput): Promise<void> {
    this.delivered.set(MockSmsProvider.key(phone, purpose), { code, sentAt: new Date() });

    if (!this.isProduction) {
      this.logger.debug(`Mock SMS delivery: ${purpose} code for ${phone}: ${code}`);
    }
    return Promise.resolve();
  }

  /** Test helper: most recent code "delivered" for a phone + purpose. */
  getLastCode(phone: string, purpose: VerificationPurpose): string | undefined {
    return this.delivered.get(MockSmsProvider.key(phone, purpose))?.code;
  }

  /** Test helper: forget delivered codes (isolates e2e cases). */
  clear(): void {
    this.delivered.clear();
  }

  private static key(phone: string, purpose: VerificationPurpose): string {
    return `${purpose}:${phone}`;
  }
}
