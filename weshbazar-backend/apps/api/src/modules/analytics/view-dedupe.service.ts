/**
 * Listing view-count anti-abuse (spec §73).
 *
 * View counts are marketplace analytics, not financial records — they may be
 * approximate. This service applies the §73 policy before a view is counted:
 *
 *   - deduplication: the same (listing, client, user-agent) triple counts at
 *     most once per `VIEW_DEDUPE_WINDOW_SECONDS` (default 12 h);
 *   - per-client budget: at most `MAX_LISTING_VIEWS_PER_WINDOW` counted views
 *     per client IP per window, so rotating user-agents cannot inflate
 *     counters beyond the budget;
 *   - retention: no raw IP addresses are stored. The dedupe key is a SHA-256
 *     fingerprint of listing + IP + user-agent, kept only in a bounded
 *     in-memory map whose entries expire with the window and are wiped on
 *     restart (documented retention: <= the dedupe window).
 *
 * The in-memory map matches the single-instance MVP rate limiter; when the
 * platform scales out, this becomes the same shared store as the limiter.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import type { AppConfig } from '../../config/config.types';

/**
 * Hard cap on live dedupe entries. The window keeps this naturally small;
 * the cap protects memory if a flood ever outpaces expiration pruning.
 */
const MAX_DEDUPE_ENTRIES = 100_000;

export interface ViewCandidate {
  listingId: string;
  clientIp: string;
  userAgent: string | null;
  /** Injectable clock for tests; defaults to now. */
  at?: Date;
}

@Injectable()
export class ViewDedupeService {
  /** Fingerprint → expiry timestamp (epoch ms). Never contains raw IPs. */
  private readonly seen = new Map<string, number>();
  private readonly windowSeconds: number;
  private readonly maxCountedPerWindow: number;

  constructor(
    private readonly rateLimitService: RateLimitService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.windowSeconds = configService.get('listing.viewDedupeWindowSeconds', { infer: true });
    this.maxCountedPerWindow = configService.get('rateLimit.listingViewPerWindow', { infer: true });
  }

  /**
   * True when this view should be counted. Callers only increment counters on
   * `true`; a `false` never fails or delays the read (§73: analytics must not
   * block the marketplace).
   */
  shouldCount(candidate: ViewCandidate): boolean {
    const nowMs = (candidate.at ?? new Date()).getTime();
    const key = fingerprint(candidate.listingId, candidate.clientIp, candidate.userAgent);

    const expiry = this.seen.get(key);
    if (expiry !== undefined && expiry > nowMs) {
      return false;
    }
    if (expiry !== undefined) {
      this.seen.delete(key);
    }

    const budget = this.rateLimitService.consume(
      'listing:view:ip',
      candidate.clientIp,
      this.maxCountedPerWindow,
      this.windowSeconds,
    );
    if (!budget.allowed) {
      return false;
    }

    this.seen.set(key, nowMs + this.windowSeconds * 1_000);
    this.prune(nowMs);
    return true;
  }

  /** Test helper: drop all fingerprints (rate limiter resets separately). */
  reset(): void {
    this.seen.clear();
  }

  /**
   * Expired entries are normally overwritten by their own key; the map only
   * needs active pruning when it grows past the hard cap (insertion order is
   * expiry order here — every entry lives for exactly one window — so the
   * oldest entries are removed first).
   */
  private prune(nowMs: number): void {
    if (this.seen.size <= MAX_DEDUPE_ENTRIES) {
      return;
    }
    for (const [key, expiry] of this.seen) {
      if (expiry <= nowMs || this.seen.size > MAX_DEDUPE_ENTRIES) {
        this.seen.delete(key);
        continue;
      }
      break;
    }
  }
}

/** Short-lived, non-reversible view fingerprint (§73: no raw IPs at rest). */
function fingerprint(listingId: string, clientIp: string, userAgent: string | null): string {
  return createHash('sha256')
    .update(`${listingId}|${clientIp}|${userAgent ?? ''}`)
    .digest('hex');
}
