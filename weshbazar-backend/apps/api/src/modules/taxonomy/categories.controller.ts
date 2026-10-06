/**
 * Public category API (spec §108): flat list, tree, detail by slug, and the
 * filter/attribute schema for a category. All routes are anonymous; visibility
 * is limited to categories whose full ancestor chain is ACTIVE.
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import type { PublicCategoryNode } from '../../common/presenters/category.presenter';
import { resolveLocale } from '../../common/utils/locale.utils';
import {
  FilterSchemaFieldDto,
  PublicCategoryDetailDto,
  PublicCategoryNodeDto,
  PublicCategorySummaryDto,
} from './dto/taxonomy-responses.dto';
import { TaxonomyService, type FilterSchemaField } from './taxonomy.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List visible categories (flat, with parent links and hasChildren)', operationId: 'categories_list' })
  @ApiOkResponse({ type: [PublicCategorySummaryDto] })
  list(@Query() query: LocaleQueryDto): ReturnType<TaxonomyService['listCategories']> {
    return this.taxonomy.listCategories(resolveLocale(query.locale));
  }

  // Declared before ':slug' so the static segment wins regardless of router
  // precedence rules.
  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Visible category tree (roots with nested children)', operationId: 'categories_tree' })
  @ApiOkResponse({ type: [PublicCategoryNodeDto] })
  tree(@Query() query: LocaleQueryDto): Promise<PublicCategoryNode[]> {
    return this.taxonomy.getTree(resolveLocale(query.locale));
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Category detail by slug (with ancestors and direct children)', operationId: 'categories_bySlug' })
  @ApiOkResponse({ type: PublicCategoryDetailDto })
  bySlug(
    @Param('slug') slug: string,
    @Query() query: LocaleQueryDto,
  ): ReturnType<TaxonomyService['getBySlug']> {
    return this.taxonomy.getBySlug(slug, resolveLocale(query.locale));
  }

  @Public()
  @Get(':id/filter-schema')
  @ApiOperation({ summary: 'Effective attribute/filter schema for a category (by id)', operationId: 'categories_filterSchema' })
  @ApiOkResponse({ type: [FilterSchemaFieldDto] })
  filterSchema(@Param('id') id: string): Promise<FilterSchemaField[]> {
    return this.taxonomy.getFilterSchema(id);
  }
}
