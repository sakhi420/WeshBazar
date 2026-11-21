/**
 * Binds the configured storage provider name (`STORAGE_PROVIDER`) to a
 * `StorageProvider` implementation (spec §64). Unknown names fail fast at
 * startup; spec §64 reserves local storage for development, so using it in
 * production logs a warning (production should use object storage).
 */
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { NeonObjectStorageProvider } from './neon-object-storage.provider';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from './storage.provider';

@Module({
  providers: [
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, LocalStorageProvider],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
        local: LocalStorageProvider,
      ): StorageProvider => {
        const provider = configService.get('storage.provider', { infer: true });
        switch (provider) {
          case 'local':
            if (configService.get('app.isProduction', { infer: true })) {
              new Logger('StorageModule').warn(
                'STORAGE_PROVIDER=local in production; spec §64 reserves local storage for development.',
              );
            }
            return local;
          case 'neon':
            return new NeonObjectStorageProvider(
              configService.get('storage.neon', { infer: true }),
            );
          default:
            throw new Error(`Unsupported STORAGE_PROVIDER "${String(provider)}".`);
        }
      },
    },
  ],
  exports: [STORAGE_PROVIDER, LocalStorageProvider],
})
export class StorageModule {}
