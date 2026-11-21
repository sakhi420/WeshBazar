/**
 * Bahar Future Afghan SMS gateway adapter.
 *
 * Uses HTTPS POST with URL-encoded form data so credentials never appear in
 * the request URL. Only the vendor-documented HTTP 500 response is retried;
 * timeouts are not retried because acceptance may be ambiguous.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import type { SendVerificationCodeInput, SmsProvider } from './sms.provider';
import { renderSmsMessage } from './sms-message';

type BaharFutureConfig = AppConfig['providers']['smsBaharFuture'];

const BAHAR_FUTURE_SEND_URL = 'https://sms.baharfuture.com/send';

@Injectable()
export class BaharFutureSmsProvider implements SmsProvider {
  private readonly logger = new Logger(BaharFutureSmsProvider.name);
  private readonly config: BaharFutureConfig;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.config = configService.get('providers.smsBaharFuture', { infer: true });
  }

  async sendVerificationCode({ phone, code, purpose }: SendVerificationCodeInput): Promise<void> {
    const { username, password } = this.config;
    if (!username || !password) {
      throw new Error(
        'Bahar Future SMS is not configured: set BAHAR_FUTURE_USERNAME and BAHAR_FUTURE_PASSWORD.',
      );
    }

    const to = this.normalizeDestination(phone);
    const params = new URLSearchParams({
      username,
      password,
      to,
      content: renderSmsMessage(this.config.messageTemplate, { code, purpose }),
    });
    if (this.config.sender) params.set('from', this.config.sender);

    const maxAttempts = this.config.maxRetries + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await fetch(BAHAR_FUTURE_SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params.toString(),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      const body = await response.text();

      if (response.status === 500 && attempt + 1 < maxAttempts) {
        this.logger.warn(
          `Bahar Future returned HTTP 500; retrying submission (attempt ${attempt + 1}/${maxAttempts}).`,
        );
        await this.backoff(attempt);
        continue;
      }

      if (!response.ok) throw this.gatewayError(response.status);

      const messageId = body.trim().replace(/^"(.*)"$/s, '$1').trim();
      if (!messageId || /^error\b/i.test(messageId)) {
        throw new Error('Bahar Future returned HTTP 200 without a valid SMS message ID.');
      }
      return;
    }
  }

  private normalizeDestination(phone: string): string {
    const digits = phone.trim().replace(/^\+/, '');
    // Auth stores Afghan phones in E.164; Bahar Future requires digits without '+'.
    if (!/^93\d{9}$/.test(digits)) {
      throw new Error('Bahar Future requires an Afghan destination in 93XXXXXXXXX format.');
    }
    return digits;
  }

  private gatewayError(status: number): Error {
    switch (status) {
      case 400:
        return new Error('Bahar Future rejected the SMS arguments or destination number (HTTP 400).');
      case 403:
        return new Error(
          'Bahar Future rejected the credentials or the prepaid account balance is insufficient (HTTP 403).',
        );
      case 412:
        return new Error('Bahar Future has no active SMS route for this recipient operator (HTTP 412).');
      case 500:
        return new Error('Bahar Future could not submit the SMS to the operator (HTTP 500).');
      default:
        return new Error(`Bahar Future SMS gateway returned HTTP ${status}.`);
    }
  }

  private async backoff(attempt: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, Math.min(250 * 2 ** attempt, 2_000)));
  }
}
