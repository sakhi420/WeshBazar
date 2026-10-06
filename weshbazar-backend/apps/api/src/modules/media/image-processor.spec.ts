/**
 * Unit tests for the image processing pipeline (spec §65, §66).
 *
 * The processor is the security boundary of uploads: declared types are
 * ignored (magic bytes decide), pixel bombs fail fast, EXIF orientation is
 * baked and every derivative is re-encoded from clean bytes. These tests run
 * the real sharp pipeline against tiny generated fixtures.
 */
import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import type { AppConfig } from '../../config/config.types';
import { ImageProcessor, IMAGE_VARIANTS, VARIANT_WIDTHS } from './image-processor';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 4_000_000;

function makeProcessor(
  overrides: Partial<{ maxUploadSize: number; maxImagePixels: number }> = {},
): ImageProcessor {
  const values: Record<string, unknown> = {
    'storage.maxUploadSize': overrides.maxUploadSize ?? MAX_UPLOAD_SIZE,
    'storage.maxImagePixels': overrides.maxImagePixels ?? MAX_IMAGE_PIXELS,
  };
  const config = {
    get: (key: string) => values[key],
  } as unknown as ConfigService<AppConfig, true>;
  return new ImageProcessor(config);
}

function isJpeg(data: Buffer): boolean {
  return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
}

function isWebp(data: Buffer): boolean {
  return (
    data.length >= 12 &&
    data.toString('latin1', 0, 4) === 'RIFF' &&
    data.toString('latin1', 8, 12) === 'WEBP'
  );
}

describe('ImageProcessor', () => {
  let widePng: Buffer;
  let smallPng: Buffer;
  let orientedJpeg: Buffer;

  beforeAll(async () => {
    widePng = await sharp({
      create: { width: 400, height: 200, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .png()
      .toBuffer();
    smallPng = await sharp({
      create: { width: 40, height: 30, channels: 3, background: { r: 200, g: 100, b: 50 } },
    })
      .png()
      .toBuffer();
    // EXIF orientation 6 = rotate 90° CW when baked.
    orientedJpeg = await sharp({
      create: { width: 20, height: 10, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
  });

  it('rejects empty input as an invalid image', async () => {
    await expect(makeProcessor().process(Buffer.alloc(0))).rejects.toMatchObject({
      code: 'INVALID_IMAGE',
    });
  });

  it('rejects uploads above the configured size before any decoding', async () => {
    const processor = makeProcessor({ maxUploadSize: 64 });
    const oversized = Buffer.alloc(65, 0x41);

    await expect(processor.process(oversized)).rejects.toMatchObject({
      code: 'IMAGE_TOO_LARGE',
      details: { maxBytes: 64 },
    });
  });

  it('ignores declared types and rejects unknown magic bytes', async () => {
    const gif = Buffer.concat([Buffer.from('GIF89a', 'latin1'), Buffer.alloc(32)]);

    await expect(makeProcessor().process(gif)).rejects.toMatchObject({
      code: 'UNSUPPORTED_IMAGE_TYPE',
    });
  });

  it('derives a clean JPEG original and three WebP variants from a PNG', async () => {
    const processed = await makeProcessor().process(widePng);

    // Original: re-encoded JPEG, dimensions preserved, checksum of stored bytes.
    expect(isJpeg(processed.original.data)).toBe(true);
    expect(processed.original.width).toBe(400);
    expect(processed.original.height).toBe(200);
    expect(processed.original.size).toBe(processed.original.data.byteLength);
    expect(processed.original.checksum).toBe(
      createHash('sha256').update(processed.original.data).digest('hex'),
    );

    for (const name of IMAGE_VARIANTS) {
      const variant = processed.variants[name];
      expect(isWebp(variant.data)).toBe(true);
      expect(variant.size).toBe(variant.data.byteLength);
      expect(variant.size).toBeGreaterThan(0);
    }

    // Thumbnail scales down to the target width; larger targets keep the
    // source size (`withoutEnlargement`).
    expect(processed.variants.thumbnail.width).toBe(VARIANT_WIDTHS.thumbnail);
    expect(processed.variants.thumbnail.height).toBe(160);
    expect(processed.variants.medium.width).toBe(400);
    expect(processed.variants.medium.height).toBe(200);
    expect(processed.variants.large.width).toBe(400);
    expect(processed.variants.large.height).toBe(200);
  });

  it('never enlarges images smaller than every variant width', async () => {
    const processed = await makeProcessor().process(smallPng);

    for (const name of IMAGE_VARIANTS) {
      expect(processed.variants[name].width).toBe(40);
      expect(processed.variants[name].height).toBe(30);
    }
  });

  it('bakes EXIF orientation into the re-encoded original', async () => {
    const processed = await makeProcessor().process(orientedJpeg);

    // 20x10 with orientation 6 must come out rotated: 10x20.
    expect(processed.original.width).toBe(10);
    expect(processed.original.height).toBe(20);
  });

  it('rejects pixel bombs as a dimensions problem', async () => {
    const processor = makeProcessor({ maxImagePixels: 100 });

    await expect(processor.process(smallPng)).rejects.toMatchObject({
      code: 'IMAGE_DIMENSIONS_TOO_LARGE',
      details: { maxPixels: 100 },
    });
  });
});
