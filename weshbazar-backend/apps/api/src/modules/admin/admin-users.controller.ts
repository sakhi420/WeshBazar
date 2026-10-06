/**
 * Admin user management (spec §60, §106) — search, detail, and the three
 * moderation commands.
 *
 * Reads need USER_READ (moderators run the suspicious-users workflow);
 * suspend/ban/restore each need their own permission, so a future
 * "support" role can search users without being able to act on them.
 * Moderation is never expressible as a payload: the endpoint IS the command.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { PagePaginated } from '../../common/http/pagination';
import type { AdminUserDetailView, AdminUserView } from '../../common/presenters/admin.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { requestAuditContext } from '../audit/audit.service';
import { AdminUsersService } from './admin-users.service';
import { AdminUserDetailDto, AdminUserDto } from './dto/admin-responses.dto';
import { AdminUsersQueryDto, BanUserDto, SuspendUserDto } from './dto/admin-users.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @RequirePermissions('USER_READ')
  @ApiOperation({
    summary: 'Search users (page/limit; phone, name, role, status filters)',
    operationId: 'admin_users_list',
  })
  @ApiOkResponse({ type: [AdminUserDto] })
  list(@Query() query: AdminUsersQueryDto): Promise<PagePaginated<AdminUserView>> {
    return this.users.search(query);
  }

  @Get(':id')
  @RequirePermissions('USER_READ')
  @ApiOperation({
    summary: 'User detail with listing and report counters',
    operationId: 'admin_users_detail',
  })
  @ApiOkResponse({ type: AdminUserDetailDto })
  detail(@Param('id', new ParseUUIDPipe()) id: string): Promise<AdminUserDetailView> {
    return this.users.detail(id);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('USER_SUSPEND')
  @ApiOperation({
    summary: 'Suspend an account, optionally until a date (revokes sessions)',
    operationId: 'admin_users_suspend',
  })
  @ApiOkResponse({ type: AdminUserDto })
  suspend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    // Placeholder so a missing body fails as VALIDATION_ERROR, not a crash.
    @Body() dto: SuspendUserDto = {} as SuspendUserDto,
    @Req() request: FastifyRequest,
  ): Promise<AdminUserView> {
    return this.users.suspend(user.id, id, dto, requestAuditContext(request));
  }

  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('USER_BAN')
  @ApiOperation({
    summary: 'Ban an account indefinitely (revokes sessions)',
    operationId: 'admin_users_ban',
  })
  @ApiOkResponse({ type: AdminUserDto })
  ban(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: BanUserDto = {} as BanUserDto,
    @Req() request: FastifyRequest,
  ): Promise<AdminUserView> {
    return this.users.ban(user.id, id, dto, requestAuditContext(request));
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('USER_RESTORE')
  @ApiOperation({
    summary: 'Restore a suspended or banned account',
    operationId: 'admin_users_restore',
  })
  @ApiOkResponse({ type: AdminUserDto })
  restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: FastifyRequest,
  ): Promise<AdminUserView> {
    return this.users.restore(user.id, id, requestAuditContext(request));
  }
}
