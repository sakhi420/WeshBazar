/**
 * Current-user profile API (spec §107): `GET /me`, `PATCH /me`.
 *
 * Both routes require authentication (global guard); the response includes
 * the user's personal seller account so seller tooling has one entry point.
 */
import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppException } from '../../common/errors/app.exception';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { MyProfileDto } from './dto/me-responses.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService, type MyProfile } from './users.service';

@ApiTags('me')
@ApiBearerAuth('access-token')
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'My profile (user account + personal seller account)',
    operationId: 'me_users_getMe',
  })
  @ApiOkResponse({ type: MyProfileDto })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<MyProfile> {
    return this.usersService.getMyProfile(user.id);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update my profile (display name, avatar, seller profile)',
    operationId: 'me_users_updateMe',
  })
  @ApiOkResponse({ type: MyProfileDto })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto): Promise<MyProfile> {
    return this.usersService.updateMyProfile(user.id, dto);
  }

  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Upload my profile picture (multipart, single file)',
    operationId: 'me_users_uploadAvatar',
  })
  @ApiOkResponse({ type: MyProfileDto })
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
  ): Promise<MyProfile> {
    const file = await this.readSingleImage(request);
    return this.usersService.uploadAvatar(user.id, file);
  }

  /** Reads the single image file from a multipart request; one file per request. */
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
        details: { errors: [{ field: 'file', messages: ['Attach one image file.'] }] },
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
