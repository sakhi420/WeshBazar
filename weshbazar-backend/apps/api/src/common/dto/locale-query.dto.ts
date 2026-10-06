/**
 * Shared `?locale=` query for localized public reads (spec §28).
 *
 * The raw value is accepted as-is (BCP-47 aliases like `fa-AF` included);
 * controllers resolve it through `resolveLocale`, which falls back to the
 * default locale for unknown input instead of rejecting the request.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LocaleQueryDto {
  @ApiPropertyOptional({
    description:
      'Preferred content locale; BCP-47 aliases such as fa-AF are accepted. Unknown values fall back to en.',
    example: 'fa-AF',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;
}
