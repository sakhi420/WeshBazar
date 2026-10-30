/**
 * Unit tests for the local storage provider and the storage key contract
 * (spec §64, §65).
 *
 * Keys are always server-generated, but every provider call re-validates them
 * as defense in depth: a single upstream bug must never become path traversal.
 * The filesystem behavior is exercised against a temporary root directory.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import { LocalStorageProvider } from './local-storage.provider';
import { assertSafeStorageKey } from './storage.provider';

const LISTING_ID = '11111111-1111-4111-8111-111111111111';
const IMAGE_ID = '22222222-2222-4222-8222-222222222222';

describe('assertSafeStorageKey', () => {
  it('accepts server-generated keys with directory segments', () => {
    const key = `listings/${LISTING_ID}/${IMAGE_ID}/thumbnail.webp`;
    expect(assertSafeStorageKey(key)).toBe(key);
  });

  it('accepts keys of exactly the maximum length', () => {
    const key = 'a'.repeat(300);
    expect(assertSafeStorageKey(key)).toBe(key);
  });

  it.each([
    ['empty string', ''],
    ['absolute path', '/etc/passwd'],
    ['backslash separators', 'listings\\evil\\original.jpg'],
    ['double slashes', 'listings//original.jpg'],
    ['dot segment', 'listings/./original.jpg'],
    ['parent traversal', 'listings/../../etc/passwd'],
    ['spaces and symbols', 'listings/a b.jpg'],
    ['colon', 'C:/windows'],
    ['over-long key', 'a'.repeat(301)],
  ])('rejects %s', (_label, key) => {
    expect(() => assertSafeStorageKey(key)).toThrow(/Unsafe storage key rejected/);
  });

  it('allows dots inside a segment name (only "." and ".." are dangerous)', () => {
    expect(assertSafeStorageKey('listings/a..b/original.jpg')).toBe('listings/a..b/original.jpg');
  });
});

describe('LocalStorageProvider', () => {
  let root: string;
  let provider: LocalStorageProvider;

  const values: Record<string, unknown> = {
    'storage.localStoragePath': '',
    'storage.publicBaseUrl': 'http://localhost:3000/',
  };
  const config = {
    get: (key: string) => values[key],
  } as unknown as ConfigService<AppConfig, true>;

  beforeAll(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'weshbazar-storage-test-'));
    values['storage.localStoragePath'] = root;
    provider = new LocalStorageProvider(config);
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes nested objects and reports existence', async () => {
    const key = 'listings/a/one/original.jpg';
    await provider.put(key, Buffer.from('hello'), 'image/jpeg');

    expect(await provider.exists(key)).toBe(true);
    expect(await provider.exists('listings/a/one/missing.jpg')).toBe(false);
    expect(await readFile(path.join(root, key), 'utf8')).toBe('hello');
  });

  it('exposes public URLs under the /media route with a normalized base', () => {
    expect(provider.getPublicUrl('listings/a/one/original.jpg')).toBe(
      'http://localhost:3000/media/listings/a/one/original.jpg',
    );
  });

  it('refuses unsafe keys on every operation', async () => {
    expect(() => provider.getPublicUrl('listings/../escape.jpg')).toThrow(
      /Unsafe storage key rejected/,
    );
    await expect(provider.put('../escape.jpg', Buffer.from('x'), 'text/plain')).rejects.toThrow(
      /Unsafe storage key rejected/,
    );
    await expect(provider.delete('../escape.jpg')).rejects.toThrow(/Unsafe storage key rejected/);
    await expect(provider.exists('../escape.jpg')).rejects.toThrow(/Unsafe storage key rejected/);
    await expect(provider.list('../')).rejects.toThrow(/Unsafe storage key rejected/);
  });

  it('lists files under a directory-shaped prefix', async () => {
    await provider.put('listings/b/two/original.jpg', Buffer.from('x'), 'image/jpeg');
    await provider.put('listings/b/two/thumbnail.webp', Buffer.from('yy'), 'image/webp');
    await provider.put('listings/c/three/original.jpg', Buffer.from('zzz'), 'image/jpeg');

    const prefixObjects = await provider.list('listings/b/two');
    expect(prefixObjects.map((object) => object.key).sort()).toEqual([
      'listings/b/two/original.jpg',
      'listings/b/two/thumbnail.webp',
    ]);
    // `instanceof Date` is unreliable under jest's VM realms (Dates created by
    // node core belong to another realm); assert validity instead.
    expect(prefixObjects.every((object) => !Number.isNaN(object.lastModified.getTime()))).toBe(
      true,
    );

    const listingObjects = await provider.list('listings/b');
    expect(listingObjects).toHaveLength(2);

    // Unknown prefixes are empty, not errors.
    expect(await provider.list('listings/missing')).toEqual([]);

    // A file-shaped key lists exactly that object with its size.
    const fileObjects = await provider.list('listings/c/three/original.jpg');
    expect(fileObjects).toEqual([
      expect.objectContaining({ key: 'listings/c/three/original.jpg', size: 3 }),
    ]);

    // The empty prefix sweeps the whole root: exactly the files written so
    // far (one from the previous test, three from this one).
    const all = await provider.list('');
    expect(all.map((object) => object.key).sort()).toEqual([
      'listings/a/one/original.jpg',
      'listings/b/two/original.jpg',
      'listings/b/two/thumbnail.webp',
      'listings/c/three/original.jpg',
    ]);
  });

  it('deletes single objects and treats missing ones as success', async () => {
    const key = 'listings/d/four/original.jpg';
    await provider.put(key, Buffer.from('x'), 'image/jpeg');

    await provider.delete(key);
    expect(await provider.exists(key)).toBe(false);
    await expect(provider.delete(key)).resolves.toBeUndefined();
  });

  it('deletes whole prefixes and reports the removed object count', async () => {
    await provider.put('listings/e/five/original.jpg', Buffer.from('x'), 'image/jpeg');
    await provider.put('listings/e/five/thumbnail.webp', Buffer.from('y'), 'image/webp');

    await expect(provider.deletePrefix('listings/e/five')).resolves.toBe(2);
    expect(await provider.list('listings/e/five')).toEqual([]);

    // A missing prefix removes nothing.
    await expect(provider.deletePrefix('listings/e/missing')).resolves.toBe(0);
  });

  it('requires a non-empty prefix for prefix deletion', async () => {
    await expect(provider.deletePrefix('')).rejects.toThrow(
      'deletePrefix requires a non-empty prefix.',
    );
  });
});
