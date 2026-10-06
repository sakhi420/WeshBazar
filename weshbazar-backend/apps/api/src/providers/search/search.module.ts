/**
 * Search provider wiring (spec §48, §113).
 *
 * One binding for the whole application: the PostgreSQL implementation backs
 * public discovery today. Spec §113 keeps the door open for an external
 * engine (OpenSearch) — that swap happens here, behind `SEARCH_PROVIDER`,
 * without touching the discovery service.
 */
import { Module } from '@nestjs/common';
import { PostgresSearchProvider } from './postgres-search.provider';
import { SEARCH_PROVIDER } from './search.provider';

@Module({
  providers: [
    PostgresSearchProvider,
    { provide: SEARCH_PROVIDER, useExisting: PostgresSearchProvider },
  ],
  exports: [SEARCH_PROVIDER],
})
export class SearchModule {}
