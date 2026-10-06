/**
 * Locations service (spec §36, §106): public province/city reads, the
 * validation primitives used when listings are created (city belongs to the
 * selected province; both must be ACTIVE), and admin management.
 *
 * Slug rules match categories: generated from the English name, retried with
 * a random suffix on collision — each attempt runs in its own transaction
 * together with its audit row (a failed statement aborts a transaction, so
 * the retry wraps the whole `$transaction` call). City slugs are unique per
 * province, not globally.
 */
import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { isUniqueViolation } from '../../common/errors/prisma-errors';
import {
  toAdminCity,
  toAdminProvince,
  toPublicCity,
  toPublicProvince,
  type AdminCity,
  type AdminProvince,
  type CityWithTranslations,
  type ProvinceWithTranslations,
  type PublicCitySummary,
  type PublicProvinceSummary,
} from '../../common/presenters/location.presenter';
import type { Locale } from '../../common/utils/locale.utils';
import { slugSuffix, slugify } from '../../common/utils/slug.utils';
import { normalizeTranslations, type TranslationInput } from '../../common/utils/translation.utils';
import { isUuid } from '../../common/utils/uuid.utils';
import { assertValidSlugInput } from '../../common/validation/field-issues';
import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type { AuditAction, LocationStatus } from '../../generated/prisma/enums';
import { AuditService, type AuditActor } from '../audit/audit.service';

const PROVINCE_INCLUDE = { translations: true } as const;
const CITY_INCLUDE = { translations: true } as const;

/** Collision retries before giving up on a generated slug. */
const SLUG_RETRIES = 4;

// --- Input shapes (mirrored by the DTOs) ----------------------------------------

interface ProvinceInput {
  code?: string;
  slug?: string;
  status?: LocationStatus;
  sortOrder?: number;
  translations?: TranslationInput[];
}

export interface CreateProvinceInput extends ProvinceInput {
  code: string;
  translations: TranslationInput[];
}

export type UpdateProvinceInput = ProvinceInput;

interface CityInput {
  slug?: string;
  status?: LocationStatus;
  sortOrder?: number;
  translations?: TranslationInput[];
}

export interface CreateCityInput extends CityInput {
  translations: TranslationInput[];
}

export type UpdateCityInput = CityInput;

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Public reads -------------------------------------------------------------

  async listProvinces(locale: Locale): Promise<PublicProvinceSummary[]> {
    const rows = await this.prisma.province.findMany({
      where: { status: 'ACTIVE' },
      include: PROVINCE_INCLUDE,
    });
    return sortLocations(rows).map((row) => toPublicProvince(row, locale));
  }

  /** Cities of an ACTIVE province; an inactive/missing province is not found. */
  async listCities(provinceId: string, locale: Locale): Promise<PublicCitySummary[]> {
    const province = await this.getProvinceRow(provinceId);
    if (province.status !== 'ACTIVE') {
      throw new AppException('PROVINCE_NOT_FOUND');
    }
    const rows = await this.prisma.city.findMany({
      where: { provinceId, status: 'ACTIVE' },
      include: CITY_INCLUDE,
    });
    return sortLocations(rows).map((row) => toPublicCity(row, locale));
  }

  /**
   * Discovery resolvers (spec §49): ACTIVE matches only. Unknown or inactive
   * slugs resolve to null so search answers with an empty feed — a filter is
   * not a resource address, and moderation state never leaks.
   */
  async resolveProvinceBySlug(slug: string): Promise<{ id: string } | null> {
    const row = await this.prisma.province.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!row || row.status !== 'ACTIVE') {
      return null;
    }
    return { id: row.id };
  }

  /** City slugs are unique per province, so the province scope is required. */
  async resolveCityBySlug(slug: string, provinceId: string): Promise<{ id: string } | null> {
    const row = await this.prisma.city.findUnique({
      where: { provinceId_slug: { provinceId, slug } },
      select: { id: true, status: true },
    });
    if (!row || row.status !== 'ACTIVE') {
      return null;
    }
    return { id: row.id };
  }

  // --- Validation primitives (listing flows) --------------------------------------

  /**
   * Guard for listing creation (spec §36): the city must exist, belong to the
   * selected province, and both the city and its province must be ACTIVE.
   */
  async assertLocationUsable(provinceId: string, cityId: string): Promise<void> {
    if (!isUuid(provinceId)) {
      throw new AppException('PROVINCE_NOT_FOUND');
    }
    if (!isUuid(cityId)) {
      throw new AppException('CITY_NOT_FOUND');
    }
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: { provinceId: true, status: true, province: { select: { status: true } } },
    });
    if (!city) {
      throw new AppException('CITY_NOT_FOUND');
    }
    if (city.provinceId !== provinceId) {
      throw new AppException('CITY_PROVINCE_MISMATCH');
    }
    if (city.status !== 'ACTIVE' || city.province.status !== 'ACTIVE') {
      throw new AppException('LOCATION_INACTIVE');
    }
  }

  // --- Admin reads -----------------------------------------------------------------

  async listProvincesAdmin(locale: Locale): Promise<AdminProvince[]> {
    const rows = await this.prisma.province.findMany({
      include: { translations: true, _count: { select: { cities: true } } },
    });
    return sortLocations(rows).map((row) => toAdminProvince(row, locale, row._count.cities));
  }

  /** All cities of a province (any status) for management screens. */
  async listCitiesAdmin(provinceId: string, locale: Locale): Promise<AdminCity[]> {
    await this.getProvinceRow(provinceId);
    const rows = await this.prisma.city.findMany({
      where: { provinceId },
      include: CITY_INCLUDE,
    });
    return sortLocations(rows).map((row) => toAdminCity(row, locale));
  }

  // --- Admin: provinces --------------------------------------------------------------

  async createProvince(
    input: CreateProvinceInput,
    locale: Locale,
    actor: AuditActor,
  ): Promise<AdminProvince> {
    const translations = normalizeTranslations(input.translations, 'en');
    assertValidSlugInput(input.slug);
    const englishName = translations.find((row) => row.locale === 'en')?.name ?? '';
    const base = input.slug ?? (slugify(englishName) || input.code.toLowerCase());

    let attempt = 0;
    for (;;) {
      const slug = attempt === 0 ? base : `${base}-${slugSuffix()}`;
      try {
        const created = await this.prisma.$transaction(async (tx) => {
          const row = await tx.province.create({
            data: {
              code: input.code,
              slug,
              status: input.status ?? 'ACTIVE',
              sortOrder: input.sortOrder ?? 0,
              // Province translations have no `description` column.
              translations: { create: translations.map(({ locale, name }) => ({ locale, name })) },
            },
            include: PROVINCE_INCLUDE,
          });
          await this.recordAudit(tx, actor, 'LOCATION_CREATED', 'Province', row.id, {
            code: row.code,
            slug: row.slug,
          });
          return row;
        });
        return toAdminProvince(created, locale, 0);
      } catch (error) {
        if (isUniqueViolation(error, 'Province_code')) {
          throw new AppException('PROVINCE_CODE_TAKEN', { cause: error });
        }
        if (!isUniqueViolation(error, 'Province_slug')) {
          throw error;
        }
        if (input.slug !== undefined || attempt >= SLUG_RETRIES) {
          throw new AppException('PROVINCE_SLUG_TAKEN', { cause: error });
        }
        attempt += 1;
      }
    }
  }

  async updateProvince(
    id: string,
    input: UpdateProvinceInput,
    locale: Locale,
    actor: AuditActor,
  ): Promise<AdminProvince> {
    await this.getProvinceRow(id);
    const translations =
      input.translations !== undefined ? normalizeTranslations(input.translations) : null;
    assertValidSlugInput(input.slug);

    const data: Prisma.ProvinceUncheckedUpdateInput = {
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(translations !== null
        ? {
            translations: {
              upsert: translations.map((translation) => ({
                where: { provinceId_locale: { provinceId: id, locale: translation.locale } },
                create: { locale: translation.locale, name: translation.name },
                update: { name: translation.name },
              })),
            },
          }
        : {}),
    };

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const row = await tx.province.update({
          where: { id },
          data,
          include: PROVINCE_INCLUDE,
        });
        await this.recordAudit(tx, actor, 'LOCATION_UPDATED', 'Province', row.id, {
          code: row.code,
          slug: row.slug,
          changed: changedFields(input),
        });
        return row;
      });
      const cityCount = await this.prisma.city.count({ where: { provinceId: id } });
      return toAdminProvince(updated, locale, cityCount);
    } catch (error) {
      if (isUniqueViolation(error, 'Province_code')) {
        throw new AppException('PROVINCE_CODE_TAKEN', { cause: error });
      }
      if (isUniqueViolation(error, 'Province_slug')) {
        throw new AppException('PROVINCE_SLUG_TAKEN', { cause: error });
      }
      throw error;
    }
  }

  async deleteProvince(id: string, actor: AuditActor): Promise<void> {
    const existing = await this.getProvinceRow(id);
    await this.prisma.$transaction(async (tx) => {
      const [cities, listings] = await Promise.all([
        tx.city.count({ where: { provinceId: id } }),
        tx.listing.count({ where: { provinceId: id } }),
      ]);
      if (cities > 0 || listings > 0) {
        throw new AppException('PROVINCE_IN_USE');
      }
      await tx.province.delete({ where: { id } });
      await this.recordAudit(tx, actor, 'LOCATION_DELETED', 'Province', id, {
        code: existing.code,
        slug: existing.slug,
      });
    });
  }

  // --- Admin: cities -------------------------------------------------------------------

  async createCity(
    provinceId: string,
    input: CreateCityInput,
    locale: Locale,
    actor: AuditActor,
  ): Promise<AdminCity> {
    await this.getProvinceRow(provinceId);
    const translations = normalizeTranslations(input.translations, 'en');
    assertValidSlugInput(input.slug);
    const englishName = translations.find((row) => row.locale === 'en')?.name ?? '';
    const base = input.slug ?? (slugify(englishName) || 'city');

    let attempt = 0;
    for (;;) {
      const slug = attempt === 0 ? base : `${base}-${slugSuffix()}`;
      try {
        const created = await this.prisma.$transaction(async (tx) => {
          const row = await tx.city.create({
            data: {
              provinceId,
              slug,
              status: input.status ?? 'ACTIVE',
              sortOrder: input.sortOrder ?? 0,
              // City translations have no `description` column.
              translations: { create: translations.map(({ locale, name }) => ({ locale, name })) },
            },
            include: CITY_INCLUDE,
          });
          await this.recordAudit(tx, actor, 'LOCATION_CREATED', 'City', row.id, {
            provinceId,
            slug: row.slug,
          });
          return row;
        });
        return toAdminCity(created, locale);
      } catch (error) {
        if (!isUniqueViolation(error, 'City_provinceId_slug')) {
          throw error;
        }
        if (input.slug !== undefined || attempt >= SLUG_RETRIES) {
          throw new AppException('CITY_SLUG_TAKEN', { cause: error });
        }
        attempt += 1;
      }
    }
  }

  async updateCity(
    id: string,
    input: UpdateCityInput,
    locale: Locale,
    actor: AuditActor,
  ): Promise<AdminCity> {
    const existing = await this.getCityRow(id);
    const translations =
      input.translations !== undefined ? normalizeTranslations(input.translations) : null;
    assertValidSlugInput(input.slug);

    const data: Prisma.CityUncheckedUpdateInput = {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(translations !== null
        ? {
            translations: {
              upsert: translations.map((translation) => ({
                where: { cityId_locale: { cityId: id, locale: translation.locale } },
                create: { locale: translation.locale, name: translation.name },
                update: { name: translation.name },
              })),
            },
          }
        : {}),
    };

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const row = await tx.city.update({
          where: { id },
          data,
          include: CITY_INCLUDE,
        });
        await this.recordAudit(tx, actor, 'LOCATION_UPDATED', 'City', row.id, {
          provinceId: existing.provinceId,
          slug: row.slug,
          changed: changedFields(input),
        });
        return row;
      });
      return toAdminCity(updated, locale);
    } catch (error) {
      if (isUniqueViolation(error, 'City_provinceId_slug')) {
        throw new AppException('CITY_SLUG_TAKEN', { cause: error });
      }
      throw error;
    }
  }

  async deleteCity(id: string, actor: AuditActor): Promise<void> {
    const existing = await this.getCityRow(id);
    await this.prisma.$transaction(async (tx) => {
      const listings = await tx.listing.count({ where: { cityId: id } });
      if (listings > 0) {
        throw new AppException('CITY_IN_USE');
      }
      await tx.city.delete({ where: { id } });
      await this.recordAudit(tx, actor, 'LOCATION_DELETED', 'City', id, {
        provinceId: existing.provinceId,
        slug: existing.slug,
      });
    });
  }

  // --- Internals -------------------------------------------------------------------------

  /**
   * §62: the audit row is written inside the caller's transaction, so it
   * exists if and only if the location change committed.
   */
  private recordAudit(
    tx: Prisma.TransactionClient,
    actor: AuditActor,
    action: AuditAction,
    entityType: 'Province' | 'City',
    entityId: string,
    metadata: Prisma.InputJsonObject,
  ): Promise<void> {
    return this.audit.record(
      {
        actorUserId: actor.actorUserId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress: actor.ipAddress ?? null,
        userAgent: actor.userAgent ?? null,
      },
      tx,
    );
  }

  private async getProvinceRow(id: string): Promise<ProvinceWithTranslations> {
    if (!isUuid(id)) {
      throw new AppException('PROVINCE_NOT_FOUND');
    }
    const row = await this.prisma.province.findUnique({ where: { id }, include: PROVINCE_INCLUDE });
    if (!row) {
      throw new AppException('PROVINCE_NOT_FOUND');
    }
    return row;
  }

  private async getCityRow(id: string): Promise<CityWithTranslations> {
    if (!isUuid(id)) {
      throw new AppException('CITY_NOT_FOUND');
    }
    const row = await this.prisma.city.findUnique({ where: { id }, include: CITY_INCLUDE });
    if (!row) {
      throw new AppException('CITY_NOT_FOUND');
    }
    return row;
  }
}

interface SortableLocation {
  sortOrder: number;
  slug: string;
  id: string;
}

function sortLocations<T extends SortableLocation>(rows: readonly T[]): T[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug) || a.id.localeCompare(b.id),
  );
}

/** Present (non-undefined) input keys — the audit "what changed" summary. */
function changedFields(input: object): string[] {
  const record = input as Record<string, unknown>;
  return Object.keys(input).filter((key) => record[key] !== undefined);
}
