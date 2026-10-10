/**
 * Media feature (master prompt §22, §35, §47).
 * Owns: multipart image upload (field `file`), reorder/remove, gallery
 * limits + fast-fail selection checks, and the local pending-image queue
 * behind the sell wizard gallery. Backend decision always wins.
 */
export * from './limits';
export * from './types';
export * from './validate';
export * from './api';
