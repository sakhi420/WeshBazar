/**
 * Admin category-attribute and attribute-option payloads (spec §29, §106).
 *
 * Cross-field coherence (which constraint fields fit which `type`) is checked
 * by the service against the *merged* state, because an update can change the
 * type while old constraint values remain. `null` explicitly clears a field;
 * omitting it leaves the stored value untouched.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { AttributeType } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Machine keys follow the same shape as listing attribute keys. */
const KEY_PATTERN = /^[a-z][a-z0-9_]{0,49}$/;

export class CreateAttributeDto {
  @ApiProperty({
    example: 'ram',
    description: 'Stable machine key used inside listing attributes.',
  })
  @Transform(trim)
  @IsString()
  @Matches(KEY_PATTERN, {
    message:
      'Key must start with a lowercase letter and contain only lowercase letters, digits and underscores (max 50).',
  })
  key!: string;

  @ApiProperty({ example: 'RAM' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Label must not be empty.' })
  @MaxLength(140)
  label!: string;

  @ApiProperty({ enum: AttributeType })
  @IsEnum(AttributeType)
  type!: AttributeType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  filterable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @ApiPropertyOptional({ nullable: true, example: 'GB' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'e.g. 128' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  placeholder?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Only for INTEGER, DECIMAL and YEAR.' })
  @IsOptional()
  @IsNumber()
  minValue?: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Only for INTEGER, DECIMAL and YEAR.' })
  @IsOptional()
  @IsNumber()
  maxValue?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0, description: 'Only for TEXT and LONG_TEXT.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minLength?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0, description: 'Only for TEXT and LONG_TEXT.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxLength?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Only for TEXT and LONG_TEXT; must compile as a regex.',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pattern?: string | null;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAttributeDto {
  @ApiPropertyOptional({ example: 'ram' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Matches(KEY_PATTERN, {
    message:
      'Key must start with a lowercase letter and contain only lowercase letters, digits and underscores (max 50).',
  })
  key?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Label must not be empty.' })
  @MaxLength(140)
  label?: string;

  @ApiPropertyOptional({ enum: AttributeType })
  @IsOptional()
  @IsEnum(AttributeType)
  type?: AttributeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  filterable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  placeholder?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  minValue?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  maxValue?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minLength?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxLength?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pattern?: string | null;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateOptionDto {
  @ApiProperty({ example: '128', description: 'Machine value stored in listing attributes.' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Option value must not be empty.' })
  @MaxLength(80)
  value!: string;

  @ApiProperty({ example: '۱۲۸ گیگابایت' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Option label must not be empty.' })
  @MaxLength(140)
  label!: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateOptionDto {
  @ApiPropertyOptional({ example: '128' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Option value must not be empty.' })
  @MaxLength(80)
  value?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Option label must not be empty.' })
  @MaxLength(140)
  label?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
