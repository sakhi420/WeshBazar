/**
 * Favorites API (spec §55, §108): save / unsave / list my favorites.
 *
 * Authentication is required on every route (global JWT guard — nothing here
 * is `@Public`). Save is 201 with a minimal echo; unsave is 204 because the
 * client only needs the new state.
 */
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CursorPaginated } from '../../common/http/pagination';
import type { FavoriteItem, FavoriteView } from '../../common/presenters/favorite.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { resolveLocale } from '../../common/utils/locale.utils';
import { FavoriteItemDto, FavoriteViewDto } from './dto/favorite-responses.dto';
import { FavoritesQueryDto } from './dto/favorites.dto';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth('access-token')
@Controller()
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Post('favorites/:listingId')
  @ApiOperation({
    summary: 'Add a listing to my favorites (409 when already saved)',
    operationId: 'favorites_add',
  })
  @ApiCreatedResponse({ type: FavoriteViewDto })
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId', new ParseUUIDPipe()) listingId: string,
  ): Promise<FavoriteView> {
    return this.favorites.add(user.id, listingId);
  }

  @Delete('favorites/:listingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a listing from my favorites (404 when not saved)',
    operationId: 'favorites_remove',
  })
  @ApiNoContentResponse({ description: 'Favorite removed.' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId', new ParseUUIDPipe()) listingId: string,
  ): Promise<void> {
    return this.favorites.remove(user.id, listingId);
  }

  @Get('me/favorites')
  @ApiOperation({
    summary: 'My favorites (cursor pagination, newest first)',
    operationId: 'favorites_list',
  })
  @ApiOkResponse({ type: [FavoriteItemDto] })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FavoritesQueryDto,
  ): Promise<CursorPaginated<FavoriteItem>> {
    return this.favorites.listForUser(user.id, query, resolveLocale(query.locale));
  }
}
