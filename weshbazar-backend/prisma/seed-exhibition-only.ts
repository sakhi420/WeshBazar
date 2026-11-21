/**
 * Guarded exhibition seeder. Dry-run is the default.
 * Real phone/password pairs are read only from the ignored local JSON file.
 */
import 'dotenv/config';
import { argon2id, hash as argon2Hash } from 'argon2';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../apps/api/src/generated/prisma/client';
import { validateAttributeValues } from '../apps/api/src/modules/taxonomy/attribute-validation';
import type { EffectiveAttribute } from '../apps/api/src/modules/taxonomy/attribute.types';
import { EXHIBITION_FIXTURES } from './seed/exhibition/fixtures';
import { EXHIBITION_SELLERS, sellerKeyForFixture, type ExhibitionSellerKey } from './seed/exhibition/sellers';
import { seedExhibitionData, type ExhibitionSellerOwner } from './seed/exhibition/seed-exhibition';

const EXPECTED_FIXTURES = 147;
const ACK = 'PUBLISH_147_LISTINGS';
const CREDENTIALS_PATH = path.resolve(process.cwd(), 'prisma/exhibition-seller-credentials.local.json');
const STAGING_PARENT = path.resolve(process.cwd(), 'apps/api/var/exhibition-seed-storage');
const ARGON2_OPTIONS = { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

interface Credential {
  key: ExhibitionSellerKey;
  phone: string;
  phoneNormalized: string;
  password: string;
}
interface SellerPlan {
  key: ExhibitionSellerKey;
  credential: Credential;
  displayName: string;
  slug: string;
  bio: string;
  existingUserId: string | null;
  existingSellerId: string | null;
  activeCount: number;
  fixtureCount: number;
}
interface Preflight {
  adminUserId: string;
  sellers: SellerPlan[];
  normalized: Map<string, Record<string, string | number | boolean | string[]>>;
  schemaRefs: Map<string, Prisma.InputJsonValue>;
  existingCount: number;
  newCount: number;
  archivedCount: number;
  imageBytes: number;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + ' is required.');
  return value;
}

function parseArgs(): { apply: boolean } {
  const args = process.argv.slice(2);
  if (args.some((item) => item !== '--apply' && item !== '--dry-run')) {
    throw new Error('Only --dry-run and --apply are supported.');
  }
  if (args.includes('--apply') && args.includes('--dry-run')) {
    throw new Error('Use either --apply or --dry-run, not both.');
  }
  return { apply: args.includes('--apply') };
}

function validateTarget(): string {
  const host = new URL(requiredEnv('DATABASE_URL')).hostname.toLowerCase();
  const expected = requiredEnv('EXHIBITION_SEED_EXPECTED_DATABASE_HOST').toLowerCase();
  if (!host.endsWith('.neon.tech') || host !== expected) {
    throw new Error('Database host does not match the explicitly allowed Neon hostname.');
  }
  return host;
}

function normalizePhone(value: string, label: string): { phone: string; phoneNormalized: string } {
  const parsed = parsePhoneNumberFromString(value.trim(), 'AF');
  if (!parsed || !parsed.isValid() || parsed.country !== 'AF') {
    throw new Error('Invalid Afghan phone number for seller ' + label + '.');
  }
  return { phone: value.trim(), phoneNormalized: parsed.number };
}

function validatePasswordPolicy(password: string, sellerKey: string): void {
  const minLength = Number(process.env.PASSWORD_MIN_LENGTH ?? 8);
  const maxLength = Number(process.env.PASSWORD_MAX_LENGTH ?? 128);
  const requireLetter = process.env.PASSWORD_REQUIRE_LETTER !== 'false';
  const requireDigit = process.env.PASSWORD_REQUIRE_DIGIT !== 'false';
  const requireSymbol = process.env.PASSWORD_REQUIRE_SYMBOL === 'true';
  const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE === 'true';

  const invalid =
    !Number.isInteger(minLength) ||
    !Number.isInteger(maxLength) ||
    minLength < 1 ||
    maxLength < minLength ||
    password.length < minLength ||
    password.length > maxLength ||
    (requireLetter && !/[A-Za-z]/.test(password)) ||
    (requireDigit && !/\d/.test(password)) ||
    (requireSymbol && !/[^A-Za-z0-9]/.test(password)) ||
    (requireUppercase && !/[A-Z]/.test(password));

  if (invalid) {
    throw new Error(\`Password for seller "\${sellerKey}" does not satisfy the current application password policy.\`);
  }
}

async function readCredentials(): Promise<Credential[]> {
  try {
    await access(CREDENTIALS_PATH);
  } catch {
    throw new Error(
      'Create prisma/exhibition-seller-credentials.local.json locally from the five phone/password pairs. ' +
      'The file is git-ignored; never add it to Git.',
    );
  }

  let rows: unknown;
  try {
    rows = JSON.parse(await readFile(CREDENTIALS_PATH, 'utf8')) as unknown;
  } catch {
    throw new Error('Seller credential file is not valid JSON.');
  }
  const expected = Object.keys(EXHIBITION_SELLERS).sort();
  if (!Array.isArray(rows) || rows.length !== expected.length) {
    throw new Error('Seller credential file must contain exactly five entries.');
  }

  const seenKeys = new Set<string>();
  const seenPhones = new Set<string>();
  const result: Credential[] = [];
  for (const row of rows) {
    if (
      row === null || typeof row !== 'object' ||
      typeof row.key !== 'string' || typeof row.phone !== 'string' ||
      typeof row.password !== 'string' || !expected.includes(row.key) ||
      seenKeys.has(row.key)
    ) {
      throw new Error('Credential entries must contain unique known keys, phone, and password strings.');
    }
    const phone = normalizePhone(row.phone, row.key);
    if (seenPhones.has(phone.phoneNormalized)) {
      throw new Error('Each seller must have a distinct Afghan phone number.');
    }
    validatePasswordPolicy(row.password, row.key);
    seenKeys.add(row.key);
    seenPhones.add(phone.phoneNormalized);
    result.push({ key: row.key as ExhibitionSellerKey, ...phone, password: row.password });
  }
  if (expected.some((key) => !seenKeys.has(key))) {
    throw new Error('Credential file is missing one or more seller keys.');
  }
  return result.sort((a, b) => expected.indexOf(a.key) - expected.indexOf(b.key));
}

function assertFixtureIntegrity(): void {
  if (EXHIBITION_FIXTURES.length !== EXPECTED_FIXTURES) {
    throw new Error(`Expected ${EXPECTED_FIXTURES} fixtures, found ${EXHIBITION_FIXTURES.length}.`);
  }
  const slugs = EXHIBITION_FIXTURES.map((fixture) => fixture.slug);
  const images = EXHIBITION_FIXTURES.map((fixture) => fixture.imageFile);
  if (new Set(slugs).size !== slugs.length || new Set(images).size !== images.length) {
    throw new Error('Duplicate listing slugs or image references detected.');
  }
  const counts = new Map<ExhibitionSellerKey, number>();
  for (const fixture of EXHIBITION_FIXTURES) {
    const key = sellerKeyForFixture(fixture);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const key of Object.keys(EXHIBITION_SELLERS) as ExhibitionSellerKey[]) {
    const count = counts.get(key) ?? 0;
    if (count === 0 || count > 50) throw new Error(`Seller allocation ${key} is outside the valid 1–50 range.`);
  }
}

function toEffectiveAttribute(attribute: {
  id: string; categoryId: string; key: string; label: string; type: EffectiveAttribute['type'];
  required: boolean; filterable: boolean; searchable: boolean; unit: string | null;
  placeholder: string | null; minValue: { toString(): string } | null;
  maxValue: { toString(): string } | null; minLength: number | null; maxLength: number | null;
  pattern: string | null; sortOrder: number; isActive: boolean;
  options: Array<{ value: string; label: string; isActive: boolean; sortOrder: number }>;
}): EffectiveAttribute {
  return {
    id: attribute.id, categoryId: attribute.categoryId, key: attribute.key,
    label: attribute.label, type: attribute.type, required: attribute.required,
    filterable: attribute.filterable, searchable: attribute.searchable,
    unit: attribute.unit, placeholder: attribute.placeholder,
    minValue: attribute.minValue === null ? null : Number(attribute.minValue),
    maxValue: attribute.maxValue === null ? null : Number(attribute.maxValue),
    minLength: attribute.minLength, maxLength: attribute.maxLength,
    pattern: attribute.pattern, sortOrder: attribute.sortOrder, isActive: attribute.isActive,
    options: attribute.options.map((option) => ({
      value: option.value, label: option.label, isActive: option.isActive, sortOrder: option.sortOrder,
    })),
  };
}

async function buildPreflight(
  prisma: PrismaClient,
  credentials: Credential[],
): Promise<Preflight> {
  assertFixtureIntegrity();

  const adminPhone = normalizePhone(process.env.SEED_ADMIN_PHONE?.trim() || '+93700000000', 'administrator').phoneNormalized;
  const admin = await prisma.user.findUnique({
    where: { phoneNormalized: adminPhone },
    include: { sellerAccount: true },
  });
  if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE' || admin.deletedAt !== null) {
    throw new Error('Existing active administrator account was not found; no admin account will be created or changed.');
  }
  if (!admin.sellerAccount || admin.sellerAccount.status !== 'ACTIVE') {
    throw new Error('Existing administrator seller profile is missing or inactive.');
  }

  const sellers: SellerPlan[] = [];
  const userIds = new Set<string>();
  for (const credential of credentials) {
    const profile = EXHIBITION_SELLERS[credential.key];
    const user = await prisma.user.findUnique({
      where: { phoneNormalized: credential.phoneNormalized },
      include: { sellerAccount: true },
    });
    if (user && (
      user.id === admin.id || user.role !== 'USER' || user.status !== 'ACTIVE' || user.deletedAt !== null
    )) {
      throw new Error(`Existing account for seller "${credential.key}" is not an eligible active USER; it will not be overwritten.`);
    }
    if (user && userIds.has(user.id)) throw new Error('Two seller phones resolve to the same user.');
    if (user) userIds.add(user.id);

    const sellerAccount = user?.sellerAccount ?? null;
    if (sellerAccount && sellerAccount.status !== 'ACTIVE') {
      throw new Error(`Existing seller profile "${credential.key}" is inactive.`);
    }
    if (!sellerAccount) {
      const slugOwner = await prisma.sellerAccount.findUnique({
        where: { slug: profile.slug }, select: { ownerUserId: true },
      });
      if (slugOwner && slugOwner.ownerUserId !== user?.id) {
        throw new Error(`Public seller slug collision for "${credential.key}".`);
      }
    }

    const activeCount = sellerAccount
      ? await prisma.listing.count({
          where: { sellerAccountId: sellerAccount.id, status: 'ACTIVE', deletedAt: null },
        })
      : 0;
    sellers.push({
      key: credential.key, credential, displayName: profile.displayName, slug: profile.slug,
      bio: profile.bio, existingUserId: user?.id ?? null,
      existingSellerId: sellerAccount?.id ?? null, activeCount,
      fixtureCount: EXHIBITION_FIXTURES.filter((fixture) => sellerKeyForFixture(fixture) === credential.key).length,
    });
  }

  const categories = await prisma.category.findMany({
    include: { attributes: { include: { options: true } } },
  });
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const activeParentIds = new Set(
    categories.filter((item) => item.status === 'ACTIVE' && item.parentId).map((item) => item.parentId as string),
  );

  const provinceSlugs = [...new Set(EXHIBITION_FIXTURES.map((fixture) => fixture.provinceSlug))];
  const provinces = await prisma.province.findMany({
    where: { slug: { in: provinceSlugs } },
    select: { id: true, slug: true, status: true },
  });
  const provinceBySlug = new Map(provinces.map((item) => [item.slug, item]));
  const cities = await prisma.city.findMany({
    where: { provinceId: { in: provinces.map((item) => item.id) } },
    select: { id: true, slug: true, provinceId: true, status: true },
  });
  const cityByKey = new Map(cities.map((item) => [item.provinceId + '/' + item.slug, item]));

  const normalized = new Map<string, Record<string, string | number | boolean | string[]>>();
  const schemaRefs = new Map<string, Prisma.InputJsonValue>();
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const fixture of EXHIBITION_FIXTURES) {
    const category = categoryBySlug.get(fixture.categorySlug);
    const province = provinceBySlug.get(fixture.provinceSlug);
    const city = province ? cityByKey.get(province.id + '/' + fixture.citySlug) : undefined;
    if (!category || category.status !== 'ACTIVE' || activeParentIds.has(category.id)) {
      missing.push(`category ${fixture.categorySlug} is missing, inactive, or not a leaf`);
      continue;
    }
    if (!province || province.status !== 'ACTIVE') {
      missing.push(`province ${fixture.provinceSlug} is missing or inactive`);
      continue;
    }
    if (!city || city.status !== 'ACTIVE') {
      missing.push(`city ${fixture.provinceSlug}/${fixture.citySlug} is missing or inactive`);
      continue;
    }

    const chain: typeof categories = [];
    let current: (typeof categories)[number] | undefined = category;
    while (current) {
      chain.unshift(current);
      current = current.parentId ? categoryById.get(current.parentId) : undefined;
    }
    if (chain.some((item) => item.status !== 'ACTIVE')) {
      missing.push(`category ancestry for ${fixture.categorySlug} contains an inactive node`);
      continue;
    }

    const attributesByKey = new Map<string, EffectiveAttribute>();
    for (const node of chain) {
      for (const attribute of [...node.attributes].sort((a, b) => a.sortOrder - b.sortOrder)) {
        attributesByKey.set(attribute.key, toEffectiveAttribute(attribute));
      }
    }
    const effective = [...attributesByKey.values()];
    const validation = validateAttributeValues(effective, fixture.attributes as Record<string, unknown>);
    if (validation.issues.length) {
      invalid.push(
        `${fixture.key}: ${validation.issues.map((issue) => issue.field + '/' + issue.rule).join(', ')}`,
      );
      continue;
    }
    normalized.set(fixture.slug, validation.normalized);
    schemaRefs.set(
      fixture.slug,
      effective.filter((item) => item.isActive).map((item) => ({
        key: item.key, type: item.type, required: item.required,
      })) as unknown as Prisma.InputJsonValue,
    );
  }
  if (missing.length) throw new Error('Base data validation failed:\n- ' + [...new Set(missing)].join('\n- '));
  if (invalid.length) throw new Error('Fixture attribute validation failed:\n- ' + invalid.join('\n- '));

  const assetsRoot = path.resolve(process.cwd(), 'prisma/seed/exhibition/assets');
  await access(assetsRoot);
  let imageBytes = 0;
  for (const fixture of EXHIBITION_FIXTURES) {
    const assetPath = path.resolve(assetsRoot, fixture.imageFile);
    if (!assetPath.startsWith(assetsRoot + path.sep)) throw new Error('Unsafe fixture asset path.');
    const stat = await readFile(assetPath);
    if (!stat.byteLength) throw new Error('Empty fixture image: ' + fixture.imageFile);
    imageBytes += stat.byteLength;
  }

  const slugs = EXHIBITION_FIXTURES.map((fixture) => fixture.slug);
  const existing = await prisma.listing.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true, sellerAccountId: true, status: true, deletedAt: true,
      images: { where: { deletedAt: null }, select: { id: true } },
    },
  });
  const existingBySlug = new Map(existing.map((item) => [item.slug, item]));
  let newCount = 0;
  let archivedCount = 0;

  for (const fixture of EXHIBITION_FIXTURES) {
    const row = existingBySlug.get(fixture.slug);
    if (!row) { newCount += 1; continue; }
    const plan = sellers.find((item) => item.key === sellerKeyForFixture(fixture));
    if (!plan?.existingSellerId || row.sellerAccountId !== plan.existingSellerId) {
      throw new Error(`Fixture slug collision: ${fixture.slug} belongs to a different seller; no ownership change will be made.`);
    }
    if (row.deletedAt !== null || !['ACTIVE', 'ARCHIVED'].includes(row.status)) {
      throw new Error(`Fixture ${fixture.slug} has unsupported/deleted status ${row.status}.`);
    }
    if (row.images.length > 1) throw new Error(`Fixture ${fixture.slug} has multiple active images.`);
    if (row.status === 'ARCHIVED') archivedCount += 1;
  }

  for (const seller of sellers) {
    const alreadyActive = EXHIBITION_FIXTURES.filter((fixture) =>
      sellerKeyForFixture(fixture) === seller.key &&
      existingBySlug.get(fixture.slug)?.status === 'ACTIVE',
    ).length;
    const toActivate = seller.fixtureCount - alreadyActive;
    if (seller.activeCount + toActivate > 50) {
      throw new Error(
        `Seller "${seller.key}" exceeds the active limit: ${seller.activeCount} existing + ${toActivate} exhibition (max 50).`,
      );
    }
  }

  return {
    adminUserId: admin.id, sellers, normalized, schemaRefs,
    existingCount: existing.length, newCount, archivedCount, imageBytes,
  };
}

async function provisionSellers(
  tx: Prisma.TransactionClient,
  preflight: Preflight,
  passwordHashes: Map<ExhibitionSellerKey, string>,
): Promise<Record<ExhibitionSellerKey, ExhibitionSellerOwner>> {
  const result = {} as Record<ExhibitionSellerKey, ExhibitionSellerOwner>;
  for (const item of preflight.sellers) {
    let user = await tx.user.findUnique({ where: { phoneNormalized: item.credential.phoneNormalized } });
    if (!user) {
      const passwordHash = passwordHashes.get(item.key);
      if (!passwordHash) throw new Error('Missing hash for new seller ' + item.key + '.');
      user = await tx.user.create({
        data: {
          phone: item.credential.phone,
          phoneNormalized: item.credential.phoneNormalized,
          passwordHash,
          displayName: item.displayName,
          role: 'USER',
          status: 'ACTIVE',
          phoneVerifiedAt: null,
        },
      });
    } else if (user.role !== 'USER' || user.status !== 'ACTIVE' || user.deletedAt !== null) {
      throw new Error(`Seller ${item.key} changed state after preflight; no account data was modified.`);
    }

    let sellerAccount = await tx.sellerAccount.findUnique({ where: { ownerUserId: user.id } });
    if (!sellerAccount) {
      const slugCollision = await tx.sellerAccount.findUnique({
        where: { slug: item.slug }, select: { ownerUserId: true },
      });
      if (slugCollision && slugCollision.ownerUserId !== user.id) {
        throw new Error('Seller slug collision appeared for ' + item.key + '.');
      }
      sellerAccount = await tx.sellerAccount.create({
        data: {
          ownerUserId: user.id, displayName: item.displayName, slug: item.slug,
          bio: item.bio, type: 'INDIVIDUAL', status: 'ACTIVE',
        },
      });
    } else if (sellerAccount.status !== 'ACTIVE') {
      throw new Error('Seller profile became inactive: ' + item.key);
    }

    result[item.key] = { userId: user.id, sellerAccountId: sellerAccount.id };
  }
  return result;
}

async function main(): Promise<void> {
  const { apply } = parseArgs();
  const databaseHost = validateTarget();
  const credentials = await readCredentials();
  assertFixtureIntegrity();
  if (apply && process.env.EXHIBITION_SEED_CONFIRM !== ACK) {
    throw new Error('Apply refused; explicitly set EXHIBITION_SEED_CONFIRM=PUBLISH_147_LISTINGS.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requiredEnv('DATABASE_URL') }),
  });
  let stagingRoot: string | null = null;
  let markerPath: string | null = null;

  try {
    const preflight = await buildPreflight(prisma, credentials);
    console.log('Exhibition seed preflight');
    console.log('Database host: ' + databaseHost);
    console.log('Fixtures: ' + EXPECTED_FIXTURES);
    console.log('New listings: ' + preflight.newCount);
    console.log('Existing fixtures: ' + preflight.existingCount);
    console.log('Archived fixtures to restore via seller flow: ' + preflight.archivedCount);
    console.log('Source image files: ' + EXPECTED_FIXTURES + ' (' +
      (preflight.imageBytes / 1024 / 1024).toFixed(2) + ' MiB)');
    console.log('Seller profiles:');
    for (const seller of preflight.sellers) {
      console.log(
        `- ${seller.displayName}: ${seller.fixtureCount}; ` +
        (seller.existingUserId ? 'existing account reused; password unchanged' : 'new login will be created'),
      );
    }
    console.log('New accounts remain phone-unverified until a real OTP check.');
    console.log('PHONE/WHATSAPP contacts disabled; admin phone is never published by this seed.');
    console.log('Administrator password and account fields are not modified.');

    if (!apply) {
      console.log('DRY RUN ONLY — database and object storage were not changed.');
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    stagingRoot = path.join(STAGING_PARENT, stamp + '-' + randomUUID().slice(0, 8));
    await mkdir(stagingRoot, { recursive: true });
    markerPath = path.join(stagingRoot, '.seed-in-progress');
    await writeFile(markerPath, 'Seed is running; do not upload this directory yet.\n', { flag: 'wx' });

    const hashes = new Map<ExhibitionSellerKey, string>();
    for (const seller of preflight.sellers) {
      if (!seller.existingUserId) {
        hashes.set(seller.key, await argon2Hash(seller.credential.password, ARGON2_OPTIONS));
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('weshbazar:exhibition-seed:v2'))`;
      const owners = await provisionSellers(tx, preflight, hashes);
      const seeded = await seedExhibitionData(tx, {
        sellers: owners,
        adminUserId: preflight.adminUserId,
        normalizedAttributesBySlug: preflight.normalized,
        attributeSchemaReferenceBySlug: preflight.schemaRefs,
        storageRoot: stagingRoot as string,
      });

      const slugs = EXHIBITION_FIXTURES.map((fixture) => fixture.slug);
      const rows = await tx.listing.findMany({
        where: { slug: { in: slugs } },
        select: {
          slug: true, sellerAccountId: true, status: true, deletedAt: true, expiresAt: true,
          images: { where: { deletedAt: null }, select: { id: true } },
          contactMethods: {
            where: { type: { in: ['PHONE', 'WHATSAPP'] } }, select: { enabled: true },
          },
        },
      });
      if (rows.length !== EXPECTED_FIXTURES) throw new Error('Post-seed count verification failed.');

      const bySlug = new Map(rows.map((row) => [row.slug, row]));
      const verifiedCounts: Record<string, number> = {};
      for (const fixture of EXHIBITION_FIXTURES) {
        const row = bySlug.get(fixture.slug);
        const owner = owners[sellerKeyForFixture(fixture)];
        if (
          !row || row.sellerAccountId !== owner.sellerAccountId ||
          row.status !== 'ACTIVE' || row.deletedAt !== null ||
          !row.expiresAt || row.expiresAt.getTime() <= Date.now() ||
          row.images.length !== 1 || row.contactMethods.some((item) => item.enabled)
        ) {
          throw new Error('Post-seed verification failed for ' + fixture.key + '.');
        }
        const key = sellerKeyForFixture(fixture);
        verifiedCounts[key] = (verifiedCounts[key] ?? 0) + 1;
      }
      if (Object.values(verifiedCounts).reduce((sum, item) => sum + item, 0) !== EXPECTED_FIXTURES) {
        throw new Error('Per-seller listing count verification failed.');
      }
      return { ...seeded, verifiedCounts };
    }, { maxWait: 15_000, timeout: 600_000 });

    await rm(markerPath, { force: true });
    markerPath = null;
    console.log('Seed transaction committed.');
    console.log(`Verified ${result.listings} listings and ${result.images} image records.`);
    for (const [key, count] of Object.entries(result.verifiedCounts)) {
      console.log(`- ${EXHIBITION_SELLERS[key as ExhibitionSellerKey].displayName}: ${count}`);
    }
    console.log('Image staging directory: ' + stagingRoot);
    console.log('Only after this process exits successfully, run media:migrate:neon -- --dry-run with this exact directory.');
  } catch (error) {
    if (stagingRoot) await rm(stagingRoot, { recursive: true, force: true });
    throw error;
  } finally {
    if (markerPath) await rm(markerPath, { force: true });
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Exhibition seed failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
