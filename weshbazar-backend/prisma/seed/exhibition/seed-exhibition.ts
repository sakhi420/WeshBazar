/**
 * Exhibition seeding — inserts the 147 exhibition listing fixtures from
 * `fixtures.ts` under the admin seller account, routes each image through the
 * same re-encode + WebP variant pipeline used by `ImageProcessor`, writes the
 * storage objects under `LOCAL_STORAGE_PATH`, and creates `ListingImage` rows.
 *
 * Idempotency: stable fixture slugs are create-once; re-runs preserve existing
 * listing edits and only add a missing image. Non-active fixtures are never reactivated.
 */
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { PrismaClient } from '../../../apps/api/src/generated/prisma/client';
import { EXHIBITION_FIXTURES } from './fixtures';

const LISTING_EXPIRES_AFTER_DAYS = 30;

export interface ExhibitionSeedOptions {
  /** Keep false unless the admin explicitly approves publishing their phone number. */
  contactsEnabled?: boolean;
}
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

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function buildSearchText(parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((p): p is string | number => p !== null && p !== undefined)
    .map((p) => String(p))
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
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

/** Replicates `ImageProcessor.process` (jpeg original + webp variants). */
async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength === 0) throw new Error('empty image');
  const opts: sharp.SharpOptions = { limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true };

  const metadata = await sharp(input, opts).metadata();
  if (!metadata.width || !metadata.height) throw new Error('invalid image');
  if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) throw new Error('image too large');

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

function storageKeys(listingId: string, imageId: string) {
  const prefix = `listings/${listingId}/${imageId}`;
  return {
    prefix,
    original: `${prefix}/original.jpg`,
    variants: {
      thumbnail: `${prefix}/thumbnail.webp`,
      medium: `${prefix}/medium.webp`,
      large: `${prefix}/large.webp`,
    } as Record<VariantName, string>,
  };
}

async function writeFileSafe(storageRoot: string, key: string, data: Buffer): Promise<void> {
  if (key.includes('..') || key.includes('\\')) {
    throw new Error(`unsafe storage key: ${key}`);
  }
  const target = path.resolve(storageRoot, key);
  if (target !== storageRoot && !target.startsWith(storageRoot + path.sep)) {
    throw new Error(`storage key escapes root: ${key}`);
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
}

/** Adds the fixture image to a listing (idempotent — skips if images exist). */
async function ensureImage(
  prisma: PrismaClient,
  listingId: string,
  imagePath: string,
  storageRoot: string,
): Promise<void> {
  const existing = await prisma.listingImage.count({ where: { listingId, deletedAt: null } });
  if (existing > 0) return;

  const input = await fs.readFile(imagePath);
  const processed = await processImage(input);

  const duplicate = await prisma.listingImage.findFirst({
    where: { listingId, checksum: processed.original.checksum, deletedAt: null },
  });
  if (duplicate) return;

  const imageId = randomUUID();
  const keys = storageKeys(listingId, imageId);

  await writeFileSafe(storageRoot, keys.original, processed.original.data);
  for (const name of Object.keys(keys.variants) as VariantName[]) {
    await writeFileSafe(storageRoot, keys.variants[name], processed.variants[name].data);
  }

  const variants = {} as Record<string, VariantDescriptor>;
  for (const name of Object.keys(keys.variants) as VariantName[]) {
    variants[name] = {
      key: keys.variants[name],
      width: processed.variants[name].width,
      height: processed.variants[name].height,
      size: processed.variants[name].size,
    };
  }

  await prisma.listingImage.create({
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

export async function seedExhibitionData(
  prisma: PrismaClient,
  options: ExhibitionSeedOptions = {},
): Promise<void> {
  const contactsEnabled = options.contactsEnabled ?? false;

  // The app serves media from `apps/api/var/storage` (NestJS runs with CWD =
  // apps/api), so a relative LOCAL_STORAGE_PATH must be resolved the same way —
  // otherwise re-seeding writes images the running backend cannot serve.
  const rawStoragePath = process.env.LOCAL_STORAGE_PATH ?? './var/storage';
  const storageRoot = path.isAbsolute(rawStoragePath)
    ? rawStoragePath
    : path.resolve(process.cwd(), 'apps/api', rawStoragePath);
  const assetsDir = path.resolve(process.cwd(), 'prisma/seed/exhibition/assets');

  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '+93700000000';
  const admin = await prisma.user.findUnique({ where: { phoneNormalized: adminPhone } });
  if (!admin) {
    throw new Error(
      `Admin user (${adminPhone}) not found — run the base seed (locations + taxonomy + admin) first.`,
    );
  }
  const sellerAccount = await prisma.sellerAccount.findUnique({
    where: { ownerUserId: admin.id },
  });
  if (!sellerAccount) {
    throw new Error('Admin seller account not found — run the base seed first.');
  }

  const categoryCache = new Map<string, Record<string, string[]>>();
  async function selectOptions(categoryId: string): Promise<Record<string, string[]>> {
    const cached = categoryCache.get(categoryId);
    if (cached) return cached;
    const attributes = await prisma.categoryAttribute.findMany({
      where: { categoryId, isActive: true },
      include: { options: { where: { isActive: true } } },
    });
    const map: Record<string, string[]> = {};
    for (const attribute of attributes) {
      if (attribute.type === 'SELECT') {
        map[attribute.key] = attribute.options.map((o) => o.value);
      }
    }
    categoryCache.set(categoryId, map);
    return map;
  }

  let inserted = 0;

  for (const fixture of EXHIBITION_FIXTURES) {
    const category = await prisma.category.findUnique({ where: { slug: fixture.categorySlug } });
    if (!category) throw new Error(`Category not found: ${fixture.categorySlug}`);

    const province = await prisma.province.findUnique({ where: { slug: fixture.provinceSlug } });
    if (!province) throw new Error(`Province not found: ${fixture.provinceSlug}`);

    const city = await prisma.city.findUnique({
      where: { provinceId_slug: { provinceId: province.id, slug: fixture.citySlug } },
    });
    if (!city) throw new Error(`City not found: ${fixture.provinceSlug}/${fixture.citySlug}`);

    const selectable = await selectOptions(category.id);
    for (const [key, value] of Object.entries(fixture.attributes)) {
      const allowed = selectable[key];
      if (allowed && !allowed.includes(String(value))) {
        throw new Error(
          `Invalid SELECT value for ${fixture.key}: attribute "${key}" = "${value}" ` +
            `(allowed: ${allowed.join(', ')})`,
        );
      }
    }

    const searchText = buildSearchText([
      fixture.title,
      fixture.description,
      ...flattenAttributeValues(fixture.attributes),
    ]);
    const publishedAt = new Date();
    const expiresAt = new Date(
      Date.now() + LISTING_EXPIRES_AFTER_DAYS * 24 * 60 * 60 * 1000,
    );

    const existingListing = await prisma.listing.findUnique({
      where: { slug: fixture.slug },
    });
    let listing: NonNullable<typeof existingListing>;

    if (existingListing) {
      if (existingListing.sellerAccountId !== sellerAccount.id) {
        throw new Error(
          `Fixture slug "${fixture.slug}" is already owned by another seller.`,
        );
      }
      if (existingListing.status !== 'ACTIVE' || existingListing.deletedAt !== null) {
        throw new Error(
          `Fixture listing "${fixture.slug}" is not active; refusing to reactivate it.`,
        );
      }
      // Preserve any edits made after the first seed.
      listing = existingListing;
    } else {
      listing = await prisma.listing.create({
        data: {
          sellerAccountId: sellerAccount.id,
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
          status: 'ACTIVE',
          attributes: fixture.attributes,
          searchText,
          publishedAt,
          expiresAt,
        },
      });
    }

    const revision = await prisma.listingRevision.findUnique({
      where: { listingId_version: { listingId: listing.id, version: 1 } },
    });
    if (!revision) {
      await prisma.listingRevision.create({
        data: {
          listingId: listing.id,
          version: 1,
          changeType: 'CREATE',
          snapshot: {
            title: fixture.title,
            description: fixture.description,
            price: fixture.price,
            currency: 'AFN',
            pricingType: fixture.pricingType,
            condition: fixture.condition,
            attributes: fixture.attributes,
          },
          createdByUserId: admin.id,
        },
      });
    }

    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: listing.id, type: 'PHONE' } },
      update: { enabled: contactsEnabled },
      create: { listingId: listing.id, type: 'PHONE', enabled: contactsEnabled },
    });
    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: listing.id, type: 'WHATSAPP' } },
      update: { enabled: contactsEnabled },
      create: { listingId: listing.id, type: 'WHATSAPP', enabled: contactsEnabled },
    });

    await ensureImage(prisma, listing.id, path.join(assetsDir, fixture.imageFile), storageRoot);

    inserted += 1;
  }

  console.log(
    `✔ Exhibition data seeded: ${inserted} ACTIVE listings under "${sellerAccount.slug}" ` +
      `(images → ${storageRoot}).`,
  );
}