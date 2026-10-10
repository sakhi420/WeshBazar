/**
 * Contacts feature (master prompt §2, §23, §36).
 * Owns: revealing seller contact methods (POST /listings/{id}/contact) with an
 * Idempotency-Key, phone/URL safety (bidi-isolated, no auto-dial surprises),
 * and the contact action UX.
 */
export * from './types';
export * from './api';
