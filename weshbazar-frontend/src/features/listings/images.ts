/**
 * Listings feature — image helpers (master prompt §47–48).
 *
 * The backend DTO carries a base `url` plus named variants. The UI picks the
 * smallest variant that fits the target slot and always renders explicit
 * width/height so layout stays stable (no CLS). Never fabricates geometry.
 */

import type { ListingImage, ListingImageVariant } from './types';

export type ImageVariantName = 'thumbnail' | 'medium' | 'large';

/**
 * Pick a display variant, degrading gracefully: preferred → medium →
 * thumbnail → large → base url with the DTO's own dimensions.
 */
export function pickImageVariant(
  image: ListingImage,
  preferred: ImageVariantName = 'medium',
): ListingImageVariant {
  const order: ImageVariantName[] = [preferred, 'medium', 'thumbnail', 'large'];
  for (const name of order) {
    const variant = image.variants?.[name];
    if (variant?.url) return variant;
  }
  return { url: image.url, width: image.width, height: image.height };
}

/** Primary image of a listing/feed item, if any. */
export function primaryImageOf(images: ListingImage[] | undefined): ListingImage | null {
  if (!images || images.length === 0) return null;
  return images.find((image) => image.isPrimary) ?? images[0] ?? null;
}
