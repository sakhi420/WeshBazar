/**
 * Account feature (master prompt §32, §33).
 * Owns: current-user profile read/update (GET/PATCH /me), sessions list and
 * revoke, change-phone and change-password flows.
 *
 * Note: components live in `./components` and are deliberately NOT re-exported
 * here — the view imports this barrel, so re-exporting it would create an
 * import cycle. Pages import the view from `@/features/account/components`.
 */
export * from './types';
export * from './format';
export * from './session-label';
export * from './api';
export * from './hooks';
