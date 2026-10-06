/**
 * Taxonomy feature module: public category reads and the dynamic attribute
 * engine (`TaxonomyService`), plus admin CRUD (`TaxonomyAdminService`, audited
 * per §62 — hence the AuditModule import). `TaxonomyService` is exported so
 * the listings module can validate category attributes when listings arrive
 * in Phase 7.
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AdminTaxonomyController } from './admin-taxonomy.controller';
import { CategoriesController } from './categories.controller';
import { TaxonomyAdminService } from './taxonomy-admin.service';
import { TaxonomyService } from './taxonomy.service';

@Module({
  imports: [AuditModule],
  controllers: [CategoriesController, AdminTaxonomyController],
  providers: [TaxonomyService, TaxonomyAdminService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
