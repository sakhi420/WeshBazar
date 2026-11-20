import { NeonObjectStorageProvider } from './neon-object-storage.provider';

const config = {
  endpoint: 'https://object-storage.example.neon.tech',
  bucket: 'weshbazar-media',
  region: 'us-east-2',
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
};

describe('NeonObjectStorageProvider', () => {
  afterEach(() => jest.restoreAllMocks());

  it('builds public path-style URLs', () => {
    const storage = new NeonObjectStorageProvider(config);
    expect(storage.getPublicUrl('listings/a/b/original.jpg')).toBe(
      'https://object-storage.example.neon.tech/weshbazar-media/listings/a/b/original.jpg',
    );
  });

  it('signs uploads with AWS Signature Version 4', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 200 }),
    );
    const storage = new NeonObjectStorageProvider(config);
    await storage.put('listings/a/b/original.jpg', Buffer.from('image-bytes'), 'image/jpeg');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(
      'https://object-storage.example.neon.tech/weshbazar-media/listings/a/b/original.jpg',
    );
    expect(init?.method).toBe('PUT');
    expect(new Headers(init?.headers).get('authorization')).toMatch(
      /^AWS4-HMAC-SHA256 Credential=test-access-key\//,
    );
    expect(new Headers(init?.headers).get('x-amz-content-sha256')).toEqual(expect.any(String));
  });

  it('parses paginated S3 ListObjectsV2 responses', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(new Response(
        '<ListBucketResult><IsTruncated>true</IsTruncated><NextContinuationToken>page-two</NextContinuationToken><Contents><Key>listings/a/b/original.jpg</Key><LastModified>2026-11-20T10:00:00.000Z</LastModified><Size>12</Size></Contents></ListBucketResult>',
        { status: 200 },
      ))
      .mockResolvedValueOnce(new Response(
        '<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>listings/a/b/thumbnail.webp</Key><LastModified>2026-11-20T10:01:00.000Z</LastModified><Size>8</Size></Contents></ListBucketResult>',
        { status: 200 },
      ));

    const storage = new NeonObjectStorageProvider(config);
    const objects = await storage.list('listings/a/b');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(objects.map((object) => object.key)).toEqual([
      'listings/a/b/original.jpg',
      'listings/a/b/thumbnail.webp',
    ]);
    expect(objects.map((object) => object.size)).toEqual([12, 8]);
  });

  it('treats a missing object as absent and deletes missing objects safely', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 404 }),
    );
    const storage = new NeonObjectStorageProvider(config);
    await expect(storage.exists('listings/a/b/original.jpg')).resolves.toBe(false);
    await expect(storage.delete('listings/a/b/original.jpg')).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('deletes objects only under a directory prefix', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(new Response(
        '<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>listings/a/b/original.jpg</Key><LastModified>2026-11-20T10:00:00.000Z</LastModified><Size>12</Size></Contents></ListBucketResult>',
        { status: 200 },
      ))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const storage = new NeonObjectStorageProvider(config);
    await expect(storage.deletePrefix('listings/a/b')).resolves.toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][1]?.method).toBe('DELETE');
  });

  it('rejects unsafe keys before making API requests', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const storage = new NeonObjectStorageProvider(config);
    expect(() => storage.getPublicUrl('../secret.jpg')).toThrow(/Unsafe storage key rejected/);
    await expect(
      storage.put('../secret.jpg', Buffer.from('x'), 'image/jpeg'),
    ).rejects.toThrow(/Unsafe storage key rejected/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
