/**
 * Storage provider abstraction (spec §64).
 *
 * The application never touches the filesystem or an object store directly;
 * the media pipeline depends on this interface so local development storage
 * can be swapped for S3-compatible object storage without touching listing
 * business logic. Keys are always server-generated, POSIX-style and relative
 * (e.g. `listings/<listingId>/<imageId>/original.jpg`) — never user input.
 */

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

/** Object metadata returned by `list` sweeps. */
export interface StoredObject {
  /** Key relative to the storage root, POSIX separators. */
  key: string;
  size: number;
  lastModified: Date;
}

export interface StorageProvider {
  /** Writes (or overwrites) an object. */
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  /** Removes a single object; a missing object is not an error. */
  delete(key: string): Promise<void>;
  /** Removes every object under a key prefix; returns how many were removed. */
  deletePrefix(prefix: string): Promise<number>;
  /** True when the object exists. */
  exists(key: string): Promise<boolean>;
  /** Public URL clients can load the object from. */
  getPublicUrl(key: string): string;
  /** Lists objects under a prefix (or the whole root for `''`). */
  list(prefix: string): Promise<StoredObject[]>;
}

/** Longest generated key; matches `ListingImage.storageKey` (VarChar(300)). */
const MAX_KEY_LENGTH = 300;

/**
 * Server-generated keys only: alphanumerics, dots, dashes, underscores and
 * forward slashes. This rejects backslashes, control characters, leading
 * slashes and anything else that could smuggle path semantics.
 */
const SAFE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/**
 * Validates a key or key prefix against the storage naming contract. Called by
 * every provider implementation as defense in depth: keys reach storage only
 * through service code, but a single upstream bug must not become path
 * traversal (spec §65).
 */
export function assertSafeStorageKey(key: string): string {
  const segments = key.split('/');
  const unsafe =
    key.length === 0 ||
    key.length > MAX_KEY_LENGTH ||
    !SAFE_KEY_PATTERN.test(key) ||
    key.includes('//') ||
    segments.some((segment) => segment === '.' || segment === '..');
  if (unsafe) {
    throw new Error(`Unsafe storage key rejected: "${key}".`);
  }
  return key;
}
