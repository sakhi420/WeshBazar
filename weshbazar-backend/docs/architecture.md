# Architecture

This document describes the runtime architecture of the WeshBazar backend — a
NestJS modular monolith implementing a consumer-to-consumer (C2C) marketplace.
It is intended for maintainers and contributors and is the authoritative
reference for the `docker-compose.yml` note "ADR-005: no Redis initially".

## At a glance

| Aspect          | Choice                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| Pattern         | Modular monolith (single deployable, strictly module-isolated)          |
| Framework       | NestJS 11 on Node.js (LTS)                                              |
| Language        | TypeScript (strict, `noUnusedLocals`/`noUnusedParameters`)              |
| Data layer      | Prisma 7 with the `@prisma/adapter-pg` driver adapter                   |
| Database        | PostgreSQL 17 (single source of truth — no Redis, no Kafka)             |
| Search          | In-process `PostgresSearchProvider` (`pg_trgm`-backed)                  |
| Auth            | JWT access + refresh tokens, OTP phone verification, RBAC + permissions |
| API shape       | Single standard envelope for success **and** errors                     |
| Validation      | Strict `ValidationPipe` (`whitelist` + `transform`, no unknown keys)    |
| Tests           | Unit + integration + e2e (three Jest configurations)                    |
| Formatting/lint | Prettier + ESLint (flat config); Husky pre-commit                       |

## High-level topology

```
                         HTTP / JSON
                             │
        ┌────────────────────▼────────────────────┐
        │            bootstrap.ts -> AppModule       │  cross-cutting wiring
        │  APP_FILTER   APP_INTERCEPTOR   APP_PIPE  │  (envelope, validation)
        │  APP_GUARD (JWT, owned by AuthModule)      │
        └────────────────────┬────────────────────┘
                             │
   ┌─────────────────────────┼───────────────────────────┐
   │                         │                           │
   ▼ domain modules          ▼ common                    ▼ providers (ports)
 AuthModule        AllExceptionsFilter        SearchProvider   (SEARCH_PROVIDER)
 UsersModule       ResponseEnvelope           SmsProvider      (SMS_PROVIDER)
 SellersModule     createValidationPipe       StorageProvider  (STORAGE_PROVIDER)
 ListingsModule    RateLimitService (in-mem)        │                │           │
 TaxonomyModule    JwtAuthGuard/RolesGuard        ┌──▼──────┐  ┌──────▼─────┐  ┌──────────────┐
 LocationsModule                                  │ Postgres│  │ MockSms     │  │ LocalStorage │
 MediaModule                                      │ Search  │  │ Provider    │  │ Provider      │
 ContactsModule                                  └────┬─────┘  └─────────────┘  └──────────────┘
 FavoritesModule                                       │ parameterized SQL (pg_trgm)
 ReportsModule                                         ▼
 AdminModule (incl. analytics)               ┌──────────────────┐
 JobsModule                                  │  PrismaService     │  driver adapter -> Postgres 17
 AuditModule / HealthModule                  └──────────────────┘
```

## Module catalog

The application is composed of feature modules registered once in `app.module.ts`.
Modules never reach across each other's internals; cross-feature needs go through
a module's exported service surface.

| Module            | Responsibility                                                             |
| ----------------- | -------------------------------------------------------------------------- |
| `ConfigModule`    | Validated, namespaced config; fails fast on invalid env (`env.schema.ts`)  |
| `LoggingModule`   | Pino structured logging                                                    |
| `PrismaModule`    | Global database access via `PrismaService` (driver adapter)                |
| `RateLimitModule` | In-process rate limiting across 11 surfaces (no Redis dependency)          |
| `StorageModule`   | Binds `STORAGE_PROVIDER` token; fail-fast on unknown provider name         |
| `AuthModule`      | Registration, login, OTP verification, refresh-token rotation/reuse detect |
| `UsersModule`     | `me` profile read/update                                                   |
| `SellersModule`   | Seller-account onboarding & KYC, admin seller management                   |
| `TaxonomyModule`  | Categories + typed attribute definitions (admin-managed)                   |
| `LocationsModule` | Afghanistan province/city taxonomy                                         |
| `ListingsModule`  | Listing CRUD, draft/expiry lifecycle, discovery (public feed)              |
| `MediaModule`     | Media upload safety (magic-byte validation, size/type caps)                |
| `ContactsModule`  | Contact-card & contact-detail resolution                                   |
| `FavoritesModule` | Favorite listings                                                          |
| `ReportsModule`   | Report lifecycle (open -> in_review -> resolved)                           |
| `AdminModule`     | Admin ops incl. analytics, moderation, suspension, audit views             |
| `JobsModule`      | Scheduled reconciliation (expiration, stale-draft archival)                |
| `AuditModule`     | Append-only audit trail                                                    |
| `HealthModule`    | Liveness/readiness probes                                                  |

## Dependency direction & layering rules

The codebase enforces a one-way dependency direction. Violating it breaks the
envelope contract and the module isolation invariant:

1. **HTTP layer (controllers) -> service layer -> data/providers.** Controllers
   never call `PrismaService` or providers directly.
2. **Services depend on ports, not adapters.** A service injects the
   `SearchProvider` / `SmsProvider` / `StorageProvider` _token_, never the
   concrete implementation.
3. **Modules import only exported service surfaces.** A module may export a
   service for cross-feature use but never re-exports another module's internals.
4. **Generated Prisma types** live under `apps/api/src/generated/prisma/` and
   are the only data-layer types services may import; raw `Prisma` SQL helpers
   are confined to provider implementations.
5. **Common (`apps/api/src/common`)** is shared leaf utility space — importable
   anywhere, but it must not import feature modules.

## Ports & adapters

Three infrastructure concerns are hidden behind swap-in ports so the concrete
technology can change without touching application logic. Each port is a
TypeScript interface bound to a NestJS DI _symbol token_, with a single default
adapter shipped today:

| Port (interface)  | DI token           | Default adapter          | Bound by                 |
| ----------------- | ------------------ | ------------------------ | ------------------------ |
| `SearchProvider`  | `SEARCH_PROVIDER`  | `PostgresSearchProvider` | `SearchModule`           |
| `SmsProvider`     | `SMS_PROVIDER`     | `MockSmsProvider`        | `SmsModule`              |
| `StorageProvider` | `STORAGE_PROVIDER` | `LocalStorageProvider`   | `StorageModule` (config) |

Notable safety properties of the boundary (see `search.provider.ts`):

- Everything crossing the search boundary is already **whitelisted and
  type-coerced by the discovery service** before it reaches the provider —
  statuses come from the service's visibility policy, the expiry flag removes
  ACTIVE rows whose runway ended, dynamic criteria are validated against
  category attribute definitions, and all values are parameterized. The provider
  never receives arbitrary keys, operators, or SQL.
- `StorageModule` reads the `STORAGE_PROVIDER` config value and **fails fast at
  startup** on an unknown name, reserving `local` for development (production use
  logs a warning).

## Cross-cutting infrastructure

Wired once in `AppModule` as `APP_*` providers so they also apply inside e2e
tests that boot via `Test.createTestingModule`:

| Concern          | Component                                                                             | Effect                                                   |
| ---------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Error envelope   | `AllExceptionsFilter` (`APP_FILTER`)                                                  | Every error leaves as the standard `{ ok, error }` shape |
| Success envelope | `ResponseEnvelopeInterceptor` (`APP_INTERCEPTOR`)                                     | Every success leaves as `{ ok, data, meta }`             |
| Validation       | `createValidationPipe` (`APP_PIPE`)                                                   | `whitelist` + `transform`; unknown keys rejected         |
| Authn/Authz      | `JwtAuthGuard` + `RolesGuard`/`PermissionsGuard` (`APP_GUARD`, owned by `AuthModule`) | Route-level JWT, RBAC, fine-grained permissions          |
| Rate limiting    | `RateLimitService` (in-memory)                                                        | 11 surfaces; no Redis                                    |
| Logging          | `LoggingModule` (Pino)                                                                | Structured, request-scoped                               |

## Data layer

- **Prisma 7** with the `@prisma/adapter-pg` driver adapter; the generated
  client lives at `apps/api/src/generated/prisma/` (git-ignored, produced by
  `prisma generate`).
- `PrismaService` is the single global injection point for database access.
- Search runs through Prisma's `sql`/`join` tagged-template helpers inside
  `PostgresSearchProvider` — fully **parameterized** statements, never
  string-built. LIKE wildcards in user values are escaped (`escapeLike`).
- Feed ordering uses **keyset pagination** with stable secondary ordering by
  `id` and `NULLS LAST` for price sorts; price is projected as **text** in
  cursors so decimal boundaries are never lost.

## Configuration

`ConfigModule.forRoot` loads `.env` (or `../../.env` when run from
`apps/api`), validates it against `env.schema.ts` (Zod-style), and **fails fast
on any invalid/missing variable**. Config is namespaced and type-inferred via
`config.types.ts` (`AppConfig`), so `configService.get('…', { infer: true })`
returns typed values. The `STORAGE_PROVIDER` enum is resolved here.

## Architecture decision records

Decisions that constrain the whole codebase. Each is linked to where it is
enforced so it cannot silently regress.

- **ADR-001 — NestJS modular monolith.** One deployable, strictly
  module-isolated. No microservices until a bounded context is proven to need
  independent scaling. _Enforced by_ the module boundary rules above and by the
  single `AppModule` composition.
- **ADR-002 — Prisma 7 with the `@prisma/adapter-pg` driver adapter.** A
  type-safe data layer with parameterized SQL helpers for the one place raw
  queries are needed (search). _Enforced by_ `PrismaService` and the
  `src/generated/prisma/` boundary rule.
- **ADR-003 — Ports & adapters for search, SMS, storage.** Application logic
  depends on interface tokens, not concrete adapters, so infrastructure can be
  swapped (e.g. an OpenSearch or Afghan SMS aggregator) without touching auth or
  discovery flows. _Enforced by_ the symbol-token DI bindings in `SearchModule`,
  `SmsModule`, `StorageModule`.
- **ADR-004 — One standard envelope for success and errors.** Every response —
  success or failure — leaves through the same `{ ok, … }` shape so clients
  have a single, predictable contract. _Enforced by_ `APP_FILTER` +
  `APP_INTERCEPTOR` wired in `AppModule`.
- **ADR-005 — No Redis (or Kafka) initially.** PostgreSQL 17 is the single
  source of truth for the MVP: full-text/discovery search is `pg_trgm`-backed
  inside `PostgresSearchProvider`, and rate limiting is in-process
  (`RateLimitService`). This keeps the operational surface minimal (one
  dependency) and the data layer strongly consistent. A cache or broker may be
  introduced later behind the existing ports without changing application code.
  _Enforced by_ `docker-compose.yml` (PostgreSQL service only) and the absence
  of any Redis/Kafka client in `package.json`.

> This file is the authoritative home for **ADR-005**; `docker-compose.yml`
> references it for that decision.
