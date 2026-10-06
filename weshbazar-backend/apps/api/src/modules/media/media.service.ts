/**
 * Listing media pipeline (spec §63–§67, §90, §107).
 *
 * Uploads (§65): raw bytes arrive from the multipart controller, are
 * validated and re-encoded by the ImageProcessor, written through the
 * StorageProvider abstraction and only then recorded as ListingImage rows.
 * The declared filename and Content-Type are never trusted; storage keys are
 * server-generated (`listings/<listingId>/<imageId>/…`).
 *
 * Image mutations are material changes (§42): after the rows change, the
 * service asks ListingsService to register the change, which applies the
 * documented moderation workflow and appends a revision.
 *
 * Deleted images are soft-deleted; their storage objects are removed later by
 * the retention-window orphan sweep (never immediately — a delayed reader may
 * still hold a URL, §67).
 */
import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception';
import type { OwnerListing } from '../../common/presenters/listing.presenter';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import type { Locale } from '../../common/utils/locale.utils';
import { isUuid } from '../../common/utils/uuid.utils';
import type { AppConfig } from '../../config/config.types';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, type ListingImage } from '../../generated/prisma/client';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import { ListingsService } from '../listings/listings.service';
import {
  IMAGE_VARIANTS,
  ORIGINAL_MIME_TYPE,
  VARIANT_MIME_TYPE,
  type ImageVariantName,
  type ProcessedImage,
  ImageProcessor,
} from './image-processor';

/** Body of `PATCH /listings/:id/images/:imageId/order` (spec §107). */
export interface ReorderImageInput {
  sortOrder?: number;
  isPrimary?: boolean;
}

interface StorageKeys {
  prefix: string;
  original: string;
  variants: Record<ImageVariantName, string>;
}

/**
 * Type alias (not interface) so the descriptor satisfies Prisma's JSON index
 * signatures without casts — interfaces lack implicit index signatures.
 */
type VariantDescriptor = {
  key: string;
  width: number;
  height: number;
  size: number;
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly storageLimits: AppConfig['storage'];
  private readonly rateLimit: AppConfig['rateLimit'];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    private readonly processor: ImageProcessor,
    private readonly listings: ListingsService,
    private readonly rateLimitService: RateLimitService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.storageLimits = configService.get('storage', { infer: true });
    this.rateLimit = configService.get('rateLimit', { infer: true });
  }

  // --- Commands -------------------------------------------------------------------

  /** Upload one image and return the refreshed owner listing (§107). */
  async uploadImage(
    userId: string,
    listingId: string,
    file: Buffer,
    locale: Locale,
  ): Promise<OwnerListing> {
    this.rateLimitService.enforce('media:upload:user', userId, this.rateLimit.imageUploadPerWindow);
    await this.listings.assertImageMutableForOwner(userId, listingId);

    // Fast fail before spending CPU on decoding; the authoritative check runs
    // inside the locked transaction below.
    const existing = await this.prisma.listingImage.count({
      where: { listingId, deletedAt: null },
    });
    if (existing >= this.storageLimits.maxImagesPerListing) {
      throw new AppException('LISTING_IMAGE_LIMIT_REACHED', {
        details: { limit: this.storageLimits.maxImagesPerListing },
      });
    }

    const processed = await this.processor.process(file);

    // Identical bytes re-attached to the same listing are almost always a
    // double submission; refuse before writing anything to storage.
    const duplicate = await this.prisma.listingImage.findFirst({
      where: { listingId, checksum: processed.original.checksum, deletedAt: null },
      select: { id: true },
    });
    if (duplicate !== null) {
      throw new AppException('MEDIA_ALREADY_LINKED');
    }

    const imageId = randomUUID();
    const keys = this.storageKeys(listingId, imageId);
    await this.writeFiles(keys, processed);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Serialize image writes per listing so the count check, sortOrder
        // allocation and single-primary invariant stay exact under parallel
        // uploads from one gallery editor.
        await this.lockListing(tx, listingId);
        const active = await tx.listingImage.count({ where: { listingId, deletedAt: null } });
        if (active >= this.storageLimits.maxImagesPerListing) {
          throw new AppException('LISTING_IMAGE_LIMIT_REACHED', {
            details: { limit: this.storageLimits.maxImagesPerListing },
          });
        }
        const maxOrder = await tx.listingImage.aggregate({
          where: { listingId, deletedAt: null },
          _max: { sortOrder: true },
        });
        await tx.listingImage.create({
          data: {
            id: imageId,
            listingId,
            storageKey: keys.original,
            variants: this.variantDescriptor(keys, processed),
            mimeType: ORIGINAL_MIME_TYPE,
            size: processed.original.size,
            width: processed.original.width,
            height: processed.original.height,
            checksum: processed.original.checksum,
            sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            isPrimary: active === 0,
          },
        });
      });
    } catch (error) {
      // The row was never created — drop the freshly written files.
      await this.quietDeletePrefix(keys.prefix);
      throw error;
    }

    await this.listings.registerImageChange(userId, listingId);
    return this.listings.getForOwner(userId, listingId, locale);
  }

  /** Soft-delete one image and return the refreshed owner listing (§107). */
  async deleteImage(
    userId: string,
    listingId: string,
    imageId: string,
    locale: Locale,
  ): Promise<OwnerListing> {
    await this.listings.assertImageMutableForOwner(userId, listingId);
    const image = await this.loadImage(imageId, listingId);

    await this.prisma.$transaction(async (tx) => {
      await this.lockListing(tx, listingId);
      await tx.listingImage.update({
        where: { id: image.id },
        data: { deletedAt: new Date() },
      });
      if (image.isPrimary) {
        // Keep the single-primary invariant: promote the visually first
        // remaining image.
        const successor = await tx.listingImage.findFirst({
          where: { listingId, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
        if (successor !== null) {
          await tx.listingImage.update({
            where: { id: successor.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    // Storage objects are intentionally retained until the orphan sweep —
    // a client may still be rendering the just-deleted URL (§67).
    await this.listings.registerImageChange(userId, listingId);
    return this.listings.getForOwner(userId, listingId, locale);
  }

  /** Reposition and/or re-flag the primary image (§107). */
  async reorderImage(
    userId: string,
    listingId: string,
    imageId: string,
    input: ReorderImageInput,
    locale: Locale,
  ): Promise<OwnerListing> {
    if (input.sortOrder === undefined && input.isPrimary === undefined) {
      throw new AppException('VALIDATION_ERROR', {
        details: {
          errors: [{ field: 'body', messages: ['Provide sortOrder and/or isPrimary.'] }],
        },
      });
    }
    await this.listings.assertImageMutableForOwner(userId, listingId);
    const image = await this.loadImage(imageId, listingId);

    await this.prisma.$transaction(async (tx) => {
      await this.lockListing(tx, listingId);

      if (input.isPrimary === true) {
        await tx.listingImage.updateMany({
          where: { listingId, deletedAt: null, id: { not: image.id } },
          data: { isPrimary: false },
        });
        await tx.listingImage.update({
          where: { id: image.id },
          data: { isPrimary: true },
        });
      } else if (input.isPrimary === false) {
        await tx.listingImage.update({
          where: { id: image.id },
          data: { isPrimary: false },
        });
      }

      if (input.sortOrder !== undefined) {
        const ordered = await tx.listingImage.findMany({
          where: { listingId, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
        const reordered = ordered.filter((candidate) => candidate.id !== image.id);
        const target = Math.min(input.sortOrder, reordered.length);
        reordered.splice(target, 0, image);
        // Normalize to a dense 0..n-1 sequence so subsequent moves are exact.
        for (const [index, candidate] of reordered.entries()) {
          if (candidate.sortOrder !== index) {
            await tx.listingImage.update({
              where: { id: candidate.id },
              data: { sortOrder: index },
            });
          }
        }
      }
    });

    await this.listings.registerImageChange(userId, listingId);
    return this.listings.getForOwner(userId, listingId, locale);
  }

  // --- Private helpers ------------------------------------------------------------

  private async loadImage(imageId: string, listingId: string): Promise<ListingImage> {
    if (!isUuid(imageId)) {
      throw new AppException('MEDIA_NOT_FOUND');
    }
    const image = await this.prisma.listingImage.findUnique({ where: { id: imageId } });
    // Scoped lookup: an image that is not on THIS listing is indistinguishable
    // from a missing one (listing ownership is already enforced upstream).
    if (image === null || image.deletedAt !== null || image.listingId !== listingId) {
      throw new AppException('MEDIA_NOT_FOUND');
    }
    return image;
  }

  /** Rows lock: serializes concurrent image writes for one listing. */
  private async lockListing(tx: Prisma.TransactionClient, listingId: string): Promise<void> {
    await tx.$queryRaw`SELECT id FROM "Listing" WHERE id = ${listingId}::uuid FOR UPDATE`;
  }

  private storageKeys(listingId: string, imageId: string): StorageKeys {
    const prefix = `listings/${listingId}/${imageId}`;
    return {
      prefix,
      original: `${prefix}/original.jpg`,
      variants: {
        thumbnail: `${prefix}/thumbnail.webp`,
        medium: `${prefix}/medium.webp`,
        large: `${prefix}/large.webp`,
      },
    };
  }

  private variantDescriptor(
    keys: StorageKeys,
    processed: ProcessedImage,
  ): Record<string, VariantDescriptor> {
    const descriptor: Record<string, VariantDescriptor> = {};
    for (const name of IMAGE_VARIANTS) {
      const variant = processed.variants[name];
      descriptor[name] = {
        key: keys.variants[name],
        width: variant.width,
        height: variant.height,
        size: variant.size,
      };
    }
    return descriptor;
  }

  private async writeFiles(keys: StorageKeys, processed: ProcessedImage): Promise<void> {
    try {
      await this.storage.put(keys.original, processed.original.data, ORIGINAL_MIME_TYPE);
      for (const name of IMAGE_VARIANTS) {
        await this.storage.put(
          keys.variants[name],
          processed.variants[name].data,
          VARIANT_MIME_TYPE,
        );
      }
    } catch (error) {
      this.logger.error(
        `Storage write failed for "${keys.prefix}": ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      await this.quietDeletePrefix(keys.prefix);
      throw new AppException('MEDIA_STORAGE_FAILED', { cause: error });
    }
  }

  /** Best-effort cleanup; never masks the original failure. */
  private async quietDeletePrefix(prefix: string): Promise<void> {
    try {
      await this.storage.deletePrefix(prefix);
    } catch (error) {
      this.logger.warn(
        `Failed to clean up storage prefix "${prefix}": ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
