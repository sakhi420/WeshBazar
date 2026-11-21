/**
 * Fast, atomic exhibition seeder.
 *
 * Image processing and local staging happen before the database transaction.
 * Database rows are inserted in bulk inside one short transaction. Listings
 * become ACTIVE only when that transaction commits, and their normal revision,
 * moderation and audit history is written in the same transaction.
 */
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { Prisma } from '../../../apps/api/src/generated/prisma/client';
import { EXHIBITION_FIXTURES, type ExhibitionFixture } from './fixtures';
import { sellerKeyForFixture, type ExhibitionSellerKey } from './sellers';
import type { ExhibitionSellerOwner } from './seed-exhibition';

const ORIGINAL_MIME_TYPE = 'image/jpeg';
const MAX_IMAGE_PIXELS = 25_000_000;
const ORIGINAL_JPEG_QUALITY = 85;
const VARIANT_WEBP_QUALITY = 80;
const VARIANT_WIDTHS = { thumbnail: 320, medium: 800, large: 1600 } as const;
const VARIANT_NAMES = ['thumbnail', 'medium', 'large'] as const;
type VariantName = (typeof VARIANT_NAMES)[number];

interface ProcessedImage {
  original: { data: Buffer; width: number; height: number; size: number; checksum: string };
  variants: Record<VariantName, { data: Buffer; width: number; height: number; size: number }>;
}

export interface PreparedExhibitionImage {
  listingId: string;
  imageId: string;
  storageKey: string;
  variants: Prisma.InputJsonObject;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  checksum: string;
}

interface FixtureLocation {
  categoryId: string;
  moderationMode: 'REVIEW_REQUIRED' | 'AUTO_APPROVE';
  provinceId: string;
  cityId: string;
}

interface BulkSeedOptions {
  fixtures: readonly ExhibitionFixture[];
  sellers: Record<ExhibitionSellerKey, ExhibitionSellerOwner>;
  adminUserId: string;
  normalizedAttributesBySlug: Map<string, Record<string, string | number | boolean | string[]>>;
  attributeSchemaReferenceBySlug: Map<string, Prisma.InputJsonValue>;
  preparedImagesBySlug: Map<string, PreparedExhibitionImage>;
}

function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function storageKeys(listingId: string, imageId: string) {
  const prefix = 'listings/' + listingId + '/' + imageId;
  return {
    original: prefix + '/original.jpg',
    variants: {
      thumbnail: prefix + '/thumbnail.webp',
      medium: prefix + '/medium.webp',
      large: prefix + '/large.webp',
    } as Record<VariantName, string>,
  };
}

async function writeFileSafe(storageRoot: string, key: string, data: Buffer): Promise<void> {
  if (key.includes('..') || key.includes('\\') || path.isAbsolute(key)) {
    throw new Error('Unsafe exhibition storage key: ' + key);
  }
  const target = path.resolve(storageRoot, key);
  if (!target.startsWith(storageRoot + path.sep)) {
    throw new Error('Storage key escapes the exhibition staging directory: ' + key);
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
}

async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength === 0) throw new Error('Exhibition image is empty.');
  const options: sharp.SharpOptions = {
    limitInputPixels: MAX_IMAGE_PIXELS,
    sequentialRead: true,
  };
  const metadata = await sharp(input, options).metadata();
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new Error('Exhibition image dimensions are invalid or too large.');
  }

  const original = await sharp(input, options)
    .rotate()
    .jpeg({ quality: ORIGINAL_JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const variants = {} as ProcessedImage['variants'];
  for (const name of VARIANT_NAMES) {
    const variant = await sharp(original.data, options)
      .resize({ width: VARIANT_WIDTHS[name], fit: 'inside', withoutEnlargement: true })
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

/**
 * Re-encodes every image and writes all four objects to the local staging
 * directory before any database transaction is opened.
 */
export async function prepareExhibitionImages(
  fixtures: readonly ExhibitionFixture[],
  storageRoot: string,
  onProgress?: (completed: number, total: number) => void,
): Promise<Map<string, PreparedExhibitionImage>> {
  const assetsRoot = path.resolve(process.cwd(), 'prisma/seed/exhibition/assets');
  const resolvedStorageRoot = path.resolve(storageRoot);
  const result = new Map<string, PreparedExhibitionImage>();

  for (let index = 0; index < fixtures.length; index += 1) {
    const fixture = fixtures[index];
    const sourcePath = path.resolve(assetsRoot, fixture.imageFile);
    if (!sourcePath.startsWith(assetsRoot + path.sep)) {
      throw new Error('Unsafe fixture asset path: ' + fixture.imageFile);
    }

    const image = await processImage(await fs.readFile(sourcePath));
    const listingId = randomUUID();
    const imageId = randomUUID();
    const keys = storageKeys(listingId, imageId);
    await writeFileSafe(resolvedStorageRoot, keys.original, image.original.data);

    const variants: Prisma.InputJsonObject = {
      thumbnail: {
        key: keys.variants.thumbnail,
        width: image.variants.thumbnail.width,
        height: image.variants.thumbnail.height,
        size: image.variants.thumbnail.size,
      },
      medium: {
        key: keys.variants.medium,
        width: image.variants.medium.width,
        height: image.variants.medium.height,
        size: image.variants.medium.size,
      },
      large: {
        key: keys.variants.large,
        width: image.variants.large.width,
        height: image.variants.large.height,
        size: image.variants.large.size,
      },
    };

    for (const name of VARIANT_NAMES) {
      await writeFileSafe(resolvedStorageRoot, keys.variants[name], image.variants[name].data);
    }

    result.set(fixture.slug, {
      listingId,
      imageId,
      storageKey: keys.original,
      variants,
      mimeType: ORIGINAL_MIME_TYPE,
      size: image.original.size,
      width: image.original.width,
      height: image.original.height,
      checksum: image.original.checksum,
    });

    onProgress?.(index + 1, fixtures.length);
  }

  return result;
}

function flattenAttributeValues(attributes: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const value of Object.values(attributes)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          values.push(String(item));
        }
      }
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      values.push(String(value));
    }
  }
  return values;
}

function buildSearchText(
  fixture: ExhibitionFixture,
  attributes: Record<string, unknown>,
): string {
  return [fixture.title, fixture.description, ...flattenAttributeValues(attributes)]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildSnapshot(input: {
  fixture: ExhibitionFixture;
  categoryId: string;
  provinceId: string;
  cityId: string;
  attributes: Record<string, string | number | boolean | string[]>;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE';
  version: number;
  publishedAt: Date | null;
  expiresAt: Date | null;
}): Prisma.InputJsonObject {
  return {
    title: input.fixture.title,
    description: input.fixture.description,
    price: input.fixture.price === null ? null : String(Number(input.fixture.price)),
    currency: 'AFN',
    pricingType: input.fixture.pricingType,
    negotiable: input.fixture.negotiable,
    condition: input.fixture.condition,
    attributes: input.attributes as Prisma.InputJsonObject,
    categoryId: input.categoryId,
    provinceId: input.provinceId,
    cityId: input.cityId,
    status: input.status,
    version: input.version,
    publishedAt: input.publishedAt?.toISOString() ?? null,
    expiresAt: input.expiresAt?.toISOString() ?? null,
  };
}

/**
 * Writes all relational data with a bounded number of SQL statements.
 * This implementation is intentionally for a clean 147-fixture insertion;
 * partial pre-existing fixture sets are rejected by the guarded CLI.
 */
export async function seedExhibitionDataBulk(
  db: Prisma.TransactionClient,
  options: BulkSeedOptions,
): Promise<{ listings: number; images: number; countsBySeller: Record<string, number> }> {
  const categorySlugs = [...new Set(options.fixtures.map((fixture) => fixture.categorySlug))];
  const provinceSlugs = [...new Set(options.fixtures.map((fixture) => fixture.provinceSlug))];
  const citySlugs = [...new Set(options.fixtures.map((fixture) => fixture.citySlug))];

  const categories = await db.category.findMany({
    where: { slug: { in: categorySlugs } },
    select: { id: true, slug: true, moderationMode: true },
  });
  const provinces = await db.province.findMany({
    where: { slug: { in: provinceSlugs } },
    select: { id: true, slug: true },
  });
  const cities = await db.city.findMany({
    where: {
      provinceId: { in: provinces.map((province) => province.id) },
      slug: { in: citySlugs },
    },
    select: { id: true, slug: true, provinceId: true },
  });

  const categoryBySlug = new Map(categories.map((item) => [item.slug, item] as const));
  const provinceBySlug = new Map(provinces.map((item) => [item.slug, item] as const));
  const cityByKey = new Map(cities.map((item) => [item.provinceId + '/' + item.slug, item] as const));
  const locationsBySlug = new Map<string, FixtureLocation>();

  for (const fixture of options.fixtures) {
    const category = categoryBySlug.get(fixture.categorySlug);
    const province = provinceBySlug.get(fixture.provinceSlug);
    const city = province ? cityByKey.get(province.id + '/' + fixture.citySlug) : undefined;
    if (!category || !province || !city) {
      throw new Error('Validated category or location disappeared for fixture ' + fixture.key + '.');
    }
    locationsBySlug.set(fixture.slug, {
      categoryId: category.id,
      moderationMode: category.moderationMode,
      provinceId: province.id,
      cityId: city.id,
    });
  }

  const now = new Date();
  const expiresAt = addDays(now, 30);
  const listingRows: Prisma.ListingCreateManyInput[] = [];
  const imageRows: Prisma.ListingImageCreateManyInput[] = [];
  const contactRows: Prisma.ListingContactMethodCreateManyInput[] = [];
  const revisionRows: Prisma.ListingRevisionCreateManyInput[] = [];
  const moderationRows: Prisma.ModerationActionCreateManyInput[] = [];
  const auditRows: Prisma.AuditLogCreateManyInput[] = [];
  const countsBySeller: Record<string, number> = {};

  for (const fixture of options.fixtures) {
    const sellerKey = sellerKeyForFixture(fixture);
    const seller = options.sellers[sellerKey];
    const location = locationsBySlug.get(fixture.slug);
    const attributes = options.normalizedAttributesBySlug.get(fixture.slug);
    const schemaReference = options.attributeSchemaReferenceBySlug.get(fixture.slug);
    const image = options.preparedImagesBySlug.get(fixture.slug);

    if (!location || !attributes || !schemaReference || !image) {
      throw new Error('Prevalidated listing data or image is missing for fixture ' + fixture.key + '.');
    }

    countsBySeller[sellerKey] = (countsBySeller[sellerKey] ?? 0) + 1;
    const automatic = location.moderationMode === 'AUTO_APPROVE';
    const activeVersion = automatic ? 2 : 3;

    listingRows.push({
      id: image.listingId,
      sellerAccountId: seller.sellerAccountId,
      categoryId: location.categoryId,
      provinceId: location.provinceId,
      cityId: location.cityId,
      slug: fixture.slug,
      title: fixture.title,
      description: fixture.description,
      price: fixture.price,
      currency: 'AFN',
      pricingType: fixture.pricingType,
      negotiable: fixture.negotiable,
      condition: fixture.condition,
      status: 'ACTIVE',
      attributes: attributes as Prisma.InputJsonObject,
      publishedAt: now,
      expiresAt,
      version: activeVersion,
      searchText: buildSearchText(fixture, attributes),
    });

    imageRows.push({
      id: image.imageId,
      listingId: image.listingId,
      storageKey: image.storageKey,
      variants: image.variants,
      mimeType: image.mimeType,
      size: image.size,
      width: image.width,
      height: image.height,
      checksum: image.checksum,
      sortOrder: 0,
      isPrimary: true,
    });

    for (const type of ['PHONE', 'WHATSAPP', 'TELEGRAM'] as const) {
      contactRows.push({
        id: randomUUID(),
        listingId: image.listingId,
        type,
        enabled: false,
        valueOverride: null,
      });
    }

    const draftSnapshot = buildSnapshot({
      fixture,
      categoryId: location.categoryId,
      provinceId: location.provinceId,
      cityId: location.cityId,
      attributes,
      status: 'DRAFT',
      version: 1,
      publishedAt: null,
      expiresAt: null,
    });
    revisionRows.push({
      id: randomUUID(),
      listingId: image.listingId,
      version: 1,
      changeType: 'CREATE',
      snapshot: draftSnapshot,
      attributeSchemaReference: schemaReference,
      createdByUserId: seller.userId,
    });

    const submittedStatus = automatic ? 'ACTIVE' : 'PENDING_REVIEW';
    const submittedSnapshot = buildSnapshot({
      fixture,
      categoryId: location.categoryId,
      provinceId: location.provinceId,
      cityId: location.cityId,
      attributes,
      status: submittedStatus,
      version: 2,
      publishedAt: automatic ? now : null,
      expiresAt: automatic ? expiresAt : null,
    });
    revisionRows.push({
      id: randomUUID(),
      listingId: image.listingId,
      version: 2,
      changeType: 'SUBMIT',
      snapshot: submittedSnapshot,
      attributeSchemaReference: schemaReference,
      createdByUserId: seller.userId,
    });

    if (!automatic) {
      const activeSnapshot = buildSnapshot({
        fixture,
        categoryId: location.categoryId,
        provinceId: location.provinceId,
        cityId: location.cityId,
        attributes,
        status: 'ACTIVE',
        version: 3,
        publishedAt: now,
        expiresAt,
      });
      revisionRows.push({
        id: randomUUID(),
        listingId: image.listingId,
        version: 3,
        changeType: 'APPROVE',
        snapshot: activeSnapshot,
        attributeSchemaReference: schemaReference,
        createdByUserId: options.adminUserId,
      });
      moderationRows.push({
        id: randomUUID(),
        listingId: image.listingId,
        adminUserId: options.adminUserId,
        action: 'APPROVE',
        reason: null,
        note: 'تأیید انتشار آگهی برای ویترین معرفی ویش‌بازار',
      });
      auditRows.push({
        id: randomUUID(),
        actorUserId: options.adminUserId,
        action: 'LISTING_APPROVED',
        entityType: 'Listing',
        entityId: image.listingId,
        metadata: {
          source: 'EXHIBITION_SEED',
          fixtureKey: fixture.key,
        },
      });
    }
  }

  const listingsCreated = await db.listing.createMany({ data: listingRows });
  if (listingsCreated.count !== options.fixtures.length) {
    throw new Error('Bulk listing insert count did not match the fixture count.');
  }

  const imagesCreated = await db.listingImage.createMany({ data: imageRows });
  if (imagesCreated.count !== options.fixtures.length) {
    throw new Error('Bulk image insert count did not match the fixture count.');
  }

  await db.listingContactMethod.createMany({ data: contactRows });
  await db.listingRevision.createMany({ data: revisionRows });
  if (moderationRows.length > 0) {
    await db.moderationAction.createMany({ data: moderationRows });
    await db.auditLog.createMany({ data: auditRows });
  }

  return {
    listings: listingsCreated.count,
    images: imagesCreated.count,
    countsBySeller,
  };
}
