import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { HttpSmsProvider } from './http-sms.provider';
import { MockSmsProvider } from './mock-sms.provider';
import { SMS_PROVIDER, type SmsProvider } from './sms.provider';

/**
 * Binds the configured SMS provider name (`SMS_PROVIDER`) to an
 * implementation. Unknown provider names fail fast at startup.
 *
 * The mock provider is for development and tests only; in production a mock
 * would silently ship unverified phone numbers, so it is rejected at startup.
 */
@Module({
  providers: [
    MockSmsProvider,
    HttpSmsProvider,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService, MockSmsProvider, HttpSmsProvider],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
        mock: MockSmsProvider,
        http: HttpSmsProvider,
      ): SmsProvider => {
        const provider = configService.get('providers.sms', { infer: true });
        switch (provider) {
          case 'mock':
            if (configService.get('app.isProduction', { infer: true })) {
              throw new Error(
                'SMS_PROVIDER=mock is not allowed in production; set SMS_PROVIDER=http and configure SMS_GATEWAY_*.',
              );
            }
            return mock;
          case 'http':
            return http;
          default:
            throw new Error(`Unsupported SMS_PROVIDER "${provider}".`);
        }
      },
    },
  ],
  exports: [SMS_PROVIDER, MockSmsProvider],
})
export class SmsModule {}
