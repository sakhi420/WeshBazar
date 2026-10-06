/**
 * PostgreSQL implementation of the search provider (spec §47, §48, §50, §70, §82).
 *
 * Every discovery constraint is translated into ONE parameterized statement:
 * statuses and filters from the service's whitelisting (including the §70
 * expiry cutoff that hides ACTIVE rows past their runway immediately),
 * `searchText` term matching (pg_trgm-backed LIKE, §47/§48), dynamic attribute
 * predicates with `jsonb_typeof` guards per stored shape, and keyset
 * pagination with the ordering rules of §50 (stable secondary ordering by id,
 * NULLS LAST for price sorts).
 *
 * The projection returns only what feed ordering and cursors need — `id`,
 * `createdAt`, `price` (as text, preserving decimal boundaries), `views` —
 * so the look-ahead query stays index-friendly (§82). The discovery service
 * hydrates full rows for the response.
 */
import { Injectable } from '@nestjs/common';
import { isUuid } from '../../common/utils/uuid.utils';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type {
  AttributeCriterion,
  SearchCriteria,
  SearchCursor,
  SearchPage,
  SearchProvider,
  SearchSort,
} from './search.provider';

/** Row projection of the feed query (price is text to keep decimals exact). */
interface SearchRow {
  id: string;
  createdAt: Date;
  price: string | null;
  views: number;
}

const ORDER_BY: Record<SearchSort, Prisma.Sql> = {
  newest: Prisma.sql`l."createdAt" DESC, l."id" DESC`,
  price_asc: Prisma.sql`l."price" ASC NULLS LAST, l."id" ASC`,
  price_desc: Prisma.sql`l."price" DESC NULLS LAST, l."id" DESC`,
  most_viewed: Prisma.sql`l."views" DESC, l."id" DESC`,
};

/** Matches values this provider itself put into price cursors. */
const DECIMAL_STRING = /^\d{1,12}(\.\d{1,2})?$/;

@Injectable()
export class PostgresSearchProvider implements SearchProvider {
  constructor(private readonly prisma: PrismaService) {}

  async search(criteria: SearchCriteria): Promise<SearchPage> {
    if (
      criteria.statuses.length === 0 ||
      criteria.sellerStatuses?.length === 0 ||
      criteria.categoryIds?.length === 0
    ) {
      // No visible statuses / sellers / empty category subtree — nothing matches.
      return { ids: [], hasMore: false, nextCursor: null };
    }

    const conditions: Prisma.Sql[] = [
      Prisma.sql`l."deletedAt" IS NULL`,
      Prisma.sql`l."status" IN (${Prisma.join([...criteria.statuses])})`,
    ];

    if (criteria.sellerStatuses !== null) {
      // Seller eligibility belongs in the query: re-checking only after the
      // fact lets hidden listings consume pagination slots (short pages).
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM "SellerAccount" sa
            WHERE sa."id" = l."sellerAccountId"
              AND sa."status" IN (${Prisma.join([...criteria.sellerStatuses])}))`,
      );
    }

    if (criteria.excludeExpiredActive) {
      // §70/§164: an ACTIVE listing past its runway disappears from the feed
      // immediately; the expiration job only reconciles the row later. The
      // cutoff is parameterized like every other value — never string-built.
      const now = new Date();
      conditions.push(
        Prisma.sql`(l."status" <> 'ACTIVE' OR l."expiresAt" IS NULL OR l."expiresAt" > CAST(${now.toISOString()} AS timestamptz))`,
      );
    }

    if (criteria.categoryIds !== null) {
      conditions.push(Prisma.sql`l."categoryId" IN (${Prisma.join([...criteria.categoryIds])})`);
    }
    if (criteria.provinceId !== null) {
      conditions.push(Prisma.sql`l."provinceId" = ${criteria.provinceId}`);
    }
    if (criteria.cityId !== null) {
      conditions.push(Prisma.sql`l."cityId" = ${criteria.cityId}`);
    }
    if (criteria.minPrice !== null) {
      conditions.push(Prisma.sql`l."price" >= CAST(${String(criteria.minPrice)} AS numeric)`);
    }
    if (criteria.maxPrice !== null) {
      conditions.push(Prisma.sql`l."price" <= CAST(${String(criteria.maxPrice)} AS numeric)`);
    }
    if (criteria.conditions !== null && criteria.conditions.length > 0) {
      conditions.push(Prisma.sql`l."condition" IN (${Prisma.join([...criteria.conditions])})`);
    }
    for (const term of criteria.terms) {
      // Every term must match (AND); pg_trgm's GIN index backs the LIKE scan.
      conditions.push(Prisma.sql`l."searchText" LIKE ${`%${escapeLike(term)}%`}`);
    }
    for (const attribute of criteria.attributes) {
      const condition = attributeCondition(attribute);
      if (condition !== null) {
        conditions.push(condition);
      }
    }
    const cursor = this.cursorCondition(criteria);
    if (cursor !== null) {
      conditions.push(cursor);
    }

    const rows = await this.prisma.$queryRaw<SearchRow[]>(Prisma.sql`
      SELECT l."id", l."createdAt", l."price"::text AS "price", l."views"
      FROM "Listing" l
      WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY ${ORDER_BY[criteria.sort]}
      LIMIT ${criteria.limit + 1}
    `);

    const page = rows.slice(0, criteria.limit);
    const hasMore = rows.length > criteria.limit;
    const last = page.at(-1);
    return {
      ids: page.map((row) => row.id),
      hasMore,
      nextCursor: hasMore && last !== undefined ? nextCursorFor(criteria.sort, last) : null,
    };
  }

  /**
   * Keyset condition for the row that follows the anchor, mirroring the
   * per-sort ordering exactly. Structurally unusable cursors are ignored
   * (defensive — the service rejects malformed cursors before this point).
   */
  private cursorCondition(criteria: SearchCriteria): Prisma.Sql | null {
    const cursor = criteria.cursor;
    if (cursor === null || cursor.sort !== criteria.sort || !isUuid(cursor.id)) {
      return null;
    }
    const id = Prisma.sql`CAST(${cursor.id} AS uuid)`;
    switch (criteria.sort) {
      case 'newest': {
        if (!(cursor.createdAt instanceof Date) || Number.isNaN(cursor.createdAt.getTime())) {
          return null;
        }
        const at = Prisma.sql`CAST(${cursor.createdAt.toISOString()} AS timestamptz)`;
        return Prisma.sql`(l."createdAt" < ${at} OR (l."createdAt" = ${at} AND l."id" < ${id}))`;
      }
      case 'price_asc': {
        if (cursor.priceNull === true) {
          return Prisma.sql`(l."price" IS NULL AND l."id" > ${id})`;
        }
        if (!isDecimalString(cursor.price)) {
          return null;
        }
        const price = Prisma.sql`CAST(${cursor.price} AS numeric)`;
        // NULLS LAST: every non-null-priced row still ahead, then the null block.
        return Prisma.sql`(l."price" > ${price} OR (l."price" = ${price} AND l."id" > ${id}) OR l."price" IS NULL)`;
      }
      case 'price_desc': {
        if (cursor.priceNull === true) {
          return Prisma.sql`(l."price" IS NULL AND l."id" < ${id})`;
        }
        if (!isDecimalString(cursor.price)) {
          return null;
        }
        const price = Prisma.sql`CAST(${cursor.price} AS numeric)`;
        return Prisma.sql`(l."price" < ${price} OR (l."price" = ${price} AND l."id" < ${id}) OR l."price" IS NULL)`;
      }
      case 'most_viewed': {
        const views = cursor.views;
        if (typeof views !== 'number' || !Number.isInteger(views) || views < 0) {
          return null;
        }
        return Prisma.sql`(l."views" < CAST(${views} AS integer) OR (l."views" = CAST(${views} AS integer) AND l."id" < ${id}))`;
      }
    }
  }
}

function nextCursorFor(sort: SearchSort, row: SearchRow): SearchCursor {
  switch (sort) {
    case 'newest':
      return { sort, id: row.id, createdAt: row.createdAt };
    case 'price_asc':
    case 'price_desc':
      return row.price === null
        ? { sort, id: row.id, priceNull: true }
        : { sort, id: row.id, price: row.price };
    case 'most_viewed':
      return { sort, id: row.id, views: row.views };
  }
}

/**
 * Predicate for one whitelisted attribute criterion. Values always arrived
 * coerced by the filter parser; the JSONB type guard keeps a wrongly-shaped
 * stored value (e.g. a legacy string where a number is expected) out of the
 * comparison instead of raising a cast error.
 */
function attributeCondition(criterion: AttributeCriterion): Prisma.Sql | null {
  if (criterion.values.length === 0) {
    return null;
  }
  const json = Prisma.sql`l."attributes" -> ${criterion.key}`;
  const asText = Prisma.sql`l."attributes" ->> ${criterion.key}`;
  const typeGuard = (kind: 'number' | 'string' | 'array'): Prisma.Sql =>
    Prisma.sql`jsonb_typeof(${json}) = ${kind}`;

  switch (criterion.type) {
    case 'INTEGER':
    case 'DECIMAL':
    case 'YEAR': {
      if (criterion.operation === 'in') {
        const list = Prisma.join(
          criterion.values.map((value) => Prisma.sql`CAST(${String(value)} AS numeric)`),
        );
        return Prisma.sql`${typeGuard('number')} AND CAST(${asText} AS numeric) IN (${list})`;
      }
      const [first] = criterion.values;
      if (first === undefined) {
        return null;
      }
      const value = Prisma.sql`CAST(${String(first)} AS numeric)`;
      switch (criterion.operation) {
        case 'eq':
          return Prisma.sql`${typeGuard('number')} AND CAST(${asText} AS numeric) = ${value}`;
        case 'gte':
          return Prisma.sql`${typeGuard('number')} AND CAST(${asText} AS numeric) >= ${value}`;
        case 'lte':
          return Prisma.sql`${typeGuard('number')} AND CAST(${asText} AS numeric) <= ${value}`;
        default:
          return null;
      }
    }
    case 'BOOLEAN': {
      const [first] = criterion.values;
      if (typeof first !== 'boolean') {
        return null;
      }
      return Prisma.sql`${json} = CAST(${first ? 'true' : 'false'} AS jsonb)`;
    }
    case 'DATE': {
      const [first] = criterion.values;
      if (typeof first !== 'string') {
        return null;
      }
      // Stored dates are ISO `YYYY-MM-DD` strings; lexicographic order is
      // chronological for that format (§34).
      switch (criterion.operation) {
        case 'eq':
          return Prisma.sql`${typeGuard('string')} AND ${asText} = ${first}`;
        case 'gte':
          return Prisma.sql`${typeGuard('string')} AND ${asText} >= ${first}`;
        case 'lte':
          return Prisma.sql`${typeGuard('string')} AND ${asText} <= ${first}`;
        default:
          return null;
      }
    }
    case 'TEXT': {
      const [first] = criterion.values;
      if (typeof first !== 'string') {
        return null;
      }
      switch (criterion.operation) {
        case 'eq':
          return Prisma.sql`${typeGuard('string')} AND ${asText} = ${first}`;
        case 'contains':
          return Prisma.sql`${typeGuard('string')} AND ${asText} LIKE ${likePattern(first)}`;
        case 'in': {
          const list = Prisma.join(criterion.values.map((value) => String(value)));
          return Prisma.sql`${typeGuard('string')} AND ${asText} IN (${list})`;
        }
        default:
          return null;
      }
    }
    case 'LONG_TEXT': {
      const [first] = criterion.values;
      if (typeof first !== 'string') {
        return null;
      }
      return Prisma.sql`${typeGuard('string')} AND ${asText} LIKE ${likePattern(first)}`;
    }
    case 'SELECT': {
      const [first] = criterion.values;
      if (typeof first !== 'string') {
        return null;
      }
      if (criterion.operation === 'eq') {
        return Prisma.sql`${typeGuard('string')} AND ${asText} = ${first}`;
      }
      if (criterion.operation === 'in') {
        const list = Prisma.join(criterion.values.map((value) => String(value)));
        return Prisma.sql`${typeGuard('string')} AND ${asText} IN (${list})`;
      }
      return null;
    }
    case 'MULTI_SELECT': {
      const [first] = criterion.values;
      if (typeof first !== 'string') {
        return null;
      }
      if (criterion.operation === 'contains') {
        return Prisma.sql`${typeGuard('array')} AND ${json} @> jsonb_build_array(CAST(${first} AS text))`;
      }
      if (criterion.operation === 'in') {
        // `?|` is the jsonb operator form of "any of"; the function form
        // avoids `?` colliding with parameter placeholder parsing.
        const list = Prisma.join(criterion.values.map((value) => String(value)));
        return Prisma.sql`${typeGuard('array')} AND jsonb_exists_any(${json}, ARRAY[${list}])`;
      }
      return null;
    }
  }
}

/** LIKE wildcards inside user values are neutralized, not interpreted. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function likePattern(value: string): string {
  return `%${escapeLike(value)}%`;
}

function isDecimalString(value: string | undefined): value is string {
  return typeof value === 'string' && DECIMAL_STRING.test(value);
}
