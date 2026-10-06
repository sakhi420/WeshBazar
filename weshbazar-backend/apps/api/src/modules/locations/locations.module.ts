/**
 * Locations feature module: public province/city reads, admin management
 * (audited per §62 — hence the AuditModule import) and the validation
 * primitives used by listing flows. `LocationsService` is exported for the
 * listings module (Phase 7).
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AdminLocationsController } from './admin-locations.controller';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [AuditModule],
  controllers: [LocationsController, AdminLocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
