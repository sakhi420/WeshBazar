/**
 * Media feature — fast-fail selection pre-checks (master prompt §35, §47).
 *
 * The backend re-encodes and validates every upload against magic bytes, so
 * these checks exist purely to give instant Persian feedback (wrong format,
 * too large, gallery already full) without a network round trip. The server
 * decision always wins.
 */

import { ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_LISTING, MAX_UPLOAD_SIZE_BYTES } from './limits';

/** One rejected file with the Persian reason shown to the user. */
export interface ImageRejection {
  fileName: string;
  message: string;
}

export interface ImageSelectionResult {
  accepted: File[];
  rejected: ImageRejection[];
}

const UNSUPPORTED_MESSAGE = 'فقط تصاویر JPEG، PNG و WebP پذیرفته می‌شوند.';
const TOO_LARGE_MESSAGE = 'حجم تصویر بیشتر از ۵ مگابایت است.';
const LIMIT_MESSAGE = 'حداکثر ۱۰ تصویر برای هر آگهی مجاز است.';

/**
 * Validate a multi-file selection against the documented limits.
 * `currentCount` is the number of images already attached (uploaded or
 * queued) so the remaining-capacity check is exact.
 */
export function validateImageSelection(
  files: readonly File[],
  currentCount: number,
): ImageSelectionResult {
  const accepted: File[] = [];
  const rejected: ImageRejection[] = [];
  let remaining = Math.max(0, MAX_IMAGES_PER_LISTING - currentCount);

  for (const file of files) {
    const type = file.type.toLowerCase();
    if (!ACCEPTED_IMAGE_TYPES.includes(type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      rejected.push({ fileName: file.name, message: UNSUPPORTED_MESSAGE });
      continue;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      rejected.push({ fileName: file.name, message: TOO_LARGE_MESSAGE });
      continue;
    }
    if (remaining <= 0) {
      rejected.push({ fileName: file.name, message: LIMIT_MESSAGE });
      continue;
    }
    accepted.push(file);
    remaining -= 1;
  }

  return { accepted, rejected };
}
