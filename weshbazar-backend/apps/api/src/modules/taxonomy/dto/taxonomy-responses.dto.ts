/**
 * Swagger response shapes for the category/taxonomy APIs (public + admin).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AdminAttribute,
  AdminAttributeOption,
} from '../../../common/presenters/attribute.presenter';
import type {
  AdminCategory,
  CategoryNameRef,
  PublicCategoryNode,
  PublicCategorySummary,
} from '../../../common/presenters/category.presenter';
import type { FilterSchemaField } from '../taxonomy.service';

// --- Public ---------------------------------------------------------------------

export class PublicCategorySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'mobile-phones' })
  slug!: string;

  @ApiProperty({ example: 'Mobile Phones' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  iconKey!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  hasChildren!: boolean;
}

export class PublicCategoryNodeDto extends PublicCategorySummaryDto {
  @ApiProperty({ type: () => [PublicCategoryNodeDto] })
  children!: PublicCategoryNode[];
}

export class CategoryNameRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class PublicCategoryDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  iconKey!: string | null;

  @ApiPropertyOptional({ type: CategoryNameRefDto, nullable: true })
  parent!: CategoryNameRef | null;

  @ApiProperty({ type: [CategoryNameRefDto] })
  ancestors!: CategoryNameRef[];

  @ApiProperty({ type: [PublicCategorySummaryDto] })
  children!: PublicCategorySummary[];
}

export class FilterSchemaOptionDto {
  @ApiProperty()
  value!: string;

  @ApiProperty()
  label!: string;
}

export class FilterSchemaFieldDto {
  @ApiProperty({ example: 'ram' })
  field!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ example: 'SELECT' })
  type!: string;

  @ApiPropertyOptional({ nullable: true })
  unit!: string | null;

  @ApiPropertyOptional({ nullable: true })
  placeholder!: string | null;

  @ApiProperty()
  required!: boolean;

  @ApiProperty()
  filterable!: boolean;

  @ApiProperty({ type: [FilterSchemaOptionDto] })
  options!: FilterSchemaField['options'];

  @ApiPropertyOptional({ nullable: true })
  min!: number | null;

  @ApiPropertyOptional({ nullable: true })
  max!: number | null;

  @ApiPropertyOptional({ nullable: true })
  minLength!: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxLength!: number | null;

  @ApiPropertyOptional({ nullable: true })
  pattern!: string | null;

  @ApiProperty({
    type: [String],
    example: ['eq', 'contains'],
    description: 'Filter operations supported for this field (empty when not filterable).',
  })
  operators!: string[];
}

// --- Admin ----------------------------------------------------------------------

export class AdminCategoryTranslationDto {
  @ApiProperty({ example: 'fa' })
  locale!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;
}

export class AdminCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] })
  status!: AdminCategory['status'];

  @ApiProperty()
  sortOrder!: number;

  @ApiPropertyOptional({ nullable: true })
  iconKey!: string | null;

  @ApiProperty({ enum: ['REVIEW_REQUIRED', 'AUTO_APPROVE'] })
  moderationMode!: AdminCategory['moderationMode'];

  @ApiProperty({ description: 'Name for the requested/fallback locale.' })
  name!: string;

  @ApiProperty({ type: [AdminCategoryTranslationDto] })
  translations!: AdminCategory['translations'];

  @ApiProperty()
  attributeCount!: number;

  @ApiProperty()
  childCount!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class AdminAttributeOptionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  attributeId!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;
}

export class AdminAttributeDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  @ApiProperty({ example: 'ram' })
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ example: 'SELECT' })
  type!: AdminAttribute['type'];

  @ApiProperty()
  required!: boolean;

  @ApiProperty()
  filterable!: boolean;

  @ApiProperty()
  searchable!: boolean;

  @ApiPropertyOptional({ nullable: true })
  unit!: string | null;

  @ApiPropertyOptional({ nullable: true })
  placeholder!: string | null;

  @ApiPropertyOptional({ nullable: true })
  minValue!: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxValue!: number | null;

  @ApiPropertyOptional({ nullable: true })
  minLength!: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxLength!: number | null;

  @ApiPropertyOptional({ nullable: true })
  pattern!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [AdminAttributeOptionDto] })
  options!: AdminAttributeOption[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
