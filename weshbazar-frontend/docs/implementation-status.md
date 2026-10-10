# Frontend Implementation Status

Durable progress record for the WeshBazar frontend. Reconstructed from the
codebase and kept in sync at the end of every increment — update this file
whenever a page contract lands, so a fresh session can locate state without
re-deriving it.

Authoritative sources (unchanged):

- `../WeshBazar_Frontend_Master_Prompt_V4_EN.md` — page/component contracts (§ references below).
- `../AGENTS.md` — ground rules: backend frozen at v1.0.0, never invent endpoints.
- `../weshbazar-backend/docs/openapi.json` — the HTTP contract; wins over everything for shapes.
- `../weshbazar-backend/docs/frontend-api-contract.md` / `frontend-error-map.md` — transport, envelopes, error catalog.

## Contract coverage map (page contracts §20–§51)

| Contract            | Route                    | State          |
| ------------------- | ------------------------ | -------------- |
| §20 Home            | `/`                      | ✅ Implemented |
| §21 Search          | `/search`                | ✅ Implemented |
| §22 Category        | `/category/[slug]`       | ✅ Implemented |
| §23 Listing Detail  | `/listing/[slug]`        | ✅ Implemented |
| §24 Seller Profile  | `/seller/[slug]`         | ✅ Implemented |
| §25 Login           | `/auth/login`            | ✅ Implemented |
| §26 Register        | `/auth/register`         | ✅ Implemented |
| §27 Verify          | `/auth/verify`           | ✅ Implemented |
| §28 Forgot Password | `/auth/forgot-password`  | ✅ Implemented |
| §29 Reset Password  | `/auth/reset-password`   | ✅ Implemented |
| §30 Favorites       | `/favorites`             | ✅ Implemented |
| §31 My Listings     | `/my-listings`           | ✅ Implemented |
| §32 Account         | `/account`               | ✅ Implemented |
| §33 Security        | `/account/security`      | ✅ Implemented |
| §34–§41 Sell flow   | `/sell` … `/sell/submit` | ✅ Implemented |
| §42 Edit Listing    | `/sell/[id]/edit`        | ✅ Implemented |
| §43 Admin Dashboard | `/admin`                 | ✅ Implemented |
| §44–§49 Admin suite | `/admin/*`               | ❌ Not started |
| §50 Not Found       | global `not-found.tsx`   | ✅ Implemented |
| §51 Global Error    | global `error.tsx`       | ✅ Implemented |

## Delivered increments (detail)

### Increment 1 — Scaffold & foundation (§0–§19)

Next.js 15 App Router · React 19 · TS strict · Tailwind tokens · ESLint 8 +
Prettier · Jest + RTL. Root layout `lang=fa-AF dir=rtl` with Vazirmatn.
Design tokens in `tailwind.config.ts` + `globals.css` (HSL channels,
`h-control`, `rounded-card`, `text-ui`, …). API boundary in `src/lib/api`:
`apiUrl()`, `credentials: 'include'`, per-request `x-request-id`, in-memory
access token + single-flight refresh + replay, typed `ApiError` with the
stable code catalog, cursor/page pagination helpers, server reads
(`serverGet`) with cache hints, query-key factory. Brand assets copied
verbatim from the backend kit; app shell with site header; feedback
primitives (EmptyState/ErrorState/Skeleton); honest route placeholders.

### Public browsing pages (§20–§24)

- **§20 Home** — search-first hero + real categories feed, server-rendered
  (`src/app/page.tsx`, `features/categories`).
- **§21 Search** — URL-state driven via nuqs; params/parsers in
  `features/search` (`params.ts`, `parsers.ts`, tested).
- **§22 Category** — category landing with listing feed
  (`src/app/category/[slug]`).
- **§23 Listing Detail** — server component: gallery → price → title → meta
  → specs → description → seller card → contact reveal (client island) →
  share/report/favorite → safety notice → related listings (honest empty on
  failure). Shared UI in `src/components/listings` (gallery, attribute list,
  seller card, safety notice, share button).
- **§24 Seller Profile** — `features/sellers` + `src/app/seller/[slug]`.

### Auth flows (§25–§29)

`features/auth`: login, register, OTP verify (resend + 60s cooldown), forgot
password, reset password. Validation module + tests (`validation.test.ts`).
Session bootstrap (`bootstrapCurrentUser`) rotates via the HttpOnly refresh
cookie on fresh tabs; token stays in memory only.

### Favorites (§30)

`features/favorites`: session-gated list, view-model + tests, shared
favorite button used on cards and detail pages.

### My Listings (§31)

`features/listings/my-listings`: owner feed with status filters, manage card
with per-status actions (view / edit / submit / pause / activate / renew /
restore / delete) gated by `permissions` from the API, view-model + tests.

### Account (§32)

`features/account` + `features/account/components/account-view.tsx`:
profile card (identity, verification, member-since), inline display-name
edit (PATCH `/me`), verification notice linking to `/auth/verify`, nav to
favorites / my-listings / my seller page / admin (role-gated), logout.

### Security (§33)

`features/account` + `src/app/account/security` (private, noindex):

- **Data** (`types.ts` / `api.ts` / `hooks.ts`): sessions query
  (`GET /auth/sessions`), `useSessions`, `useRevokeSession`, `useLogoutAll`
  (local token cleared only on success), `useChangePassword` (invalidates
  the sessions cache — backend revokes other sessions on success),
  `useSignOutLocal`, `startPhoneChange` / `verifyPhoneChange`
  (`VerifyPhoneChangeResult` consumes the `{ user }` subset the controller
  actually returns; OpenAPI declares `MeResponseDto`).
- **Model** (`session-label.ts`, tested): pure user-agent parsing — device
  label preference, `browser · OS` summary, `دستگاه ناشناس` fallback.
- **View** (`security-view.tsx` + 3 sections): session gate with `next`
  preserved; password change (current/new/confirm, error codes bound to
  fields); sessions list (device label, relative last-used, current-device
  badge, IP) with two-step inline confirm for revoke and logout-all;
  revoking the current session signs out locally (refresh cookie already
  cleared server-side); `SESSION_NOT_FOUND` converges via refetch; phone
  change step 1 (password + new number) → OTP step with resend cooldown
  from `resendAvailableAt` (resend = re-start call), success patches the
  auth cache. Account nav gains an «امنیت حساب» entry.

### Admin Dashboard (§43)

`features/admin` + `src/app/admin` (private, noindex) — replaces the
`RouteScaffold` entry:

- **Data** (`types.ts` / `api.ts` / `hooks.ts`): `GET /admin/dashboard`
  (AdminDashboardDto) + `GET /admin/analytics/summary`
  (MarketplaceSummaryDto, server default = last 30 days). Both routes are
  gated by ANALYTICS_READ — MODERATOR/ADMIN; queries stay disabled until
  the gate resolves.
- **Model** (`model.ts`, tested): ordered listing-status breakdown (known
  lifecycle statuses always shown, unknown keys appended, NaN coerced),
  rolling-window sums (`sumLastDays`, `sumEngagement`), inclusive range
  span + «۳۰ روز اخیر» label, engagement item labels.
- **View** (`admin-dashboard-view.tsx` + content + access-denied): session
  gate with `next` preserved; a signed-in USER (or a stale-role 403) lands
  on the honest access-denied surface, never a redirect loop (§42).
  Counter cards (users/listings/reports), status breakdown with share
  bars, marketplace summary (totals + derived 7-day numbers, engagement
  grid), manual refresh, per-section loading/error/retry states.
- `RouteScaffold` is now unused (kept in-tree until §44–§49 confirm they
  don't need it).

### Sell flow (§34–§41)

`features/listings/sell`: 8-step wizard (start/category → photos → basic →
attributes → location → contact → preview → submit) with `sell-provider`
(state + draft persistence), step guards, draft recovery banner, shared
image pipeline (`features/media`: validate + limits), attribute field
renderer driven by the category filter schema, submit outcome states.
Pure modules tested: `sell-steps`, `validation`, `draft`, `media/validate`.

### Edit Listing (§42)

`features/listings/edit` + `src/app/sell/[id]/edit`:

- **Model** (`model.ts`, tested): `seedEditForm`, defensive
  `readContactConfig` (presenter includes `contactMethods` though the
  OpenAPI type omits it; null seed → all-off with notice), diff-based
  `buildEditPatch` (only changed fields; category switch re-sends
  attributes against the new schema; pricing tuple with create-parity
  clearing; `expectedVersion` on every patch),
  `canMutateListingImages` mirroring backend `IMAGE_MUTABLE_STATUSES`.
- **View** (`edit-listing-view.tsx`): auth gates (redirect to login with
  `next`), two-tier lock (non-editable status at load → locked notice;
  mid-session status flip after save → form replaced while gallery stays
  live for PENDING_REVIEW), rejection notice, schema-ready gating before
  attributes can be saved, per-call outcome copy
  (`describeSaveOutcome`), submit-to-review strip for DRAFT/REJECTED with
  inline confirm, sticky save bar.
- **Sections**: basic (title/description/condition/price/category),
  attributes (schema-driven, retry/empty states), location (province/city
  with stale-id fallbacks), contact (phone/whatsapp/telegram dual-form),
  photos (ordered gallery, per-op refresh on conflict, sequential upload
  with progress).
- **Entry**: edit button on the My Listings manage card (`canEdit`).

### Error surfaces (§50–§51)

Global `not-found.tsx` and `error.tsx` implemented; route-level
`loading.tsx` skeletons where useful.

## Verification state

- Tests: **14 suites / 164 tests** (Jest + RTL) — pure modules only:
  edit model, sell validation/steps/draft, media validation, search params,
  favorites + my-listings view-models, admin dashboard model,
  listings/account formatters, session labels, attribute list component,
  auth validation.
- Gates, all green at §43 completion: `tsc --noEmit`, `next lint`
  (no warnings), `jest`, production `next build` (`/admin`
  6.91 kB / 142 kB First Load JS), HTTP + browser smoke (anonymous redirect
  to login with `next` preserved, fa-AF/RTL rendering, clean console).

## Not yet implemented

1. **§44–§49 Admin sub-pages** — listings moderation queue (§44), reports
   (§45), users (§46), taxonomy (§47), locations (§48), audit (§49). All
   endpoints are frozen (`/admin/listings`, `/admin/reports`, `/admin/users`,
   `/admin/categories` + attributes/options, `/admin/provinces` + cities,
   `/admin/audit-logs`). Needs the admin error-map surfaces
   (`frontend-error-map.md`); the §43 dashboard shell they hang off now
   exists.
2. **Deferred infrastructure** (declared out of scope since scaffold):
   Playwright/axe suites, OpenAPI-generated types, toasts system — adopt
   only when an increment demands them.
