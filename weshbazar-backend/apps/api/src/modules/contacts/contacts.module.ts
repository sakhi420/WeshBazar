/**
 * Contacts module (spec §54): the anonymous contact action endpoint.
 * Analytics counters are provided by the shared analytics module (§74).
 */
import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [AnalyticsModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
