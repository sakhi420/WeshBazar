# API Freeze Summary — WeshBazar API v1.0

> **Status:** FROZEN. This document records the final frozen API contract for frontend integration.
> **Frozen at:** API `1.0.0`. **OpenAPI:** `3.0.0`. **Spec ref:** `.devin/rules/api-contract.md`.
> Any change to paths, operationIds, schemas, security schemes, or error codes requires a new
> version tag and a contract delta document.

## 1. Identity

| Item | Value |
| --- | --- |
| API version | `1.0.0` |
| OpenAPI version | `3.0.0` |
| Base URL (dev) | `http://localhost:3000` |
| API prefix | `/api/v1` (except `/health/live`, `/health/ready`) |
| Surface | 70 paths, **83 operationIds** (0 duplicates), 103 schemas |
| Live docs (dev) | `GET /docs` (Swagger UI), `GET /docs-json` (raw OpenAPI) |
| Committed artifact | `docs/openapi.json` (regenerated from `buildSwaggerConfig`) |

## 2. Auth transport (dual-token)

- **Access token:** JWT, `Authorization: Bearer <token>`, **15 min** lifetime. Stored in JS memory
  only (never localStorage). Frontend attaches it per request.
- **Refresh session:** HttpOnly cookie `weshbazar_refresh`, **30 days**, browser-managed. The
  frontend never reads it; the browser auto-sends it to `/api/v1/auth/*` because `credentials: 'include'`.
- **Rotation:** every `POST /api/v1/auth/refresh` issues a new cookie and a new access token. Reuse
  of a rotated refresh token → `SESSION_REUSE_DETECTED` (session revoked).
- **Security schemes in OpenAPI:** `access-token` (type `http`, scheme `bearer`) and `refresh-cookie`
  (type `apiKey`, `in: cookie`, name `weshbazar_refresh`).

## 3. Cookie & CORS policy

- Cookie: `HttpOnly; SameSite=Lax; Secure=(prod true / dev false); Path=/api/v1/auth`. Optional
  `Domain` via `COOKIE_DOMAIN`. Production requires `COOKIE_SECURE=true` and >=32-char secrets
  (env schema rejects otherwise).
- CORS: `credentials=true` always; origins from `CORS_ALLOWED_ORIGINS` (dev
  `http://localhost:3000,http://localhost:3001`); exposed header `x-request-id`; `maxAge=600`.
  Wildcard origin rejected in production.
- Frontend obligation: `credentials: 'include'` on **all** requests (including public auth ones).

## 4. Envelope & request ID

- Success: `{ success: true, data, meta?, requestId }`. Paginated `meta` only on list endpoints.
- Error: `{ success: false, error: { code, message, details? }, requestId }`. Branch on `error.code`
  (see `docs/frontend-error-map.md`).
- `x-request-id` echoed on every response (incl. 4xx/5xx) and as envelope `requestId`; inbound
  header honored only when `TRUST_REQUEST_ID_HEADER=true` and it matches `/^[A-Za-z0-9._-]{1,64}$/`.

## 5. Pagination

- Public discovery → **cursor** (`{ nextCursor, hasMore, limit }`); opaque base64url; `limit` 1-60 (default 24).
- Admin queues → **page** (`{ page, limit, total, totalPages }`); `page` 1-based.

## 6. Rate limits & cache

- Global `ThrottlerGuard` per-IP window (`THROTTLE_TTL`/`THROTTLE_LIMIT`). Auth/OTP endpoints carry
  tighter limits; OTP resend cooldown 60s, max 5 verify attempts per OTP.
- Over-limit → `429 RATE_LIMITED`; honor `Retry-After`.
- Public read responses carry `Cache-Control`; image assets are `immutable, max-age=86400`.

## 7. Search & dynamic filters

- Discovery `q`: multi-word AND, Persian/Arabic normalized.
- `sort`: `newest` | `price_asc` | `price_desc` | `most_viewed`.
- `filter`: `key:operator:value` (repeatable); operators `eq`/`contains`/`gte`/`lte`/`in` (max 20
  in-values), capped at 32 filters. Allowed operators per field come from
  `GET /api/v1/categories/{id}/filter-schema`. Unknown attribute → `VALIDATION_ERROR` (fail-closed).

## 8. Media

- `multipart/form-data` field `file`; JPEG/PNG/WebP (magic-byte verified); 5 MiB; 25 MP; max 10/listing.
- Dev serving `GET /media/<key>` (immutable 1d); production swaps in object storage / CDN.
- `Idempotency-Key` supported on uploads for safe retries.

## 9. Known limitations (v1.0)

- No ETag/conditional-GET contract at v1; rely on cursor freshness.
- Dev media is local-disk only; production object storage is configured via env.
- `Accept-Language` is honored but full i18n of error messages is future work; `error.code` is
  the stable contract surface (messages may change/localize).
- WebSocket/SSE not part of v1; real-time updates are out of scope for the freeze.

## 10. Frontend integration instructions

1. Read `docs/frontend-api-contract.md` for the full endpoint inventory + flow walkthroughs.
2. Read `docs/frontend-error-map.md` for per-code UI actions and retry policy.
3. Generate a typed client from `docs/openapi.json` (OpenAPI 3.0 codegen). Bind to `operationId`.
4. Implement the dual-token auth flow: in-memory access token + silent refresh on `TOKEN_EXPIRED`.
5. Use `credentials: 'include'`; send `x-request-id` per request; surface `requestId` on fatal screens.
6. Branch all error handling on `error.code`; bind `VALIDATION_ERROR.details` to form fields.

## 11. Freeze checklist result

| Check | Result |
| --- | --- |
| Top-level `servers` populated | PASS (1 server: `http://localhost:3000`) |
| Top-level `tags` populated | PASS (9 tags: auth, me, sellers, categories, locations, listings, favorites, admin, health) |
| `info.version` = `1.0` | PASS |
| OperationIds unique (0 duplicates) | PASS (83 unique) |
| Every path has `operationId` | PASS |
| Security schemes match code | PASS (`access-token` + `refresh-cookie`) |
| Broken `$ref`s | PASS (103 unique refs, 0 broken) |
| Single source of truth (no drift) | PASS (`buildSwaggerConfig` used by both bootstrap + generator) |
| `@ApiCookieAuth` on refresh-dependent routes | PASS |

> The API contract is frozen at v1.0.0 and is frontend-ready. Handoff deliverables:
> `docs/openapi.json`, `docs/frontend-api-contract.md`, `docs/frontend-error-map.md`, this summary.
