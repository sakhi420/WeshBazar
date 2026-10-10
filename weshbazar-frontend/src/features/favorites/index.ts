/**
 * Favorites feature (master prompt §30, §43, §44).
 * Owns: favorite list/ids data access and the optimistic add/remove mutation
 * that keeps the favorite button, list, and any count in sync.
 *
 * Note: components live in `./components` and are deliberately NOT re-exported
 * here — they import this barrel, so re-exporting them would create an import
 * cycle. Consumers import them from `@/features/favorites/components`.
 */
export * from './types';
export * from './view-model';
export * from './api';
export * from './hooks';
