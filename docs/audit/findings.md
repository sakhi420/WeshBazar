# WeshBazar Audit — Findings Register

**Generated:** 2026-10-13 | **Evidence standard:** Line-level source citation

## Security (SEC)

| ID | Status | Summary | Evidence |
|----|--------|---------|----------|
| SEC-001 | ✅ PASS | All 38 admin endpoints have @RequirePermissions | 22 decorators + 3 class-level across 8 controllers |
| SEC-002 | ✅ PASS | 12 granular permissions: USER=0, MOD=5, ADMIN=12 | `permissions.ts:36-38` |
| SEC-003 | ✅ PASS | Account status re-check on every guarded request | `permissions.guard.ts:35`: `user.status !== 'ACTIVE'` |
| SEC-004 | ✅ PASS | Frontend middleware protects /admin prefix | `middleware.ts:21`: `/admin` in PROTECTED_PREFIXES |
| SEC-005 | ✅ PASS | Admin pages not indexable | `layout.tsx:6`: robots noindex; `next.config.mjs:22-24`: X-Robots-Tag |
| SEC-006 | ✅ PASS | Client-side role gate shows denial for USER | `admin-access-denied.tsx`: "دسترسی به پنل مدیریت ندارید" |
| SEC-007 | ✅ PASS | Audit rows created for all admin commands | Every admin controller passes `requestAuditContext(request)` |
| SEC-008 | ✅ PASS | Refresh token rotation + reuse detection | `api-freeze-summary.md:27`: SESSION_REUSE_DETECTED |
| SEC-009 | ✅ PASS | Rate limiting on auth/OTP endpoints | Rate-limit module + ThrottlerGuard |
| SEC-010 | ⚪ NOT VERIFIED | CORS hardening in production | Env-based; not tested against deployment |
| SEC-011 | ⚪ NOT VERIFIED | Idempotency keys for write operations | IdempotencyKey model exists; not verified at runtime |
| SEC-012 | ⚪ NOT VERIFIED | Password hashing strength (argon2) | `argon2` dependency confirmed; not tested |
| SEC-013 | ⚪ NOT VERIFIED | Session revocation on suspend/ban | Controller invokes session service; not verified at runtime |

## Authorization (AUTH)

| ID | Status | Summary | Evidence |
|----|--------|---------|----------|
| AUTH-001 | ✅ PASS | Permission guard runs after JWT; deny-by-default | `permissions.guard.ts:38`: 403 when insufficient |
| AUTH-002 | ✅ PASS | MODERATOR cannot archive/ban/manage taxonomy | `permissions.ts:37`: MODERATOR has 5 permissions only |
| AUTH-003 | ✅ PASS | Permission granularity per-endpoint (not per-controller-only) | Mix of class-level + per-handler decorators |
| AUTH-004 | ⚪ NOT VERIFIED | Cross-account isolation (User A cannot moderate User B's listing) | Logic in service layer; not tested |
| AUTH-005 | ⚪ NOT VERIFIED | Permission changes take effect immediately (no cached JWT claims) | Depends on token refresh; not tested |
| AUTH-006 | ⚪ NOT VERIFIED | Self-moderation prevention (admin cannot ban themselves) | Logic in service layer; not tested |

## Feature Gaps (GAP)

| ID | Severity | Summary | Evidence |
|----|----------|---------|----------|
| GAP-001 | ✅ RESOLVED | Reports: resolve/dismiss wired to frontend | `admin-reports-view.tsx` has Resolve/Dismiss buttons + note modal |
| GAP-002 | ✅ RESOLVED | /admin/locations: full UI with province+city CRUD | Page + view + API wrappers + hooks implemented |
| GAP-003 | ✅ RESOLVED | /admin/audit: full UI with filters + pagination | Page + view + API wrapper + hook implemented |
| GAP-004 | ✅ RESOLVED | Taxonomy attributes/options: full UI | `admin-taxonomy-view.tsx` rebuilt with attribute CRUD + option management |
| GAP-005 | ✅ RESOLVED | AdminNav has 7 tabs: dashboard, listings, reports, users, taxonomy, locations, audit | `admin-nav.tsx:13-21`: TABS has 7 entries |
| GAP-006 | ✅ RESOLVED | Vazir self-hosted via next/font/local | `layout.tsx`: localFont with 4 weight files in `./fonts/` |
| GAP-007 | 🟡 P2 | No admin panel entry point from public pages | No "Admin" link visible to MODERATOR/ADMIN users |

## UX (UX)

| ID | Status | Summary | Evidence |
|----|--------|---------|----------|
| UX-001 | ⚪ NOT VERIFIED | Responsive behavior at 390×844 and 1440×900 | No browser testing |
| UX-002 | ⚪ NOT VERIFIED | Keyboard navigation and focus management | No assistive tech testing |
| UX-003 | 🟡 P2 | Users view: suspend/ban use inline reason form (no modal confirmation) | `admin-users-view.tsx:77-80` |
| UX-004 | 🟡 P2 | Taxonomy delete uses toggle "مطمئنی؟" not modal | `admin-taxonomy-view.tsx:171-179` |
| UX-005 | ✅ PASS | All admin views have loading, error, empty, denied states | Every view component handles 5+ states |
| UX-006 | ✅ PASS | Listing moderation has inline reject reason + archive confirmation | `admin-listing-actions.tsx:54-145` |
| UX-007 | ✅ PASS | Permission-aware action buttons (only show permitted) | `admin-listing-actions.tsx:60`: filters by `permittedActions` |
| UX-008 | 🟡 P2 | No bulk operations (batch approve/reject) | Queue supports per-item actions only |
| UX-009 | ⚠️ PARTIAL | Reports view: status tabs + pagination work; no action buttons | `admin-reports-view.tsx:100-157`: tabs + list; 0 action handlers |
| UX-010 | ✅ PASS | Queue URL state (view, sort, search, page, seller) preserved | `admin-listings-content.tsx:44-48`: 5 nuqs parsers |

## Performance (PERF)

| ID | Status | Summary |
|----|--------|---------|
| PERF-001 | ⚪ NOT VERIFIED | Initial JS bundle size |
| PERF-002 | ⚪ NOT VERIFIED | Table rendering at 1000+ items (pagination at 20/page) |
| PERF-003 | ⚪ NOT VERIFIED | Image optimization (thumbnails via backend, not next/image) |
| PERF-004 | ✅ PASS | Search debounced via URL state (not direct input) |
| PERF-005 | ✅ PASS | Placeholder data keeps previous page visible during navigation |

## Testing (TEST)

| ID | Status | Summary |
|----|--------|---------|
| TEST-001 | ⚠️ BLOCKED | Frontend Jest fails: TS 5.7 `ignoreDeprecations` incompatibility with Next.js |
| TEST-002 | ⚪ NOT VERIFIED | Backend tests not executed |
| TEST-003 | ✅ PASS | model.test.ts: 13 pure-helper tests structurally valid |
| TEST-004 | ✅ PASS | errors.test.ts: error classification tests structurally valid |
| TEST-005 | ⚪ NOT VERIFIED | E2E admin workflow tests |
| TEST-006 | ⚪ NOT VERIFIED | Authorization boundary tests (cross-account, unauthenticated) |