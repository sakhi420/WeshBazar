import { Global, Module } from '@nestjs/common';
import { InMemoryRateLimiter, RATE_LIMITER, type RateLimiter } from './rate-limiter';
import { RateLimitService } from './rate-limit.service';

/**
 * Global so any feature module can enforce limits without importing this
 * module. Swap the `RATE_LIMITER` factory to move to a distributed limiter.
 */
@Global()
@Module({
  providers: [
    {
      provide: RATE_LIMITER,
      useFactory: (): RateLimiter => new InMemoryRateLimiter(),
    },
    RateLimitService,
  ],
  exports: [RateLimitService],
})
export class RateLimitModule {}
