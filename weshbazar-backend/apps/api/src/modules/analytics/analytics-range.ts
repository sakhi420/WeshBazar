/**
 * Analytics range parsing (spec §71–§72).
 *
 * Admin and seller summaries share one range contract: optional `from`/`to`
 * ISO dates (or datetimes), defaulting to the last 30 UTC days, capped at 92
 * days so a single request can never scan an unbounded window. Day buckets
 * are always UTC — the database session is pinned to UTC — so a "day" means
 * the same thing everywhere.
 */
import { AppException } from '../../common/errors/app.exception';

/** Hard cap on the requested range (≈ a quarter). */
const MAX_RANGE_DAYS = 92;

/** Default window when `from` is omitted. */
const DEFAULT_RANGE_DAYS = 30;

const MS_PER_DAY = 86_400_000;

export interface AnalyticsRange {
  /** Midnight UTC of the first day in range (inclusive). */
  fromDay: Date;
  /** Midnight UTC of the last day in range (inclusive). */
  toDay: Date;
  /** Exclusive SQL upper bound: `toDay` + 1 day. */
  until: Date;
  /** Every UTC day of the range as `YYYY-MM-DD`, ascending. */
  days: string[];
}

/** `YYYY-MM-DD` in UTC. */
export function formatDay(day: Date): string {
  return day.toISOString().slice(0, 10);
}

export function resolveAnalyticsRange(
  from?: string,
  to?: string,
  now: Date = new Date(),
): AnalyticsRange {
  const toDate = to === undefined ? now : new Date(to);
  if (Number.isNaN(toDate.getTime())) {
    throw invalidRange('to', '`to` must be a valid ISO-8601 date.');
  }
  const fromDate =
    from === undefined
      ? new Date(toDate.getTime() - (DEFAULT_RANGE_DAYS - 1) * MS_PER_DAY)
      : new Date(from);
  if (Number.isNaN(fromDate.getTime())) {
    throw invalidRange('from', '`from` must be a valid ISO-8601 date.');
  }

  const fromDay = utcMidnight(fromDate);
  const toDay = utcMidnight(toDate);
  if (fromDay.getTime() > toDay.getTime()) {
    throw invalidRange('from', '`from` must not be after `to`.');
  }

  const days: string[] = [];
  for (let day = fromDay.getTime(); day <= toDay.getTime(); day += MS_PER_DAY) {
    days.push(formatDay(new Date(day)));
  }
  if (days.length > MAX_RANGE_DAYS) {
    throw invalidRange('from', `Analytics ranges are capped at ${MAX_RANGE_DAYS} days.`);
  }

  return {
    fromDay,
    toDay,
    until: new Date(toDay.getTime() + MS_PER_DAY),
    days,
  };
}

function utcMidnight(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

function invalidRange(field: 'from' | 'to', message: string): AppException {
  return new AppException('VALIDATION_ERROR', {
    details: { errors: [{ field, messages: [message] }] },
  });
}
