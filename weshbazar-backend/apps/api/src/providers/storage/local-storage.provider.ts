/**
 * Local filesystem storage provider — development and test only (spec §64).
 *
 * Objects live under the configured `LOCAL_STORAGE_PATH` root and are served
 * publicly through the `/media/` static route registered in `bootstrap.ts`.
 * Keys are mapped to absolute paths with an explicit containment check, so
 * even a future upstream bug cannot escape the storage root.
 */
import { access, mkdir, readdir, rm, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { assertSafeStorageKey, type StorageProvider, type StoredObject } from './storage.provider';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;
  private readonly publicBaseUrl: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.root = path.resolve(configService.get('storage.localStoragePath', { infer: true }));
    this.publicBaseUrl = configService
      .get('storage.publicBaseUrl', { infer: true })
      .replace(/\/+$/, '');
  }

  /**
   * Local storage serves files with the extension-appropriate content type
   * through the static plugin, so the declared upload MIME type is not stored.
   */
  async put(key: string, data: Buffer, _contentType: string): Promise<void> {
    const target = this.resolveInsideRoot(assertSafeStorageKey(key));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
  }

  async delete(key: string): Promise<void> {
    const target = this.resolveInsideRoot(assertSafeStorageKey(key));
    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    });
  }

  /**
   * Deletes the whole key subtree — used to drop an image's original together
   * with its generated variants in one call.
   */
  async deletePrefix(prefix: string): Promise<number> {
    if (prefix.length === 0) {
      throw new Error('deletePrefix requires a non-empty prefix.');
    }
    const objects = await this.list(assertSafeStorageKey(prefix));
    if (objects.length === 0) {
      return 0;
    }
    const target = this.resolveInsideRoot(prefix);
    await rm(target, { recursive: true, force: true });
    return objects.length;
  }

  async exists(key: string): Promise<boolean> {
    // Key validation stays outside the try: an unsafe key must surface as an
    // error, only filesystem absence answers `false`.
    const target = this.resolveInsideRoot(assertSafeStorageKey(key));
    try {
      await access(target);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/media/${assertSafeStorageKey(key)}`;
  }

  /**
   * Lists objects under a directory-shaped key prefix (e.g. `listings/`,
   * `listings/<id>/<imageId>`). Sibling-prefix text matching (`abc` matching
   * `abc-def`) is intentionally not supported; generated keys always use
   * directory boundaries.
   */
  async list(prefix: string): Promise<StoredObject[]> {
    const validated = prefix.length === 0 ? '' : assertSafeStorageKey(prefix);
    /**
     * A trailing slash (`listings/`) is accepted for readability, but the
     * recursive walker concatenates `${keyPrefix}/${entry.name}`; leaving the
     * slash in would produce double slashes in every returned key, which
     * breaks downstream shape-parsers (parseListingImageId expects exactly
     * four slash-separated segments with no empties).
     */
    const normalized = validated.replace(/\/+$/, '');
    const target = this.resolveInsideRoot(normalized);
    const info = await stat(target).catch(() => null);
    if (info === null) {
      return [];
    }
    if (info.isFile()) {
      return [{ key: normalized, size: info.size, lastModified: info.mtime }];
    }
    if (!info.isDirectory()) {
      return [];
    }
    const objects: StoredObject[] = [];
    await this.walk(target, normalized, objects);
    return objects;
  }

  private async walk(absoluteDir: string, keyPrefix: string, out: StoredObject[]): Promise<void> {
    const entries = await readdir(absoluteDir, { withFileTypes: true });
    for (const entry of entries) {
      const childAbsolute = path.join(absoluteDir, entry.name);
      const childKey = keyPrefix.length === 0 ? entry.name : `${keyPrefix}/${entry.name}`;
      if (entry.isDirectory()) {
        await this.walk(childAbsolute, childKey, out);
      } else if (entry.isFile()) {
        const info = await stat(childAbsolute);
        out.push({ key: childKey, size: info.size, lastModified: info.mtime });
      }
    }
  }

  /** Maps a validated key to an absolute path that is inside the root. */
  private resolveInsideRoot(key: string): string {
    const resolved = path.resolve(this.root, key);
    if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
      throw new Error(`Storage key escapes the storage root: "${key}".`);
    }
    return resolved;
  }
}
