/**
 * Media request DTOs (spec §107).
 *
 * Shape checks only; the service enforces the at-least-one-field rule and all
 * configured bounds.
 */
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Body of `PATCH /listings/:id/images/:imageId/order`. */
export class ReorderImageDto {
  /** Target position among the active images (0-based, clamped). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  sortOrder?: number;

  /** When true, this image becomes the listing's single primary image. */
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
