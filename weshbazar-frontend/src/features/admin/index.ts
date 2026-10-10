/**
 * Admin feature (master prompt §43–49, §51, §52).
 * Owns: dashboard/analytics, users, listings moderation queue, reports queue,
 * taxonomy, locations, and audit-log views. Uses page pagination. Role-based UI
 * visibility only — the backend authorizes every action (§42).
 *
 * Note: components live in `./components` and are deliberately NOT re-exported
 * here — the view imports this barrel, so re-exporting it would create an
 * import cycle. Pages import the view from `@/features/admin/components`.
 */
export * from './types';
export * from './model';
export * from './api';
export * from './hooks';
export * from './errors';
