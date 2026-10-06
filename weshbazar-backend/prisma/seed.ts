/**
 * Database seed — idempotent and safe to run repeatedly.
 *
 * Seeds:
 *  - all 34 Afghan provinces and their principal cities (en/fa/ps names);
 *  - the category tree with dynamic attribute definitions and options;
 *  - the initial admin account (from `SEED_ADMIN_*` environment variables);
 *  - optional demo data (user, seller account and sample listings) when
 *    `SEED_SAMPLE_DATA=true`.
 *
 * Run with `npm run db:seed` (maps to `prisma db seed`).
 */
import 'dotenv/config';
import { argon2id, hash as hashPassword } from 'argon2';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../apps/api/src/generated/prisma/client';
import { PROVINCES } from './seed/locations.data';
import { CATEGORIES } from './seed/taxonomy.data';
import type { CategorySeed } from './seed/types';

const LOCALES = ['en', 'fa', 'ps'] as const;
const LISTING_EXPIRES_AFTER_DAYS = 30;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required to run the seed script.');
  }
  return url;
}

function normalizePhoneOrThrow(raw: string): string {
  const parsed = parsePhoneNumberFromString(raw.trim());
  if (!parsed || !parsed.isValid()) {
    throw new Error(`Invalid phone number "${raw}" — expected E.164 (e.g. +93700123456).`);
  }
  return parsed.number;
}

/**
 * Deterministic, normalized search text for sample listings. The application
 * maintains this field through its own search-text builder; the seed uses the
 * same normalization rules (lowercase, collapsed whitespace).
 */
function buildSearchText(parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((part): part is string | number => part !== null && part !== undefined)
    .map((part) => String(part))
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function scalarToString(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }
  return null;
}

function flattenAttributeValues(attributes: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const value of Object.values(attributes)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const text = scalarToString(item);
        if (text !== null) {
          values.push(text);
        }
      }
    } else {
      const text = scalarToString(value);
      if (text !== null) {
        values.push(text);
      }
    }
  }
  return values;
}

function findCategorySeed(slug: string): CategorySeed | undefined {
  for (const root of CATEGORIES) {
    if (root.slug === slug) {
      return root;
    }
    const child = root.children?.find((candidate) => candidate.slug === slug);
    if (child) {
      return child;
    }
  }
  return undefined;
}

// -----------------------------------------------------------------------------
// Locations
// -----------------------------------------------------------------------------

async function seedLocations(prisma: PrismaClient): Promise<void> {
  let cities = 0;

  for (const [provinceIndex, province] of PROVINCES.entries()) {
    const record = await prisma.province.upsert({
      where: { code: province.code },
      update: { slug: province.slug, sortOrder: provinceIndex },
      create: { code: province.code, slug: province.slug, sortOrder: provinceIndex },
    });

    for (const locale of LOCALES) {
      await prisma.provinceTranslation.upsert({
        where: { provinceId_locale: { provinceId: record.id, locale } },
        update: { name: province.names[locale] },
        create: { provinceId: record.id, locale, name: province.names[locale] },
      });
    }

    for (const [cityIndex, city] of province.cities.entries()) {
      const cityRecord = await prisma.city.upsert({
        where: { provinceId_slug: { provinceId: record.id, slug: city.slug } },
        update: { sortOrder: cityIndex },
        create: { provinceId: record.id, slug: city.slug, sortOrder: cityIndex },
      });

      for (const locale of LOCALES) {
        await prisma.cityTranslation.upsert({
          where: { cityId_locale: { cityId: cityRecord.id, locale } },
          update: { name: city.names[locale] },
          create: { cityId: cityRecord.id, locale, name: city.names[locale] },
        });
      }
      cities += 1;
    }
  }

  console.log(`✔ Locations seeded: ${PROVINCES.length} provinces, ${cities} cities.`);
}

// -----------------------------------------------------------------------------
// Taxonomy
// -----------------------------------------------------------------------------

interface TaxonomyCounters {
  categories: number;
  attributes: number;
  options: number;
}

async function upsertCategoryTree(
  prisma: PrismaClient,
  seed: CategorySeed,
  parentId: string | null,
  counters: TaxonomyCounters,
): Promise<string> {
  const category = await prisma.category.upsert({
    where: { slug: seed.slug },
    update: { parentId, iconKey: seed.iconKey ?? null },
    create: { slug: seed.slug, parentId, iconKey: seed.iconKey ?? null },
  });
  counters.categories += 1;

  for (const locale of LOCALES) {
    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: category.id, locale } },
      update: { name: seed.names[locale] },
      create: { categoryId: category.id, locale, name: seed.names[locale] },
    });
  }

  for (const [attributeIndex, attribute] of (seed.attributes ?? []).entries()) {
    const attributeRecord = await prisma.categoryAttribute.upsert({
      where: { categoryId_key: { categoryId: category.id, key: attribute.key } },
      update: {
        label: attribute.label,
        type: attribute.type,
        required: attribute.required ?? false,
        filterable: attribute.filterable ?? false,
        searchable: attribute.searchable ?? false,
        unit: attribute.unit ?? null,
        placeholder: attribute.placeholder ?? null,
        minValue: attribute.minValue ?? null,
        maxValue: attribute.maxValue ?? null,
        minLength: attribute.minLength ?? null,
        maxLength: attribute.maxLength ?? null,
        sortOrder: attributeIndex,
      },
      create: {
        categoryId: category.id,
        key: attribute.key,
        label: attribute.label,
        type: attribute.type,
        required: attribute.required ?? false,
        filterable: attribute.filterable ?? false,
        searchable: attribute.searchable ?? false,
        unit: attribute.unit ?? null,
        placeholder: attribute.placeholder ?? null,
        minValue: attribute.minValue ?? null,
        maxValue: attribute.maxValue ?? null,
        minLength: attribute.minLength ?? null,
        maxLength: attribute.maxLength ?? null,
        sortOrder: attributeIndex,
      },
    });
    counters.attributes += 1;

    for (const [optionIndex, option] of (attribute.options ?? []).entries()) {
      await prisma.categoryAttributeOption.upsert({
        where: {
          attributeId_value: { attributeId: attributeRecord.id, value: option.value },
        },
        update: { label: option.label, sortOrder: optionIndex },
        create: {
          attributeId: attributeRecord.id,
          value: option.value,
          label: option.label,
          sortOrder: optionIndex,
        },
      });
      counters.options += 1;
    }
  }

  for (const child of seed.children ?? []) {
    await upsertCategoryTree(prisma, child, category.id, counters);
  }

  return category.id;
}

async function seedTaxonomy(prisma: PrismaClient): Promise<void> {
  const counters: TaxonomyCounters = { categories: 0, attributes: 0, options: 0 };
  for (const root of CATEGORIES) {
    await upsertCategoryTree(prisma, root, null, counters);
  }
  console.log(
    `✔ Taxonomy seeded: ${counters.categories} categories, ` +
      `${counters.attributes} attributes, ${counters.options} attribute options.`,
  );
}

// -----------------------------------------------------------------------------
// Admin account
// -----------------------------------------------------------------------------

async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawPhone = process.env.SEED_ADMIN_PHONE ?? '+93700000000';
  const configuredPassword = process.env.SEED_ADMIN_PASSWORD;
  const displayName = process.env.SEED_ADMIN_DISPLAY_NAME ?? 'WeshBazar Admin';

  if (isProduction && !configuredPassword) {
    throw new Error('SEED_ADMIN_PASSWORD is required when seeding in production.');
  }

  const password = configuredPassword || 'ChangeMe123!';
  if (!configuredPassword) {
    console.warn('⚠ SEED_ADMIN_PASSWORD not set — using the development fallback password.');
  }

  const phoneNormalized = normalizePhoneOrThrow(rawPhone);
  const passwordHash = await hashPassword(password, { type: argon2id });

  const admin = await prisma.user.upsert({
    where: { phoneNormalized },
    update: {
      passwordHash,
      displayName,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      phone: phoneNormalized,
      phoneNormalized,
      passwordHash,
      displayName,
      role: 'ADMIN',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
    },
  });

  // Every user owns a personal seller account (spec §25); seed-created users
  // are provisioned here because they bypass the registration service.
  await prisma.sellerAccount.upsert({
    where: { ownerUserId: admin.id },
    update: {},
    create: {
      ownerUserId: admin.id,
      displayName,
      slug: 'weshbazar-admin',
      type: 'INDIVIDUAL',
      status: 'ACTIVE',
    },
  });

  console.log(`✔ Admin account seeded (${phoneNormalized}).`);
}

// -----------------------------------------------------------------------------
// Optional demo data
// -----------------------------------------------------------------------------

interface SampleListing {
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  price: string | null;
  pricingType: 'PAID' | 'FREE' | 'CONTACT';
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  status: 'ACTIVE' | 'PENDING_REVIEW';
  attributes: Record<string, string | number | boolean>;
}

const SAMPLE_LISTINGS: SampleListing[] = [
  {
    slug: 'iphone-13-128gb-kabul',
    title: 'iPhone 13 128GB — excellent condition',
    description:
      'iPhone 13 with 128GB storage in excellent condition. Battery health is high, ' +
      'no scratches, original parts only. Comes with a charger and protective case.',
    categorySlug: 'mobile-phones',
    price: '42000.00',
    pricingType: 'PAID',
    condition: 'LIKE_NEW',
    status: 'ACTIVE',
    attributes: { brand: 'apple', model: 'iPhone 13', storage: '128gb', network: '4g' },
  },
  {
    slug: 'toyota-corolla-2018-kabul',
    title: 'Toyota Corolla 2018 — well maintained',
    description:
      'Toyota Corolla 2018 model, single owner, regularly serviced. White sedan with ' +
      'automatic transmission, low mileage and clean interior. Kabul registered.',
    categorySlug: 'cars',
    price: '1450000.00',
    pricingType: 'PAID',
    condition: 'GOOD',
    status: 'ACTIVE',
    attributes: {
      make: 'toyota',
      model: 'Corolla',
      year: 2018,
      mileage_km: 85000,
      fuel_type: 'petrol',
      transmission: 'automatic',
      body_type: 'sedan',
      color: 'white',
    },
  },
  {
    slug: 'samsung-galaxy-a54-kabul',
    title: 'Samsung Galaxy A54 5G — brand new sealed',
    description:
      'Brand new sealed Samsung Galaxy A54 5G smartphone with 128GB storage. ' +
      'Full box with all original accessories and one year warranty.',
    categorySlug: 'mobile-phones',
    price: '18500.00',
    pricingType: 'PAID',
    condition: 'NEW',
    status: 'PENDING_REVIEW',
    attributes: { brand: 'samsung', model: 'Galaxy A54', storage: '128gb', network: '5g' },
  },
  {
    slug: 'apartment-for-rent-shahr-e-naw',
    title: 'Two-bedroom apartment for rent in Shahr-e Naw',
    description:
      'Bright two-bedroom apartment in Shahr-e Naw with one bathroom, furnished ' +
      'living room, private parking and a large balcony. Suitable for a family.',
    categorySlug: 'properties-for-rent',
    price: '25000.00',
    pricingType: 'PAID',
    condition: 'GOOD',
    status: 'ACTIVE',
    attributes: {
      property_type: 'apartment',
      bedrooms: 2,
      bathrooms: 1,
      area_sqm: 90,
      floor_number: 2,
      furnished: true,
      parking: true,
    },
  },
];

async function seedSampleData(prisma: PrismaClient): Promise<void> {
  const phoneNormalized = normalizePhoneOrThrow('+93700111222');
  const passwordHash = await hashPassword('Demo123!', { type: argon2id });

  const sellerUser = await prisma.user.upsert({
    where: { phoneNormalized },
    update: { displayName: 'Ahmad Wesh' },
    create: {
      phone: phoneNormalized,
      phoneNormalized,
      passwordHash,
      displayName: 'Ahmad Wesh',
      role: 'USER',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
    },
  });

  const sellerAccount = await prisma.sellerAccount.upsert({
    where: { ownerUserId: sellerUser.id },
    update: { displayName: 'Ahmad Wesh' },
    create: {
      ownerUserId: sellerUser.id,
      displayName: 'Ahmad Wesh',
      slug: 'ahmad-wesh',
      bio: 'Electronics and vehicles seller based in Kabul.',
      type: 'INDIVIDUAL',
      status: 'ACTIVE',
    },
  });

  const kabul = await prisma.province.findUniqueOrThrow({ where: { code: 'AF-KAB' } });
  const kabulCity = await prisma.city.findUniqueOrThrow({
    where: { provinceId_slug: { provinceId: kabul.id, slug: 'kabul' } },
  });

  let listings = 0;
  for (const sample of SAMPLE_LISTINGS) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: sample.categorySlug },
    });

    const searchText = buildSearchText([
      sample.title,
      sample.description,
      ...flattenAttributeValues(sample.attributes),
    ]);

    const isActive = sample.status === 'ACTIVE';
    const publishedAt = isActive ? new Date() : null;
    const expiresAt = isActive
      ? new Date(Date.now() + LISTING_EXPIRES_AFTER_DAYS * 24 * 60 * 60 * 1000)
      : null;

    const listing = await prisma.listing.upsert({
      where: { slug: sample.slug },
      update: {
        title: sample.title,
        description: sample.description,
        price: sample.price,
        pricingType: sample.pricingType,
        condition: sample.condition,
        status: sample.status,
        attributes: sample.attributes,
        categoryId: category.id,
        provinceId: kabul.id,
        cityId: kabulCity.id,
        searchText,
      },
      create: {
        sellerAccountId: sellerAccount.id,
        categoryId: category.id,
        provinceId: kabul.id,
        cityId: kabulCity.id,
        slug: sample.slug,
        title: sample.title,
        description: sample.description,
        price: sample.price,
        currency: 'AFN',
        pricingType: sample.pricingType,
        condition: sample.condition,
        status: sample.status,
        attributes: sample.attributes,
        searchText,
        publishedAt,
        expiresAt,
      },
    });

    const categorySeed = findCategorySeed(sample.categorySlug);
    const attributeSchemaReference = categorySeed?.attributes
      ? Object.fromEntries(
          categorySeed.attributes.map((attribute) => [attribute.key, attribute.type]),
        )
      : undefined;

    await prisma.listingRevision.upsert({
      where: { listingId_version: { listingId: listing.id, version: 1 } },
      update: {},
      create: {
        listingId: listing.id,
        version: 1,
        changeType: 'CREATE',
        snapshot: {
          title: sample.title,
          description: sample.description,
          price: sample.price,
          currency: 'AFN',
          pricingType: sample.pricingType,
          condition: sample.condition,
          attributes: sample.attributes,
        },
        attributeSchemaReference,
        createdByUserId: sellerUser.id,
      },
    });

    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: listing.id, type: 'PHONE' } },
      update: {},
      create: { listingId: listing.id, type: 'PHONE', enabled: true },
    });

    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: listing.id, type: 'WHATSAPP' } },
      update: {},
      create: { listingId: listing.id, type: 'WHATSAPP', enabled: true },
    });

    listings += 1;
  }

  console.log(`✔ Demo data seeded: 1 seller account, ${listings} listings (${phoneNormalized}).`);
}

// -----------------------------------------------------------------------------
// Entrypoint
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: requireDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedLocations(prisma);
    await seedTaxonomy(prisma);
    await seedAdminUser(prisma);

    if (process.env.SEED_SAMPLE_DATA === 'true') {
      await seedSampleData(prisma);
    }

    console.log('✔ Seed completed.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('✖ Seed failed:', error);
  process.exitCode = 1;
});
