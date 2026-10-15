# Review Inventory — Profile / Account Audit

Status key: **F** = fully reviewed (read in full), **P** = partially reviewed
(targeted ranges + call sites read), **N** = not reviewed (listed for completeness).

> A file listed as "P" is read at the cited lines/methods; surrounding logic was
> inspected via search + call-site tracing. This is not a claim of line-by-line
> coverage for every file.

## Frontend — HTTP boundary & session state

| File | Responsibility | Review |
| --- | --- | --- |
| `src/lib/api/client.ts` | Browser HTTP adapter; single-flight refresh; replay-once; error mapping | F |
| `src/lib/api/server.ts` | RSC `serverGet` / `serverGetCursorPage` (public reads + cache hints) | F |
| `src/lib/api/errors.ts` | `ApiError`, stable code catalog, session-terminal set, retriable GET | F |
| `src/lib/api/token-store.ts` | In-memory access token (module state) + listeners | F |
| `src/lib/api/query-keys.ts` | TanStack Query key factory (note: keys not user-scoped) | F |
| `src/lib/api/types.ts` / `index.ts` / `browser.ts` | Envelope + pagination types; barrels | F |
| `src/components/auth/auth-provider.tsx` | Auth context; `performLogout`; middleware marker cookie | F |
| `src/middleware.ts` | Soft route guard on `weshbazar_session` cookie | F |
| `src/app/providers.tsx` / `layout.tsx` | QueryClient config; self-hosted Vazir; RTL shell | F |

## Frontend — auth feature

| File | Responsibility | Review |
| --- | --- | --- |
| `src/features/auth/api.ts` | login/register/logout/bootstrap/verify/resend/reset | F |
| `src/features/auth/hooks.ts` | `useAuthBootstrap` (checking/ready/anonymous/unreachable) | F |
| `src/features/auth/types.ts` | User/Me/session DTO mirrors | F |
| `src/features/auth/validation.ts` | phone/password/OTP/`next` sanitization helpers | F |
| `src/features/auth/components/login-form.tsx` / `register-form.tsx` | sign-in / sign-up forms + cache drop on identity swap | F |
| `src/features/auth/components/verify-form.tsx` | OTP verify; backend-derived verification state | F |
| `src/features/auth/components/forgot-form.tsx` / `reset-form.tsx` | recovery forms | P |
| `src/features/auth/components/password-field.tsx` | autocomplete/paste/visibility toggle | F |
| `src/features/auth/components/{phone-input,otp-input,form-field,form-error,auth-card}.tsx` / `index.ts` | form primitives | P |
| `src/app/auth/{login,register,verify,forgot-password,reset-password}/page.tsx` | thin RSC pages with `sanitizeNextPath` | F |

## Frontend — account & security feature

| File | Responsibility | Review |
| --- | --- | --- |
| `src/features/account/api.ts` | `/me`, sessions, revoke, logout-all, change-password, change-phone | F |
| `src/features/account/hooks.ts` | profile update, `useLogout`, `useSignOutLocal`, sessions, `useLogoutAll`, `useChangePassword` (contains `clearUserCaches`) | F |
| `src/features/account/types.ts` / `format.ts` / `session-label.ts` | DTOs + Persian formatting + session labels | F |
| `src/features/account/components/account-view.tsx` | profile card + inline name edit + nav + logout | F |
| `src/features/account/components/security-view.tsx` | security page gate + layout | F |
| `src/features/account/components/security-password-section.tsx` | change password form | F |
| `src/features/account/components/security-phone-section.tsx` | 2-step phone change | F |
| `src/features/account/components/security-sessions-section.tsx` | sessions list + revoke/logout-all (uses `useSignOutLocal`) | F |
| `src/app/account/page.tsx` / `src/app/account/security/page.tsx` | private RSC pages (`robots: noindex`) | F |

## Frontend — favorites, listings, sellers, contacts, drafts

| File | Responsibility | Review |
| --- | --- | --- |
| `src/features/favorites/api.ts` / `hooks.ts` | save/unsave/list + ids walk + optimistic toggle | F |
| `src/features/favorites/components/favorite-button.tsx` / `favorites-view.tsx` | save button + favorites grid | F |
| `src/features/favorites/view-model.ts` | DTO→card adaptation | P |
| `src/features/listings/my-listings/view-model.ts` / `hooks.ts` | status tabs + lifecycle perms + mutations | F |
| `src/features/listings/my-listings/components/my-listings-view.tsx` / `listing-manage-card.tsx` | management hub + per-row actions | F |
| `src/features/sellers/api.ts` / `types.ts` | public seller profile read | F |
| `src/app/seller/[slug]/page.tsx` | public seller profile page (uses `sellerSlug`) | F |
| `src/features/listings/sell/draft.ts` | user-scoped draft keys + clear-on-logout | F |
| `src/features/contacts/api.ts` / `components/contact-section.tsx` | contact reveal (component-local state, not cached) | F |
| `src/features/listings/edit/*` / `src/app/sell/*` | seller edit + sell wizard | P (draft model only) |

## Backend (frozen v1.0.0 — contract + authorization verification)

| File | Responsibility | Review |
| --- | --- | --- |
| `prisma/schema.prisma` | User/SellerAccount/RefreshSession/VerificationChallenge/Listing/Favorite | F |
| `common/presenters/user.presenter.ts` | `SafeUser` (no passwordHash/lockout) | F |
| `common/presenters/seller.presenter.ts` | `PublicSellerProfile` (`slug`, no ids/phone) vs `MySellerAccount` | F |
| `common/presenters/listing.presenter.ts` | `OwnerListing` (owner-only fields) | F |
| `common/presenters/public-listing.presenter.ts` | public listing (no moderation/contact/rejection) | F |
| `modules/users/users.controller.ts` / `users.service.ts` | `GET/PATCH /me` | F |
| `modules/sellers/sellers.controller.ts` / `seller-accounts.service.ts` | public profile; 404 for suspended/banned/deleted | F |
| `modules/auth/auth.controller.ts` | login/register/refresh/logout/verify shaping | F |
| `modules/auth/auth.service.ts` | token issuing/rotation (not line-by-line) | P |
| `modules/favorites/favorites.controller.ts` / `favorites.service.ts` | favorites ownership + visibility | F |
| `modules/listings/listings.controller.ts` / `me-listings.controller.ts` | owner command surface + owner feed | F |
| `modules/listings/listings.service.ts` | `updateForOwner`/`submitForReview`/`getForOwner` (not line-by-line) | P |
| `apps/api/test/e2e/profile.e2e-spec.ts` | profile + public-seller + moderation-hiding e2e | F |
| `modules/users/dto/update-me.dto.ts` / `me-responses.dto.ts` / `sellers/dto/seller-responses.dto.ts` | DTO validation + shape | F |
| `modules/contacts/contacts.controller.ts` / `contacts.service.ts` | contact reveal (not line-by-line) | N |

## Unreviewed / not-yet-verified (honest limits)

- Browser-level (Playwright/axe) verification of the profile/seller/favorites pages
  was **not** run in this environment (no browser harness available). Visual/a11y
  assertions below are code-level only → marked **NOT VERIFIED** where applicable.
- `apps/api/src/modules/listings/listings.service.ts` and `auth.service.ts` full
  bodies were not read line-by-line; ownership checks were confirmed at controller
  level + via e2e coverage + `api-contract-audit.md` assertions.
- `contacts` backend service (reveal payload) not line-read; the frontend reveal is
  confirmed to keep values in component-local state only.