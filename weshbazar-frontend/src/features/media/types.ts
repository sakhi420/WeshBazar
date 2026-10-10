/**
 * Media feature — local view models (master prompt §35, §47).
 * These describe client-side state only; the wire contract for image
 * mutations is `OwnerListingDto` from `@/features/listings`.
 */

/**
 * One locally picked image waiting to be uploaded to the listing gallery.
 * Lives in memory only — `File` handles cannot be restored after a reload.
 */
export interface PendingImage {
  /** Local-only id for React keys and queue bookkeeping (never sent). */
  id: string;
  file: File;
  /** Object URL for previews; revoked when the item is removed. */
  url: string;
  /** Intrinsic dimensions read at pick time (0 when decode failed). */
  width: number;
  height: number;
}
