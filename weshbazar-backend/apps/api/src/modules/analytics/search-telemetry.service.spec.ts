/**
 * Unit tests for zero-result search telemetry (owner decision D3).
 *
 * The points under test are the intent gate (a no-intent ping must not spend
 * rate-limit budget) and the event shape (rate-limited then logged).
 */
import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import type { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { SearchTelemetryService } from './search-telemetry.service';

function makeService(): { service: SearchTelemetryService; enforce: jest.Mock } {
  const enforce = jest.fn();
  const rateLimit = { enforce } as unknown as RateLimitService;
  const config = { get: jest.fn(() => 30) } as unknown as ConfigService<AppConfig, true>;
  return { service: new SearchTelemetryService(rateLimit, config), enforce };
}

describe('SearchTelemetryService', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('ignores a no-intent ping without spending rate-limit budget', () => {
    const { service, enforce } = makeService();

    service.recordZeroResult({}, '1.2.3.4');

    expect(enforce).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('rate-limits and logs a real zero-result query', () => {
    const { service, enforce } = makeService();

    service.recordZeroResult({ q: '  iphone  ', category: 'mobile-phones' }, '1.2.3.4');

    expect(enforce).toHaveBeenCalledWith('search:zero-result:ip', '1.2.3.4', 30);

    const logArgs = logSpy.mock.calls[0] as [
      { event: string; q?: string; category?: string; province?: string },
      string,
    ];
    expect(logArgs[0]).toMatchObject({
      event: 'search.zero_result',
      q: 'iphone',
      category: 'mobile-phones',
    });
    expect(logArgs[1]).toBe('ZeroResultSearch');
  });
});