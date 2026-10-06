import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { MockSmsProvider } from './mock-sms.provider';
import { SMS_PROVIDER, type SmsProvider } from './sms.provider';

/**
 * Binds the configured SMS provider name (`SMS_PROVIDER`) to an
 * implementation. Unknown provider names fail fast at startup.
 */
@Module({
  providers: [
    MockSmsProvider,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService, MockSmsProvider],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
        mock: MockSmsProvider,
      ): SmsProvider => {
        const provider = configService.get('providers.sms', { infer: true });
        switch (provider) {
          case 'mock':
            return mock;
          default:
            throw new Error(`Unsupported SMS_PROVIDER "${provider}".`);
        }
      },
    },
  ],
  exports: [SMS_PROVIDER, MockSmsProvider],
})
export class SmsModule {}
