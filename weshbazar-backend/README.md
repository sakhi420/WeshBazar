# WeshBazar

> Afghanistan-focused C2C marketplace backend — a production-minded **modular
> monolith** built with NestJS 12, Fastify 5, PostgreSQL 17, Prisma 7 and
> TypeScript 6.

WeshBazar connects individual sellers with buyers across Afghanistan through a
phone-first, location-aware listing marketplace. The backend is intentionally a
**single deployable** (no microservices, no Redis/Kafka/Kubernetes) — the
specification's MUST-NOTs forbid those until traffic demands them. All
persistence is PostgreSQL; background reconciliation runs as in-process scheduled
jobs.

---

## Highlights

- **Modular monolith** — one Nest app, ~14 domain modules with strict one-way
  dependency direction (controllers → services → Prisma; no Prisma in
  controllers).
- **Phone-first auth** — Afghan E.164 phone + password, OTP verification,
  rotating access/refresh tokens (opaque refresh, httpOnly cookie transport),
  refresh-reuse detection with family revocation.
- **State-machine listings** — `DRAFT → PENDING_REVIEW → ACTIVE ↔ ARCHIVED`
  with admin moderation, expiry, and audit revisions.
- **Data-driven taxonomy** — category attributes validated against JSON-Schema
  definitions (product fields are never hard-coded on `Listing`).
- **Postgres trigram search** — `pg_trgm` GIN index on `Listing.searchText`,
  no external search engine.
- **Standard envelope everywhere** — `{ success, data|error, meta?, requestId }`
  on every response, including errors, with a stable error-code catalog.
- **Least-privileged DB role** — the app connects as `weshbazar` (no superuser);
  migrations use a shadow database for safe dev validation.
- **450 automated tests** — 193 unit + 7 integration + 250 e2e, all green.

---

## Tech stack (exact, registry-pinned — no `latest`)

| Concern    | Choice                                                                          |
| ---------- | ------------------------------------------------------------------------------- |
| Runtime    | Node.js 24 (Active LTS)                                                         |
| Framework  | NestJS 12.1.2 on `@nestjs/platform-fastify` 12.1.2 / Fastify 5.12.5             |
| Language   | TypeScript 6.0.3 (`nodenext`, `strict`)                                         |
| Database   | PostgreSQL 17                                                                   |
| ORM        | Prisma 7.10.0 (`prisma-client` generator + `@prisma/adapter-pg` + `pg`)         |
| Auth       | `@nestjs/jwt`, `argon2`, `libphonenumber-js`                                    |
| Validation | `class-validator` + `class-transformer` (strict whitelist pipe) + `zod` for env |
| Logging    | `nestjs-pino` / `pino` (structured, request-scoped)                             |
| Docs       | `@nestjs/swagger` (OpenAPI 3, served at `/docs`)                                |
| Media      | `sharp` (image processing/safety) + local storage (dev) / pluggable provider    |
| Tests      | Jest 30 + `ts-jest` 29 + `supertest` 7                                          |
| Quality    | ESLint 10, Prettier 3, Husky 9 + lint-staged, EditorConfig                      |
| CI         | GitHub Actions (lint → format → typecheck → unit → integration → e2e → build)   |

---

## Prerequisites

- **Node.js 24.x** (see `.nvmrc`) and **npm 11.x**
- **PostgreSQL 15+** (17 recommended) running on `localhost:5432` with a
  `postgres` superuser available
- (Optional) **Docker** — only used to run PostgreSQL via `docker-compose.yml`

---

## Quick start (local)

All commands run from the repository root (`weshbazar-backend/`).

### 1. Provision PostgreSQL (one-time, idempotent)

Creates the least-privileged `weshbazar` role, the `weshbazar_dev`,
`weshbazar_test` and `weshbazar_shadow` databases, and the `pg_trgm` extension.

```powershell
# Windows / PowerShell
powershell -ExecutionPolicy Bypass -File scripts/setup-local-db.ps1
```

```bash
# macOS / Linux / CI
PGPASSWORD=postgres PGSUPER=postgres bash scripts/setup-local-db.sh
```

> Requires `psql` on `PATH` (Windows: install PostgreSQL 17 so
> `C:\Program Files\PostgreSQL\17\bin` exists; the script auto-discovers it).

### 2. Configure environment

```bash
cp .env.example .env
```

`.env` defaults point at the locally-provisioned databases. **Change
`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` to strong random values (≥ 32 chars)
before anything leaves your machine.** See `.env.example` for every knob.

### 3. Install, generate client, migrate, (optional) seed

```bash
npm install
npm run prisma:generate         # emits apps/api/src/generated/prisma
npm run prisma:migrate:deploy   # applies migrations to weshbazar_dev
npm run db:seed                 # optional: taxonomy + locations + sample data
```

### 4. Run the API

```bash
npm run dev
```

Listens on `http://0.0.0.0:3000`; in development, interactive Swagger UI is at
`http://localhost:3000/docs`. Health probes live outside the `/api/v1` prefix:

- `GET /health/live` — liveness (process alive; never touches the DB)
- `GET /health/ready` — readiness (checks the DB; 503 when down)

---

## npm scripts

| Script                                      | What it does                                      |
| ------------------------------------------- | ------------------------------------------------- |
| `npm run dev`                               | Start the API in watch mode                       |
| `npm run build`                             | Production build (`nest build` → `apps/api/dist`) |
| `npm start`                                 | Run the compiled server (`node dist/main.js`)     |
| `npm run lint` / `lint:fix`                 | ESLint 10 (flat config) over the repo             |
| `npm run format` / `format:check`           | Prettier                                          |
| `npm run typecheck`                         | `tsc --noEmit` for the repo **and** the API       |
| `npm test`                                  | Unit tests (`src/**/*.spec.ts`)                   |
| `npm run test:integration`                  | DB foundation tests (needs PostgreSQL)            |
| `npm run test:e2e`                          | Full-stack e2e via supertest (needs PostgreSQL)   |
| `npm run test:security`                     | Security-focused e2e specs                        |
| `npm run prisma:generate`                   | Generate the Prisma client                        |
| `npm run prisma:migrate:dev`                | Create + apply a migration (dev)                  |
| `npm run prisma:migrate:deploy`             | Apply pending migrations (prod/CI)                |
| `npm run prisma:validate` / `prisma:format` | Validate/format the schema                        |
| `npm run db:seed`                           | Seed taxonomy, locations, optional sample data    |
| `npm run openapi:generate`                  | Rebuild the committed `docs/openapi.json`         |

---

## Testing

The suite is split into three Jest configurations with deterministic,
test-scoped environment defaults (`apps/api/test/setup/`):

| Layer       | Config                        | DB?                    | Scope                                                                                                                               |
| ----------- | ----------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `jest.config.mjs`             | No                     | Pure logic: state machines, validation, slug/phone utils, rate limiter, error codes, OpenAPI drift                                  |
| Integration | `jest.integration.config.mjs` | Yes (`weshbazar_test`) | Database foundation: connectivity, `pg_trgm`, trigram index, CHECK constraints, unique indexes                                      |
| E2E         | `jest.e2e.config.mjs`         | Yes (`weshbazar_test`) | Full HTTP round-trips per feature: auth, discovery, listings, media, engagement, jobs, taxonomy, locations, profile, app-foundation |

A global setup (`test/setup/global-setup.ts`) runs `prisma migrate deploy`
against the test database before integration/e2e suites, so tests always run
against the current schema. Jobs are disabled in tests (`JOBS_ENABLED=false`);
suites invoke job methods directly.

```bash
npm run lint && npm run typecheck && npm test \
  && npm run test:integration && npm run test:e2e && npm run build
```

---

## Project structure

```
weshbazar-backend/
├── apps/api/                 # @weshbazar/api — the Nest application
│   ├── src/
│   │   ├── common/           # envelope, errors, validation, authz, rate-limit, utils, http
│   │   ├── config/           # configuration() + zod env schema (validateEnv)
│   │   ├── database/         # PrismaModule/PrismaService (driver adapter)
│   │   ├── logging/          # nestjs-pino module
│   │   ├── modules/          # domain modules (one-way deps)
│   │   │   ├── auth/ users/ sellers/ taxonomy/ locations/
│   │   │   ├── listings/ media/ contacts/ favorites/ reports/
│   │   │   └── admin/ audit/ analytics/ health/ jobs/
│   │   ├── providers/        # ports & adapters: search (pg_trgm), sms (mock), storage (local)
│   │   ├── scripts/         # generate-openapi.ts
│   │   ├── app.module.ts     # root module (APP_FILTER/INTERCEPTOR/PIPE wiring)
│   │   ├── bootstrap.ts     # shared Fastify/transport config (helmet, cookie, multipart, CORS, Swagger, request IDs)
│   │   └── main.ts          # process entry: load .env → validate → boot
│   └── test/                # e2e + integration + setup
├── prisma/
│   ├── schema.prisma         # 14 core entities, enums, indexes
│   ├── migrations/          # 20261004 init + add_audit_delete_actions
│   └── seed/                # taxonomy + Afghanistan locations data
├── docker/                  # Dockerfile, postgres/init.sql
├── docs/                    # implementation-status.md, api-contract-audit.md, openapi.json
├── scripts/                 # setup-local-db.{sh,ps1}
├── .github/workflows/ci.yml # lint → format → typecheck → unit → integration → e2e → build
├── docker-compose.yml       # PostgreSQL 17 only (dev)
└── package.json             # npm workspaces root
```

### Domain modules

- **auth** — register, login, OTP verify, refresh (rotating, reuse-detected),
  logout, password change/reset.
- **users** — `/me` profile, phone change, account delete (soft).
- **sellers** — seller account onboarding (INDIVIDUAL).
- **taxonomy** — categories + data-driven attributes/options (admin CRUD,
  public read tree).
- **locations** — Afghanistan provinces/cities (admin CRUD, public read).
- **listings** — create/preview/publish, moderation state machine, expiry,
  search/discovery feed, my-listings.
- **media** — multipart upload, `sharp` image processing/safety, orphan cleanup.
- **contacts** — reveal/decide contact (phone/whatsapp/telegram click tracking).
- **favorites** — save/unsave listings.
- **reports** — report listings/users (open → resolved/dismissed).
- **admin** — users, listings (approve/reject/archive/restore), reports
  (resolve/dismiss), taxonomy, locations, analytics, audit — RBAC-gated
  (`@Roles` / `@RequirePermissions` + `PermissionsGuard`).
- **audit** — append-only `AuditLog` for every privileged/security action.
- **analytics** — admin marketplace summary/series, seller summary/series,
  listing view counting with anti-abuse dedupe.
- **jobs** — five bounded, idempotent, crash-safe scheduled jobs (expire
  listings, archive stale drafts, clean challenges/sessions/orphan media).

---

## Configuration

All runtime behavior is env-driven and validated at boot through a zod schema
(`apps/api/src/config/env.schema.ts`) — the process refuses to start on invalid
or missing required values. See `.env.example` for the full, documented list
(~80 variables): runtime, database/pool, JWT/cookie, password policy, OTP, rate
limits (11 surfaces), account lockout, storage/media limits, listing/marketplace
limits, background-job tuning, and provider selection (`SMS_PROVIDER=mock`,
`MODERATION_PROVIDER=noop`).

### SMS provider (production)

The OTP pipeline ships with a mock provider for local development. To enable
real delivery, buy an aggregator, fill the `SMS_GATEWAY_*` variables, and set
`SMS_PROVIDER=http` — **no code changes** required. In production the process
refuses to start with `SMS_PROVIDER=mock`.

| Variable | Meaning |
| --- | --- |
| `SMS_GATEWAY_URL` | absolute `http(s)` endpoint (required) |
| `SMS_GATEWAY_API_KEY` | API key/secret (required) |
| `SMS_GATEWAY_API_KEY_HEADER` | header carrying the key (default `X-Api-Key`) |
| `SMS_GATEWAY_API_KEY_PREFIX` | optional prefix, e.g. `Bearer ` |
| `SMS_GATEWAY_SENDER` | sender ID / short-code (optional) |
| `SMS_GATEWAY_TIMEOUT_MS` | per-attempt timeout (default `10000`) |
| `SMS_GATEWAY_MAX_RETRIES` | retries after a failed attempt (default `2`) |
| `SMS_MESSAGE_TEMPLATE` | Dari text; `{code}` is replaced with the OTP |

The provider POSTs JSON `{ to, message, sender }`. If the chosen vendor needs a
different shape, add one provider class behind `SmsProvider` (see
`apps/api/src/providers/sms/`); the auth flow is untouched.

---

## Deployment

### Docker (PostgreSQL only)

`docker-compose.yml` intentionally runs **only PostgreSQL 17** — the app is a
single process you run directly in production; it adds no Redis, queues, or
orchestrators (spec MUST-NOTs):

```bash
docker compose up -d            # starts postgres on :5432
```

### Production build & run

```bash
npm ci --no-audit --no-fund
npm run prisma:generate
npm run prisma:migrate:deploy   # apply migrations as the app role
npm run build
NODE_ENV=production npm start    # node apps/api/dist/main.js
```

Set `TRUST_PROXY=true` behind a reverse proxy, `COOKIE_SECURE=true` and
`SWAGGER_ENABLED=false` in production. Serve media from a CDN/object storage
(`STORAGE_PROVIDER`).

---

## CI

`.github/workflows/ci.yml` runs on every push/PR against a `postgres:17-alpine`
service: install → validate schema → provision role/DBs/`pg_trgm` → migrate →
generate client → lint → format-check → typecheck → unit → integration → e2e →
build. Concurrency cancels superseded runs.

---

## Commit hygiene

Husky `pre-commit` runs `lint-staged`: ESLint `--fix` + Prettier on staged TS,
`prisma format` on staged schema, and Prettier on JSON/MD/YAML. Run
`npm run format` before committing if your editor does not format on save.

---

## Status

See [`docs/implementation-status.md`](docs/implementation-status.md) for the
phase-by-phase build status and the verified quality-gate results. The
interactive API contract is at [`docs/openapi.json`](docs/openapi.json) and the
contract audit at [`docs/api-contract-audit.md`](docs/api-contract-audit.md).
