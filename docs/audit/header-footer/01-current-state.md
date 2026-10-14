<!-- @format -->

# 01 — Current State Audit

## WeshBazar Shared Header, Navigation & Footer

**Date:** 2026-10-14

**Status:** Complete — verified against implementation

---

## 1. Architecture Overview

WeshBazar uses a **single root layout** (`src/app/layout.tsx`) that wraps all routes. There are **no route group layouts** and **no nested layout variants**. All pages share:

```

<html dir="rtl" lang="fa-AF">

 <body>

 <Providers>

 <SkipLink />

<MobileHeader /> <!-- screens < 768px -->

<DesktopHeader /> <!-- screens >= 768px -->

 <main>{children}</main>

<MobileBottomNav /> <!-- screens < 768px -->

 <SiteFooter />

 </Providers>

 </body>

</html>

```

### Responsive Strategy

- **768px boundary** (`lg:`): Switches between mobile/desktop header and shows/hides bottom nav.

- **Mobile header**: 56px height (`h-header`), `sticky top-0`, `lg:hidden`.

- **Desktop header**: 64px height (`h-[4rem]`), `sticky top-0`, `hidden lg:flex`.

- **Mobile bottom nav**: 64px height (`--bottom-nav`), `fixed bottom-0`, `lg:hidden`.

- No CSS `display:none` for either header; both render and rely on responsive classes to hide.

### Unused Component

`src/components/layout/site-header.tsx` is a complete header component that is **never imported**. It appears to be an earlier iteration that was replaced by the DesktopHeader/MobileHeader split. It provides a search link (not inline search) and renders on all screen sizes.

### Middleware (UPDATED — 2026-10-14)

`src/middleware.ts` (47 lines, 1833 bytes) — **EXISTS** and is fully implemented. Previously reported as missing but found during re-verification.

#### Behavior
1. Reads `weshbazar_session` cookie (set by `AuthProvider` on successful bootstrap)
2. Redirects authenticated users away from `/auth/login` and `/auth/register` → `/`
3. Redirects guests from protected prefixes to `/auth/login?next=ORIGINAL_PATH`
4. Protected prefixes: `/favorites`, `/account`, `/my-listings`, `/sell`, `/admin`

#### Matcher Config
Excludes `_next`, `api`, `favicon`, `brand`, `fonts`, `media` — only runs on page routes.

#### Assessment
**PASS** — Middleware implements server-side auth gating as specified. HF-SEC-001 is resolved.

---
---

## 2. Desktop Header (`desktop-header.tsx`)

**File:** `src/components/layout/desktop-header.tsx` (44 lines)

**Type:** Server Component

**Visible:** `lg:` (>= 768px)

### Structure (RTL order)

Position | Element | Type | Details |

---|---|---|---|

Start (right in RTL) | Logo | `Link` to `/` | `BrandLogo height={34} priority` |

— | Search | `SearchField` | Flex-1, max-w-xl, inline search |

— | Categories | `Button ghost icon` | `Grid3X3` icon, `aria-label="دسته‌بندی‌ها"`, links to `/search` |

— | Sell CTA | `Button accent sm` | `Plus` icon "ثبت آگهی", links to `/sell` |

End (left in RTL) | Auth actions | `HeaderAuthActions` | Client Component |

### Key Observations

1. **Search field is inline** but uses `useQueryState('q')` from nuqs, writing the `q` param to the **current page URL**. On non-search pages (account, admin, seller), submitting search does not navigate to `/search` and produces no search results.

2. **Category button** is a `Grid3X3` icon with `aria-label="دسته‌بندی‌ها"` but links to `/search`, not a category browser. This is misleading.

3. **`redirectToSearch` prop is defined** in `SearchFieldProps` interface but **never implemented** in the component body. The prop is destructured but unused. Passing it from `DesktopHeader` would have no effect without also implementing the redirect logic in `SearchField`.

---

## 3. Mobile Header (`mobile-header.tsx`)

**File:** `src/components/layout/mobile-header.tsx` (35 lines)

**Type:** Server Component

**Visible:** `lg:hidden` (< 768px)

### Structure

Position | Element | Type | Details |

---|---|---|---|

Start | Logo | `Link` to `/` | `BrandLogo height={28} priority` |

End | Sell icon | `Button accent icon` | Only on `xs:` (>= 360px). `Plus` icon, links to `/sell` |

End | Auth actions | `HeaderAuthActions` | Client Component |

### Key Observations

1. **No search access** in the mobile header. Users must tap the "جستجو" tab in the bottom nav or navigate to `/search` manually.

2. **Sell CTA is icon-only** on mobile, hidden below 360px (`xs:` breakpoint).

3. The unused `SiteHeader` had a search entry pattern (tappable link to `/search`) that was not carried into `MobileHeader`.

---

## 4. Site Footer (`site-footer.tsx`)

**File:** `src/components/layout/site-footer.tsx` (81 lines)

**Type:** Server Component

**Rendered on:** All pages

### Structure

```

┌────────────────────────────────────────┐

│ [Logo] │

│ Description paragraph │

│ Tip text │

├──────────────┬─────────────────────────┤

│ بازار │ حساب │

│ صفحه اصلی │ ورود به حساب │

│ جست‌وجو │ علاقه‌مندی‌ها │

│ ثبت آگهی │ آگهی‌های من │

│ │ حساب کاربری │

├──────────────┴─────────────────────────┤

│ WeshBazar © ۱۴۰۵ همه حقوق محفوظ │

└────────────────────────────────────────┘

```

### Link Inventory

Link text | Href | Route exists? | Auth required? |

---|---|---|---|

صفحه اصلی | `/` | ✅ | No |

جست‌وجوی آگهی‌ها | `/search` | ✅ | No |

ثبت آگهی | `/sell` | ✅ | Yes (redirect) |

ورود به حساب | `/auth/login` | ✅ | No |

علاقه‌مندی‌ها | `/favorites` | ✅ | Yes (redirect) |

آگهی‌های من | `/my-listings` | ✅ | Yes (redirect) |

حساب کاربری | `/account` | ✅ | Yes (redirect) |

### Key Observations

1. **All links resolve** to existing routes. No broken links.

2. **Links are static** — the footer is a Server Component with no auth awareness. Authenticated users see "ورود به حساب" and anonymous users see links to protected routes. Routes handle redirect — this is acceptable but not ideal.

3. **No safety/help/about/contact links**. Footer lacks trust and support content.

4. **No invented content**. No phone numbers, emails, social accounts, or certifications.

5. **Dark teal background** with white text provides good contrast.

6. **Persian year** via `Intl.NumberFormat('fa-AF')` — correct.

---

## 5. Mobile Bottom Navigation (`mobile-bottom-nav.tsx`)

**File:** `src/components/layout/mobile-bottom-nav.tsx` (101 lines)

**Type:** Client Component (needs `usePathname` and `useAuth`)

**Visible:** `lg:hidden` (< 768px)

### Tabs

Tab | Icon | Href | Active when | Auth-aware? |

---|---|---|---|---|

خانه | `Home` | `/` | `pathname === '/'` | No |

جستجو | `Search` | `/search` | `pathname.startsWith('/search')` | No |

دسته‌ها | `Grid3X3` | `/categories` | `pathname.startsWith('/categories')` | No |

نشان‌ها | `Heart` | `/favorites` | `pathname.startsWith('/favorites')` | No |

مدیریت | `Shield` | `/admin` | `pathname.startsWith('/admin')` | Yes (MODERATOR/ADMIN only) |

حساب | `User` | `/account` or `/auth/login` | `/account` or `/auth/login` | Yes (auth state) |

### Key Observations

1. **"دسته‌ها" tab links to `/categories`** which **does not exist** (404). This is a P1 defect.

2. **Admin tab** conditionally renders only for MODERATOR/ADMIN users.

3. **Account tab** dynamically links to `/account` when authenticated, `/auth/login` when not.

4. **Active state** is color-only (`text-primary` vs `text-muted-foreground`). No shape or border indicator.

5. **All icons have visible text labels** — accessible.

6. **Fixed bottom with safe-area inset**: `pb-[env(safe-area-inset-bottom,0px)]`.

7. **Height**: `var(--bottom-nav)` = 4rem (64px).

8. **Favorites tab** does NOT check auth state — always shows, even for guests.

---

## 6. Header Auth Actions (`header-auth-actions.tsx`)

**File:** `src/components/layout/header-auth-actions.tsx` (66 lines)

**Type:** Client Component

**Used by:** `DesktopHeader`, `MobileHeader`, `SiteHeader` (unused)

### States

Auth Status | Rendered UI |

---|---|

`checking` | Spinning `Loader2` icon, `aria-label="در حال بررسی وضعیت حساب…"` |

`ready` `user` | User name button → `/account`, Admin button (if MODERATOR/ADMIN), Logout icon button |

`anonymous` | Login icon button → `/auth/login` |

`unreachable` | Login icon button → `/auth/login` |

### Key Observations

1. **Admin link** appears based on client-side `user.role === 'MODERATOR' || user.role === 'ADMIN'`. Backend enforces authorization on API calls — this is a UI convenience.

2. **Logout** calls `performLogout()` which clears session cookie, access token, all query caches, and redirects to `/`.

3. **User name** is truncated at 128px (`max-w-32 truncate`).

4. **All buttons have accessible labels** via `aria-label`.

---

## 7. Authentication System

### Auth Bootstrap Flow (`hooks.ts`)

```

Page Load → useAuthBootstrap (TanStack Query)

├─ hasAccessToken()? → fetchCurrentUser() → MeResponse

└─ no token → refreshAccessToken()

├─ success → fetchCurrentUser() → status: 'ready'

└─ fail (401) → status: 'anonymous'

```

### Auth Provider (`auth-provider.tsx`)

- Manages `weshbazar_session` cookie for middleware (planned).

- `performLogout()` clears 7 query cache groups, session cookie, access token, and redirects to `/`.

- Single-flight token refresh via API client.

### Session Handling

- **Access token**: In-memory only (via `token-store.ts`). Never persisted to localStorage.

- **Refresh cookie**: HttpOnly, path=`/api/v1/auth`. Browser never sends it on page requests.

- **Session cookie**: `weshbazar_session=1`, path=`/`, SameSite=Lax. Non-HttpOnly indicator for middleware.

---

## 8. Search Behavior

**Component:** `src/features/search/components/search-field.tsx` (80 lines, Client Component)

### How it works

1. Reads initial value from URL `q` param via nuqs `useQueryState`.

2. Local state (`value`) mirrors the URL param for responsive typing.

3. On submit: commits `value.trim()` to URL `q` param (or removes param if empty).

4. Clear button resets both local state and URL param.

### Header integration issues

- `SearchField` accepts a `redirectToSearch` prop but it is **never used**.

- In `DesktopHeader`, search writes `q` to current URL without navigating to `/search`.

- On the home page, this works because `page.tsx` reads `q` and redirects to search. On other pages, no search results appear.

---

## 9. Location Picker

**Component:** `src/components/location/location-picker.tsx` (86 lines, Client Component)

**Used on:** Home page only (not in header)

### Features

- Province/city two-column dropdown.

- URL state via nuqs (`province`, `city` params).

- Escape key closes dropdown.

- Click outside closes dropdown.

- `aria-expanded`, `role="option"`, `aria-selected` attributes.

### Issues

- **Dropdown option buttons lack focus-visible styles** — keyboard users cannot see which option is focused.

- Not integrated into the header. Only available on the home page.

---

## 10. Layout Components (Auxiliary)

### PageContainer (`page-container.tsx`)

Simple constrained container: `container w-full py-section-y`. Used by every page.

### SectionHeader (`section-header.tsx`)

Flex row with H2 title optional icon trailing action link.

### PageHeading (`page-heading.tsx`)

H1 optional description inline-end actions block.

### Breadcrumbs (`breadcrumbs.tsx`)

RTL breadcrumb trail with ChevronLeft separator. Used on seller profile page.

### RouteScaffold (`route-scaffold.tsx`)

Honest placeholder for routes not yet built. Shows title, route path, and construction message.

---

## 11. Auth Pages

All auth pages use the same root layout with full header, footer, and bottom nav.

Page | File | Key features |

---|---|---|

Login | `auth/login/page.tsx` | `?next=` return path, `?reset=1` greeting |

Register | `auth/register/page.tsx` | `?next=` return path |

Verify | `auth/verify/page.tsx` | SMS OTP; requires refreshable session |

Forgot Password | `auth/forgot-password/page.tsx` | Anti-enumeration messaging |

Reset Password | `auth/reset-password/page.tsx` | `?phone=` prefilled if plausible |

All forms use `AuthCard` wrapper with title, description, and footer link (login↔register, etc.).

---

## 12. Tests

**Existing tests:** 24 test files found (admin: 8, auth: 2, listings: 6, account: 2, others: 6). Only 1 test was run (`admin-users-view`) and it FAILED due to missing `@testing-library/user-event`. No tests exist for layout or auth provider components.

**No tests for:**

- `DesktopHeader`, `MobileHeader`, `SiteHeader`, `SiteFooter`

- `MobileBottomNav`, `HeaderAuthActions`

- `AuthProvider`, `useAuthBootstrap`

- `BrandLogo`, `PageContainer`, `SectionHeader`, `PageHeading`, `Breadcrumbs`

- `SearchField`, `LocationPicker`

---

## 13. Design Tokens

All verified against Master Prompt V5:

Token | Spec | Actual | Match |

---|---|---|---|

Primary teal | `#0F766E` | `hsl(175 77% 26%)` | ✅ |

Dark teal | `#0B2F2B` | `hsl(173 62% 11%)` | ✅ |

Soft teal | `#E6F5F3` | `hsl(172 43% 93%)` | ✅ |

Orange accent | `#F59E0B` | `hsl(38 92% 50%)` | ✅ |

Dark orange | `#D97706` | `hsl(32 95% 44%)` | ✅ |

Background | `#F8FAFC` | `hsl(210 40% 98%)` | ✅ |

White surface | `#FFFFFF` | `hsl(0 0% 100%)` | ✅ |

Border | `#E2E8F0` | `hsl(214 32% 91%)` | ✅ |

---

## 14. Summary Statistics

| Metric | Count |
|---|---|
| Routes implemented | 22 |
| Routes referenced but missing | 1 (`/categories`) |
| Components reviewed | 22 |
| Dead code files | 1 (`site-header.tsx`) |
| P0 defects | 0 (middleware exists — verified 2026-10-14) |
| P1 defects | 5 (nav, search, footer) |
| P2 issues | 8 |
| Tests total | 24 test files across codebase |
| Tests run (sampled) | 1 (admin-users-view) |
| Tests failing (sampled) | 1 (missing dependency) |
| Test coverage for layout/auth | 0% (no layout/auth tests exist) |
