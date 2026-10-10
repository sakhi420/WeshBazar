/**
 * Media limits — mirror of the backend storage configuration defaults
 * (weshbazar-backend/.env: MAX_UPLOAD_SIZE=5242880, MAX_IMAGES_PER_LISTING=10,
 * §65). These power client-side fast-fail pre-checks only; the server remains
 * authoritative (IMAGE_TOO_LARGE / LISTING_IMAGE_LIMIT_REACHED win if the
 * deployed configuration differs).
 */

/** 5 MiB — `MAX_UPLOAD_SIZE`. */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

/** 10 images per listing — `MAX_IMAGES_PER_LISTING`. */
export const MAX_IMAGES_PER_LISTING = 10;

/** Formats accepted by the backend image processor (§65). */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** `accept` attribute for file inputs (mobile file pickers honor it). */
export const IMAGE_ACCEPT_ATTRIBUTE = 'image/*';

/** Human-readable size used in Persian copy. */
export const MAX_UPLOAD_SIZE_LABEL = '۵ مگابایت';
