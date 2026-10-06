/**
 * Background jobs module (spec §69, §164).
 *
 * Owns the scheduling layer: `ScheduleModule.forRoot()` lives here so the rest
 * of the application stays free of timer concerns, and `JobsService` registers
 * one interval per job when `JOBS_ENABLED` is true. The job methods stay
 * callable directly (tests, manual runs) regardless of the flag.
 */
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StorageModule } from '../../providers/storage/storage.module';
import { ListingsModule } from '../listings/listings.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [ScheduleModule.forRoot(), ListingsModule, StorageModule],
  providers: [JobsService],
})
export class JobsModule {}
