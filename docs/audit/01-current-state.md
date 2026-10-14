# Deliverable One — Current-State Report

**Date:** 2026-10-13 | **Scope:** WeshBazar Full-Stack | **Method:** Line-level source evidence

## 1. Architecture Overview

### 1.1 Repository Structure
- `weshbazar-backend/` — NestJS 12 + Fastify 5 + Prisma 7 (PostgreSQL), Node ≥24
- `weshbazar-frontend/` — Next.js 15.1.6 App Router + TanStack Query 5.64 + Tailwind 3.4, Node ≥24
- Shared Git root

### 1.2 Transport & API
- API v1.0.0 (FROZEN per `docs/openapi.json`)
- 70 paths, 83 operationIds, 103 schemas (`api-freeze-summary.md:16`)
- Prefix: `/api/v1` (except `/health/live`, `/health/ready`)
- Dual-token auth: Access JWT (15min, in-memory) + HttpOnly refresh cookie `weshbazar_refresh` (30d, path=/api/v1/auth)
- Response envelope: `{ success, data, meta?, requestId }`
- Cursor pagination (public) / page pagination (admin)
- Rate limiting via ThrottlerGuard

### 1.3 Guard Chain (Server-Side)
```
JwtAuthGuard → RolesGuard → PermissionsGuard
```
- `permissions.guard.ts:35`: re-checks `user.status !== 'ACTIVE'`
- `permissions.guard.ts:38`: deny-by-default, returns 403 FORBIDDEN
- `@Public()` bypasses entire chain

### 1.4 Frontend Protection
- `middleware.ts:21`: `/admin` in PROTECTED_PREFIXES
- Checks `weshbazar_session` cookie (NOT the HttpOnly refresh cookie)
- Redirects guests to `/auth/login?next=/admin/...`
- NOT a security boundary — backend is authoritative (§42)
- `next.config.mjs:22-24`: X-Robots-Tag: noindex,nofollow on `/admin/*`, `/account/*`

## 2. Authorization — Role-Permission Matrix

| Role | Permissions | Source |
|------|------------|--------|
| USER | None (0) | `permissions.ts:36` |
| MODERATOR | LISTING_REVIEW, LISTING_REJECT, REPORT_REVIEW, USER_READ, ANALYTICS_READ (5) | `permissions.ts:37` |
| ADMIN | All 12 | `permissions.ts:38` |

**12 Permissions:** LISTING_REVIEW, LISTING_REJECT, LISTING_ARCHIVE, REPORT_REVIEW, USER_READ, USER_SUSPEND, USER_BAN, USER_RESTORE, CATEGORY_MANAGE, LOCATION_MANAGE, AUDIT_READ, ANALYTICS_READ (`permissions.ts:12-25`)

**Enforcement:** 22 `@RequirePermissions()` + 3 class-level across 8 controllers. Server-side only — `permissions.guard.ts:38` returns 403. Status re-check at line 35 blocks suspended staff.

## 3. Database Entities (Prisma)

**25 models, 8 enums** in `prisma/schema.prisma` (769 lines):

| Model | Key Features |
|-------|-------------|
| User | UUID PK, phone E.164 normalized (unique), passwordHash (argon2), role: USER|MODERATOR|ADMIN, status: ACTIVE|SUSPENDED|BANNED|DEACTIVATED, failedLoginAttempts, lockedUntil, suspensionReason, suspendedUntil, soft-delete |
| SellerAccount | 1:1 User, type: INDIVIDUAL, status: ACTIVE|SUSPENDED|BANNED |
| Listing | UUID PK, slug (unique), status: DRAFT→PENDING_REVIEW→ACTIVE→SOLD→REJECTED→ARCHIVED, version (optimistic concurrency), attributes JSONB, searchText (pg_trgm GIN), price Decimal |
| ListingImage | up to 10/listing, imageKey, 5MiB JPEG/PNG/WebP |
| Report | reason: PROHIBITED_ITEM|MISLEADING|SPAM|DUPLICATE|BAD_PHOTO|OFFENSIVE|SCAM|OTHER, status: OPEN→UNDER_REVIEW→RESOLVED→DISMISSED |
| ModerationAction | APPROVE|REJECT|ARCHIVE|RESTORE per listing, reason + note |
| AuditLog | Append-only, 27 audit action types, actorUserId, entityType/Id, metadata JSON, ipAddress, userAgent |
| Category | Nested (parentId), translations fa/en/pashto |
| CategoryAttribute | Per-category dynamic fields, TEXT|NUMBER|SELECT|MULTI_SELECT|BOOLEAN |
| RefreshSession | Rotate on refresh, reuse detection |
| ListingDailyStat | Daily views/clicks/favorites/reports per listing |

## 4. Listing Lifecycle

```
DRAFT → PENDING_REVIEW → ACTIVE → SOLD
                 ↘ REJECTED
ACTIVE → ARCHIVED → (restore by admin) → ACTIVE
```
- Optimistic concurrency via `version` field
- Server-enforced transitions; 409 `LISTING_INVALID_TRANSITION` on invalid moves
- Seller creates as DRAFT → submits → PENDING_REVIEW; moderator/admin approves → ACTIVE
- Rejection requires machine-readable reason (7 options: PROHIBITED_ITEM, MISLEADING, SPAM, DUPLICATE, BAD_PHOTO, OFFENSIVE, OTHER)
- Archive removes from public view; restore re-activates with fresh expiry
## 5. Admin Route Inventory

| # | Route | Backend | Frontend | Status |
|---|-------|---------|----------|--------|
| 1 | `/admin` | dashboard + analytics/summary | AdminDashboardView | ✅ Full |
| 2 | `/admin/listings` | queue + 4 moderation commands | AdminListingsView (full moderation UI) | ✅ Full |
| 3 | `/admin/reports` | queue + resolve/dismiss | AdminReportsView (tabs + list ONLY) | ⚠️ View only |
| 4 | `/admin/users` | search + suspend/ban/restore | AdminUsersView (table + actions) | ⚠️ Implemented, not verified |
| 5 | `/admin/taxonomy` | CRUD categories + attributes/options | AdminTaxonomyView (categories only) | ⚠️ Partial |
| 6 | `/admin/locations` | 9 endpoints CRUD provinces/cities | **NO UI** | ❌ Missing |
| 7 | `/admin/audit` | 1 endpoint GET audit-logs | **NO UI** | ❌ Missing |

### 5.1 Dashboard (`/admin`)
- Data: `GET /admin/dashboard` (counters) + `GET /admin/analytics/summary` (30-day trends)
- Components: admin-dashboard-view.tsx (session gate), admin-dashboard-content.tsx (counters + summary)
- States: Loading (skeleton), Error (ErrorState+retry), Denied (AdminAccessDenied)
- Two independent queries — one failure doesn't blank the other
- Manual refresh button; 30s/60s staleTime

### 5.2 Listings Queue (`/admin/listings`)
- Queue: `GET /admin/listings?status=&reported=&q=&sort=&page=&limit=&sellerAccountId=&categoryId=`
- Detail: `GET /admin/listings/:id` — full listing + moderationActions[] trail
- Actions: APPROVE, REJECT (7 reasons + optional note), ARCHIVE (confirmation), RESTORE — driven by `permittedActions[]`
- URL state: view tabs, sort, search, page, seller filter — all nuqs
- Responsive: Cards (mobile), Table (desktop ≥768px, 880px min-width)
- Moderation trail inline expansion; seller quick-filter

### 5.3 Reports (`/admin/reports`)
- Backend: `GET /admin/reports` (status filter + page), `POST .../:id/resolve` ({note}), `POST .../:id/dismiss` ({note})
- **GAP-001**: `api.ts` has fetchAdminReports only; NO resolveReport/dismissReport wrappers
- **GAP-001**: admin-reports-view.tsx shows cards with reason/listing/reporter/status/timestamp/description — NO action buttons
- URL state: status tabs (ALL, OPEN, UNDER_REVIEW, RESOLVED, DISMISSED), page pagination

### 5.4 Users (`/admin/users`)
- List: `GET /admin/users?q=&role=&status=&page=&limit=`
- Actions: Suspend (reason + optional until), Ban (reason), Restore (one-click)
- UI: Search input + table; inline reason form on suspend/ban click
- No confirmation dialog before destructive actions
- Detail endpoint exists (`GET /admin/users/:id`) but not called from frontend
### 5.5 Taxonomy (`/admin/taxonomy`)
- Backend: 12 endpoints — CRUD categories + attributes + options under `/admin/`
- Frontend: Categories CRUD only (inline add/edit forms, toggle delete confirmation)
- **GAP-004**: 6 attribute/option endpoints with no frontend counterpart
- Delete uses toggle "مطمئنی؟" (no modal)

### 5.6 Locations (`/admin/locations`) — NOT IMPLEMENTED
- Backend: Province CRUD (4 endpoints) + City CRUD (5 endpoints) requiring LOCATION_MANAGE
- Frontend: No route directory, no page, no component, no API wrappers, no nav entry
- Master Prompt §48 specifies this page

### 5.7 Audit (`/admin/audit`) — NOT IMPLEMENTED
- Backend: `GET /admin/audit-logs?action=&entityType=&entityId=&actorUserId=&page=&limit=`
- Filterable by action type, entity, actor; requires AUDIT_READ (ADMIN only)
- Frontend: No route, no component, no API wrappers, no nav entry
- Master Prompt §49 specifies this page

## 6. Admin Navigation
`admin-nav.tsx:13-19` — 5 tabs: داشبورد, آگهی‌ها, گزارش‌ها, کاربران, دسته‌بندی‌ها
Missing: مکان‌ها (locations), گزارش رویدادها (audit)
Uses `<Link>`, `usePathname()`, `role="tablist"`/`role="tab"`

## 7. Key Workflows

### 7.1 Moderate a Listing (Full)
1. Enter `/admin/listings` → session gate → queue loads (default: pending)
2. View tabs + search + sort filter the queue; expand row for detail + moderation trail
3. APPROVE: one-click; REJECT: reason dropdown (required) + optional note; ARCHIVE: confirmation text → confirm; RESTORE: one-click
4. All actions invalidate admin query cache on settle; 409 handling with Persian message
5. Seller quick-filter available from detail panel

### 7.2 Report Review (Blocked)
1. Enter `/admin/reports` → view report cards with reason, listing, reporter, description
2. **BLOCKED**: Cannot resolve or dismiss — no UI controls exist
3. Admin must separately navigate to listings queue and moderate the listing there

### 7.3 User Management
1. Enter `/admin/users` → search → table of users
2. Suspend: click → inline reason input → submit; Ban: same pattern; Restore: one-click
3. No detail view despite backend endpoint

### 7.4 Category Management
1. Enter `/admin/taxonomy` → flat list; create/edit via inline forms; delete via toggle
2. No attribute management despite 6 backend endpoints

## 8. Known Gaps Summary

| ID | Severity | Description |
|----|----------|-------------|
| GAP-001 | 🔴 P1 | Reports: resolve/dismiss API exists, NOT wired to frontend |
| GAP-002 | 🔴 P1 | /admin/locations: 9 backend endpoints, 0 frontend files |
| GAP-003 | 🔴 P1 | /admin/audit: 1 backend endpoint, 0 frontend files |
| GAP-004 | 🟡 P1 | Category attributes: 6 backend endpoints, no UI |
| GAP-005 | 🟡 P2 | User detail view not called from frontend |
| GAP-006 | 🟡 P2 | No admin link in public navigation for staff |
| GAP-007 | 🟡 P2 | Vazirmatn via Google Fonts (spec §12 self-hosting) |
| GAP-008 | 🟡 P2 | Taxonomy delete toggle vs modal confirmation |
| GAP-009 | 🟡 P2 | No bulk moderation operations |
| UX-001 | ⚪ NOT VERIFIED | Responsive behavior |
| UX-002 | ⚪ NOT VERIFIED | Keyboard/accessibility |
| TEST-001 | ⚠️ BLOCKED | Jest: TS 5.7 ignoreDeprecations incompatibility |

## 5. Known Gaps

| ID | Severity | Description |
|----|----------|-------------|
| GAP-001 | P1 | Reports resolve/dismiss not wired to frontend |
| GAP-002 | P1 | `/admin/locations` — no UI |
| GAP-003 | P1 | `/admin/audit` — no UI |
| GAP-004 | P2 | Attribute management under taxonomy — no UI |
| GAP-005 | P2 | Users/taxonomy CRUD not browser-tested |
| GAP-006 | P2 | Responsive admin not tested at 390px |
| GAP-007 | P2 | Vazirmatn from Google Fonts (spec §12 self-host)

**Date:** 2026-10-13 | **Scope:** WeshBazar Full-Stack | **Method:** Line-level source evidence

## 1. Architecture Overview

### Repository Structure
- `weshbazar-backend/` — NestJS 11 + Fastify + Prisma 7 (PostgreSQL)
- `weshbazar-frontend/` — Next.js 15 App Router + TanStack Query v5 + Tailwind CSS v4

### Transport
- API v1.0.0 (FROZEN per `docs/openapi.json`)
- 70 paths, 83 operationIds, 103 schemas
- Dual-token auth: JWT access (15 min, in-memory) + HttpOnly refresh cookie (30 days)
- Envelope: `{ success, data, meta?, requestId }`
- Cursor pagination (public) / page pagination (admin)

### Guard Chain (server-side)
```
JwtAuthGuard → RolesGuard → PermissionsGuard
```
`permissions.guard.ts:4-7`: runs after JWT, re-checks `user.status !== 'ACTIVE'` at line 35, deny by default at line 38.
## 3. Admin Route Inventory

| # | Route | View | Backend Status | Frontend Status |
|---|-------|------|---------------|-----------------|
| 1 | `/admin` | AdminDashboardView | dashboard + analytics | ✅ Full |
| 2 | `/admin/listings` | AdminListingsView | queue + 4 actions | ✅ Full |
| 3 | `/admin/reports` | AdminReportsView | queue + resolve/dismiss | ⚠️ View only |
| 4 | `/admin/users` | AdminUsersView | search + 3 actions | ⚠️ Added, untested |
| 5 | `/admin/taxonomy` | AdminTaxonomyView | CRUD + attributes | ⚠️ Added, untested |
| 6 | `/admin/locations` | — | CRUD provinces/cities | ❌ No UI |
| 7 | `/admin/audit` | — | GET audit logs | ❌ No UI |

## 4. Listing Lifecycle
```
DRAFT → PENDING_REVIEW → ACTIVE → SOLD
                 ↘ REJECTED
ACTIVE → ARCHIVED → (restore) → ACTIVE
```
Version field for optimistic concurrency. Server-enforced transitions (409 on invalid).

## 5. Known Gaps (Audit Findings)
| ID | Sev | Description |
|----|-----|-------------|
| GAP-001 | P1 | Reports: resolve/dismiss API exists, not wired to UI. `ResolveReportDto` requires `{note}`. |
| GAP-002 | P1 | `/admin/locations`: no frontend UI (backend exists) |
| GAP-003 | P1 | `/admin/audit`: no frontend UI (backend exists) |
| GAP-004 | P1 | Category attributes: CRUD API exists, no UI under taxonomy |
| GAP-005 | P2 | Users suspend/ban/restore: code written, not browser-tested |
| GAP-006 | P2 | Taxonomy create/update/delete: code written, not browser-tested |
| GUID-V01 | P2 | Vazirmatn from Google Fonts — spec §12 requires self-hosting