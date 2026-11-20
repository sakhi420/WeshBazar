import { createHash, createHmac } from 'node:crypto';
import {
  assertSafeStorageKey,
  type StorageProvider,
  type StoredObject,
} from './storage.provider';

export interface NeonObjectStorageConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

type QueryPair = [string, string];

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    '%' + character.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'));
  return match ? decodeXml(match[1].trim()) : null;
}

/**
 * Neon Object Storage provider.
 *
 * Neon implements the S3 protocol. Public delivery uses path-style URLs and
 * therefore requires the bucket's access mode to be set to public_read in the
 * Neon Console. Writes and object management use AWS Signature V4.
 *
 * This implementation uses Node crypto and fetch, adding no runtime SDK.
 */
export class NeonObjectStorageProvider implements StorageProvider {
  private readonly endpoint: URL;
  private readonly bucket: string;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(config: NeonObjectStorageConfig) {
    this.endpoint = new URL(config.endpoint);
    this.bucket = config.bucket;
    this.region = config.region || 'us-east-2';
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;

    if (this.endpoint.protocol !== 'https:') {
      throw new Error('Neon Object Storage endpoint must use HTTPS.');
    }
    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error('Neon Object Storage requires a bucket and access credentials.');
    }
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const response = await this.signedRequest('PUT', key, data, contentType);
    await this.assertSuccess(response, 'upload');
  }

  async delete(key: string): Promise<void> {
    const response = await this.signedRequest('DELETE', key);
    if (response.status === 404) return;
    await this.assertSuccess(response, 'delete');
  }

  async deletePrefix(prefix: string): Promise<number> {
    if (prefix.length === 0) throw new Error('deletePrefix requires a non-empty prefix.');
    const normalized = assertSafeStorageKey(prefix).replace(/\/+$/, '');
    const objects = await this.list(normalized + '/');
    let deleted = 0;
    for (const object of objects) {
      await this.delete(object.key);
      deleted += 1;
    }
    return deleted;
  }

  async exists(key: string): Promise<boolean> {
    const response = await this.signedRequest('HEAD', key);
    if (response.status === 404) return false;
    await this.assertSuccess(response, 'check object');
    return true;
  }

  getPublicUrl(key: string): string {
    return this.objectUrl(assertSafeStorageKey(key)).toString();
  }

  async list(prefix: string): Promise<StoredObject[]> {
    const normalized = prefix.length === 0
      ? ''
      : assertSafeStorageKey(prefix).replace(/\/+$/, '');
    const isFile = /\.(jpg|jpeg|png|webp)$/i.test(normalized);
    const objectPrefix = normalized.length === 0
      ? ''
      : isFile ? normalized : normalized + '/';
    const objects: StoredObject[] = [];
    let continuationToken: string | undefined;

    do {
      const query: QueryPair[] = [['list-type', '2']];
      if (objectPrefix) query.push(['prefix', objectPrefix]);
      if (continuationToken) query.push(['continuation-token', continuationToken]);

      const response = await this.signedRequest('GET', undefined, undefined, undefined, query);
      await this.assertSuccess(response, 'list objects');
      const xml = await response.text();
      const contents = xml.match(/<Contents>[\s\S]*?<\/Contents>/g) ?? [];

      for (const content of contents) {
        const key = xmlValue(content, 'Key');
        const size = xmlValue(content, 'Size');
        const modified = xmlValue(content, 'LastModified');
        if (!key || size === null || modified === null) continue;
        try {
          const safeKey = assertSafeStorageKey(key);
          const lastModified = new Date(modified);
          if (Number.isNaN(lastModified.getTime())) continue;
          objects.push({
            key: safeKey,
            size: Number.parseInt(size, 10) || 0,
            lastModified,
          });
        } catch {
          // Ignore unexpected keys returned by the service.
        }
      }

      const truncated = xmlValue(xml, 'IsTruncated') === 'true';
      continuationToken = truncated ? xmlValue(xml, 'NextContinuationToken') ?? undefined : undefined;
      if (truncated && !continuationToken) {
        throw new Error('Neon Object Storage returned a truncated listing without a continuation token.');
      }
    } while (continuationToken);

    return objects;
  }

  private objectUrl(key?: string, query?: QueryPair[]): URL {
    const basePath = this.endpoint.pathname.replace(/\/+$/, '');
    const objectPath = key
      ? '/' + this.bucket + '/' + key.split('/').map(encodeRfc3986).join('/')
      : '/' + this.bucket;
    const url = new URL(this.endpoint.toString());
    url.pathname = basePath + objectPath;

    if (query && query.length > 0) {
      const canonicalQuery = query
        .map(([name, value]) => [encodeRfc3986(name), encodeRfc3986(value)] as const)
        .sort(([leftName, leftValue], [rightName, rightValue]) =>
          leftName.localeCompare(rightName) || leftValue.localeCompare(rightValue),
        )
        .map(([name, value]) => name + '=' + value)
        .join('&');
      url.search = canonicalQuery;
    }
    return url;
  }

  private async signedRequest(
    method: string,
    key?: string,
    body?: Buffer,
    contentType?: string,
    query?: QueryPair[],
  ): Promise<Response> {
    const url = this.objectUrl(key, query);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = body ? sha256(body) : sha256('');
    const canonicalHeaders =
      'host:' + url.host + '\n' +
      'x-amz-content-sha256:' + payloadHash + '\n' +
      'x-amz-date:' + amzDate + '\n';
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
      method,
      url.pathname,
      url.search.length > 0 ? url.search.slice(1) : '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');
    const scope = dateStamp + '/' + this.region + '/s3/aws4_request';
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      scope,
      sha256(canonicalRequest),
    ].join('\n');

    const dateKey = hmac(Buffer.from('AWS4' + this.secretAccessKey), dateStamp);
    const regionKey = hmac(dateKey, this.region);
    const serviceKey = hmac(regionKey, 's3');
    const signingKey = hmac(serviceKey, 'aws4_request');
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    const authorization =
      'AWS4-HMAC-SHA256 Credential=' + this.accessKeyId + '/' + scope +
      ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;

    const headers = new Headers({
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authorization,
    });
    if (contentType) headers.set('content-type', contentType);

    return fetch(url, {
      method,
      headers,
      body: body ? new Uint8Array(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
  }

  private async assertSuccess(response: Response, operation: string): Promise<void> {
    if (response.ok) return;
    const detail = (await response.text()).slice(0, 500);
    throw new Error(
      'Neon Object Storage ' + operation + ' failed (' + response.status + '): ' +
      (detail || response.statusText),
    );
  }
}
