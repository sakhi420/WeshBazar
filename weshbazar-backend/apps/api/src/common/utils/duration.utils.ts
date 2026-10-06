/**
 * Duration parsing for configuration values like "15m", "30d" or "3600s".
 * The env schema validates the format; this helper converts a duration to
 * seconds (cookie max-age, token TTL metadata in API responses).
 */

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

export function parseDurationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration value "${value}" (expected formats like "15m", "30d" or "3600s").`,
    );
  }
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];
  return amount * UNIT_SECONDS[unit];
}
