/**
 * Image processing pipeline (spec §65, §66).
 *
 * The processor is deliberately storage- and database-agnostic: it validates
 * raw upload bytes and returns safe derivative bytes. Storage keys, file
 * writes and database rows are the media service's concern.
 *
 * Security posture (§65, §90):
 *  - the declared filename and Content-Type are ignored entirely; the true
 *    format is detected from magic bytes,
 *  - every decode runs under `limitInputPixels` and an explicit dimension
 *    check, so pixel bombs fail fast and cheaply,
 *  - the original is re-encoded (dropping EXIF/GPS metadata, baking
 *    orientation), so variants always derive from clean bytes,
 *  - only JPEG, PNG and WebP inputs are accepted.
 */
import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { AppException } from '../../common/errors/app.exception';
import type { AppConfig } from '../../config/config.types';

/** Derivative variants generated for every stored image (§66). */
export const IMAGE_VARIANTS = ['thumbnail', 'medium', 'large'] as const;
export type ImageVariantName = (typeof IMAGE_VARIANTS)[number];

/** Target widths (px); `withoutEnlargement` keeps small images untouched. */
export const VARIANT_WIDTHS: Record<ImageVariantName, number> = {
  thumbnail: 320,
  medium: 800,
  large: 1600,
};

export const ORIGINAL_MIME_TYPE = 'image/jpeg';
export const VARIANT_MIME_TYPE = 'image/webp';

/** Re-encode quality; originals keep more fidelity than card variants. */
const ORIGINAL_JPEG_QUALITY = 85;
const VARIANT_WEBP_QUALITY = 80;

export interface ProcessedOriginal {
  data: Buffer;
  width: number;
  height: number;
  size: number;
  /** SHA-256 (hex) of the stored original bytes (§66). */
  checksum: string;
}

export interface ProcessedVariant {
  data: Buffer;
  width: number;
  height: number;
  size: number;
}

export interface ProcessedImage {
  original: ProcessedOriginal;
  variants: Record<ImageVariantName, ProcessedVariant>;
}

@Injectable()
export class ImageProcessor {
  private readonly maxUploadSize: number;
  private readonly maxImagePixels: number;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.maxUploadSize = configService.get('storage.maxUploadSize', { infer: true });
    this.maxImagePixels = configService.get('storage.maxImagePixels', { infer: true });
  }

  /** Validates, re-encodes and derives variants from raw upload bytes. */
  async process(input: Buffer): Promise<ProcessedImage> {
    if (input.byteLength === 0) {
      throw new AppException('INVALID_IMAGE');
    }
    if (input.byteLength > this.maxUploadSize) {
      throw new AppException('IMAGE_TOO_LARGE', {
        details: { maxBytes: this.maxUploadSize },
      });
    }
    if (this.detectFormat(input) === null) {
      throw new AppException('UNSUPPORTED_IMAGE_TYPE');
    }

    // Metadata parsing already enforces `limitInputPixels` in sharp, so a
    // pixel bomb surfaces here; the explicit product check below is the
    // belt-and-braces guard for formats where header parsing alone is not
    // conclusive.
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(input, this.sharpOptions()).metadata();
    } catch (error) {
      throw this.translateDecodeError(error);
    }
    if (metadata.width === undefined || metadata.height === undefined) {
      throw new AppException('INVALID_IMAGE');
    }
    if (metadata.width * metadata.height > this.maxImagePixels) {
      throw new AppException('IMAGE_DIMENSIONS_TOO_LARGE', {
        details: { maxPixels: this.maxImagePixels },
      });
    }

    // Re-encode as JPEG: `rotate()` bakes EXIF orientation, and omitting
    // `withMetadata()` strips EXIF/GPS/ICC payloads from the stored bytes.
    const original = await this.runDecode(() =>
      sharp(input, this.sharpOptions())
        .rotate()
        .jpeg({ quality: ORIGINAL_JPEG_QUALITY, mozjpeg: true })
        .toBuffer({ resolveWithObject: true }),
    );

    const variants = {} as Record<ImageVariantName, ProcessedVariant>;
    for (const name of IMAGE_VARIANTS) {
      const variant = await this.runDecode(() =>
        sharp(original.data, this.sharpOptions())
          .resize({ width: VARIANT_WIDTHS[name], fit: 'inside', withoutEnlargement: true })
          .webp({ quality: VARIANT_WEBP_QUALITY })
          .toBuffer({ resolveWithObject: true }),
      );
      variants[name] = {
        data: variant.data,
        width: variant.info.width,
        height: variant.info.height,
        size: variant.info.size,
      };
    }

    return {
      original: {
        data: original.data,
        width: original.info.width,
        height: original.info.height,
        size: original.info.size,
        checksum: createHash('sha256').update(original.data).digest('hex'),
      },
      variants,
    };
  }

  private sharpOptions(): sharp.SharpOptions {
    return { limitInputPixels: this.maxImagePixels, sequentialRead: true };
  }

  /**
   * Maps sharp failures onto stable error codes: exceeding the decode pixel
   * limit is a dimensions problem, everything else is a malformed image.
   */
  private translateDecodeError(error: unknown): AppException {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('pixel limit')) {
      return new AppException('IMAGE_DIMENSIONS_TOO_LARGE', {
        details: { maxPixels: this.maxImagePixels },
        cause: error,
      });
    }
    return new AppException('INVALID_IMAGE', { cause: error });
  }

  private async runDecode<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.translateDecodeError(error);
    }
  }

  /** Magic-byte format detection — the only trusted type signal (§65). */
  private detectFormat(input: Buffer): 'jpeg' | 'png' | 'webp' | null {
    if (input.length >= 3 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) {
      return 'jpeg';
    }
    if (
      input.length >= 8 &&
      input[0] === 0x89 &&
      input[1] === 0x50 &&
      input[2] === 0x4e &&
      input[3] === 0x47 &&
      input[4] === 0x0d &&
      input[5] === 0x0a &&
      input[6] === 0x1a &&
      input[7] === 0x0a
    ) {
      return 'png';
    }
    if (
      input.length >= 12 &&
      input.toString('latin1', 0, 4) === 'RIFF' &&
      input.toString('latin1', 8, 12) === 'WEBP'
    ) {
      return 'webp';
    }
    return null;
  }
}
