/**
 * UUID helpers for service-level guards.
 *
 * Route params are validated by `ParseUUIDPipe`; services additionally guard
 * IDs that arrive from other services or raw payloads, because passing a
 * malformed UUID to PostgreSQL raises a cast error (22P02) instead of a
 * not-found result.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
