/**
 * Shared admin-module types (spec §62).
 *
 * `AdminActionContext` carries request-derived audit fields between the
 * admin controllers and services. It is intentionally limited to ip and
 * user-agent — nothing else from the request ever reaches an audit row.
 */
export interface AdminActionContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}
