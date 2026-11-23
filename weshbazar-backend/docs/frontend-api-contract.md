# Frontend API Contract — WeshBazar API v1

> **Audience:** frontend engineers integrating against the frozen WeshBazar backend.
> **Single source of truth for schemas:** `docs/openapi.json` (OpenAPI 3.0.0). This doc is the
> human-readable handoff; when in doubt, the OpenAPI document wins for request/response shapes.
> **API version:** 1.0.0 (frozen). **OpenAPI version:** 3.0.0.

## 1. Transport & base URL

| Item | Value |
| --- | --- |
| Base URL (dev) | `http://localhost:3000` |
| API prefix | `/api/v1` (applied to all routes **except** `GET /health/live` and `GET /health/ready`) |
| Protocol | HTTP/1.1 over Fastify |
| JSON body limit | 1 MiB (`application/json`) |
| Multipart limit | file 5 MiB, ≤10 files, 20 fields, 40 parts |
| Swagger UI (dev) | `GET /docs` (enabled when `SWAGGER_ENABLED=true`) |
| OpenAPI JSON | `GET /docs-json` (live) or committed `docs/openapi.json` |

> Production runs behind a reverse proxy; set `TRUST_PROXY=true` and front with TLS + a domain.
> The frontend talks only to the `/api/v1` prefix (and `/media/` for stored images in dev).

## 2. Authentication model

Dual-token auth: a **short-lived access token** (in-memory / JS memory) + a **long-lived refresh
cookie** (HttpOnly, browser-managed).

| Concern | Access token | Refresh session |
| --- | --- | --- |
| Transport | `Authorization: Bearer <jwt>` header | HttpOnly cookie `weshbazar_refresh` |
| Lifetime | **15 min** (`ACCESS_TOKEN_EXPIRES_IN`) | **30 days** (`REFRESH_TOKEN_EXPIRES_IN`) |
| Storage (frontend) | JS memory only — **never** localStorage | Browser cookie store (not readable by JS) |
| Sent automatically? | No — attach header per request | Yes, browser sends to `/api/v1/auth/*` |
| Rotation | n/a | **Yes** — each refresh issues a new cookie; reuse of an old token → `SESSION_REUSE_DETECTED` (revokes the session) |

The browser API client serializes refresh rotations across same-origin tabs with the Web Locks API when available. This prevents two tabs from presenting the same shared refresh cookie concurrently. Browsers without Web Locks retain the single-tab refresh behavior; backend reuse detection is never relaxed.

### 2.1 Auth endpoints (`@ApiTags('auth')`)

| Method | Path | operationId | Auth | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | `auth_register` | Public | Create account (phone + password). |
| POST | `/api/v1/auth/login` | `auth_login` | Public | Sign in → access token + sets refresh cookie. |
| POST | `/api/v1/auth/refresh` | `auth_refresh` | Cookie | Rotate refresh cookie + new access token. |
| POST | `/api/v1/auth/logout` | `auth_logout` | Cookie | Revoke current session, clear cookie. |
| POST | `/api/v1/auth/logout-all` | `auth_logoutAll` | Cookie | Revoke all sessions for the account. |
| GET | `/api/v1/auth/me` | `auth_me` | Bearer | Current user snapshot (for bootstrapping the app). |
| GET | `/api/v1/auth/sessions` | `auth_listSessions` | Bearer | List active sessions. |
| DELETE | `/api/v1/auth/sessions/{sessionId}` | `auth_revokeSession` | Bearer | Revoke a specific session. |
| POST | `/api/v1/auth/verify-phone` | `auth_verifyPhone` | Bearer | Verify OTP after register. |
| POST | `/api/v1/auth/verify-phone/resend` | `auth_resendPhoneVerification` | Bearer | Resend OTP (60s cooldown). |
| POST | `/api/v1/auth/change-phone` | `auth_changePhone` | Bearer | Start phone change. |
| POST | `/api/v1/auth/change-phone/verify` | `auth_verifyPhoneChange` | Bearer | Verify phone change OTP. |
| POST | `/api/v1/auth/change-password` | `auth_changePassword` | Bearer | Change password (needs current). |
| POST | `/api/v1/auth/forgot-password` | `auth_forgotPassword` | Public | Request reset (rate-limited). |
| POST | `/api/v1/auth/reset-password` | `auth_resetPassword` | Public | Submit new password with reset token. |

### 2.2 Frontend auth flow

## 3. Cookies & CORS

| Concern | Value |
| --- | --- |
| Refresh cookie name | `weshbazar_refresh` (configurable via `REFRESH_COOKIE_NAME`) |
| Cookie attributes | `HttpOnly; SameSite=Lax; Secure=(prod: true; dev: false); Path=/api/v1/auth; Domain=(env COOKIE_DOMAIN or unset)` |
| Production hardening | `COOKIE_SECURE` must be `true`; secrets >=32 chars (env validation rejects otherwise) |
| CORS `credentials` | `true` (always) - refresh cookies require it |
| Allowed origins | `CORS_ALLOWED_ORIGINS` (dev: `http://localhost:3000,http://localhost:3001`) |
| Exposed headers | `x-request-id` |
| CORS `maxAge` | 600s |
| Wildcard origin | Rejected in production |

> Frontend must use `credentials: 'include'` (fetch) / `withCredentials: true` (axios) on **all**
> requests, including the public auth ones, so the refresh cookie round-trips.

## 4. Response & error envelopes

### 4.1 Success

```json
{ "success": true, "data": { }, "meta": { }, "requestId": "8f3c..." }
```

- `data` is the resource, or an array for list endpoints.
- `meta` is present only on paginated endpoints.
- `requestId` echoes the `x-request-id` response header (set on every response, including 4xx/5xx).

### 4.2 Error

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field": "password", "message": "..." }] },
  "requestId": "8f3c..."
}
```

- `error.code` is **stable** - branch on it. Full catalog + frontend actions: see `docs/frontend-error-map.md`.
- `error.details` only on `VALIDATION_ERROR` and some 422 business rules; array of `{ field, message }`.
- HTTP status always matches the code's catalog status (200/201/204 on success).

## 5. Request ID

- The server echoes `x-request-id` on every response and includes it in the envelope as `requestId`.
- You may send an inbound `x-request-id` (only honored when `TRUST_REQUEST_ID_HEADER=true` and it
  matches `/^[A-Za-z0-9._-]{1,64}$/`); otherwise the server mints a UUID.
- Surface `requestId` on fatal error screens for support traceability.

## 6. Pagination

Two shapes - **do not mix them**.

## 7. Search & filter grammar (discovery)

`GET /api/v1/listings` (`listings_discovery_list`) accepts these query params:

| Param | Type | Notes |
| --- | --- | --- |
| `q` | string <=120 | Free-text. Multi-word = **AND** over bounded terms. Persian/Arabic normalized (da/dhal, yeh variants, kaf variants, alef variants, zero-width stripped). |
| `category` | slug | Category slug (leaf). Unknown slug -> empty feed (not an error). |
| `province` | slug | Province slug. |
| `city` | slug | City slug. |
| `minPrice` | number <=2dp, >=0 | Absolute cap 999,999,999,999.99. |
| `maxPrice` | number <=2dp, >=0 | Same cap. |
| `condition` | enum, CSV or repeated | `NEW,GOOD` or repeated. Max 4. Values = `ListingCondition` enum. |
| `sort` | enum | `newest` \| `price_asc` \| `price_desc` \| `most_viewed`. Default `newest`. |
| `filter` | string, repeatable | Dynamic attribute filter expressions (see below). Max 32, each <=200 chars. |
| `cursor` | string <=512 | Opaque cursor from a previous page. |
| `limit` | int 1-60 | Default 24. |
| `Accept-Language` | header | Locale preference (shared `LocaleQueryDto`). |

### 7.1 Filter expression grammar

Format: `?filter=key:operator:value` (repeatable, or `?filter=a&filter=b`).

| Operator | Meaning | Allowed attribute types |
| --- | --- | --- |
| `eq` | equals | TEXT, NUMBER, SELECT, BOOLEAN |
| `contains` | substring match | TEXT, LONG_TEXT |
| `gte` | >= | NUMBER, DATE |
| `lte` | <= | NUMBER, DATE |
| `in` | one-of (comma-separated value, max 20 values) | SELECT, MULTI_SELECT |

- The allowed operators per attribute come from the category's filter schema:
  `GET /api/v1/categories/{id}/filter-schema` (`categories_filterSchema`) returns each field's
  `operators[]` - build the filter UI from that.
- **Unknown attribute key -> `VALIDATION_ERROR`** (fail-closed; never silently dropped).
- Per-type operator whitelist is enforced server-side.

### 7.2 Example

```
GET /api/v1/listings?category=electronics&province=kabul&minPrice=1000&maxPrice=50000&condition=NEW,GOOD&sort=price_asc&filter=brand:eq:samsung&filter=ram:gte:8&limit=24
```

## 8. Media

| Concern | Value |
| --- | --- |

## 9. Rate limits & cache

| Concern | Value |
| --- | --- |
| Global throttle | `ThrottlerGuard` with per-IP window (see `THROTTLE_TTL` / `THROTTLE_LIMIT`). |
| Auth-sensitive | Login, register, forgot-password, OTP verify/resend carry tighter per-window limits. |
| OTP resend cooldown | 60s between resends; max 5 verify attempts per OTP. |
| Over-limit response | `429` + `RATE_LIMITED`; honor `Retry-After` header when present. |
| HTTP cache | Public GET discovery/category/location responses carry `Cache-Control`; client may cache briefly. Image assets are `immutable, max-age=86400`. |
| ETags | Not promised at v1; rely on cursor freshness rather than conditional GETs. |

## 10. Endpoint inventory (83 operations)

> `Auth`: `P` public, `B` bearer access token, `C` cookie (refresh). `Role`: `user` (any authed),
> `seller` (has seller account), `admin` (moderator/admin). `Pag`: `cur` cursor, `pg` page, `-` none.

### 10.1 auth (15)

| Method | Path | operationId | Auth | Role |
| --- | --- | --- | --- | --- |
| POST | /api/v1/auth/register | auth_register | P | - |
| POST | /api/v1/auth/login | auth_login | P | - |
| POST | /api/v1/auth/refresh | auth_refresh | C | - |
| POST | /api/v1/auth/logout | auth_logout | C | - |
| POST | /api/v1/auth/logout-all | auth_logoutAll | C | user |
| GET | /api/v1/auth/me | auth_me | B | user |
| GET | /api/v1/auth/sessions | auth_listSessions | B | user |
| DELETE | /api/v1/auth/sessions/{sessionId} | auth_revokeSession | B | user |
| POST | /api/v1/auth/verify-phone | auth_verifyPhone | B | user |
| POST | /api/v1/auth/verify-phone/resend | auth_resendPhoneVerification | B | user |
| POST | /api/v1/auth/change-phone | auth_changePhone | B | user |
| POST | /api/v1/auth/change-phone/verify | auth_verifyPhoneChange | B | user |
| POST | /api/v1/auth/change-password | auth_changePassword | B | user |
| POST | /api/v1/auth/forgot-password | auth_forgotPassword | P | - |
| POST | /api/v1/auth/reset-password | auth_resetPassword | P | - |

### 10.2 me (6)

| Method | Path | operationId | Auth | Role |
| --- | --- | --- | --- | --- |
| GET | /api/v1/me | me_users_getMe | B | user |
| PATCH | /api/v1/me | me_users_updateMe | B | user |
| POST | /api/v1/me/avatar | me_users_uploadAvatar | B | user |
| GET | /api/v1/me/analytics/summary | me_analytics_summary | B | seller |
| GET | /api/v1/me/listings | me_listings_list | B | seller |
| GET | /api/v1/me/listings/{id} | me_listings_get | B | seller |

### 10.3 sellers (1)

| Method | Path | operationId | Auth | Role |
| --- | --- | --- | --- | --- |
| GET | /api/v1/sellers/{slug} | sellers_getPublicProfile | P | - |

### 10.4 categories (4)

### 10.6 listings (14)

| Method | Path | operationId | Auth | Role | Pag |
| --- | --- | --- | --- | --- | --- |
| GET | /api/v1/listings | listings_discovery_list | P | - | cur |
| GET | /api/v1/listings/{slug} | listings_discovery_detail | P | - | - |
| POST | /api/v1/listings | listings_create | B | seller | - |
| PATCH | /api/v1/listings/{id} | listings_update | B | seller | - |
| POST | /api/v1/listings/{id}/submit | listings_submit | B | seller | - |
| POST | /api/v1/listings/{id}/renew | listings_renew | B | seller | - |
| POST | /api/v1/listings/{id}/mark-sold | listings_markSold | B | seller | - |
| POST | /api/v1/listings/{id}/archive | listings_archive | B | seller | - |
| POST | /api/v1/listings/{id}/contact | listings_contact_reveal | B | user | - |
| POST | /api/v1/listings/{id}/reports | listings_reports_submit | B | user | - |
| POST | /api/v1/listings/{id}/images | listings_media_upload | B | seller | - |
| PATCH | /api/v1/listings/{id}/images/{imageId}/order | listings_media_reorder | B | seller | - |
| DELETE | /api/v1/listings/{id}/images/{imageId} | listings_media_remove | B | seller | - |
| GET | /api/v1/listings/{id}/revisions | listings_listRevisions | B | seller | - |

### 10.7 favorites (3)

| Method | Path | operationId | Auth | Role | Pag |
| --- | --- | --- | --- | --- | --- |
| GET | /api/v1/me/favorites | favorites_list | B | user | cur |
| POST | /api/v1/favorites/{listingId} | favorites_add | B | user | - |
| DELETE | /api/v1/favorites/{listingId} | favorites_remove | B | user | - |

### 10.8 health (2)

| Method | Path | operationId | Auth | Role |
| --- | --- | --- | --- | --- |
| GET | /health/live | health_live | P | - |
| GET | /health/ready | health_ready | P | - |

> Note: health routes are **outside** the `/api/v1` prefix.

### 10.9 admin (37)

All admin routes require `Bearer` + `admin` role.

| Method | Path | operationId | Pag |
| --- | --- | --- | --- |
| GET | /api/v1/admin/dashboard | admin_analytics_dashboard | - |
| GET | /api/v1/admin/analytics/summary | admin_analytics_summary | - |
| GET | /api/v1/admin/users | admin_users_list | pg |
| GET | /api/v1/admin/users/{id} | admin_users_detail | - |
| POST | /api/v1/admin/users/{id}/ban | admin_users_ban | - |
| POST | /api/v1/admin/users/{id}/suspend | admin_users_suspend | - |
| POST | /api/v1/admin/users/{id}/restore | admin_users_restore | - |
| GET | /api/v1/admin/categories | admin_taxonomy_listCategories | - |
| POST | /api/v1/admin/categories | admin_taxonomy_createCategory | - |
| GET | /api/v1/admin/categories/{id} | admin_taxonomy_getCategory | - |
| PATCH | /api/v1/admin/categories/{id} | admin_taxonomy_updateCategory | - |
| DELETE | /api/v1/admin/categories/{id} | admin_taxonomy_deleteCategory | - |
| GET | /api/v1/admin/categories/{id}/attributes | admin_taxonomy_listAttributes | - |
| POST | /api/v1/admin/categories/{id}/attributes | admin_taxonomy_createAttribute | - |
| PATCH | /api/v1/admin/attributes/{id} | admin_taxonomy_updateAttribute | - |
| DELETE | /api/v1/admin/attributes/{id} | admin_taxonomy_deleteAttribute | - |
| POST | /api/v1/admin/attributes/{id}/options | admin_taxonomy_createOption | - |
| PATCH | /api/v1/admin/options/{id} | admin_taxonomy_updateOption | - |
| DELETE | /api/v1/admin/options/{id} | admin_taxonomy_deleteOption | - |
| GET | /api/v1/admin/provinces | admin_locations_listProvinces | - |
| POST | /api/v1/admin/provinces | admin_locations_createProvince | - |
| PATCH | /api/v1/admin/provinces/{id} | admin_locations_updateProvince | - |
| DELETE | /api/v1/admin/provinces/{id} | admin_locations_deleteProvince | - |
| GET | /api/v1/admin/provinces/{provinceId}/cities | admin_locations_listCities | - |
| POST | /api/v1/admin/provinces/{provinceId}/cities | admin_locations_createCity | - |
| PATCH | /api/v1/admin/cities/{id} | admin_locations_updateCity | - |
| DELETE | /api/v1/admin/cities/{id} | admin_locations_deleteCity | - |

## 11. OpenAPI regeneration & tooling

The committed `docs/openapi.json` and the live `/docs` UI share one source of truth:
`apps/api/src/common/http/openapi-document.ts` (`buildSwaggerConfig()` + `OPENAPI_TAGS`). Regenerate:

```bash
# from apps/api
pnpm nest build                       # rebuild dist (helper is imported by the generator)
node dist/scripts/generate-openapi.js # writes docs/openapi.json
```

- The generator boots the Nest app (Postgres must be reachable on `localhost:5432`) so all module
  routes are discovered; it then serializes via `SwaggerModule.createDocument` + `buildSwaggerConfig`.
- Live Swagger UI: `GET /docs` (dev only, `SWAGGER_ENABLED=true`). Raw JSON: `GET /docs-json`.
- If you add/remove a controller tag, update `OPENAPI_TAGS` in `openapi-document.ts` so the committed
  artifact and live UI stay in sync.

## 12. Frontend integration checklist

- [ ] Base URL configurable; default `http://localhost:3000`; prefix `/api/v1`.
- [ ] HTTP client sends `credentials: 'include'` and `x-request-id` on every request.
- [ ] Access token stored in memory only; attach `Authorization: Bearer <token>`.
- [ ] Silent refresh on `401 TOKEN_EXPIRED`; clear session on other 401 auth codes.
- [ ] Error handling branches on `error.code`; `VALIDATION_ERROR.details` bound to form fields.
- [ ] Cursor pagination for discovery; page pagination for admin queues.
- [ ] Media uploads use `multipart/form-data` field `file`; send `Idempotency-Key`.
- [ ] Build the dynamic filter UI from `GET /api/v1/categories/{id}/filter-schema`.
- [ ] Honor `Retry-After` on `429`; never auto-retry non-idempotent writes without `Idempotency-Key`.

| GET | /api/v1/admin/listings | admin_listings_queue | pg |
| GET | /api/v1/admin/listings/{id} | admin_listings_detail | - |
| POST | /api/v1/admin/listings/{id}/approve | admin_listings_approve | - |
| POST | /api/v1/admin/listings/{id}/reject | admin_listings_reject | - |
| POST | /api/v1/admin/listings/{id}/archive | admin_listings_archive | - |
| POST | /api/v1/admin/listings/{id}/restore | admin_listings_restore | - |
| GET | /api/v1/admin/reports | admin_reports_queue | pg |
| POST | /api/v1/admin/reports/{id}/resolve | admin_reports_resolve | - |
| POST | /api/v1/admin/reports/{id}/dismiss | admin_reports_dismiss | - |
| GET | /api/v1/admin/audit-logs | admin_audit_list | pg |


| Method | Path | operationId | Auth | Role |
| --- | --- | --- | --- | --- |
| GET | /api/v1/categories | categories_list | P | - |
| GET | /api/v1/categories/tree | categories_tree | P | - |
| GET | /api/v1/categories/{slug} | categories_bySlug | P | - |
| GET | /api/v1/categories/{id}/filter-schema | categories_filterSchema | P | - |

### 10.5 locations (2)

| Method | Path | operationId | Auth | Role |
| --- | --- | --- | --- | --- |
| GET | /api/v1/locations/provinces | locations_listProvinces | P | - |
| GET | /api/v1/locations/provinces/{provinceId}/cities | locations_listCities | P | - |

| Upload endpoint | `POST /api/v1/listings/{id}/images` (`listings_media_upload`) - `multipart/form-data`, field `file`. |
| Accepted types | JPEG, PNG, WebP (verified by magic bytes, not extension). |
| Max file size | 5 MiB (`MAX_UPLOAD_SIZE`). |
| Max dimensions | 25 MP (`MAX_IMAGE_PIXELS`). |
| Max images/listing | 10 (`MAX_IMAGES_PER_LISTING`). |
| Reorder | `PATCH /api/v1/listings/{id}/images/{imageId}/order` (`listings_media_reorder`). |
| Remove | `DELETE /api/v1/listings/{id}/images/{imageId}` (`listings_media_remove`). |
| Dev serving | `GET /media/<key>` (immutable, 1-day cache) - production swaps in object storage / CDN. |
| Public base URL | `PUBLIC_STORAGE_BASE_URL` (dev `http://localhost:3000`). Image URLs in responses are absolute. |
| Profile photo | `POST /api/v1/me/avatar` (`me_users_uploadAvatar`) — reuses the same media pipeline (JPEG/PNG/WebP, 5 MiB, 25 MP); stores one WebP avatar and returns the refreshed `MyProfile` (with absolute `avatarUrl`). `PATCH /me` `{ avatarKey: '' }` clears it. |

> Upload requires a listing in `DRAFT` state; orphan media is cleaned by a background job after
> `ORPHAN_MEDIA_RETENTION_DAYS` (7 days). Send `Idempotency-Key` on uploads to make retries safe.


### 6.1 Cursor pagination (public discovery)

```json
{ "data": [ ], "meta": { "nextCursor": "eyJ...", "hasMore": true, "limit": 24, "total": 137 }, "requestId": "..." }
```

- `nextCursor` is **opaque** base64url - treat as a black box; pass it back unchanged as `?cursor=`.
- If `nextCursor` is `null` (and `hasMore=false`), there are no more pages.
- `limit` 1-60, default 24.
- `total` is the exact number of listings matching the query (ignores `cursor`/`limit`). Presence: discovery feeds provide it; non-discovery cursor feeds omit it.
- Stable under inserts/edits (keyset, not offset).

### 6.2 Page pagination (admin queues)

```json
{ "data": [ ], "meta": { "page": 1, "limit": 20, "total": 137, "totalPages": 7 }, "requestId": "..." }
```

- Used by admin listings/reports/users/audit and analytics endpoints.
- `page` 1-based, clamped to >=1.


1. **Login/Register** → store the returned access token in memory; the refresh cookie is set by the
   server (you never touch it).
2. **On every authenticated request** attach `Authorization: Bearer <accessToken>`.
3. **On `401 TOKEN_EXPIRED`** → call `POST /api/v1/auth/refresh` once (cookie sent automatically),
   store the new access token, replay the original request.
4. **On refresh failure** (`REFRESH_TOKEN_*`, `SESSION_REVOKED`, `SESSION_REUSE_DETECTED`) → clear
   session, route to `/login`.
5. **Logout** → call `POST /api/v1/auth/logout` so the server revokes the session; do not just drop
   the token locally.

> The `JwtAuthGuard` is the default guard. Public routes (`auth_register/login/refresh/logout`,
> `forgot/reset-password`, discovery, categories, locations, sellers, health) are `@Public()`.
