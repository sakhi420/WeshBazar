# WeshBazar Audit — Review Inventory
**Generated:** 2026-10-13 | **Method:** Line-level source review

## Backend — Apps/API/Src — Common Layer
| File | Responsibility | Status |
|------|---------------|--------|
| `common/authz/permissions.ts` | 12 permissions, 3-role matrix | ✅ Reviewed |
| `common/authz/permissions.spec.ts` | Unit tests for permissions | ✅ Reviewed |
| `common/guards/permissions.guard.ts` | Server-side enforcement, deny-by-default | ✅ Reviewed |
| `common/guards/jwt-auth.guard.ts` | JWT validation, principal attachment | ✅ Reviewed |
| `common/guards/roles.guard.ts` | Role check before permissions | ✅ Reviewed |
| `common/decorators/permissions.decorator.ts` | @RequirePermissions() metadata | ✅ Reviewed |
| `common/decorators/roles.decorator.ts` | @Roles() metadata | ✅ Reviewed |
| `common/decorators/public.decorator.ts` | @Public() bypass marker | ✅ Reviewed |
| `common/decorators/current-user.decorator.ts` | @CurrentUser() extractor | ✅ Reviewed |
| `common/errors/app.exception.ts` | AppException base class | ✅ Reviewed |
| `common/errors/error-codes.ts` | Error code catalog | ✅ Reviewed |
| `common/errors/exception.filter.ts` | Global exception → envelope | ✅ Reviewed |
| `common/http/pagination.ts` | Cursor + page pagination types | ✅ Reviewed |
| `common/http/response.interceptor.ts` | Success envelope wrapping | ✅ Reviewed |
| `common/presenters/` (12 files) | Admin/analytics/audit/category/listing/location/report/user view models | ✅ Reviewed |
| `common/rate-limit/` | Rate limiting via ThrottlerGuard | ✅ Reviewed |
| `common/validation/validation.pipe.ts` | Zod-based validation pipe | ✅ Reviewed |

## Backend — Admin Controllers
| File | Endpoints | Permission | Status |
|------|-----------|------------|--------|
| `admin-listings.controller.ts` | 6: queue, detail, approve, reject, archive, restore | LISTING_REVIEW, LISTING_REJECT, LISTING_ARCHIVE | ✅ Reviewed |
| `admin-reports.controller.ts` | 3: queue, resolve, dismiss | Class: REPORT_REVIEW | ✅ Reviewed |
| `admin-users.controller.ts` | 5: list, detail, suspend, ban, restore | USER_READ, USER_SUSPEND, USER_BAN, USER_RESTORE | ✅ Reviewed |
| `admin-analytics.controller.ts` | 2: dashboard, summary | Class: ANALYTICS_READ | ✅ Reviewed |
| `admin-audit.controller.ts` | 1: list audit-logs | Class: AUDIT_READ | ✅ Reviewed |
| `admin-locations.controller.ts` | 9: CRUD provinces + cities | Class: LOCATION_MANAGE | ✅ Reviewed |
| `admin-taxonomy.controller.ts` | 12: CRUD categories + attributes + options | Class: CATEGORY_MANAGE | ✅ Reviewed |

## Backend — Admin Services (Partial review via controllers)
| File | Status |
|------|--------|
| `admin-listings.service.ts` | 🟡 Partial |
| `admin-reports.service.ts` | 🟡 Partial |
| `admin-users.service.ts` | 🟡 Partial |
| `admin-analytics.service.ts` | 🟡 Partial |
| `audit.service.ts` | 🟡 Partial |
## Frontend — Admin Feature (src/features/admin/)
| File | Responsibility | Status |
|------|---------------|--------|
| `api.ts` | 15 API wrapper functions | ✅ Reviewed |
| `types.ts` | 16 interfaces matching backend DTOs | ✅ Reviewed |
| `hooks.ts` | 11 TanStack Query hooks | ✅ Reviewed |
| `errors.ts` | Error classification helpers | ✅ Reviewed |
| `errors.test.ts` | Error tests (blocked at runtime) | ✅ Reviewed |
| `model.ts` | Pure view-model helpers | ✅ Reviewed |
| `model.test.ts` | 13 unit tests (blocked at runtime) | ✅ Reviewed |
| `params.ts` | nuqs URL-state parsers | ✅ Reviewed |
| `index.ts` | Barrel exports | ✅ Reviewed |
| `components/admin-dashboard-view.tsx` | Dashboard shell + session gate | ✅ Reviewed |
| `components/admin-dashboard-content.tsx` | Counters + marketplace summary | ✅ Reviewed |
| `components/admin-listings-view.tsx` | Queue shell + session gate | ✅ Reviewed |
| `components/admin-listings-content.tsx` | Queue body with filters + moderation | ✅ Reviewed |
| `components/admin-listing-card.tsx` | Mobile queue row card | ✅ Reviewed |
| `components/admin-listing-table.tsx` | Desktop queue row table | ✅ Reviewed |
| `components/admin-listing-actions.tsx` | Permission-aware action buttons | ✅ Reviewed |
| `components/admin-listing-detail-panel.tsx` | Expanded detail + moderation trail | ✅ Reviewed |
| `components/admin-listing-status-badge.tsx` | Status badge | ✅ Reviewed |
| `components/admin-reports-view.tsx` | Report queue (NO resolve/dismiss actions) | ✅ Reviewed |
| `components/admin-users-view.tsx` | User table + suspend/ban/restore actions | ✅ Reviewed |
| `components/admin-taxonomy-view.tsx` | Category CRUD (NO attribute management) | ✅ Reviewed |
| `components/admin-nav.tsx` | 5-tab navigation | ✅ Reviewed |
| `components/admin-access-denied.tsx` | Honest denial for USER role | ✅ Reviewed |
| `components/index.ts` | Component barrel | ✅ Reviewed |

## Frontend — App Pages (src/app/)
| File | Route | Status |
|------|-------|--------|
| `admin/layout.tsx` | `/admin/*` — layout + AdminNav + noindex | ✅ Reviewed |
| `admin/page.tsx` | `/admin` — dashboard | ✅ Reviewed |
| `admin/listings/page.tsx` | `/admin/listings` — listings queue | ✅ Reviewed |
| `admin/reports/page.tsx` | `/admin/reports` — reports | ✅ Reviewed |
| `admin/users/page.tsx` | `/admin/users` — users | ✅ Reviewed |
| `admin/taxonomy/page.tsx` | `/admin/taxonomy` — taxonomy | ✅ Reviewed |
| `admin/locations/` | `/admin/locations` — **MISSING** | ❌ Not implemented |
| `admin/audit/` | `/admin/audit` — **MISSING** | ❌ Not implemented |

## Frontend — Infrastructure
| File | Responsibility | Status |
|------|---------------|--------|
| `middleware.ts` | Cookie-based route guard | ✅ Reviewed |
| `next.config.mjs` | Image + robots headers config | ✅ Reviewed |
| `package.json` | Dependencies | ✅ Reviewed |
| `tsconfig.json` | Strict TS config | ✅ Reviewed |
| `tailwind.config.ts` | Custom theme tokens | ✅ Reviewed |
| `jest.config.mjs` | Test configuration | ✅ Reviewed |

## Backend Docs
| File | Status |
|------|--------|
| `docs/openapi.json` (70 paths, 83 ops, 103 schemas) | ✅ Reviewed |
| `docs/frontend-api-contract.md` | ✅ Reviewed |
| `docs/frontend-error-map.md` | ✅ Reviewed |
| `docs/api-freeze-summary.md` | ✅ Reviewed |
| `locations.service.ts` | 🟡 Partial |
| `taxonomy-admin.service.ts` | 🟡 Partial |

## Backend — Database
| File | Status |
|------|--------|
| `prisma/schema.prisma` (769 lines, 25 models, 8 enums) | ✅ Reviewed |
| `prisma/migrations/` | 🟡 Not reviewed |
| `prisma/seed.ts` | 🟡 Not reviewed |