# Deliverable Three — Target-State Specification & Implementation Roadmap

> Guiding rule (AGENTS.md / V5): do **not** invent endpoints, roles, metrics, or
> marketplace features. The target below is scoped strictly to the frozen v1 backend
> surface + the real product (browse listings, contact the seller directly). No
> payments, no escrow, no internal messaging, no order management.

## 5.1 Target information architecture

| Section | Route | Access | Purpose | Data source | Permitted actions |
| --- | --- | --- | --- | --- | --- |
| Public seller profile | `/seller/[slug]` | Public | Understand seller + discover listings | `GET /sellers/{slug}` | none (read-only) |
| Account overview | `/account` | Private | Identity snapshot + navigation | `GET /me` | edit display name; link out |
| Account security | `/account/security` | Private | Password, sessions, phone | `/me`, `GET /auth/sessions` + mutations | change password/phone, revoke sessions, logout-all |
| Personal listings | `/my-listings` | Private | Manage own listings by state | `GET /me/listings` + commands | renew / mark-sold / archive / edit / view |
| Sell + edit | `/sell/*`, `/sell/[id]/edit` | Private | Create & edit drafts | create/update/submit/media | draft CRUD, publish, edit |
| Favorites | `/favorites` | Private | Saved listings | `GET /me/favorites` | add/remove |
| Auth flows | `/auth/*` | Public | login/register/verify/recover | auth endpoints | sign in/up/verify/reset |

Recommended (no new backend surface): add a visible header cross-link between the
**private** account ("حساب") and the **public** seller page ("صفحه فروشنده من") — the
data already exists (`profile.seller.slug`).

## 5.2 Public seller profile — target design

- **Essential identity (only):** display name, verified-phone badge (backend-backed),
  member-since, bio. No fabricated metrics, ratings, or transaction counts.
- **Privacy:** never render internal id, phone, email, `ownerUserId`, or moderation
  state. 404 for suspended/banned/deleted (already correct).
- **Listings:** with no seller-listings endpoint, keep the honest empty/notice state
  and route browsing to `/search` (optionally prefiltered by the seller's province if
  the listing detail carries it). Defer a real seller-grid to a future contract that
  includes it — do not fabricate one.
- **Sorting/pagination:** N/A until an endpoint exists.
- **Contact:** per-listing reveal only (already the product behavior). Do not expose
  a direct seller-level contact action without a contract change.
- **Trust:** single indicator = `phoneVerified` (`activeListingCount` is informational,
  not a trust score).
- **Share:** optional "copy profile link" (native `navigator.share` fallback to
  clipboard) — listing-level share already exists; profile share is a small, justified
  add with no backend change.
- **Mobile-first + a11y + RTL:** single column, `dir=rtl`, `h1` = display name, bidi
  isolation not needed (no phone/URL on this page today).
- **Fix CONTRACT-001:** canonical URL must use the runtime `slug`.

## 5.3 Private account — target design

- **Overview (compact):** identity card (initials avatar, name, verified badge, own
  phone, role, member-since) + 4 nav links (security, favorites, my-listings, seller
  page) + logout. Keep it small — no large dashboard to imitate other marketplaces.
- **Editable vs read-only:** display name editable (inline); phone read-only on
  `/account` (change lives under security); role/status read-only (rollups); seller
  display name/bio editable later via the same `PATCH /me` (currently only name is
  wired — add seller name/bio affordance if product wants it).
- **Validation:** reuse `PATCH /me` (2–80 name), bind `VALIDATION_ERROR` field errors.
- **Save/cancel:** keep ذخیره / انصراف; add a lightweight dirty indicator (the "ویرایش"
  button → inline editor). Optionally a `beforeunload`/router-leave guard (UX-003).
- **Error recovery:** keep `ErrorState` + `requestId`; network retry.
- **Session-expiry:** keep the 401→login routing.
- **Verification:** warn + deep-link when unverified; badge only when backend says so.
- **Account lifecycle:** no deletion control (PROFILE-003) — do not add one until a
  policy exists. Logout available here **and** in the header.

## 5.4 Personal listing & draft — target design

- **States already match the real model:** DRAFT / PENDING_REVIEW / ACTIVE / REJECTED /
  SOLD / ARCHIVED. Keep per-state labels + hints (localized).
- **Actions per state:** unchanged (renew/mark-sold/archive/edit/view). Irreversible
  actions stay two-step confirmed; renew stays immediate.
- **Publication outcomes:** `/sell/submit` outcome page already distinguishes
  PENDING_REVIEW vs auto-approve ACTIVE. Keep rejection reason visible to the owner
  only (already the case via `rejectedReason`/`rejectedNote`).
- **Draft preservation:** keep `weshbazar.sell-draft.v1.<userId>` + the legacy-key
  quarantine flow. No change needed (CACHE-004 PASS).
- **Photo/validation recovery:** keep the media validation + edit sections; no change.
- **Backend ownership:** no change (already enforced).
- **Consistency:** ensure `/my-listings` and the edit wizard share the same owner
  cache (`syncOwnerListing`) — already the case.

## 5.5 Privacy & security target state

### Field-level privacy matrix (verified + target)

| Field | Public seller | Private `/me` (owner) | Backend-only | Excluded |
| --- | --- | --- | --- | --- |
| `slug` / `displayName` / `bio` | ✅ (public) | ✅ | | |
| `memberSince` | ✅ | ✅ (as createdAt) | | |
| `phoneVerified` | ✅ | ✅ | | |
| `activeListingCount` | ✅ | — | | |
| `phone` | ❌ | ✅ (own) | | |
| `id` (user) / `seller.id` | ❌ | ✅ (own) | | `ownerUserId` (admin-only) |
| `role` / `status` | ❌ | ✅ (own) | | |
| `avatarKey` | ❌ | ✅ (write, unrendered) | | (pending IDENT-005) |
| `passwordHash` / lockout / `failedLoginAttempts` / `lockedUntil` | ❌ | ❌ | ✅ | |
| moderation metadata / `rejectedReason` (owner) | ❌ | ✅ (owner listing) | | |
| contact values | ❌ | ✅ (own listing, reveal) | ✅ (reveal endpoint) | |
| refresh token | ❌ | ❌ | ✅ (HttpOnly cookie) | body copy (PROFILE-004) |

**Target change:** `avatarKey` either (a) removed from the writable surface or
(b) validated against an owned media object. No other field changes required.

### User-to-resource authorization matrix (target = current, all enforced server-side)

| Resource | Anonymous | Owner | Other user | Moderator/Admin |
| --- | --- | --- | --- | --- |
| `GET /me`, `PATCH /me` | ❌ 401 | ✅ | ❌ 401 | ✅ (own) |
| `GET /me/listings`, `GET /me/listings/{id}` | ❌ 401 | ✅ (own only) | ❌ | ✅ (own) |
| create/update/submit/renew/sold/archive/revisions | ❌ 401 | ✅ (own only) | ❌ | ✅ (own) / admin commands |
| favorites list/add/remove | ❌ 401 | ✅ (own only) | ❌ | ✅ (own) |
| `GET /sellers/{slug}` | ✅ (active only) | ✅ | ✅ | ✅ |
| `GET /listings/{slug}` (public) | ✅ (ACTIVE/SOLD) | ✅ | ✅ | ✅ |
| contact reveal | ❌ (401→login) | ✅ (verified) | ✅ (verified) | ✅ (verified) |

**Session / cache target:**
- One canonical `clearUserScopedCaches()` used by **every** sign-out path; also clears
  the `weshbazar_session` marker cookie and cancels in-flight private queries.
- User-scope `listings.mine`, `analytics.sellerSummary` (and `favorites`/`contacts`
  keys where cheap) to eliminate shared-key cross-account reuse.
- Keep draft user-namespacing + clear-on-logout.

**Audit/business:** review admin audit actions for `AUTH_PASSWORD_CHANGED`,
`AUTH_PHONE_CHANGED`, `SECURITY_*` (already present in `AuditAction`) — no change.

## 5.6 Visual design system

Preserve the existing WeshBazar brand and the official logo assets (never redrawn).

- Primary teal `#0F766E`, dark teal `#0B2F2B`, soft teal `#E6F5F3`, orange
  `#F59E0B`, dark orange `#D97706`, background `#F8FAFC`, white `#FFFFFF`,
  border `#E2E8F0`. These are already represented as HSL tokens in
  `globals.css` / `tailwind.config.ts` — reuse them (`bg-primary`, `text-foreground`,
  `rounded-card`, `h-control`, `text-ui`, …), never raw hex.
- Font: self-hosted Vazir (`next/font/local`, weights 300/400/500/700) — already in
  `layout.tsx`. Do not swap to a Google-hosted Vazirmatn; self-hosting is preferred.
- Layout: mobile-first, RTL (`dir=rtl`, logical `ps/pe/ms/me/start/end`),
  clear at 390×844 and 1440×900; bidi isolation for phone/URL/IP.
- Components: reuse the existing `Button`, `FormField`, `EmptyState`, `ErrorState`,
  `Skeleton`, `ListingCard`, `Breadcrumbs`, `PageContainer` — no new generic dashboard.
- Behavior: no oversized decorative headers, no unnecessary gradients, no fake
  ratings, minimal motion (`prefers-reduced-motion` respected).

## 5.7 Implementation roadmap

Priorities: **P0** privacy/authorization/session/verification correctness →
**P1** broken required workflows → **P2** UX/a11y/responsive/perf → **P3** optional.

### P0 — (none required now)
No live P0 defect was found. The P0-class invariants (server-side ownership,
presenter separation, HttpOnly refresh cookie, verification truth) are already met
and covered by tests. If any P0-class item is later introduced by a browser session
test, fix it before anything else.

### P1 — Cache isolation (CACHE-001, CACHE-002) — ✅ DONE (Phase 1)
- **Affected:** `src/features/account/hooks.ts`, `src/components/auth/auth-provider.tsx`,
  `src/lib/api/query-keys.ts`.
- **Criteria:** CACHE-001, CACHE-002; **Findings:** CACHE-001.
- **Approach:** extract a single `clearUserScopedCaches()` (superset incl. listings/
  contacts/analytics), call it from `useLogout`, `useSignOutLocal`, `useLogoutAll`
  and `performLogout`; scope `listings.mine` + `analytics.sellerSummary` keys by an
  owner identity (or fall back to clearing `listings.all`/`analytics`).
- **Dependencies:** none (frontend-only).
- **Regression risk:** low; watch that the header logout still clears the extra caches.
- **Tests:** unit assert `useLogout`/`useSignOutLocal` remove listings+analytics keys.
- **Acceptance:** A→B switch never renders A's stale listings/analytics within staleTime.

### P1 — Browser session/auth regression suite (TEST-003)
- **Affected:** new Playwright specs (frontend).
- **Criteria:** TEST-003; covers login→reload, expired-access→refresh,
  refresh-failure/revoked, logout cleanup, A→B isolation, cross-account draft, session
  expiry during submit, public-seller never exposes private fields.
- **Dependencies:** a backing test environment + backend running (dev).
- **Acceptance:** all 12 V5 §7 scenarios green.

### P2 — Contract conformance (CONTRACT-001)
- **Affected:** backend `sellers/dto/seller-responses.dto.ts` (rename `sellerSlug`→`slug`),
  regenerate `docs/openapi.json`; frontend `src/features/sellers/types.ts` +
  `src/app/seller/[slug]/page.tsx:27`.
- **Criteria:** IDENT-006.
- **Approach:** standardize on `slug` (avoids touching frozen runtime JSON); fix DTO +
  regenerate; update frontend to `profile.slug`.
- **Regression test:** e2e asserts body has `slug` not `sellerSlug`; frontend SSR test
  asserts canonical = `/seller/{slug}`.
- **Acceptance:** canonical URL correct; OpenAPI + runtime agree.

### P2 — Unify sign-out marker-cookie clearing (SESSION-001) — ✅ DONE (Phase 1)
- **Affected:** `src/components/auth/auth-provider.tsx` (export `clearSessionCookie`),
  `src/features/account/hooks.ts`.
- **Criteria:** SESSION-001.
- **Approach:** call the same cookie-clear primitive in `useSignOutLocal`/`useLogout`.
- **Regression test:** after `useLogout`/`useSignOutLocal`, `document.cookie` lacks
  `weshbazar_session`.

### P2 — Avatar decision (IDENT-005 / PROFILE-002)
- **Affected:** `src/features/account/*` (and backend DTO if removing).
- **Criteria:** IDENT-005.
- **Approach:** mark avatar out-of-scope in v1: do not render it; optionally stop
  sending `avatarKey` from the UI (and/or reject non-empty until an upload exists).
  Defer the upload+ownership flow to a product decision.

### P3 — optional enhancements
- Dirty-state warning for the inline display-name edit (UX-003).
- Profile share button (native share/copy) on `/seller/[slug]` (no backend change).
- Seller name/bio inline editing on `/account` (backend already supports it via
  `PATCH /me`).
- Axe/keyboard browser pass over profile/security/favorites (A11Y-002/005).
- Harden auth responses: omit `refreshToken` from browser JSON (PROFILE-004).
- Account deletion/deactivation: **product/legal decision + schema/retention design
  required before any implementation** (PROFILE-003).

### Rollout order
1. ✅ **DONE (Phase 1)** — CACHE-001/CACHE-002 + SESSION-001.
2. CONTRACT-001 (fix + regenerate contract).
3. TEST-003 Playwright suite (locks in 1 and 2 and future work).
4. P3 items as product decisions are made.