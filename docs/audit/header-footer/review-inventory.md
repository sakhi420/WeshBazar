<!-- @format -->

# Review Inventory — Header, Navigation & Footer

Every file inspected during the audit, with review status.

## Root Layout & Providers

| File                    | Lines | Type   | Callers          | Dependencies                                                                  | Tests | Status   |
| ----------------------- | ----- | ------ | ---------------- | ----------------------------------------------------------------------------- | ----- | -------- |
| `src/app/layout.tsx`    | 1-77  | Server | Root             | `Providers`, `MobileHeader`, `DesktopHeader`, `SiteFooter`, `MobileBottomNav` | None  | Reviewed |
| `src/app/providers.tsx` | 1-46  | Client | `layout.tsx`     | `QueryClientProvider`, `NuqsAdapter`, `AuthProvider`                          | None  | Reviewed |
| `src/app/globals.css`   | 1-85  | —      | `layout.tsx`     | Tailwind, CSS custom properties                                               | None  | Reviewed |
| `src/app/error.tsx`     | 1-38  | Client | Next.js boundary | `PageContainer`, `ErrorState`                                                 | None  | Reviewed |
| `src/app/not-found.tsx` | 1-36  | Server | Next.js 404      | `PageContainer`, `Button`                                                     | None  | Reviewed |
| `src/app/loading.tsx`   | 1-19  | Server | Root loading     | `PageContainer`, `Skeleton`                                                   | None  | Reviewed |
| `src/app/page.tsx`      | 1-160 | Server | Home page        | `SearchField`, `LocationPicker`, listing/category fetchers                    | None  | Reviewed |

## Layout Components

| File                                            | Lines | Type   | Callers           | Tests | Status   |
| ----------------------------------------------- | ----- | ------ | ----------------- | ----- | -------- |
| `src/components/layout/desktop-header.tsx`      | 1-44  | Server | `layout.tsx`      | None  | Reviewed |
| `src/components/layout/mobile-header.tsx`       | 1-35  | Server | `layout.tsx`      | None  | Reviewed |
| `src/components/layout/site-header.tsx`         | 1-45  | Server | **UNUSED**        | None  | Reviewed |
| `src/components/layout/site-footer.tsx`         | 1-81  | Server | `layout.tsx`      | None  | Reviewed |
| `src/components/layout/mobile-bottom-nav.tsx`   | 1-101 | Client | `layout.tsx`      | None  | Reviewed |
| `src/components/layout/header-auth-actions.tsx` | 1-66  | Client | Headers           | None  | Reviewed |
| `src/components/layout/page-container.tsx`      | 1-17  | Both   | Multiple pages    | None  | Reviewed |
| `src/components/layout/section-header.tsx`      | 1-24  | Both   | Home page         | None  | Reviewed |
| `src/components/layout/page-heading.tsx`        | 1-25  | Both   | Various pages     | None  | Reviewed |
| `src/components/layout/breadcrumbs.tsx`         | 1-45  | Both   | Seller page       | None  | Reviewed |
| `src/components/layout/route-scaffold.tsx`      | 1-34  | Server | Placeholder pages | None  | Reviewed |

## Brand & Config

| File                                  | Lines | Type | Status   |
| ------------------------------------- | ----- | ---- | -------- |
| `src/components/brand/brand-logo.tsx` | 1-40  | Both | Reviewed |

## Auth Feature

| File                                    | Lines | Type        | Status   |
| --------------------------------------- | ----- | ----------- | -------- |
| `src/middleware.ts`                     | 1-47  | Edge        | Reviewed (2026-10-14) |
| `src/components/auth/auth-provider.tsx` | 1-131 | Client      | Reviewed |
| `src/features/auth/index.ts`            | 1-14  | Barrel      | Reviewed |
| `src/features/auth/types.ts`            | 1-87  | Types       | Reviewed |
| `src/features/auth/api.ts`              | 1-97  | Data access | Reviewed |
| `src/features/auth/hooks.ts`            | 1-48  | Client      | Reviewed |

## Auth Pages

| File                                    | Lines | Type   | Status   |
| --------------------------------------- | ----- | ------ | -------- |
| `src/app/auth/login/page.tsx`           | 1-50  | Server | Reviewed |
| `src/app/auth/register/page.tsx`        | 1-45  | Server | Reviewed |
| `src/app/auth/verify/page.tsx`          | 1-46  | Server | Reviewed |
| `src/app/auth/forgot-password/page.tsx` | 1-38  | Server | Reviewed |
| `src/app/auth/reset-password/page.tsx`  | 1-51  | Server | Reviewed |

## Search & Location

| File                                              | Lines | Type   | Status   |
| ------------------------------------------------- | ----- | ------ | -------- |
| `src/features/search/components/search-field.tsx` | 1-80  | Client | Reviewed |
| `src/components/location/location-picker.tsx`     | 1-86  | Client | Reviewed |

## API Layer

| File                    | Type                 | Status   |
| ----------------------- | -------------------- | -------- |
| `src/lib/api/index.ts`  | Barrel               | Reviewed |
| `src/lib/api/client.ts` | Client fetch adapter | Reviewed |

## Tests Discovered

| Test                                                     | Result | Notes                                            |
| -------------------------------------------------------- | ------ | ------------------------------------------------ |
| `src/features/admin/__tests__/admin-users-view.test.tsx` | FAIL   | Missing `@testing-library/user-event` dependency |
| No header, nav, footer, or auth tests found              | N/A    | Zero coverage for shared layout components       |

## Routes Discovered

| Route                   | Page                                    | Type             | Status      |
| ----------------------- | --------------------------------------- | ---------------- | ----------- |
| `/`                     | `src/app/page.tsx`                      | Public           | Implemented |
| `/search`               | `src/app/search/page.tsx`               | Public           | Implemented |
| `/category/[slug]`      | `src/app/category/[slug]/page.tsx`      | Public           | Implemented |
| `/listing/[slug]`       | `src/app/listing/[slug]/page.tsx`       | Public           | Implemented |
| `/seller/[slug]`        | `src/app/seller/[slug]/page.tsx`        | Public           | Implemented |
| `/favorites`            | `src/app/favorites/page.tsx`            | Auth required    | Implemented |
| `/my-listings`          | `src/app/my-listings/page.tsx`          | Auth required    | Implemented |
| `/sell` (+ sub-routes)  | `src/app/sell/`                         | Auth required    | Implemented |
| `/account`              | `src/app/account/page.tsx`              | Auth required    | Implemented |
| `/account/security`     | `src/app/account/security/page.tsx`     | Auth required    | Implemented |
| `/admin`                | `src/app/admin/page.tsx`                | MODERATOR/ADMIN  | Implemented |
| `/admin/listings`       | `src/app/admin/listings/page.tsx`       | MODERATOR/ADMIN  | Implemented |
| `/admin/users`          | `src/app/admin/users/page.tsx`          | MODERATOR/ADMIN  | Implemented |
| `/admin/reports`        | `src/app/admin/reports/page.tsx`        | MODERATOR/ADMIN  | Implemented |
| `/admin/locations`      | `src/app/admin/locations/page.tsx`      | MODERATOR/ADMIN  | Implemented |
| `/admin/taxonomy`       | `src/app/admin/taxonomy/page.tsx`       | MODERATOR/ADMIN  | Implemented |
| `/admin/audit`          | `src/app/admin/audit/page.tsx`          | MODERATOR/ADMIN  | Implemented |
| `/auth/login`           | `src/app/auth/login/page.tsx`           | Public           | Implemented |
| `/auth/register`        | `src/app/auth/register/page.tsx`        | Public           | Implemented |
| `/auth/verify`          | `src/app/auth/verify/page.tsx`          | Session required | Implemented |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` | Public           | Implemented |
| `/auth/reset-password`  | `src/app/auth/reset-password/page.tsx`  | Public           | Implemented |

## Routes Referenced But Not Implemented

| Referenced path | Where referenced            | Status         |
| --------------- | --------------------------- | -------------- |
| `/categories`   | `MobileBottomNav` (line 12) | 404            |
| `/about`        | Not referenced anywhere     | Does not exist |
| `/help`         | Not referenced anywhere     | Does not exist |
| `/help/safety`  | Not referenced anywhere     | Does not exist |
| `/contact`      | Not referenced anywhere     | Does not exist |

## Unused Components

| File                                    | Status                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/components/layout/site-header.tsx` | Not imported by any file — `DesktopHeader` + `MobileHeader` split is the actual implementation |

## Summary

- **Files inspected:** 46+
- **Components traced:** 23 (inc. middleware)
- **Routes verified:** 22 implemented, 5 referenced but non-existent
- **Tests found:** 24 test files across codebase (none for layout/auth)
- **Unused code:** 1 component (`SiteHeader`)
- **Middleware:** Found and verified — previously missed in initial audit
  | `src/lib/api/token-store.ts` | In-memory token | Reviewed |
  | `src/lib/api/errors.ts` | Error mapping | Reviewed |
  | `src/lib/api/types.ts` | Shared types | Reviewed |
  | `src/lib/api/query-keys.ts` | Query key factory | Reviewed |
  | `src/lib/api/server.ts` | RSC fetch | Reviewed |
  | `src/lib/env.ts` | Env vars | Reviewed |
  | `src/config/brand.ts` | 1-32 | — | Reviewed |
  | `src/config/site.ts` | 1-14 | — | Reviewed |
  | `tailwind.config.ts` | 1-130 | — | Reviewed |
  | `src/lib/i18n/config.ts` | 1-29 | — | Reviewed |
