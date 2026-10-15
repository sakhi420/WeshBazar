# Deliverable One — Verified Current-State Report

> Scope note: this report describes the profile/account system as **actually
> implemented** at HEAD `dd6ceef`, cross-checked against the frozen OpenAPI contract,
> the Prisma schema, and the V5 prompt. Fields/endpoints named here are verified in
> source; nothing is assumed.

## 1. Route and page inventory (verified)

| Route | File | Public/Private | Guard | Data source(s) |
| --- | --- | --- | --- | --- |
| `/seller/[slug]` | `src/app/seller/[slug]/page.tsx` | Public (RSC) | none | `GET /sellers/{slug}` (server) |
| `/auth/login` | `src/app/auth/login/page.tsx` | Public | middleware bounces authed users away | `POST /auth/login` |
| `/auth/register` | `src/app/auth/register/page.tsx` | Public | middleware bounces authed users away | `POST /auth/register` |
| `/auth/verify` | `src/app/auth/verify/page.tsx` | Public (session gated client-side) | client `useAuthBootstrap` | `/auth/me`, `POST /auth/verify-phone` |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` | Public | none | `POST /auth/forgot-password` |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` | Public | none | `POST /auth/reset-password` |
| `/favorites` | `src/app/favorites/page.tsx` | Private | middleware + client `useAuthBootstrap` | `GET /me/favorites` (cursor) |
| `/my-listings` | `src/app/my-listings/page.tsx` | Private | middleware + client gate | `GET /me/listings` (cursor) |
| `/account` | `src/app/account/page.tsx` | Private | middleware + client gate | `GET /me` |
| `/account/security` | `src/app/account/security/page.tsx` | Private | middleware + client gate | `/me`, `GET /auth/sessions`, mutations |
| `/sell` (+ `/sell/{photos,basic,attributes,location,contact,preview,submit}`) | `src/app/sell/*` | Private | middleware + client `SellGuard` | `GET /me/listings/{id}`, media, create/submit |
| `/sell/[id]/edit` | `src/app/sell/[id]/edit/page.tsx` | Private | middleware + client guard | `GET /me/listings/{id}`, PATCH |

Additional relevant public routes: `/listing/[slug]` (detail page carrying the seller
card + contact reveal). Admin routes (`/admin/*`) are covered by the separate
admin audit and only linked from `/account` when `role !== 'USER'`.

**How guarding actually works (important).** The backend refresh cookie is HttpOnly
with `Path=/api/v1/auth`, so the browser never sends it on page requests. The
frontend sets a **non-secret** marker cookie `weshbazar_session` (`path=/`) after a
successful bootstrap; `src/middleware.ts` reads it to (a) redirect authed users away
from login/register and (b) redirect guests to login for `/favorites`,
`/account`, `/my-listings`, `/sell`, `/admin`. This marker is a **soft UX gate, not
a security boundary** — the API enforces authorization; the marker only avoids a
pointless page render. Each private client view independently re-gates via
`useAuthBootstrap()` and redirects on `status === 'anonymous'`.

**Per-route behavior** (verified in the client views):

- **Loading** → "در حال بررسی نشست…" spinner (bootstrap), then per-view skeleton.
- **Unreachable** → `ErrorState` "ارتباط با سرور برقرار نشد" + retry.
- **Anonymous** → auto `router.replace('/auth/login?next=…')` via effect.
- **Error** → `ErrorState` with `requestId` (when `ApiError`) + retry.
- **Empty** → `EmptyState` (favorites "هنوز آگهیای ذخیره نکرده اید", my-listings,
  seller page "آگهی فعال ندارد").
- **Not-found** → seller page calls `notFound()` on 404 `SELLER_ACCOUNT_NOT_FOUND`.

## 2. Public seller profile (`/seller/[slug]`)

**Data (verified).** `GET /sellers/{slug}` (`@Public()`), returns
`PublicSellerProfile` built by `toPublicSellerProfile` (`seller.presenter.ts`):

- `slug`, `displayName`, `bio` (nullable), `memberSince` (`owner.createdAt`),
  `phoneVerified` (`owner.phoneVerifiedAt !== null`), `activeListingCount`.

**What it does NOT expose (verified by e2e `profile.e2e-spec.ts:293-296`):** internal
`id`, `phone`, `ownerUserId` — the test asserts none of `"id"` / `"phone"` / the
userId appear in the raw JSON.

**Moderation states.** A seller whose `SellerAccount.status != ACTIVE`, or whose
owner `User.status != ACTIVE`, or whose owner `deletedAt != null`, is returned as
404 `SELLER_ACCOUNT_NOT_FOUND` — intentionally indistinguishable from a missing
seller (`seller-accounts.service.ts:147-167`), verified by e2e (`:307-324`).

**Verification indicator.** The **only** trust signal is `phoneVerified`, derived
server-side from `phoneVerifiedAt`. No ratings, reviews, transaction counts,
response rates, or "sales" stats exist anywhere — correct, since the product has
no order/review system.

**Listing display.** There is **no seller-listings endpoint in the frozen contract**
(`sellers/api.ts` notes this explicitly). The page therefore shows the profile
header + an honest `EmptyState`: if `activeListingCount > 0` it explains listings
are not listed here and routes to `/search`; otherwise it shows "no active
listings". It never fabricates a grid (`seller/[slug]/page.tsx:102-128`).

**Identity/join/location.** `displayName`, `memberSince`, `activeListingCount`, and
`bio` are rendered. There is no avatar image (a `UserRound` icon is shown) and no
location field on the public profile (location lives per-listing only).

**Contact / share / navigation.** No contact action on the seller page (contact is
per-listing via the reveal flow). No share button on the seller page (share is a
listing-level control `ShareButton`). Breadcrumbs link back to Home.

**Defect found.** `generateMetadata` reads `profile.sellerSlug`, but the runtime
field is `slug` → canonical URL renders as `/seller/undefined` (CONTRACT-001).

## 3. Private account overview (`/account`)

**Data (verified).** `GET /me` returns `MyProfile` = `SafeUser` + `avatarKey` +
`seller` (`users.service.ts:29-37`):

- User: `id`, `phone` (own), `displayName`, `role`, `status`, `phoneVerified`,
  `phoneVerifiedAt`, `avatarKey`, `createdAt`.
- Seller: `id`, `type` (INDIVIDUAL), `displayName`, `slug`, `bio`, `status`,
  `createdAt`, `updatedAt`.

`SafeUser` explicitly excludes `passwordHash`, `failedLoginAttempts`, `lockedUntil`
(`user.presenter.ts:1-4`); the e2e (`profile.e2e-spec.ts:164-166`) asserts
`lockedUntil`/`failedLoginAttempts`/`ownerUserId` are absent.

**Rendered.** The account card shows initials avatar, `displayName`, verified badge
(only when `phoneVerified`), own phone (`dir=ltr`), role label, and member-since. If
unverified, an inline warning links to `/auth/verify`. It then links to security,
favorites, my-listings, the public seller page (`/seller/{profile.seller.slug}`),
and (non-USER only) the admin panel. A logout button sits at the bottom.

**Editability.** Only the display name is inline-editable; `PATCH /me` accepts
`displayName` (2–80, trimmed), `avatarKey`, and `seller.{displayName,bio}`.
`seller.slug` is immutable. Validation is server-authoritative (`VALIDATION_ERROR`);
the UI binds `fieldErrors` to the name input. `avatarKey` is accepted but never
rendered (PROFILE-002).

**Save / dirty / failure.** The name edit has explicit ذخیره / انصراف and shows
"ذخیره نمایش نام ناموفق بود" on failure; on success `useUpdateProfile` writes the
fresh profile into `account.profile` and patches `auth.me` (header stays in sync).
There is **no** dirty-state/beforeunload guard on the inline edit (UX-003).

**Session state.** `useAuthBootstrap` drives the gate; if the profile fetch 401s
mid-page, the view routes to login. Logout here uses `useLogout` (see SESSION-001).

## 4. Personal listings (`/my-listings`)

**Data.** `GET /me/listings` (cursor, newest-first) filtered by optional `status`;
`GET /me/listings/{id}` for the single owner read. Both are seller-role + bearer
(`me-listings.controller.ts`). The owner view returns `contactMethods` incl.
`valueOverride`, `rejectedReason`/`rejectedNote`, `views`, `favoriteCount` — owner-only
fields kept out of the public presenter (`listing.presenter.ts` vs
`public-listing.presenter.ts`).

**States (real business model).** `DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `REJECTED`,
`SOLD`, `ARCHIVED` (`ListingStatus`). Tabs are `ALL` + each status; labels/hints are
localized (`format.ts`, `my-listings/view-model.ts`). There is no "paused"/"expired"
tab — expiry is a runtime condition surfaced through `formatExpiryCountdown`.

**Actions + rules (`listingLifecycle`):**
- renew: `ACTIVE` (extend) or `ARCHIVED` (republish → DRAFT).
- mark-sold: `ACTIVE` → `SOLD` (irreversible, confirmed inline).
- archive: `ACTIVE` → `ARCHIVED` (reversible via renew).
- edit: `DRAFT` | `REJECTED` | `ACTIVE` → `/sell/{id}/edit`.
- view public: `ACTIVE` | `SOLD` → `/listing/{slug}`.

All mutations pass `expectedVersion` (optimistic concurrency); the backend rejects
stale `version` (409) and the UI re-reads the single record + invalidates the list.

**Ownership.** Every command and read derives the seller from the JWT `user.id`
(`listings.controller.ts:61-148`, `me-listings.controller.ts:38,49`). A user cannot
read or mutate another user's listing/draft by changing an id; the service filters by
owner (`listForOwner`/`getForOwner`/`updateForOwner`/`submitForReview`/`markSold`/
`archive`/`renew`/`listRevisions`).

**Empty/pagination/errors.** Empty states per tab; "load more" cursor button; error
state with retry; `describeSellError` for lifecycle failure messages.

## 5. Favorites (`/favorites`)

**Data.** `GET /me/favorites` (cursor), `POST /favorites/{listingId}` (201 / 409),
`DELETE /favorites/{listingId}` (204 / 404). All bearer + keyed by `user.id`
(`favorites.controller.ts`). Backend `UNIQUE(userId, listingId)` is the de-dup
arbiter (`favorites.service.ts:100`); the counter and analytic row move in the same
transaction.

**Visibility.** The feed only returns listings whose seller is active, not deleted,
and in the public states `ACTIVE` (within runway) or `SOLD` (`favorites.service.ts:132-141`).

**Client behavior.** The save button state set (`favorites.ids`) is an id walk capped
at 5 cursor pages; the toggle is optimistic with conflict convergence
(`FAVORITE_ALREADY_EXISTS`→saved, `FAVORITE_NOT_FOUND`→unsaved) and rollback on other
errors (`favorites/hooks.ts:51-85`). The favorites page uses `useInfiniteQuery`;
each card carries a `FavoriteButton` so unsaving is one tap. Guests route to login
with `next` preserved.

**Isolation.** Server-scoped per user; no cross-account read is possible. Cross-session
cache isolation is the open item (CACHE-001) — the `/me/favorites` **list** key is
cleared on logout, but the shared `favorites.ids` key is removed via `favorites.all`
on the stronger logout path only.

## 6. Authentication, verification, and recovery

**Register** (`POST /auth/register`): phone + password (+ optional displayName).
The backend creates the user **and** provisions a single `INDIVIDUAL` seller account
with a unique slug (`seller-accounts.service.ts:44-108`). The response sets the
HttpOnly refresh cookie and returns `tokens.accessToken` (which the frontend stores
in-memory) + `user`. The frontend then routes to `/auth/verify` (unverified).

**Verification** (`POST /auth/verify-phone`, `POST /auth/verify-phone/resend`): SMS
OTP; the form bootstraps the session from the refresh cookie (reload-safe) and only
shows "شماره تأیید شد" after the server returns a verified `user` — `alreadyVerified =
user.phoneVerified === true` (`verify-form.tsx:70`). Resend has a 60s cooldown + a
1s countdown; `OTP_RESEND_TOO_SOON` maps to `Retry-After`.

**Login** (`POST /auth/login`): verified users → `next`; unverified users →
`/auth/verify?next=…`. Handles `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`,
`ACCOUNT_NOT_ACTIVE`, `RATE_LIMITED`, `VALIDATION_ERROR`.

**Recovery** (`POST /auth/forgot-password`, `POST /auth/reset-password`): forgot ends
with a generic message (anti-enumeration); reset takes `phone + code + newPassword`
and revokes every refresh session on success (204). The reset form then deep-links to
login with `?reset=1`.

**HTTPS redirects.** `?next=` is sanitized by `sanitizeNextPath` (internal,
single-slash; rejects `//` and control/backslash chars) — open-redirect safe.

## 7. Account security & session lifecycle

- **Tokens:** access token in JS memory only (`token-store.ts`); refresh token in an
  HttpOnly `SameSite=…; Path=/api/v1/auth` cookie (secure in prod). No localStorage /
  sessionStorage / URL / log usage for either (verified by grep + code review).
- **Rotation + reuse:** each refresh rotates the cookie; reusing a consumed token
  triggers `SESSION_REUSE_DETECTED` → family revocation (`session.service.ts`,
  `auth.service.ts:194-210`).
- **Single-flight refresh:** concurrent 401s share one `refreshAccessToken()` promise;
  the original request replays exactly once (`client.ts:96-134,245-265`).
- **SSR concern (verified safe here):** the backend refresh cookie path is
  `/api/v1/auth`, and server reads (`server.ts`) never forward the refresh cookie or
  consume a one-time token — the refresh token is only sent to `/auth/refresh`.
- **Logout / revoke:** `/logout` (202→204) revokes the session + clears cookie;
  `/logout-all` revokes all; `DELETE /sessions/{id}` revokes one (clears cookie if it
  was the current session). `change-password` keeps the current session and revokes
  others; `reset-password` revokes all.
- **Sessions UI:** `/account/security` lists sessions with localized device labels,
  IP (bidi-isolated) and last-used; revoke/logout-all are two-step confirmed.
- **Defect found:** three sign-out paths (account-page logout, revoke-current,
  logout-all) clear fewer caches and do not clear the middleware marker cookie
  (CACHE-001, SESSION-001).

## 8. Privacy & account lifecycle

- **Public vs private boundary:** cleanly separated by presenters (SafeUser /
  PublicSellerProfile / PublicListingDetail / OwnerListing). Public responses never
  contain internal ids, phone, moderation, or contact values.
- **Contact values:** never embedded; revealed per-listing on demand via
  `POST /listings/{id}/contact` (idempotent) and kept in component-local state.
- **Drafts:** user-namespaced in localStorage (`weshbazar.sell-draft.v1.<userId>`),
  cleared for the user on logout; legacy unscoped keys are quarantined pending
  explicit ownership confirmation (`sell/draft.ts`, `sell-provider.tsx`).
- **Account deletion:** **not exposed** in the frozen v1 contract (PROFILE-003).
  Soft deletion exists only as an admin action; no user-facing deactivation/delete.
- **Retention:** no legal retention policy is asserted here — flagged as a product /
  legal decision.

## Verified-in-suite vs not-verified

- Backend e2e covers profile CRUD, public-seller safety, moderation hiding, favorites,
  listings ownership, media, engagement, refresh-reuse (per README + `profile.e2e-spec.ts`).
- Frontend: 264 unit/view-model tests green; typecheck green.
- **Not browser-verified** (no Playwright/axe in this environment): visual layout at
  390×844 / 1440×900, keyboard completeness, focus-visible, target-size, full
  A→B account-switch sequence, and in-flight-request repopulation (all marked
  NOT VERIFIED in the register).