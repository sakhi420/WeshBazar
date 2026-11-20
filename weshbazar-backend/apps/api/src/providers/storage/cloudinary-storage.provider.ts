/**
 * Cloudinary-backed image storage provider.
 *
 * Application storage keys stay stable, e.g. listings/<listingId>/<imageId>/original.jpg.
 * Cloudinary public IDs omit the file extension, so this provider maps keys to
 * extension-free IDs and reconstructs the image format for delivery and lists.
 *
 * Uses signed REST calls plus Node 24's built-in fetch/FormData; no SDK package
 * or new runtime dependency is required.
 */
import { createHash } from 'node:crypto';
import {
  assertSafeStorageKey,
  type StorageProvider,
  type StoredObject,
} from './storage.provider';

export interface CloudinaryStorageConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface CloudinaryResource {
  public_id?: string;
  format?: string;
  bytes?: number;
  created_at?: string;
}

type JsonObject = Record<string, unknown>;

const SUPPORTED_FORMATS = new Set(['jpg', 'jpeg', 'png', 'webp']);

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStorageKey(key: string): { publicId: string; format: string } {
  const safeKey = assertSafeStorageKey(key);
  const match = safeKey.match(/\.(jpg|jpeg|png|webp)$/i);
  if (!match || match.index === undefined) {
    throw new Error('Unsupported Cloudinary storage-key extension: "' + key + '".');
  }
  return {
    publicId: safeKey.slice(0, match.index),
    format: match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase(),
  };
}

export class CloudinaryStorageProvider implements StorageProvider {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly apiBase: string;
  private readonly deliveryBase: string;

  constructor(config: CloudinaryStorageConfig) {
    this.cloudName = config.cloudName;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary storage requires cloudName, apiKey and apiSecret.');
    }
    if (!/^[A-Za-z0-9_-]+$/.test(this.cloudName)) {
      throw new Error('Cloudinary cloud name contains unsupported characters.');
    }

    this.apiBase = 'https://api.cloudinary.com/v1_1/' + this.cloudName;
    this.deliveryBase = 'https://res.cloudinary.com/' + this.cloudName;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const parsed = parseStorageKey(key);
    if (contentType !== 'image/jpeg' && contentType !== 'image/png' && contentType !== 'image/webp') {
      throw new Error('Unsupported image content type for Cloudinary: "' + contentType + '".');
    }

    const params = {
      overwrite: 'true',
      public_id: parsed.publicId,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const form = new FormData();
    for (const [name, value] of Object.entries(params)) form.set(name, value);
    form.set('api_key', this.apiKey);
    form.set('signature', this.signature(params));
    const bytes = new Uint8Array(data.byteLength);
    bytes.set(data);
    const blob = new Blob([bytes.buffer], { type: contentType });
    const fileName = (parsed.publicId.split('/').at(-1) ?? 'image') + '.' + parsed.format;
    form.set('file', blob, fileName);

    const response = await fetch(this.apiBase + '/image/upload', {
      method: 'POST',
      body: form,
    });
    await this.readJson(response);
  }

  async delete(key: string): Promise<void> {
    const parsed = parseStorageKey(key);
    const params = {
      public_id: parsed.publicId,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const form = new FormData();
    for (const [name, value] of Object.entries(params)) form.set(name, value);
    form.set('api_key', this.apiKey);
    form.set('signature', this.signature(params));

    const response = await fetch(this.apiBase + '/image/destroy', {
      method: 'POST',
      body: form,
    });
    const payload = await this.readJson(response);
    if (payload.result !== 'ok' && payload.result !== 'not found') {
      throw new Error('Cloudinary failed to delete image "' + parsed.publicId + '".');
    }
  }

  async deletePrefix(prefix: string): Promise<number> {
    if (prefix.length === 0) {
      throw new Error('deletePrefix requires a non-empty prefix.');
    }
    const normalized = assertSafeStorageKey(prefix).replace(/\/+$/, '');
    const body = new URLSearchParams({ prefix: normalized + '/' });
    const response = await fetch(this.apiBase + '/resources/image/upload', {
      method: 'DELETE',
      headers: {
        ...this.adminHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const payload = await this.readJson(response);
    if (payload.partial === true) {
      throw new Error('Cloudinary only partially deleted prefix "' + normalized + '/".');
    }
    const deleted = isRecord(payload.deleted) ? Object.values(payload.deleted) : [];
    return deleted.filter((result) => result === 'deleted').length;
  }

  async exists(key: string): Promise<boolean> {
    const parsed = parseStorageKey(key);
    const query = new URLSearchParams();
    query.append('public_ids[]', parsed.publicId);
    const response = await fetch(this.apiBase + '/resources/image/upload?' + query, {
      method: 'GET',
      headers: this.adminHeaders(),
    });
    if (response.status === 404) return false;
    const payload = await this.readJson(response);
    const resources = Array.isArray(payload.resources) ? payload.resources : [];
    return resources.some(
      (resource) => isRecord(resource) && resource.public_id === parsed.publicId,
    );
  }

  getPublicUrl(key: string): string {
    const parsed = parseStorageKey(key);
    return this.deliveryBase + '/image/upload/' + parsed.publicId + '.' + parsed.format;
  }

  async list(prefix: string): Promise<StoredObject[]> {
    const normalized = prefix.length === 0
      ? ''
      : assertSafeStorageKey(prefix).replace(/\/+$/, '');
    const isExactFile = /\.(jpg|jpeg|png|webp)$/i.test(normalized);
    const publicIdPrefix = isExactFile ? parseStorageKey(normalized).publicId : normalized;
    const results: StoredObject[] = [];
    let cursor: string | undefined;

    do {
      const query = new URLSearchParams({ max_results: '500' });
      if (publicIdPrefix) {
        query.set('prefix', isExactFile ? publicIdPrefix : publicIdPrefix + '/');
      }
      if (cursor) query.set('next_cursor', cursor);

      const response = await fetch(this.apiBase + '/resources/image/upload?' + query, {
        method: 'GET',
        headers: this.adminHeaders(),
      });
      const payload = await this.readJson(response);
      const resources = Array.isArray(payload.resources) ? payload.resources : [];

      for (const rawResource of resources) {
        if (!isRecord(rawResource)) continue;
        const resource = rawResource as CloudinaryResource;
        if (
          typeof resource.public_id !== 'string' ||
          typeof resource.format !== 'string' ||
          !SUPPORTED_FORMATS.has(resource.format.toLowerCase())
        ) {
          continue;
        }
        const format = resource.format.toLowerCase() === 'jpeg'
          ? 'jpg'
          : resource.format.toLowerCase();
        const key = resource.public_id + '.' + format;
        if (isExactFile && key !== normalized) continue;
        const parsedDate = typeof resource.created_at === 'string'
          ? new Date(resource.created_at)
          : new Date(0);
        results.push({
          key,
          size: typeof resource.bytes === 'number' ? resource.bytes : 0,
          lastModified: Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate,
        });
      }

      cursor = typeof payload.next_cursor === 'string' && payload.next_cursor.length > 0
        ? payload.next_cursor
        : undefined;
    } while (cursor);

    return results;
  }

  private signature(params: Record<string, string>): string {
    const canonical = Object.entries(params)
      .filter(([, value]) => value !== '')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => key + '=' + value)
      .join('&');
    return createHash('sha1').update(canonical + this.apiSecret).digest('hex');
  }

  private adminHeaders(): HeadersInit {
    return {
      Authorization: 'Basic ' + Buffer.from(this.apiKey + ':' + this.apiSecret).toString('base64'),
    };
  }

  private async readJson(response: Response): Promise<JsonObject> {
    const raw = await response.text();
    let payload: unknown = {};
    if (raw.length > 0) {
      try {
        payload = JSON.parse(raw) as unknown;
      } catch {
        throw new Error('Cloudinary returned a non-JSON response (' + response.status + ').');
      }
    }

    if (!response.ok) {
      const error = isRecord(payload) && isRecord(payload.error) ? payload.error : undefined;
      const message = error && typeof error.message === 'string'
        ? error.message
        : response.statusText || 'request failed';
      throw new Error('Cloudinary API request failed (' + response.status + '): ' + message);
    }
    if (!isRecord(payload)) {
      throw new Error('Cloudinary returned an unexpected response.');
    }
    return payload;
  }
}
