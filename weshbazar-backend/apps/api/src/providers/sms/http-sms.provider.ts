/**
 * HTTP SMS provider — the production delivery channel.
 *
 * Vendor-agnostic by design: when the Afghan aggregator is purchased, only the
 * `SMS_GATEWAY_*` environment variables change; no business logic is touched.
 * It assumes a JSON `POST` endpoint of the common shape `{ to, message, sender }`
 * authenticated with a configurable API-key header. If the chosen vendor
 * differs, write one new provider class behind `SmsProvider` — the auth flow
 * never changes.
 *
 * Delivery failures throw; `VerificationService` catches them, invalidates the
 * freshly issued challenge and surfaces `OTP_DELIVERY_FAILED`.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import type { SendVerificationCodeInput, SmsProvider } from './sms.provider';
import { renderSmsMessage } from './sms-message';

interface SmsHttpPayload {
  to: string;
  message: string;
  sender?: string;
}

type SmsHttpConfig = AppConfig['providers']['smsHttp'];

@Injectable()
export class HttpSmsProvider implements SmsProvider {
  private readonly logger = new Logger(HttpSmsProvider.name);
  private readonly config: SmsHttpConfig;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.config = configService.get('providers.smsHttp', { infer: true });
  }

  async sendVerificationCode({ phone, code, purpose }: SendVerificationCodeInput): Promise<void> {
    // Defense in depth: env.schema already refuses `http` without these, but a
    // programmatically-constructed provider must never silently no-op.
    const { gatewayUrl, apiKey } = this.config;
    if (!gatewayUrl || !apiKey) {
      throw new Error('HttpSmsProvider is not configured: set SMS_GATEWAY_URL and SMS_GATEWAY_API_KEY.');
    }

    const payload: SmsHttpPayload = {
      to: phone,
      message: renderSmsMessage(this.config.messageTemplate, { code, purpose }),
      ...(this.config.sender ? { sender: this.config.sender } : {}),
    };

    const maxAttempts = this.config.maxRetries + 1;
    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        await this.deliver(gatewayUrl, apiKey, payload);
        return;
      } catch (error) {
        lastError = error;
        if (attempt + 1 < maxAttempts) {
          this.logger.warn(
            `SMS delivery attempt ${attempt + 1}/${maxAttempts} failed; retrying: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          await this.backoff(attempt);
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('SMS delivery failed after exhausting retries.');
  }

  private async deliver(url: string, apiKey: string, payload: SmsHttpPayload): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [this.config.apiKeyHeader]: `${this.config.apiKeyPrefix}${apiKey}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`SMS gateway responded ${response.status} ${response.statusText}`);
    }
  }

  private async backoff(attempt: number): Promise<void> {
    // Exponential backoff (200ms, 400ms, 800ms, …), bounded by the retry count.
    await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 200));
  }
}