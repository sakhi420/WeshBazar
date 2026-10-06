/**
 * Swagger response shape for the contact action (spec §54).
 * Mirrors `ContactTargetView` in `contacts.service.ts`.
 */
import { ApiProperty } from '@nestjs/swagger';

export class ContactTargetDto {
  @ApiProperty({ example: 'WHATSAPP' })
  method!: string;

  @ApiProperty({
    example: '+93701234567',
    description: 'Sanitized contact target; a canonical @handle for TELEGRAM.',
  })
  value!: string;
}
