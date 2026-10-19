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
import { SearchEventDto } from './dto/search-event.dto';
import { SearchZeroResultDto } from './dto/zero-result.dto';

@Injectable()
export class SearchTelemetryService {
  private readonly logger = new Logger(SearchTelemetryService.name);
  private readonly searchPerWindow: number;
  private readonly searchEventsPerWindow: number;

  constructor(
    private readonly rateLimitService: RateLimitService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.searchPerWindow = configService.get('rateLimit.searchPerWindow', { infer: true });
    this.searchEventsPerWindow = configService.get('rateLimit.searchEventsPerWindow', { infer: true });
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

  recordEvent(dto: SearchEventDto, clientIp: string): void {
    this.rateLimitService.enforce('search:events:ip', clientIp, this.searchEventsPerWindow);

    this.logger.log(
      {
        event: 'search.event',
        type: dto.type,
        ...(dto.q ? { q: dto.q } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.province ? { province: dto.province } : {}),
        ...(dto.sort ? { sort: dto.sort } : {}),
        ...(dto.filterKey ? { filterKey: dto.filterKey } : {}),
        ...(dto.filterValue ? { filterValue: dto.filterValue } : {}),
        ...(dto.count !== undefined && dto.count !== null ? { count: dto.count } : {}),
        ...(dto.listingId ? { listingId: dto.listingId } : {}),
      },
      'SearchEvent',
    );
  }
}