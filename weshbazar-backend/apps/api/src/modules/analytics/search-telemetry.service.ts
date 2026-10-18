/**
 * Zero-result search telemetry (owner decision D3).
 *
 * Emits a lightweight, structured log event for searches that returned no
 * listings. Deliberately no database write: operators pipe the pino stream
 * into their analytics warehouse. Rate-limited per client IP and gated on
 * "there was a real intent" (q / category / province) so a bare empty feed is
 * never mistaken for demand.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { SearchZeroResultDto } from './dto/zero-result.dto';

@Injectable()
export class SearchTelemetryService {
  private readonly logger = new Logger(SearchTelemetryService.name);
  private readonly searchPerWindow: number;

  constructor(
    private readonly rateLimitService: RateLimitService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.searchPerWindow = configService.get('rateLimit.searchPerWindow', { infer: true });
  }

  recordZeroResult(dto: SearchZeroResultDto, clientIp: string): void {
    const q = dto.q?.trim();
    const category = dto.category ?? undefined;
    const province = dto.province ?? undefined;

    // No intent → not a demand signal; ignore before spending rate-limit budget.
    if (!q && !category && !province) {
      return;
    }

    this.rateLimitService.enforce('search:zero-result:ip', clientIp, this.searchPerWindow);

    this.logger.log(
      { event: 'search.zero_result', q: q || undefined, category, province },
      'ZeroResultSearch',
    );
  }
}