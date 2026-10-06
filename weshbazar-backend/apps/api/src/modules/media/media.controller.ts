/**
 * Listing gallery API (spec §107, §63–§67).
 *
 * Uploads are `multipart/form-data` with exactly one image file per request;
 * the declared filename and Content-Type are ignored — magic bytes decide the
 * true format. Size/count limits come from configuration and are enforced by
 * the multipart plugin plus the media service. Every mutation returns the
 * refreshed owner listing so clients can re-render the gallery and pick up
 * the new `version` in one round trip.
 */
import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { AppException } from '../../common/errors/app.exception';
import type { OwnerListing } from '../../common/presenters/listing.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { resolveLocale } from '../../common/utils/locale.utils';
import { OwnerListingDto } from '../listings/dto/listing-responses.dto';
import { ReorderImageDto } from './dto/media.dto';
import { MediaService } from './media.service';

@ApiTags('listings')
@ApiBearerAuth('access-token')
@Controller('listings')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload one image for a listing (multipart, single file)', operationId: 'listings_media_upload' })
  @ApiCreatedResponse({ type: OwnerListingDto })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: FastifyRequest,
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    const file = await this.readSingleImage(request);
    return this.media.uploadImage(user.id, id, file, resolveLocale(query.locale));
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete one image from a listing gallery', operationId: 'listings_media_remove' })
  @ApiOkResponse({ type: OwnerListingDto })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.media.deleteImage(user.id, id, imageId, resolveLocale(query.locale));
  }

  @Patch(':id/images/:imageId/order')
  @ApiOperation({ summary: 'Reorder an image and/or flag it as the primary image', operationId: 'listings_media_reorder' })
  @ApiOkResponse({ type: OwnerListingDto })
  async reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @Body() dto: ReorderImageDto = {},
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.media.reorderImage(user.id, id, imageId, dto, resolveLocale(query.locale));
  }

  /**
   * Reads the single image file from a multipart request. All parts are
   * consumed (so the parser never stalls); the first file wins and any extra
   * file part is rejected — the contract is one image per request.
   */
  private async readSingleImage(request: FastifyRequest): Promise<Buffer> {
    if (!request.isMultipart()) {
      throw new AppException('VALIDATION_ERROR', {
        details: {
          errors: [{ field: 'file', messages: ['Send the image as multipart/form-data.'] }],
        },
      });
    }

    let firstFile: Buffer | null = null;
    let fileCount = 0;
    try {
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          const data = await part.toBuffer();
          fileCount += 1;
          firstFile ??= data;
        }
      }
    } catch (error) {
      this.translateMultipartError(error);
    }

    if (firstFile === null) {
      throw new AppException('VALIDATION_ERROR', {
        details: {
          errors: [{ field: 'file', messages: ['Attach one image file.'] }],
        },
      });
    }
    if (fileCount > 1) {
      throw new AppException('VALIDATION_ERROR', {
        details: {
          errors: [{ field: 'file', messages: ['Upload exactly one image per request.'] }],
        },
      });
    }
    return firstFile;
  }

  /** Transport-level multipart failures → stable catalog codes. */
  private translateMultipartError(error: unknown): never {
    if (AppException.isAppException(error)) {
      throw error;
    }
    if (readErrorCode(error) === 'FST_REQ_FILE_TOO_LARGE') {
      throw new AppException('IMAGE_TOO_LARGE', { cause: error });
    }
    throw new AppException('VALIDATION_ERROR', {
      details: {
        errors: [{ field: 'file', messages: ['The multipart upload could not be read.'] }],
      },
      cause: error,
    });
  }
}

function readErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }
  const { code } = error as { code?: unknown };
  return typeof code === 'string' ? code : null;
}
