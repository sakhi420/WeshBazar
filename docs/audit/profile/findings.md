# Findings — Profile / Account Audit

Every finding carries code-level evidence (file path + line). Findings are
numbered by severity tier. Stable IDs are reused in `criteria-register.json` and
the roadmap. "Expected" is grounded in Master Prompt V5, OWASP ASVS 5.0, WCAG 2.2,
or the frozen OpenAPI contract — never in features that the product does not define.

---

## P1 — Cross-account data exposure / broken workflows

### CACHE-001 — Incomplete private-cache clearing on secondary sign-out paths

**Status:** ✅ **Resolved in Phase 1.** A shared `clearUserScopedCaches()` now runs on
every sign-out path (`useLogout`, `useSignOutLocal`, `performLogout`).

- **Category:** Cache & account switching.
- **Severity:** High (cross-account stale-data exposure). **Priority:** P1.

**Actual behavior.** Three sign-out paths in the account feature route through
`clearUserCaches`, which only drops `auth`, `account` and `favorites`:

- `weshbazar-frontend/src/features/account/hooks.ts:29-33`
  ```ts
  function clearUserCaches(qc) {
    qc.removeQueries({ queryKey: queryKeys.auth.all });
    qc.removeQueries({ queryKey: queryKeys.account.all });
    qc.removeQueries({ queryKey: queryKeys.favorites.all });
  }
  ```
- Callers: `useLogout` (account page "خروج از حساب"), `useSignOutLocal`
  (revoke-current-session + `useLogoutAll` on the security page).
- `weshbazar-frontend/src/features/account/components/account-view.tsx:167-175`
  uses `useLogout` for its logout button.
- `weshbazar-frontend/src/features/account/components/security-sessions-section.tsx:52-58`
  calls `useSignOutLocal()` when revoking the current session.

By contrast, the header logout path clears **more**:
- `weshbazar-frontend/src/components/auth/auth-provider.tsx:113-119` also removes
  `listings`, `contacts`, `analytics` and `admin`.

The query keys for `listings.mine` and `analytics.sellerSummary` are **not
user-scoped**:
- `weshbazar-frontend/src/lib/api/query-keys.ts:37` `mine: (params) => ['listings','mine',params]`
- `weshbazar-frontend/src/lib/api/query-keys.ts:66` `sellerSummary: ['analytics','seller','summary']`

**Impact.** Sequence: user A signs in → visits `/my-listings` (populates
`['listings','mine',…]`) → visits `/account` and logs out via the account-page
button (`useLogout`) → the `listings.mine` cache survives in memory. User B then
signs in and visits `/my-listings`: TanStack Query serves A's cached seller listing
summaries for the `staleTime` window (30s) before refetching. Same class of
exposure for `analytics.sellerSummary`. This is exactly the "account A to account B
isolation" hazard in Master Prompt V5 §7 and §4.5 of this audit.

**Expected.** Every sign-out path must clear the same complete set of user-scoped
caches (or user-scope the keys by userId so they can never be shared). Master
Prompt V5 §7 ("clear all … user-specific query caches") and §437 (logout/identity
change must clear prior account state).

**Reproduction.** Manual/browser test as above, or a unit test asserting that
`useLogout` and `useSignOutLocal` remove `queryKeys.listings.all` and
`queryKeys.analytics` in addition to auth/account/favorites.

**Fix.** Centralize a single `clearUserScopedCaches()` (superset) and call it from
`AuthProvider.performLogout`, `useLogout`, `useSignOutLocal`, and `useLogoutAll`;
additionally scope `listings.mine`, `analytics.sellerSummary` (and ideally the
favorites/contacts keys) by an owner identity or clear them all explicitly.

**Confidence.** High on the asymmetry (code is explicit). Medium-high on the
cross-account leak (depends on A having visited `/my-listings`; self-corrects on
refetch). **Unresolved:** whether any user-facing flow already refetches fast
enough to mask it.

## P2 — Contract/UX/SEO correctness

### CONTRACT-001 — `sellerSlug` (OpenAPI + frontend) vs `slug` (backend runtime)

- **Category:** Contract conformance / SEO metadata. **Priority:** P2.

**Actual behavior.** The public seller profile response field is named differently
at runtime vs. the documented contract:

- Runtime returns **`slug`**: `seller.presenter.ts:36-43` `return { slug: seller.slug, … }`.
- Backend Swagger DTO + OpenAPI declare **`sellerSlug`**:
  - `modules/sellers/dto/seller-responses.dto.ts:6` `sellerSlug!: string;`
  - `docs/openapi.json:4365` `"sellerSlug"`, and `:4393` `"required": ["sellerSlug",…]`.
- Frontend mirrors the (wrong) field:
  - `src/features/sellers/types.ts:11` `sellerSlug: string;`
  - `src/app/seller/[slug]/page.tsx:27` `canonical: /seller/${profile.sellerSlug}`.

So `profile.sellerSlug` is `undefined` at runtime → canonical URL **`/seller/undefined`**.
Visible content is unaffected (reads `displayName`, `memberSince`, `phoneVerified`,
`activeListingCount`, `bio`). Backend e2e uses the runtime key:
`test/e2e/profile.e2e-spec.ts:59` `slug` / `:285` `expect(data.slug)`.

**Expected.** OpenAPI is authoritative (`AGENTS.md`, `frontend-api-contract.md:6`);
runtime and docs must match; canonical must be the real seller URL.

**Impact.** Wrong canonical/SEO metadata on every public seller page; latent trap
for any consumer of the documented `sellerSlug`.

**Fix.** Adopt `slug` everywhere: (a) fix the backend Swagger DTO `sellerSlug`→`slug`
and regenerate `openapi.json` (concrete contract bug → in scope per `AGENTS.md`);
(b) change the frontend type + page to `profile.slug`.

**Regression test.** e2e asserts the body contains `slug` and not `sellerSlug`;
frontend SSR test asserts canonical = `/seller/{slug}`.

**Confidence.** High.

---

### SESSION-001 — `weshbazar_session` cookie not cleared by secondary sign-outs

**Status:** ✅ **Resolved in Phase 1.** `clearSessionCookie()` is now called from
`useLogout` and `useSignOutLocal` (shared in `src/lib/api/session-cookie.ts`).

- **Category:** Session lifecycle / route guarding. **Priority:** P2.

**Actual behavior.** The soft middleware gate reads a non-HttpOnly `weshbazar_session`
`path=/` cookie set by `AuthProvider` after bootstrap and cleared only in
`performLogout`:
- `src/components/auth/auth-provider.tsx:44` (set) and `:98` (clear).
- `src/middleware.ts:25` `request.cookies.has('weshbazar_session')`.

Account-page logout and security-page sign-outs do **not** clear it:
- `useLogout` → `logout` API + `clearUserCaches` (`account/hooks.ts:64-73`).
- `useSignOutLocal` → `clearAccessToken` + `clearUserCaches` (`account/hooks.ts:40-45`).

**Impact.** After signing out from `/account` or revoking current session / "logout
all" from `/account/security`, the marker cookie stays (~30d), so middleware still
treats the next request as "session" until the client bootstrap 401s and flips to
anonymous. Transient wrong redirect + redundant login bounce. Not a security boundary
(API still enforces auth), but an inconsistency.

**Expected.** One shared sign-out clears the marker cookie, token, and caches from
every entry point (Master Prompt V5 §7).

**Fix.** Route both flows through the same primitive (or export `clearSessionCookie`
and call it in `useSignOutLocal`/`useLogout`).

**Regression test.** After `useLogout`/`useSignOutLocal`, `document.cookie` lacks
`weshbazar_session`; middleware treats the request as guest.

**Confidence.** High.

### PROFILE-002 — `avatarKey` writable but no upload/validity/render path

- **Category:** Identity correctness / privacy. **Priority:** P2.

**Actual behavior.** `PATCH /me` accepts `avatarKey` validated only as a storage-key
*shape*; no ownership/validity check; no avatar upload endpoint in the frozen contract:

- Schema: `prisma/schema.prisma:64` `avatarKey String?`.
- DTO: `modules/users/dto/update-me.dto.ts:41-44` (`@Matches(/^$|^[A-Za-z0-9][A-Za-z0-9/_\-.]*$/)`).
- Store verbatim: `modules/users/users.service.ts:47-49`; expose: `users.service.ts:34`, `me-responses.dto.ts:55`.
- No avatar upload route (media contract is listing images only — `frontend-api-contract.md:338`).

The frontend never renders `avatarKey` (account page shows `initialsFrom`, seller page
shows a `UserRound` icon); no avatar upload UI exists.

**Impact.** Self-scoped only (not a cross-account leak): a caller can store an
arbitrary `avatarKey`. If any surface later renders it, broken images result; the
value is not bound to an owned media object.

**Expected.** Either keep avatar out of scope (don't render, optionally reject
non-empty `avatarKey` in UI) or add a validated upload + ownership link. V5 §24/§32
do **not** require an avatar.

**Fix.** Short term: treat avatar as out-of-scope; product decision for a real flow.

**Confidence.** High. **Unresolved:** planned v1.1 avatar scope.

---

## P3 — Product / documentation gaps & positives

### PROFILE-003 — No user-facing account deletion/deactivation in frozen v1

- **Category:** Account lifecycle / privacy. **Priority:** P3 (needs product/legal input).

**Evidence.** The 83-operation endpoint inventory has no user-facing delete; `/me`
exposes only get/update/listings/analytics (`frontend-api-contract.md:195-203`).
Deactivation exists only in the admin module (`admin_users_*`). The backend README
mentions "account delete (soft)" (`weshbazar-backend/README.md:204`) but it is not
exposed in the frozen HTTP contract.

**Impact.** Users cannot delete/deactivate their own account (data-retention
decision unresolved). Do **not** hand-roll this: DB relations (`SellerAccount` FK is
`Restrict`, listings/reports/favorites cascade or restrict) require a documented
policy first.

**Action.** Product/legal decision required; list as unresolved.

---

### PROFILE-004 — `refreshToken` also returned in auth JSON body (documented, deferred)

- **Category:** Token handling. **Priority:** P3 (informational → harden later).

**Evidence.** Login/register/refresh set the HttpOnly cookie **and** return
`refreshToken` in the body (`auth.service.ts:653`, `auth.controller.ts:346-353`,
OpenAPI requires it at `openapi.json:4067`). The frontend never reads it —
`features/auth/api.ts` reads only `data.tokens.accessToken`, and
`features/auth/types.ts:26-30` marks it "never read or stored". The refresh cookie is
`Path=/api/v1/auth`, so the browser never sends it on page requests.

**Assessment.** Not a live leak for this frontend (the field is ignored), and the
body copy exists for non-browser clients. For browser clients it is defense-in-depth
debt. Recommend (future, optional) omitting `refreshToken` from browser responses or
documenting it explicitly as non-browser-only.

---

## Verified positives (no defect) — recorded for the criteria register

- **Ownership enforcement** — every owner-facing mutation derives identity from the
  JWT `user.id`: `users.controller.ts`, `favorites.controller.ts` (`user.id`),
  `listings.controller.ts` (`updateForOwner`/`submitForReview`/`markSold`/`archive`/
  `renew`/`listRevisions`), `me-listings.controller.ts` (`listForOwner`/`getForOwner`).
- **Presenter separation** — `user.presenter.ts` excludes `passwordHash`/lockout;
  `seller.presenter.ts` (public) excludes ids/phone; `public-listing.presenter.ts`
  excludes moderation/contact/rejection; `rejectedReason` public leakage is covered
  by `presenter-leak.spec.ts` + `api-contract-audit.md:116`.
- **Moderation-state hiding** — suspended/banned/deleted sellers 404
  (`seller-accounts.service.ts:147-167`), verified by `profile.e2e-spec.ts:307-324`.
- **Verification truth** — `phoneVerified` = `phoneVerifiedAt !== null` server-side
  only (`user.presenter.ts:26`); UI derives from backend (`verify-form.tsx:70`,
  `account-view.tsx:193`).
- **Session lifecycle** — in-memory access token, HttpOnly refresh cookie
  (`path=/api/v1/auth`), rotation + reuse detection (`auth.controller.ts:63,346`,
  `session.service.ts`), single-flight refresh + replay-once (`client.ts:96-134,245-265`).
- **Draft isolation** — user-scoped localStorage keys + clear-on-logout
  (`sell/draft.ts:36-62`).
- **Favorites** — server-side `UNIQUE(userId, listingId)` arbiter + optimistic
  conflict convergence (`favorites.service.ts:100`, `favorites/hooks.ts:62-85`).
- **A11y/RTL** — self-hosted Vazir, `lang=fa-AF dir=rtl`, skip-to-content,
  `maximumScale:5`, autocomplete tokens, no paste-blocking (`layout.tsx`,
  `password-field.tsx`).
- **Baseline gates** — frontend typecheck PASS; 264 tests PASS; backend 450 tests
  (per README).