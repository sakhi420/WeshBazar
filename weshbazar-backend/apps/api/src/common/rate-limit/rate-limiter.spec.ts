import { InMemoryRateLimiter } from './rate-limiter';

describe('InMemoryRateLimiter', () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter();
  });

  afterEach(() => {
    limiter.reset();
    jest.useRealTimers();
  });

  it('allows requests up to the limit and blocks the next one', () => {
    for (let i = 0; i < 3; i += 1) {
      expect(limiter.consume('scope:key', 3, 60).allowed).toBe(true);
    }

    const blocked = limiter.consume('scope:key', 3, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.limit).toBe(3);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('reports a decreasing remaining allowance', () => {
    expect(limiter.consume('k', 5, 60).remaining).toBe(4);
    expect(limiter.consume('k', 5, 60).remaining).toBe(3);
    expect(limiter.consume('k', 5, 60).remaining).toBe(2);
  });

  it('tracks keys independently', () => {
    limiter.consume('a', 1, 60);
    const other = limiter.consume('b', 1, 60);
    expect(other.allowed).toBe(true);
  });

  it('resets the window once it expires', () => {
    jest.useFakeTimers();
    expect(limiter.consume('k', 2, 60).allowed).toBe(true);
    expect(limiter.consume('k', 2, 60).allowed).toBe(true);
    expect(limiter.consume('k', 2, 60).allowed).toBe(false);

    jest.advanceTimersByTime(61_000);
    expect(limiter.consume('k', 2, 60).allowed).toBe(true);
  });

  it('clears only matching keys when a prefix is provided', () => {
    limiter.consume('auth:login:1.2.3.4', 1, 60);
    limiter.consume('listings:create:user-1', 1, 60);

    limiter.reset('auth:login');

    expect(limiter.consume('auth:login:1.2.3.4', 1, 60).allowed).toBe(true);
    expect(limiter.consume('listings:create:user-1', 1, 60).allowed).toBe(false);
  });
});
