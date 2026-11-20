import { CloudinaryStorageProvider } from './cloudinary-storage.provider';

const config = {
  cloudName: 'weshbazar-demo',
  apiKey: '123456789',
  apiSecret: 'test-secret-value',
};

describe('CloudinaryStorageProvider', () => {
  afterEach(() => jest.restoreAllMocks());

  it('preserves stable storage keys in public delivery URLs', () => {
    const storage = new CloudinaryStorageProvider(config);
    expect(storage.getPublicUrl('listings/a/b/original.jpg')).toBe(
      'https://res.cloudinary.com/weshbazar-demo/image/upload/listings/a/b/original.jpg',
    );
  });

  it('uploads a key without its extension as the Cloudinary public ID', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ public_id: 'listings/a/b/original', format: 'jpg' }), { status: 200 }),
    );
    const storage = new CloudinaryStorageProvider(config);
    await storage.put('listings/a/b/original.jpg', Buffer.from('image-bytes'), 'image/jpeg');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const form = fetchSpy.mock.calls[0][1]?.body as FormData;
    expect(form.get('public_id')).toBe('listings/a/b/original');
    expect(form.get('overwrite')).toBe('true');
    expect(form.get('api_key')).toBe(config.apiKey);
    expect(form.get('signature')).toEqual(expect.any(String));
  });

  it('paginates storage listings and converts Cloudinary formats back to keys', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({
        resources: [{
          public_id: 'listings/a/b/original',
          format: 'jpg',
          bytes: 12,
          created_at: '2026-11-20T10:00:00Z',
        }],
        next_cursor: 'page-2',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        resources: [{
          public_id: 'listings/a/b/thumbnail',
          format: 'webp',
          bytes: 8,
          created_at: '2026-11-20T10:01:00Z',
        }],
      }), { status: 200 }));

    const storage = new CloudinaryStorageProvider(config);
    const objects = await storage.list('listings/a/b');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(objects.map((object) => object.key)).toEqual([
      'listings/a/b/original.jpg',
      'listings/a/b/thumbnail.webp',
    ]);
    expect(objects.every((object) => object.lastModified instanceof Date)).toBe(true);
  });

  it('uses Cloudinary delete-by-prefix with a path-boundary slash', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        deleted: { 'listings/a/b/original': 'deleted' },
        partial: false,
      }), { status: 200 }),
    );

    const storage = new CloudinaryStorageProvider(config);
    await expect(storage.deletePrefix('listings/a/b')).resolves.toBe(1);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://api.cloudinary.com/v1_1/weshbazar-demo/resources/image/upload');
    expect(init?.method).toBe('DELETE');
    expect(String(init?.body)).toBe('prefix=listings%2Fa%2Fb%2F');
    expect(new Headers(init?.headers).get('authorization')).toContain('Basic ');
  });

  it('rejects unsafe keys before making an API request', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const storage = new CloudinaryStorageProvider(config);

    expect(() => storage.getPublicUrl('../secret.jpg')).toThrow(/Unsafe storage key rejected/);
    await expect(storage.put('../secret.jpg', Buffer.from('x'), 'image/jpeg')).rejects.toThrow(
      /Unsafe storage key rejected/,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
