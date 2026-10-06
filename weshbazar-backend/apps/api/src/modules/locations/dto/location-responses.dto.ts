/**
 * Swagger response shapes for the location APIs (public + admin).
 */
import { ApiProperty } from '@nestjs/swagger';
import type { AdminCity, AdminProvince } from '../../../common/presenters/location.presenter';

export class PublicProvinceSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'AF-KAB' })
  code!: string;

  @ApiProperty({ example: 'kabul' })
  slug!: string;

  @ApiProperty({ example: 'Kabul' })
  name!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class PublicCitySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'kabul-city' })
  slug!: string;

  @ApiProperty({ example: 'Kabul' })
  name!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class LocationTranslationRowDto {
  @ApiProperty({ example: 'fa' })
  locale!: string;

  @ApiProperty({ example: 'کابل' })
  name!: string;
}

export class AdminProvinceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'AF-KAB' })
  code!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status!: AdminProvince['status'];

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ description: 'Name for the requested/fallback locale.' })
  name!: string;

  @ApiProperty({ type: [LocationTranslationRowDto] })
  translations!: AdminProvince['translations'];

  @ApiProperty()
  cityCount!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class AdminCityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  provinceId!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status!: AdminCity['status'];

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ description: 'Name for the requested/fallback locale.' })
  name!: string;

  @ApiProperty({ type: [LocationTranslationRowDto] })
  translations!: AdminCity['translations'];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
