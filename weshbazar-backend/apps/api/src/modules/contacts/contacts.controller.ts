/**
 * Contact action API (spec §54, §108): `POST /listings/:id/contact`.
 *
 * Public by design — buyers are not required to register — which makes the
 * per-IP rate limit the only defense against scraping; it is enforced in the
 * service before any listing data is read.
 */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Public } from '../../common/decorators/public.decorator';
import { ContactRequestDto } from './dto/contact.dto';
import { ContactTargetDto } from './dto/contact-responses.dto';
import { ContactsService, type ContactTargetView } from './contacts.service';

@ApiTags('listings')
@Controller('listings')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Public()
  @Post(':id/contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Reveal an enabled contact method for an active listing (anonymous, per-IP rate limit)',
    operationId: 'listings_contact_reveal',
  })
  @ApiOkResponse({ type: ContactTargetDto })
  reveal(
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    // Placeholder so a missing body fails as VALIDATION_ERROR, not a crash.
    @Body() dto: ContactRequestDto = {} as ContactRequestDto,
  ): Promise<ContactTargetView> {
    return this.contacts.reveal(id, dto.method, request.ip);
  }
}
