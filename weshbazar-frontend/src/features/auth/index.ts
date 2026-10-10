/**
 * Auth feature (master prompt §7, §15, §16).
 * Owns: login/register/verify/forgot/reset flows, the in-memory access-token
 * lifecycle, single-flight refresh integration, `useAuth` state, and route
 * guarding UX. Uses the API boundary — never touches the refresh cookie.
 *
 * Note: components live in `./components` and are deliberately NOT re-exported
 * here — the forms import this barrel, so re-exporting them would create an
 * import cycle. Pages import forms from `@/features/auth/components`.
 */
export * from './types';
export * from './validation';
export * from './api';
export * from './hooks';
