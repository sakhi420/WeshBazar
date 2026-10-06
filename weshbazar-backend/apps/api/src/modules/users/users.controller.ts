/**
 * Current-user profile API (spec §107): `GET /me`, `PATCH /me`.
 *
 * Both routes require authentication (global guard); the response includes
 * the user's personal seller account so seller tooling has one entry point.
 */
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
  @ApiOperation({ summary: 'My profile (user account + personal seller account)', operationId: 'me_users_getMe' })
  @ApiOkResponse({ type: MyProfileDto })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<MyProfile> {
    return this.usersService.getMyProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update my profile (display name, avatar, seller profile)', operationId: 'me_users_updateMe' })
  @ApiOkResponse({ type: MyProfileDto })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto): Promise<MyProfile> {
    return this.usersService.updateMyProfile(user.id, dto);
  }
}
