/**
 * Rate limiting abstraction.
 *
 * `RateLimiter` is the seam between the application and the limiter
 * implementation. The MVP ships with a single-process, in-memory fixed-window
 * limiter: it protects ONE API replica only and provides NO distributed
 * enforcement. When multiple replicas or shared counters are required, add a
 * Redis-backed implementation of this interface and swap the provider in
 * `RateLimitModule` (see docs/implementation-status.md).
 */

export const RATE_LIMITER = Symbol('RATE_LIMITER');

export interface RateLimitConsumption {
  allowed: boolean;
  /** Configured maximum for the window. */
  limit: number;
  /** Remaining allowance in the current window (0 once exhausted). */
  remaining: number;
  /** Seconds until the window resets — meaningful when not allowed. */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  consume(key: string, limit: number, windowSeconds: number): RateLimitConsumption;
  reset(keyPrefix?: string): void;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, WindowEntry>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
    // Housekeeping must never keep the process alive on its own.
    this.cleanupTimer.unref();
  }

  consume(key: string, limit: number, windowSeconds: number): RateLimitConsumption {
    const now = Date.now();
    const entry = this.windows.get(key);

    if (!entry || entry.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, limit, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 };
    }

    entry.count += 1;
    const allowed = entry.count <= limit;
    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - entry.count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  reset(keyPrefix?: string): void {
    if (keyPrefix === undefined) {
      this.windows.clear();
      return;
    }
    for (const key of this.windows.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.windows.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.windows) {
      if (entry.resetAt <= now) {
        this.windows.delete(key);
      }
    }
  }
}
