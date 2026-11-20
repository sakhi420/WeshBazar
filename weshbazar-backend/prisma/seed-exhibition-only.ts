/**
 * Safe, exhibition-only listing seed.
 *
 * Dry-run is the default. This command never seeds locations, taxonomy, users,
 * passwords, or sample accounts. It only targets the existing ADMIN seller and
 * the 147 stable exhibition fixture slugs.
 *
 * Before --apply, the caller must explicitly allow the exact Neon DB hostname
 * and provide a one-time acknowledgement. Images are written into an isolated
 * ignored local folder, then copied to Neon with media:migrate:neon.
 */
import 'dotenv/config';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../apps/api/src/generated/prisma/client';
import { EXHIBITION_FIXTURES } from './seed/exhibition/fixtures';
import { seedExhibitionData } from './seed/exhibition/seed-exhibition';

const EXPECTED_FIXTURE_COUNT = 147;
const APPLY_ACKNOWLEDGEMENT = 'PUBLISH_147_LISTINGS';
const ISOLATED_STORAGE_ROOT = path.resolve(
  process.cwd(),
  'apps/api/var/exhibition-seed-storage',
);

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + ' is required.');
  return value;
}

function parseArguments(): { apply: boolean } {
  const args = process.argv.slice(2);
  const unsupported = args.filter((arg) => arg !== '--apply' && arg !== '--dry-run');
  if (unsupported.length > 0) {
    throw new Error('Unsupported argument(s): ' + unsupported.join(', '));
  }
  if (args.includes('--apply') && args.includes('--dry-run')) {
    throw new Error('Use either --apply or --dry-run, not both.');
  }
  return { apply: args.includes('--apply') };
}

function validateDatabaseTarget(): string {
  const databaseUrl = requiredEnv('DATABASE_URL');
  const actualHost = new URL(databaseUrl).hostname.toLowerCase();
  const expectedHost = requiredEnv('EXHIBITION_SEED_EXPECTED_DATABASE_HOST').toLowerCase();

  if (!actualHost.endsWith('.neon.tech')) {
    throw new Error('Refusing to seed a non-Neon database host: ' + actualHost);
  }
  if (actualHost !== expectedHost) {
    throw new Error(
      'Database host mismatch. DATABASE_URL points to "' + actualHost +
      '", but EXHIBITION_SEED_EXPECTED_DATABASE_HOST is "' + expectedHost + '".',
    );
  }
  return actualHost;
}

function normalizeAdminPhone(): string {
  const raw = process.env.SEED_ADMIN_PHONE?.trim() || '+93700000000';
  const parsed = parsePhoneNumberFromString(raw);
  if (!parsed || !parsed.isValid()) {
    throw new Error('SEED_ADMIN_PHONE must be a valid Afghan E.164 phone number.');
  }
  const normalized = parsed.number;
  // Keep the existing exhibition seeder's lookup identical to this preflight.
  process.env.SEED_ADMIN_PHONE = normalized;
  return normalized;
}

function assertFixtureIntegrity(): void {
  if (EXHIBITION_FIXTURES.length !== EXPECTED_FIXTURE_COUNT) {
    throw new Error(
      'Expected ' + EXPECTED_FIXTURE_COUNT + ' exhibition fixtures, found ' +
      EXHIBITION_FIXTURES.length + '. Review the seed before applying.',
    );
  }

  const slugs = EXHIBITION_FIXTURES.map((fixture) => fixture.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error('Duplicate fixture slugs detected.');
  }

  const imageFiles = EXHIBITION_FIXTURES.map((fixture) => fixture.imageFile);
  if (new Set(imageFiles).size !== imageFiles.length) {
    throw new Error('Duplicate fixture image references detected.');
  }
}

async function main(): Promise<void> {
  const { apply } = parseArguments();
  const databaseHost = validateDatabaseTarget();
  const adminPhone = normalizeAdminPhone();
  assertFixtureIntegrity();

  if (apply && process.env.EXHIBITION_SEED_CONFIRM !== APPLY_ACKNOWLEDGEMENT) {
    throw new Error(
      'Apply refused. Set EXHIBITION_SEED_CONFIRM=' + APPLY_ACKNOWLEDGEMENT +
      ' explicitly before running with --apply.',
    );
  }

  const assetsRoot = path.resolve(process.cwd(), 'prisma/seed/exhibition/assets');
  await access(assetsRoot);

  const assetChecks = await Promise.all(
    EXHIBITION_FIXTURES.map(async (fixture) => {
      const filePath = path.join(assetsRoot, fixture.imageFile);
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error('Fixture asset is not a file: ' + fixture.imageFile);
      return fileStat.size;
    }),
  );
  const missingOrEmptyAssets = assetChecks.filter((size) => size <= 0).length;
  if (missingOrEmptyAssets > 0) throw new Error('Empty exhibition image assets detected.');

  const adapter = new PrismaPg({ connectionString: requiredEnv('DATABASE_URL') });
  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await prisma.user.findUnique({
      where: { phoneNormalized: adminPhone },
      include: { sellerAccount: true },
    });

    if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE' || admin.deletedAt) {
      throw new Error(
        'The existing active ADMIN account was not found for ' + adminPhone +
        '. This command will not create or modify an admin account.',
      );
    }
    if (!admin.sellerAccount || admin.sellerAccount.status !== 'ACTIVE') {
      throw new Error('The existing ADMIN seller account is missing or inactive.');
    }

    const categorySlugs = [...new Set(EXHIBITION_FIXTURES.map((fixture) => fixture.categorySlug))];
    const provinceSlugs = [...new Set(EXHIBITION_FIXTURES.map((fixture) => fixture.provinceSlug))];
    const [categories, provinces] = await Promise.all([
      prisma.category.findMany({
        where: { slug: { in: categorySlugs } },
        select: { slug: true },
      }),
      prisma.province.findMany({
        where: { slug: { in: provinceSlugs } },
        select: { id: true, slug: true },
      }),
    ]);

    const categorySet = new Set(categories.map((category) => category.slug));
    const provinceMap = new Map(provinces.map((province) => [province.slug, province]));
    const missingCategories = categorySlugs.filter((slug) => !categorySet.has(slug));
    const missingProvinces = provinceSlugs.filter((slug) => !provinceMap.has(slug));

    const cityPairs = new Map<string, { provinceSlug: string; citySlug: string }>();
    for (const fixture of EXHIBITION_FIXTURES) {
      cityPairs.set(fixture.provinceSlug + '/' + fixture.citySlug, {
        provinceSlug: fixture.provinceSlug,
        citySlug: fixture.citySlug,
      });
    }

    const missingCities: string[] = [];
    for (const pair of cityPairs.values()) {
      const province = provinceMap.get(pair.provinceSlug);
      if (!province) {
        missingCities.push(pair.provinceSlug + '/' + pair.citySlug);
        continue;
      }
      const city = await prisma.city.findUnique({
        where: {
          provinceId_slug: {
            provinceId: province.id,
            slug: pair.citySlug,
          },
        },
        select: { id: true },
      });
      if (!city) missingCities.push(pair.provinceSlug + '/' + pair.citySlug);
    }

    if (missingCategories.length || missingProvinces.length || missingCities.length) {
      throw new Error(
        'Base data is incomplete. Missing categories: [' + missingCategories.join(', ') +
        ']; provinces: [' + missingProvinces.join(', ') +
        ']; cities: [' + missingCities.join(', ') + ']. Run no automatic base seed here.',
      );
    }

    const fixtureSlugs = EXHIBITION_FIXTURES.map((fixture) => fixture.slug);
    const existingListings = await prisma.listing.findMany({
      where: { slug: { in: fixtureSlugs } },
      select: {
        slug: true,
        sellerAccountId: true,
        status: true,
        deletedAt: true,
        images: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    const foreignListings = existingListings.filter(
      (listing) => listing.sellerAccountId !== admin.sellerAccount!.id,
    );
    if (foreignListings.length > 0) {
      throw new Error(
        'Fixture slug collision with listings owned by another seller: ' +
        foreignListings.map((listing) => listing.slug).join(', '),
      );
    }

    const nonActiveListings = existingListings.filter(
      (listing) => listing.status !== 'ACTIVE' || listing.deletedAt !== null,
    );
    if (nonActiveListings.length > 0) {
      throw new Error(
        'Refusing to reactivate or overwrite archived/non-active fixture listings: ' +
        nonActiveListings.map((listing) => listing.slug).join(', '),
      );
    }

    const newListings = EXPECTED_FIXTURE_COUNT - existingListings.length;
    const existingWithoutImages = existingListings.filter(
      (listing) => listing.images.length === 0,
    ).length;
    const listingsNeedingImages = newListings + existingWithoutImages;
    const totalAssetBytes = assetChecks.reduce((sum, size) => sum + size, 0);

    console.log('Exhibition seed preflight');
    console.log('Database host: ' + databaseHost);
    console.log('Existing seller: ' + admin.sellerAccount.slug + ' (existing ADMIN account)');
    console.log('Fixtures: ' + EXPECTED_FIXTURE_COUNT);
    console.log('New listings: ' + newListings);
    console.log('Existing active fixture listings: ' + existingListings.length);
    console.log('Listings requiring an image: ' + listingsNeedingImages);
    console.log('Image source files: ' + assetChecks.length + ' (' +
      (totalAssetBytes / 1024 / 1024).toFixed(2) + ' MiB)');
    console.log('Local image output: ' + ISOLATED_STORAGE_ROOT);
    console.log('Contact methods: disabled for fixture listings (admin phone is not published).');

    if (!apply) {
      console.log('DRY RUN ONLY — database and object storage were not changed.');
      console.log('After reviewing this report, use --apply with the required acknowledgement.');
      return;
    }

    process.env.LOCAL_STORAGE_PATH = ISOLATED_STORAGE_ROOT;
    await seedExhibitionData(prisma, { contactsEnabled: false });

    const seededListings = await prisma.listing.findMany({
      where: { slug: { in: fixtureSlugs } },
      select: {
        slug: true,
        sellerAccountId: true,
        status: true,
        deletedAt: true,
        images: { where: { deletedAt: null }, select: { id: true } },
        contactMethods: {
          where: { type: { in: ['PHONE', 'WHATSAPP'] } },
          select: { enabled: true },
        },
      },
    });

    const invalidListings = seededListings.filter(
      (listing) =>
        listing.sellerAccountId !== admin.sellerAccount!.id ||
        listing.status !== 'ACTIVE' ||
        listing.deletedAt !== null ||
        listing.images.length === 0 ||
        listing.contactMethods.some((method) => method.enabled),
    );

    if (seededListings.length !== EXPECTED_FIXTURE_COUNT || invalidListings.length > 0) {
      throw new Error(
        'Post-seed verification failed. Found ' + seededListings.length +
        ' fixture listings; invalid: ' + invalidListings.map((listing) => listing.slug).join(', '),
      );
    }

    const imageCount = seededListings.reduce((sum, listing) => sum + listing.images.length, 0);
    console.log('Verified: ' + seededListings.length + ' ACTIVE listings under the existing ADMIN seller.');
    console.log('Verified: ' + imageCount + ' image records are attached.');
    console.log('Verified: fixture PHONE/WHATSAPP contacts are disabled.');
    console.log('Next: run media:migrate:neon -- --dry-run with LOCAL_STORAGE_PATH set to the isolated folder.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Exhibition seed failed:', error);
  process.exitCode = 1;
});
