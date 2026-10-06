/**
 * Application-facing rate limiting service.
 *
 * Scopes are namespaced strings ("auth:login:ip", "listings:create:user", …)
 * so different flows never collide. Identifiers can be IPs, phone numbers or
 * user ids — they are never logged (phone numbers are PII).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../errors/app.exception';
import type { AppConfig } from '../../config/config.types';
import { RATE_LIMITER, type RateLimitConsumption, type RateLimiter } from './rate-limiter';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly defaultWindowSeconds: number;

  constructor(
    @Inject(RATE_LIMITER) private readonly limiter: RateLimiter,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.defaultWindowSeconds = configService.get('rateLimit.windowSeconds', { infer: true });
  }

  /** Consume one unit for `scope` + `identifier`; throws RATE_LIMITED when exhausted. */
  enforce(scope: string, identifier: string, limit: number, windowSeconds?: number): void {
    const result = this.consume(scope, identifier, limit, windowSeconds);
    if (!result.allowed) {
      this.logger.warn(
        `Rate limit exceeded for scope "${scope}" (retry in ${String(result.retryAfterSeconds)}s).`,
      );
      throw new AppException('RATE_LIMITED', {
        details: { scope, retryAfterSeconds: result.retryAfterSeconds },
      });
    }
  }

  /** Non-throwing variant for callers that react to the result themselves. */
  consume(
    scope: string,
    identifier: string,
    limit: number,
    windowSeconds: number = this.defaultWindowSeconds,
  ): RateLimitConsumption {
    return this.limiter.consume(`${scope}:${identifier}`, limit, windowSeconds);
  }

  /** Test/warm-up helper: clear all counters or those of one scope. */
  reset(scope?: string): void {
    this.limiter.reset(scope);
  }
}
