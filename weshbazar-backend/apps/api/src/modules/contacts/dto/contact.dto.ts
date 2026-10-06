/**
 * Contact action payload (spec §54).
 *
 * Only the method selector is client-supplied; the revealed value is always
 * resolved server-side from the listing configuration and the seller's
 * verified phone (`contact-methods.ts`).
 */
import { IsEnum } from 'class-validator';
import { ListingContactType } from '../../../generated/prisma/enums';

export class ContactRequestDto {
  /** Which enabled method to reveal (PHONE / WHATSAPP / TELEGRAM). */
  @IsEnum(ListingContactType)
  method!: ListingContactType;
}
