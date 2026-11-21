/**
 * Exhibition listing seeder.
 *
 * This module is called only from the guarded CLI runner. It runs within the
 * caller's database transaction, creates complete listings before publishing,
 * records the normal create/submit/approve revision trail, and stages every
 * original + WebP variant under a per-run local directory.
 */
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { Prisma } from '../../../apps/api/src/generated/prisma/client';
import type { ListingRevisionChangeType } from '../../../apps/api/src/generated/prisma/enums';
import { EXHIBITION_FIXTURES, type ExhibitionFixture } from './fixtures';
import {
  sellerKeyForFixture,
  type ExhibitionSellerKey,
} from './sellers';

type Database = Prisma.TransactionClient;

export interface ExhibitionSellerOwner {
  userId: string;
  sellerAccountId: string;
}

export interface ExhibitionSeedOptions {
  sellers: Record<ExhibitionSellerKey, ExhibitionSellerOwner>;
  adminUserId: string;
  normalizedAttributesBySlug: Map<string, Record<string, string | number | boolean | string[]>>;
  attributeSchemaReferenceBySlug: Map<string, Prisma.InputJsonValue>;
  storageRoot: string;
}

const LISTING_EXPIRES_AFTER_DAYS = 30;
const ORIGINAL_MIME_TYPE = 'image/jpeg';
const VARIANT_MIME_TYPE = 'image/webp';
const MAX_IMAGE_PIXELS = 25_000_000;
const ORIGINAL_JPEG_QUALITY = 85;
const VARIANT_WEBP_QUALITY = 80;
const VARIANT_WIDTHS = { thumbnail: 320, medium: 800, large: 1600 } as const;

type VariantName = keyof typeof VARIANT_WIDTHS;

interface ProcessedImage {
  original: { data: Buffer; width: number; height: number; size: number; checksum: string };
  variants: Record<VariantName, { data: Buffer; width: number; height: number; size: number }>;
}

interface VariantDescriptor {
  key: string;
  width: number;
  height: number;
  size: number;
}

interface ListingSnapshotSource {
  title: string;
  description: string;
  price: { toString(): string } | string | null;
  currency: string;
  pricingType: string;
  negotiable: boolean;
  condition: string;
  attributes: Prisma.JsonValue;
  categoryId: string;
  provinceId: string;
  cityId: string;
  status: string;
  version: number;
  publishedAt: Date | null;
  expiresAt: Date | null;
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function flattenAttributeValues(attributes: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const value of Object.values(attributes)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) values.push(String(item));
      }
    } else if (value !== null && value !== undefined && typeof value !== 'object') {
      values.push(String(value));
    }
  }
  return values;
}

function buildSearchText(fixture: ExhibitionFixture, attributes: Record<string, unknown>): string {
  return [fixture.title, fixture.description, ...flattenAttributeValues(attributes)]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function toSnapshot(
  listing: ListingSnapshotSource,
  overrides: Partial<Pick<ListingSnapshotSource, 'status' | 'version' | 'publishedAt' | 'expiresAt'>> = {},
): Prisma.InputJsonObject {
  const status = overrides.status ?? listing.status;
  const version = overrides.version ?? listing.version;
  const publishedAt = overrides.publishedAt === undefined ? listing.publishedAt : overrides.publishedAt;
  const expiresAt = overrides.expiresAt === undefined ? listing.expiresAt : overrides.expiresAt;
  return {
    title: listing.title,
    description: listing.description,
    price: listing.price === null ? null : listing.price.toString(),
    currency: listing.currency,
    pricingType: listing.pricingType,
    negotiable: listing.negotiable,
    condition: listing.condition,
    attributes: listing.attributes as Prisma.InputJsonValue,
    categoryId: listing.categoryId,
    provinceId: listing.provinceId,
    cityId: listing.cityId,
    status,
    version,
    publishedAt: publishedAt?.toISOString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null,
  };
}

async function appendRevision(
  db: Database,
  input: {
    listingId: string;
    version: number;
    changeType: ListingRevisionChangeType;
    snapshot: Prisma.InputJsonObject;
    userId: string;
    attributeSchemaReference: Prisma.InputJsonValue;
  },
): Promise<void> {
  await db.listingRevision.create({
    data: {
      listingId: input.listingId,
      version: input.version,
      changeType: input.changeType,
      snapshot: input.snapshot,
      attributeSchemaReference: input.attributeSchemaReference,
      createdByUserId: input.userId,
    },
  });
}

function storageKeys(listingId: string, imageId: string) {
  const prefix = `listings/${listingId}/${imageId}`;
  return {
    original: `${prefix}/original.jpg`,
    variants: {
      thumbnail: `${prefix}/thumbnail.webp`,
      medium: `${prefix}/medium.webp`,
      large: `${prefix}/large.webp`,
    } as Record<VariantName, string>,
  };
}

async function writeFileSafe(storageRoot: string, key: string, data: Buffer): Promise<void> {
  if (key.includes('..') || key.includes('\\') || path.isAbsolute(key)) {
    throw new Error(`Unsafe exhibition storage key: ${key}`);
  }
  const target = path.resolve(storageRoot, key);
  if (!target.startsWith(storageRoot + path.sep)) {
    throw new Error(`Storage key escapes the exhibition staging directory: ${key}`);
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
}

async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength === 0) throw new Error('Exhibition image is empty.');
  const opts: sharp.SharpOptions = {
    limitInputPixels: MAX_IMAGE_PIXELS,
    sequentialRead: true,
  };
  const metadata = await sharp(input, opts).metadata();
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new Error('Exhibition image dimensions are invalid or too large.');
  }

  const original = await sharp(input, opts)
    .rotate()
    .jpeg({ quality: ORIGINAL_JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const variants = {} as ProcessedImage['variants'];
  for (const [name, width] of Object.entries(VARIANT_WIDTHS) as [VariantName, number][]) {
    const variant = await sharp(original.data, opts)
      .resize({ width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: VARIANT_WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
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
      checksum: sha256(original.data),
    },
    variants,
  };
}

function existingVariantKeys(value: Prisma.JsonValue): Record<VariantName, string> {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('Existing listing image has an invalid variants descriptor.');
  }
  const result = {} as Record<VariantName, string>;
  for (const name of Object.keys(VARIANT_WIDTHS) as VariantName[]) {
    const descriptor = value[name];
    if (
      descriptor === null ||
      Array.isArray(descriptor) ||
      typeof descriptor !== 'object' ||
      typeof descriptor.key !== 'string' ||
      descriptor.key.length === 0
    ) {
      throw new Error(`Existing listing image is missing the ${name} storage key.`);
    }
    result[name] = descriptor.key;
  }
  return result;
}

/**
 * Every active image row is materialized into the selected staging directory.
 * Existing DB keys are preserved so re-running also repairs missing Neon
 * objects instead of silently skipping an image whose object was never copied.
 */
async function ensureImage(
  db: Database,
  listingId: string,
  imagePath: string,
  storageRoot: string,
): Promise<void> {
  const activeImages = await db.listingImage.findMany({
    where: { listingId, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, storageKey: true, variants: true, checksum: true },
  });
  if (activeImages.length > 1) {
    throw new Error(`Fixture listing ${listingId} has multiple active images; manual review is required.`);
  }

  const processed = await processImage(await fs.readFile(imagePath));
  const existing = activeImages[0];

  if (existing) {
    if (existing.checksum !== processed.original.checksum) {
      throw new Error(
        `Existing image checksum does not match fixture source for listing ${listingId}; refusing to overwrite it.`,
      );
    }
    const variantKeys = existingVariantKeys(existing.variants);
    await writeFileSafe(storageRoot, existing.storageKey, processed.original.data);
    const variants: Record<string, VariantDescriptor> = {};
    for (const name of Object.keys(VARIANT_WIDTHS) as VariantName[]) {
      const variant = processed.variants[name];
      await writeFileSafe(storageRoot, variantKeys[name], variant.data);
      variants[name] = {
        key: variantKeys[name],
        width: variant.width,
        height: variant.height,
        size: variant.size,
      };
    }
    await db.listingImage.update({
      where: { id: existing.id },
      data: {
        variants,
        mimeType: ORIGINAL_MIME_TYPE,
        size: processed.original.size,
        width: processed.original.width,
        height: processed.original.height,
        checksum: processed.original.checksum,
      },
    });
    return;
  }

  const imageId = randomUUID();
  const keys = storageKeys(listingId, imageId);
  await writeFileSafe(storageRoot, keys.original, processed.original.data);

  const variants: Record<string, VariantDescriptor> = {};
  for (const name of Object.keys(keys.variants) as VariantName[]) {
    const variant = processed.variants[name];
    await writeFileSafe(storageRoot, keys.variants[name], variant.data);
    variants[name] = {
      key: keys.variants[name],
      width: variant.width,
      height: variant.height,
      size: variant.size,
    };
  }

  await db.listingImage.create({
    data: {
      id: imageId,
      listingId,
      storageKey: keys.original,
      variants,
      mimeType: ORIGINAL_MIME_TYPE,
      size: processed.original.size,
      width: processed.original.width,
      height: processed.original.height,
      checksum: processed.original.checksum,
      sortOrder: 0,
      isPrimary: true,
    },
  });
}

async function ensureContactsDisabled(db: Database, listingId: string): Promise<void> {
  for (const type of ['PHONE', 'WHATSAPP', 'TELEGRAM'] as const) {
    await db.listingContactMethod.upsert({
      where: { listingId_type: { listingId, type } },
      update: { enabled: false, valueOverride: null },
      create: { listingId, type, enabled: false },
    });
  }
}

async function approveByAdmin(
  db: Database,
  input: { listingId: string; adminUserId: string; fixtureKey: string },
): Promise<void> {
  await db.moderationAction.create({
    data: {
      listingId: input.listingId,
      adminUserId: input.adminUserId,
      action: 'APPROVE',
      reason: null,
      note: 'تأیید انتشار آگهی برای ویترین معرفی ویش‌بازار',
    },
  });
  await db.auditLog.create({
    data: {
      actorUserId: input.adminUserId,
      action: 'LISTING_APPROVED',
      entityType: 'Listing',
      entityId: input.listingId,
      metadata: {
        source: 'EXHIBITION_SEED',
        fixtureKey: input.fixtureKey,
      },
    },
  });
}

async function publishDraft(
  db: Database,
  input: {
    listing: Prisma.ListingGetPayload<{}> | null;
    sellerUserId: string;
    adminUserId: string;
    fixture: ExhibitionFixture;
    moderationMode: 'REVIEW_REQUIRED' | 'AUTO_APPROVE';
    attributeSchemaReference: Prisma.InputJsonValue;
    now: Date;
  },
): Promise<void> {
  if (!input.listing) throw new Error('Cannot publish a missing exhibition listing.');
  const listing = input.listing;
  const expiresAt = addDays(input.now, LISTING_EXPIRES_AFTER_DAYS);
  const nextVersion = listing.version + 1;

  if (input.moderationMode === 'AUTO_APPROVE') {
    const active = await db.listing.update({
      where: { id: listing.id },
      data: {
        status: 'ACTIVE',
        publishedAt: input.now,
        expiresAt,
        version: nextVersion,
      },
    });
    await appendRevision(db, {
      listingId: active.id,
      version: nextVersion,
      changeType: 'SUBMIT',
      snapshot: toSnapshot(active),
      userId: input.sellerUserId,
      attributeSchemaReference: input.attributeSchemaReference,
    });
    return;
  }

  const pending = await db.listing.update({
    where: { id: listing.id },
    data: { status: 'PENDING_REVIEW', version: nextVersion },
  });
  await appendRevision(db, {
    listingId: pending.id,
    version: nextVersion,
    changeType: 'SUBMIT',
    snapshot: toSnapshot(pending),
    userId: input.sellerUserId,
    attributeSchemaReference: input.attributeSchemaReference,
  });

  const approvedAt = new Date(input.now);
  const approved = await db.listing.update({
    where: { id: pending.id },
    data: {
      status: 'ACTIVE',
      publishedAt: approvedAt,
      expiresAt,
      version: nextVersion + 1,
    },
  });
  await appendRevision(db, {
    listingId: approved.id,
    version: nextVersion + 1,
    changeType: 'APPROVE',
    snapshot: toSnapshot(approved),
    userId: input.adminUserId,
    attributeSchemaReference: input.attributeSchemaReference,
  });
  await approveByAdmin(db, {
    listingId: approved.id,
    adminUserId: input.adminUserId,
    fixtureKey: input.fixture.key,
  });
}

export async function seedExhibitionData(
  db: Database,
  options: ExhibitionSeedOptions,
): Promise<{ listings: number; images: number; countsBySeller: Record<string, number> }> {
  const assetsDir = path.resolve(process.cwd(), 'prisma/seed/exhibition/assets');
  const countsBySeller: Record<string, number> = {};
  let imageCount = 0;
  const now = new Date();

  for (const fixture of EXHIBITION_FIXTURES) {
    const sellerKey = sellerKeyForFixture(fixture);
    const seller = options.sellers[sellerKey];
    countsBySeller[sellerKey] = (countsBySeller[sellerKey] ?? 0) + 1;

    const [category, province] = await Promise.all([
      db.category.findUnique({ where: { slug: fixture.categorySlug } }),
      db.province.findUnique({ where: { slug: fixture.provinceSlug } }),
    ]);
    if (!category || !province) {
      throw new Error(`Validated base data disappeared for ${fixture.key}.`);
    }
    const city = await db.city.findUnique({
      where: { provinceId_slug: { provinceId: province.id, slug: fixture.citySlug } },
    });
    if (!city) throw new Error(`Validated city disappeared for ${fixture.key}.`);

    const normalizedAttributes = options.normalizedAttributesBySlug.get(fixture.slug);
    if (!normalizedAttributes) {
      throw new Error(`Validated attributes are missing for ${fixture.key}.`);
    }
    const searchText = buildSearchText(fixture, normalizedAttributes);
    const attributeSchemaReference = options.attributeSchemaReferenceBySlug.get(fixture.slug);
    if (!attributeSchemaReference) {
      throw new Error(`Validated attribute schema reference is missing for ${fixture.key}.`);
    }

    let listing = await db.listing.findUnique({ where: { slug: fixture.slug } });
    if (listing) {
      if (listing.sellerAccountId !== seller.sellerAccountId) {
        throw new Error(`Fixture slug collision: ${fixture.slug} belongs to another seller.`);
      }
      if (listing.deletedAt !== null) {
        throw new Error(`Fixture ${fixture.slug} is soft-deleted; refusing to restore it.`);
      }
      if (!['ACTIVE', 'ARCHIVED'].includes(listing.status)) {
        throw new Error(`Fixture ${fixture.slug} has unsupported status ${listing.status}.`);
      }

      if (listing.status === 'ARCHIVED') {
        const restored = await db.listing.update({
          where: { id: listing.id },
          data: {
            status: 'DRAFT',
            archivedAt: null,
            expiresAt: null,
            version: listing.version + 1,
          },
        });
        await appendRevision(db, {
          listingId: restored.id,
          version: restored.version,
          changeType: 'RESTORE',
          snapshot: toSnapshot(restored),
          userId: seller.userId,
          attributeSchemaReference,
        });
        listing = restored;
      }
    } else {
      listing = await db.listing.create({
        data: {
          sellerAccountId: seller.sellerAccountId,
          categoryId: category.id,
          provinceId: province.id,
          cityId: city.id,
          slug: fixture.slug,
          title: fixture.title,
          description: fixture.description,
          price: fixture.price,
          currency: 'AFN',
          pricingType: fixture.pricingType,
          negotiable: fixture.negotiable,
          condition: fixture.condition,
          status: 'DRAFT',
          attributes: normalizedAttributes,
          searchText,
        },
      });
      await appendRevision(db, {
        listingId: listing.id,
        version: listing.version,
        changeType: 'CREATE',
        snapshot: toSnapshot(listing),
        userId: seller.userId,
        attributeSchemaReference,
      });
    }

    await ensureContactsDisabled(db, listing.id);
    await ensureImage(
      db,
      listing.id,
      path.join(assetsDir, fixture.imageFile),
      options.storageRoot,
    );
    imageCount += 1;

    if (listing.status === 'DRAFT') {
      await publishDraft(db, {
        listing,
        sellerUserId: seller.userId,
        adminUserId: options.adminUserId,
        fixture,
        moderationMode: category.moderationMode,
        attributeSchemaReference,
        now,
      });
    } else if (listing.status === 'ACTIVE') {
      const expired = listing.expiresAt === null || listing.expiresAt.getTime() <= now.getTime();
      if (expired) {
        const expiresAt = addDays(now, LISTING_EXPIRES_AFTER_DAYS);
        const renewed = await db.listing.update({
          where: { id: listing.id },
          data: { expiresAt, version: listing.version + 1 },
        });
        await appendRevision(db, {
          listingId: renewed.id,
          version: renewed.version,
          changeType: 'RENEW',
          snapshot: toSnapshot(renewed),
          userId: seller.userId,
          attributeSchemaReference,
        });
      }
    }

    const finalListing = await db.listing.findUnique({
      where: { id: listing.id },
      select: {
        status: true,
        deletedAt: true,
        expiresAt: true,
        sellerAccountId: true,
        images: { where: { deletedAt: null }, select: { id: true } },
        contactMethods: {
          where: { type: { in: ['PHONE', 'WHATSAPP'] } },
          select: { enabled: true },
        },
      },
    });
    if (
      !finalListing ||
      finalListing.sellerAccountId !== seller.sellerAccountId ||
      finalListing.status !== 'ACTIVE' ||
      finalListing.deletedAt !== null ||
      !finalListing.expiresAt ||
      finalListing.expiresAt.getTime() <= now.getTime() ||
      finalListing.images.length === 0 ||
      finalListing.contactMethods.some((method) => method.enabled)
    ) {
      throw new Error(`Post-seed verification failed for fixture ${fixture.key}.`);
    }

    // Existing fixtures are never reworded or reassigned; their current content
    // and revisions remain intact. The seed only repairs images/contact safety
    // and extends expired active fixtures with a RENEW revision.
  }

  const totalListings = EXHIBITION_FIXTURES.length;
  if (totalListings !== 147) {
    throw new Error(`Expected 147 fixtures, found ${totalListings}.`);
  }
  return { listings: totalListings, images: imageCount, countsBySeller };
}
