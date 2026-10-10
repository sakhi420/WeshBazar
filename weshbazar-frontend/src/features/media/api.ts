/**
 * Media feature — data access (master prompt §35, §47; backend spec §63–§67).
 *
 * Uploads are `multipart/form-data` with exactly one image file per request
 * (field name `file`); every mutation returns the refreshed `OwnerListingDto`
 * so the caller can re-render the gallery and pick up the new `version` in
 * one round trip. No idempotency key is sent — the frozen backend does not
 * require one for these routes.
 */

import { del, patch, request } from '@/lib/api';
import type { OwnerListing } from '@/features/listings';

/** Upload one image (`POST /listings/{id}/images`). */
export function uploadListingImage(listingId: string, file: File): Promise<OwnerListing> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return request<OwnerListing>(`/listings/${encodeURIComponent(listingId)}/images`, {
    method: 'POST',
    formData,
  }).then((envelope) => envelope.data);
}

/** Soft-delete one image (`DELETE /listings/{id}/images/{imageId}`). */
export function deleteListingImage(listingId: string, imageId: string): Promise<OwnerListing> {
  return del<OwnerListing>(
    `/listings/${encodeURIComponent(listingId)}/images/${encodeURIComponent(imageId)}`,
  );
}

/**
 * Reposition and/or re-flag the primary image
 * (`PATCH /listings/{id}/images/{imageId}/order`). At least one of
 * `sortOrder` / `isPrimary` must be provided (backend VALIDATION_ERROR
 * otherwise).
 */
export function reorderListingImage(
  listingId: string,
  imageId: string,
  input: { sortOrder?: number; isPrimary?: boolean },
): Promise<OwnerListing> {
  return patch<OwnerListing>(
    `/listings/${encodeURIComponent(listingId)}/images/${encodeURIComponent(imageId)}/order`,
    input,
  );
}
