/**
 * Database foundation integration test.
 *
 * Proves the full Prisma 7 toolchain works end-to-end against a real
 * PostgreSQL database: the generated TypeScript client (CJS module format),
 * the `@prisma/adapter-pg` driver adapter, and the raw-SQL objects added by
 * the initial migration (pg_trgm extension, trigram index, CHECK
 * constraints, partial unique index).
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

describe('Database foundation (integration)', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('connects to PostgreSQL and executes a query', async () => {
    const rows = await prisma.$queryRaw<Array<{ one: number }>>`SELECT 1 AS one`;
    expect(rows[0]?.one).toBe(1);
  });

  it('counts users through the generated client', async () => {
    const count = await prisma.user.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('has the pg_trgm extension installed', async () => {
    const rows = await prisma.$queryRaw<
      Array<{ extname: string }>
    >`SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'`;
    expect(rows).toHaveLength(1);
  });

  it('has the trigram search index on Listing.searchText', async () => {
    const rows = await prisma.$queryRaw<Array<{ indexdef: string }>>`SELECT indexdef FROM pg_indexes
      WHERE tablename = 'Listing' AND indexname = 'Listing_searchText_trgm_idx'`;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.indexdef).toContain('gin_trgm_ops');
  });

  it('has the partial unique index preventing duplicate open reports', async () => {
    const rows = await prisma.$queryRaw<Array<{ indexdef: string }>>`SELECT indexdef FROM pg_indexes
      WHERE tablename = 'Report' AND indexname = 'Report_reporter_user_listing_open_key'`;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.indexdef).toContain('UNIQUE');
  });

  it('enforces the Listing check constraints', async () => {
    const rows = await prisma.$queryRaw<
      Array<{ conname: string }>
    >`SELECT conname FROM pg_constraint
      WHERE conrelid = '"Listing"'::regclass AND contype = 'c'
      ORDER BY conname`;

    const names = rows.map((row) => row.conname);
    expect(names).toEqual(
      expect.arrayContaining([
        'Listing_price_nonnegative_check',
        'Listing_views_nonnegative_check',
        'Listing_favoriteCount_nonnegative_check',
        'Listing_version_positive_check',
      ]),
    );
  });

  it('rejects a Listing row violating the version check constraint', async () => {
    // Exercise the raw-SQL guardrail through the client (insert is expected
    // to fail before any real data is possible to persist).
    await expect(
      prisma.$executeRaw`
        INSERT INTO "Listing" (
          "id", "sellerAccountId", "categoryId", "provinceId", "cityId",
          "slug", "title", "description", "condition", "version", "updatedAt"
        ) VALUES (
          gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
          gen_random_uuid(), gen_random_uuid(),
          'constraint-probe', 'Constraint probe', 'Constraint probe row',
          'NEW', -1, NOW()
        )`,
    ).rejects.toThrow();
  });
});
