/**
 * Structured logging.
 *
 * Pino is the single logging backend. In development a pino-pretty transport
 * makes logs human-readable; in production logs are emitted as JSON lines to
 * stdout. Sensitive headers are redacted, every request log carries the
 * request ID (assigned by Fastify's `genReqId`), and health-probe noise is
 * suppressed.
 *
 * Request-scoped context (userId, sellerAccountId, errorCode) is attached by
 * guards/filters as those layers come online.
 */
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule, type Params } from 'nestjs-pino';
import type { AppConfig } from '../config/config.types';

export function buildPinoHttpOptions(app: AppConfig['app']): Params['pinoHttp'] {
  return {
    level: app.logLevel,
    ...(app.isProduction
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              translateTime: 'SYS:HH:MM:ss.l',
              ignore: 'pid,hostname',
            },
          },
        }),
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '[REDACTED]',
    },
    customProps: (request) => ({
      requestId: (request as { id?: unknown }).id,
    }),
    autoLogging: {
      // Health probes are polled constantly; log them only at debug level.
      ignore: (request) =>
        typeof request.url === 'string' &&
        (request.url === '/health/live' || request.url === '/health/ready'),
    },
  };
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        pinoHttp: buildPinoHttpOptions(configService.get('app', { infer: true })),
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
