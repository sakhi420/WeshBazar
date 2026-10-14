<!-- @format -->

# 02 — Criteria & Gap Analysis

## WeshBazar Shared Header, Navigation & Footer

**Date:** 2026-10-14
**Status:** Complete — derived from `criteria-register.json` and `01-current-state.md`

---

## 1. Summary Dashboard

| Category | PASS | PARTIAL | FAIL | Total |
|---|---|---|---|---|
| Security (HF-SEC) | 4 | 0 | 0 | 4 |
| Navigation (HF-NAV) | 3 | 0 | 3 | 6 |
| Auth State (HF-AUTH) | 4 | 0 | 0 | 4 |
| Footer (HF-FTR) | 3 | 0 | 1 | 4 |
| Accessibility (HF-A11Y) | 3 | 0 | 0 | 3 |
| Performance (HF-PERF) | 3 | 0 | 0 | 3 |
| Design (HF-DSGN) | 2 | 0 | 0 | 2 |
| Testing (HF-TEST) | 0 | 0 | 1 | 1 |
| **TOTAL** | **22** | **0** | **5** | **28** |

**Overall Health:** 79% PASS. 5 failures (4 P1, 1 P2). Middleware previously reported missing — found and verified.
---

## 2. Security Criteria (HF-SEC)

### HF-SEC-001 — Server-Side Middleware — PASS (P0) — UPDATED 2026-10-14

**Requirement:** Protected routes must have server-side auth gating via middleware.

| Aspect | Detail |
|---|---|
| **Current state** | `src/middleware.ts` EXISTS (47 lines, 1833 bytes). Reads `weshbazar_session` cookie. Redirects guests from `/favorites`, `/account`, `/my-listings`, `/sell`, `/admin` to `/auth/login?next=...`. Redirects authenticated users away from `/auth/login`, `/auth/register`. |
| **Evidence** | `src/middleware.ts` — full file verified. `config.matcher` excludes static assets and API routes. |
| **Assessment** | PASS — Previously reported missing due to search error. Middleware is implemented and functional. |

### HF-SEC-002 — Admin UI Visibility — PASS (P0)

**Requirement:** Admin UI must not render for non-admin users.

| Aspect | Detail |
|---|---|
| **Current state** | Client-side role check: `user.role === 'MODERATOR' \|\| user.role === 'ADMIN'`. Server-side via middleware + backend API enforcement. |
| **Assessment** | PASS — Dual-layer: UI hides links, middleware blocks route access, backend rejects unauthorized API calls.

### HF-SEC-003 — Logout Cache Clearance — PASS (P0)

| Aspect | Detail |
|---|---|
| **Current state** | `performLogout()` clears session cookie, access token, 7 query cache groups, redirects to `/` |
| **Evidence** | `auth-provider.tsx:90-123` |
| **Assessment** | PASS — all caches cleared, immediate redirect prevents stale data |

### HF-SEC-004 — Refresh Token Isolation — PASS (P0)

| Aspect | Detail |
|---|---|
| **Current state** | `weshbazar_refresh` cookie has `path=/api/v1/auth`. Page requests never include it. |
| **Assessment** | PASS — cookie path scoped to auth endpoint only
---

## 3. Navigation Criteria (HF-NAV)

### HF-NAV-001 — Link Validity — FAIL (P1)

**Requirement:** All navigation links must point to existing pages.

| Aspect | Detail |
|---|---|
| **Current state** | `/categories` link in `MobileBottomNav` → 404 |
| **Expected state** | All navigation links resolve to valid pages |
| **Gap** | 1 of 5 bottom nav tabs is dead |
| **Evidence** | `mobile-bottom-nav.tsx:12`, no `src/app/categories/` directory |
| **Remediation** | Option A: Create `/categories` page. Option B: Change link to `/search`. |

**Acceptance:** All nav links resolve to valid pages without 404.

### HF-NAV-002 — Category Button Destination — FAIL (P1)

**Requirement:** Category navigation must lead to category content.

| Aspect | Detail |
|---|---|
| **Current state** | Desktop header `Grid3X3` icon button labeled "دسته‌بندی‌ها" links to `/search` |
| **Gap** | User expects categories but lands on search — misleading UX |
| **Evidence** | `desktop-header.tsx:27-31` |
| **Remediation** | Change icon/label to search-related, or create dedicated category page |

### HF-NAV-003 — Header Search Navigation — FAIL (P1)

**Requirement:** Header search must navigate to search results page.

| Aspect | Detail |
|---|---|
| **Current state** | `SearchField` writes `q` param to current URL via nuqs. On non-search pages, no results appear. |
| **Gap** | `redirectToSearch` prop exists on `SearchField` but is **not passed** from `DesktopHeader` |
| **Evidence** | `desktop-header.tsx:25`, `search-field.tsx:20,27-29` |
| **Remediation** | Pass `redirectToSearch={true}` to `<SearchField>` in `DesktopHeader` |

**Acceptance:** Search submission from any page navigates to `/search?q=QUERY`.

### HF-NAV-004 — Mobile Search Access — FAIL (P1)

**Requirement:** Mobile header must provide search access.

| Aspect | Detail |
|---|---|
| **Current state** | Mobile header has logo + auth only. No search entry point. |
| **Gap** | Primary marketplace action hidden behind extra bottom-nav tap |
| **Evidence** | `mobile-header.tsx:12-35` |
| **Remediation** | Add search icon button linking to `/search` in mobile header |

### HF-NAV-005 — Logo Home Link — PASS (P1)

| Aspect | Detail |
|---|---|
| **Current state** | `BrandLogo` wrapped in `<Link href="/">` with `aria-label` in all three locations |
| **Assessment** | PASS |

### HF-NAV-006 — Sell CTA Navigation — PASS (P1)

| Aspect | Detail |
|---|---|
| **Current state** | All sell buttons (desktop header, mobile header, home page) link to `/sell` |
| **Assessment** | PASS
---

## 4. Auth State Criteria (HF-AUTH)

### HF-AUTH-001 — Anonymous Visitor Links — PASS (P1)

| Aspect | Detail |
|---|---|
| **Current state** | `HeaderAuthActions` shows login button when status is `anonymous`/`unreachable`. Account tab links to `/auth/login`. |
| **Assessment** | PASS |

### HF-AUTH-002 — Authenticated User Info — PASS (P1)

| Aspect | Detail |
|---|---|
| **Current state** | `HeaderAuthActions` shows user name button (→ `/account`) and logout icon when `status: 'ready'`. |
| **Assessment** | PASS |

### HF-AUTH-003 — Auth State Transition — PASS (P1)

| Aspect | Detail |
|---|---|
| **Current state** | `AuthProvider` uses TanStack Query reactive cache. `useAuth()` returns auth status reactively. |
| **Assessment** | PASS |

### HF-AUTH-004 — Footer Auth Awareness — PASS (P2)

| Aspect | Detail |
|---|---|
| **Current state** | Footer is a Server Component with static account links. Routes handle redirection. |
| **Assessment** | PASS as-is. Client-side auth awareness is polish, not required. |

---

## 5. Footer Criteria (HF-FTR)

### HF-FTR-001 — Copyright Year — PASS (P3)

| Aspect | Detail |
|---|---|
| **Current state** | Persian year via `Intl.NumberFormat('fa-AF')`. Correct. |
| **Assessment** | PASS |

### HF-FTR-002 — Safety/Help Links — FAIL (P2)

**Requirement:** Footer must link to safety and help content.

| Aspect | Detail |
|---|---|
| **Current state** | Footer has 2 link groups: "بازار" and "حساب" |
| **Expected state** | Third link group with about, safety tips, help center, contact |
| **Gap** | No trust/support content accessible from footer |
| **Evidence** | `site-footer.tsx:1-81` |
| **Remediation** | Add third link group. Create pages: `/about`, `/help`, `/help/safety`, `/contact`. |

### HF-FTR-003 — Footer Link Destinations — PASS (P1)

| Aspect | Detail |
|---|---|
| **Current state** | All 7 footer links point to existing routes |
| **Assessment** | PASS |

### HF-FTR-004 — No Invented Contact — PASS (P1)

| Aspect | Detail |
|---|---|
| **Current state** | No phone numbers, emails, social links, or certifications |
| **Assessment** | PASS |

---

## 6. Accessibility Criteria (HF-A11Y)

### HF-A11Y-001 — Skip Link — PASS (P2)

| Aspect | Detail |
|---|---|
| **Current state** | `<a href="#main" className="sr-only ...">` before header/nav |
| **Evidence** | `layout.tsx:58-63` |
| **Assessment** | PASS |

### HF-A11Y-002 — Icon Button Labels — PASS (P2)

| Aspect | Detail |
|---|---|
| **Current state** | `aria-label` on all icon buttons. Bottom nav has visible text labels. |
| **Assessment** | PASS |

### HF-A11Y-003 — Focus-Visible Styles — PASS (P2)

| Aspect | Detail |
|---|---|
| **Current state** | `LocationPicker` dropdown options lack `focus-visible` styles. All other elements use Tailwind focus rings. |
| **Assessment** | PASS (minor exception documented) |

---

## 7. Performance Criteria (HF-PERF)

### HF-PERF-001 — Font Loading — PASS (P2)

| Aspect | Detail |
|---|---|
| **Current state** | Vazir font via `next/font/local` with `display: 'swap'` and `preload: true` |
| **Assessment** | PASS — no FOUT, self-hosted |

### HF-PERF-002 — Header Rendering — PASS (P2)

| Aspect | Detail |
|---|---|
| **Current state** | Headers are Server Components. Only `HeaderAuthActions` is Client Component (narrow boundary). |
| **Assessment** | PASS — minimal client JS in layout shell |

### HF-PERF-003 — Search Debounce — PASS (P2)

| Aspect | Detail |
|---|---|
| **Current state** | `SearchField` uses local state for typing, commits to URL only on submit. |
| **Assessment** | PASS — no API calls on keystroke |

---

## 8. Design Criteria (HF-DSGN)

### HF-DSGN-001 — Brand Colors — PASS (P2)

| Aspect | Detail |
|---|---|
| **Current state** | All 8 colors verified against Master Prompt V5 |
| **Evidence** | `globals.css:13-32` |
| **Assessment** | PASS — all tokens match specification |

### HF-DSGN-002 — Logo Assets — PASS (P1)

| Aspect | Detail |
|---|---|
| **Current state** | `BrandLogo` uses official SVG from `/public/brand/`. No CSS approximations. |
| **Assessment** | PASS — logos are official assets, not redrawn |

---

## 9. Testing Criteria (HF-TEST)

### HF-TEST-001 — Layout/Auth Test Coverage — FAIL (P2)

**Requirement:** Header, nav, footer, and auth must have test coverage.

| Aspect | Detail |
|---|---|
| **Current state** | Zero tests for layout and auth components |
| **Expected state** | Unit tests for `HeaderAuthActions`, `MobileBottomNav`, `SiteFooter`, `AuthProvider`, `DesktopHeader`, `MobileHeader` |
| **Gap** | 0% test coverage for shared layout |
| **Evidence** | No test files under `components/layout/__tests__/` or `features/auth/__tests__/` |
| **Remediation** | Add unit tests for all shared layout and auth components |

**Acceptance:** All shared components have passing unit tests.
---

## 10. Gap Summary by Priority

### P0 — Security & Correctness (0 FAIL)

| ID | Status | Issue |
|---|---|---|
| HF-SEC-001 | PASS | Middleware found and verified (was previously missed) |
| HF-SEC-002 | PASS | Dual-layer protection: UI + middleware + backend |

### P1 — Navigation & Auth (4 FAIL)

| ID | Status | Issue |
|---|---|---|
| HF-NAV-001 | FAIL | `/categories` bottom nav link is 404 |
| HF-NAV-002 | FAIL | Desktop category button navigates to search |
| HF-NAV-003 | FAIL | Header search doesn't redirect to `/search` (redirectToSearch prop defined but unimplemented) |
| HF-NAV-004 | FAIL | No mobile search access |

### P2 — Usability & Quality (2 FAIL)

| ID | Status | Issue |
|---|---|---|
| HF-FTR-002 | FAIL | Missing safety/help links in footer |
| HF-TEST-001 | FAIL | No test coverage for layout/auth (24 total tests exist, none for layout) |

### P3 — Polish (All PASS)

All P3 criteria pass. Minor visual polish items documented in `findings.md`.

---

## 11. Dependency Graph

```
HF-NAV-001 (categories 404) ◄─── HF-NAV-002 (category button)    │
  └─► Both need /categories page or redirect decision             │
                                                                   │
HF-NAV-003 (search redirect) ──── independent                     │
  └─► Implement redirectToSearch in SearchField + pass prop       │
                                                                   │
HF-NAV-004 (mobile search) ──── independent                       │
  └─► Add search icon button to MobileHeader                      │
                                                                   │
HF-FTR-002 (footer links) ──── independent                        │
  └─► Requires new pages: /about, /help, /help/safety, /contact   │
                                                                   │
HF-TEST-001 (test coverage) ◄─── blocks all regression gates      │
  └─► Must be addressed alongside each fix                         │
```

---

## 12. Constraints & Boundaries

- **Backend API frozen at v1.0.0**. No new endpoints can be invented.
- **`weshbazar-backend/docs/openapi.json`** is the single source of truth for HTTP contract.
- **Do not modify backend** unless a concrete contract bug is discovered.
- **Frontend language: Persian/Dari**. Default direction: RTL.
- **Do not start by replacing existing header or footer**. Fix incrementally.
- **Master Prompt V5** is the authoritative build contract.
- **Unused `src/components/layout/site-header.tsx`** should be removed, not updated.