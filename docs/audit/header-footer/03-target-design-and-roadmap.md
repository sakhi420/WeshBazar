<!-- @format -->

# 03 — Target Design & Implementation Roadmap

## WeshBazar Shared Header, Navigation & Footer

**Date:** 2026-10-14
**Status:** Ready for implementation
**Based on:** `01-current-state.md`, `02-criteria-and-gap-analysis.md`, `findings.md`

---

## 1. Roadmap Overview

Total estimated effort: **5 phases** (Phase 1 middleware already exists). Each phase is a bounded, testable, independently shippable increment.

| Phase | Priority | Description | Defects Addressed |
|---|---|---|---|
| ~~1~~ | ~~P0~~ | ~~Server-side auth middleware~~ | ~~HF-SEC-001~~ → RESOLVED |
| 1 | P1 | Navigation fixes (categories, search, mobile search) | HF-NAV-001..004 |
| 2 | P2 | Footer safety/help links + new pages | HF-FTR-002 |
| 3 | P2 | Test coverage for layout & auth | HF-TEST-001 |
| 4 | P2 | Cleanup & polish | P2-006, P2-005, P3 items |
| 5 | — | Verification & regression gates | All criteria re-verified |
---

## ~~Phase 1: Server-Side Auth Middleware~~ → RESOLVED (2026-10-14)

**Defect:** HF-SEC-001  
**Status:** CLOSED — `src/middleware.ts` found (47 lines, 1833 bytes). Implements full auth gating. No action required.
---

## Phase 1: Navigation Fixes (P1)

**Defects:** HF-NAV-001, HF-NAV-002, HF-NAV-003, HF-NAV-004

### 1.1 Create /categories Page (HF-NAV-001, HF-NAV-002)

Mobile bottom nav "دسته‌ها" → 404. Desktop header category button → `/search`. Both need `/categories`.

**Create:** `src/app/categories/page.tsx` (category grid), `src/app/category/[slug]/page.tsx` (listings)

**Touch:** `desktop-header.tsx` — change category button `href` from `/search` to `/categories`

**Acceptance:** /categories loads (no 404). Desktop category button → /categories.

### 1.2 Fix Header Search (HF-NAV-003)

`SearchField` defines `redirectToSearch` in props interface but **never implements it** — the prop is destructured but unused. DesktopHeader never passes it either. Two changes needed:

**Touch `search-field.tsx`:** Implement `redirectToSearch` — when true and form submitted, use `router.push('/search?q=...')` instead of `setQuery()`.

**Touch `desktop-header.tsx`:** Pass `redirectToSearch={true}` to `<SearchField>`.

**Acceptance:** Search on any page → /search?q=QUERY.

### 1.3 Mobile Search (HF-NAV-004)

Mobile header has no search. Add Search icon button.

**Touch:** `mobile-header.tsx` — add `<Link href="/search"><Search /></Link>`

**Acceptance:** Search icon visible. Navigates to /search.
---

## Phase 2: Footer Safety/Help Links (P2)

**Defect:** HF-FTR-002
**Effort:** M (1 file touched, 4 new pages)
**Depends on:** None

Footer currently has 2 link groups: "بازار" and "حساب". Add a third group "راهنما".

### Files to Touch

| File | Change |
|---|---|
| `src/components/layout/site-footer.tsx` | Add third link group "راهنما" |

### New Link Group

| Link Text (Persian) | Href | Page to Create |
|---|---|---|
| درباره ما | `/about` | `src/app/about/page.tsx` |
| نکات ایمنی | `/help/safety` | `src/app/help/safety/page.tsx` |
| مرکز راهنمایی | `/help` | `src/app/help/page.tsx` |
| تماس با ما | `/contact` | `src/app/contact/page.tsx` |

### Pages to Create

| File | Type | Content |
|---|---|---|
| `src/app/about/page.tsx` | Server | About WeshBazar (use RouteScaffold if deferred) |
| `src/app/help/page.tsx` | Server | Help center landing |
| `src/app/help/safety/page.tsx` | Server | Safety tips for buyers/sellers |
| `src/app/contact/page.tsx` | Server | Contact page (use RouteScaffold if deferred) |

### Acceptance Criteria

- [ ] Footer shows 3 link groups on all pages
- [ ] All 4 new pages resolve (no 404), even if using RouteScaffold
- [ ] No invented phone numbers, emails, or social accounts
---

## Phase 3: Test Coverage (P2)

**Defect:** HF-TEST-001
**Effort:** L (6+ test files)
**Depends on:** Phases 1-3 complete

### Test Files to Create

| Test File | Covers |
|---|---|
| `src/components/layout/__tests__/desktop-header.test.tsx` | Rendering, links, search field |
| `src/components/layout/__tests__/mobile-header.test.tsx` | Rendering, search icon, sell CTA |
| `src/components/layout/__tests__/site-footer.test.tsx` | Link groups, destinations, copyright |
| `src/components/layout/__tests__/mobile-bottom-nav.test.tsx` | Tabs, active state, admin visibility |
| `src/components/layout/__tests__/header-auth-actions.test.tsx` | All 4 auth states, admin, logout |
| `src/components/auth/__tests__/auth-provider.test.tsx` | Provider mount, session cookie, logout |

### Testing Strategy

- Framework: Jest + React Testing Library
- Auth mocking: Mock `useAuth()` for all 4 states
- Router mocking: Mock `next/navigation`
- Coverage target: >80% lines for layout components

### Acceptance Criteria

- [ ] All 6 test files with meaningful cases
- [ ] Tests cover all auth states: checking, ready, anonymous, unreachable
- [ ] Tests verify admin tab visibility based on role
- [ ] Tests verify link destinations are correct
- [ ] All tests pass: `npx jest --testPathPattern="layout|auth"`
---

## Phase 4: Cleanup & Polish (P2-P3)

**Defects:** P2-005, P2-006, P3-001, P3-002
**Effort:** S (scattered changes)
**Depends on:** Phase 4 (tests as regression safety)

### 5.1 Remove Unused SiteHeader (P2-006)

| File | Action |
|---|---|
| `src/components/layout/site-header.tsx` | DELETE — never imported |

**Acceptance:** Build passes, no import errors, typecheck clean.

### 5.2 Focus-Visible on LocationPicker (P2-005)

**Touch:** `src/components/location/location-picker.tsx` — add `focus-visible:ring-2` to option buttons.

### 5.3 Back-to-Top Button (P3-001)

**Create:** `src/components/layout/back-to-top.tsx` — floating button after 400px scroll.

**Touch:** `src/app/layout.tsx` — add `<BackToTop />` inside Providers.

### 5.4 Bottom Nav Active Indicator (P3-002)

**Touch:** `src/components/layout/mobile-bottom-nav.tsx` — add `border-t-2 border-primary` on active tab.

---

## Phase 5: Verification & Regression Gates

**Effort:** S (manual + automated)
**Depends on:** All previous phases

### Automated Checks

- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npx eslint src/` — zero lint errors
- [ ] `npm run build` — successful production build
- [ ] `npx jest` — all tests pass

### Criteria Re-Verification (28 criteria from criteria-register.json)

| ID | Expected | Verify |
|---|---|---|
| HF-SEC-001 | Middleware redirects unauthenticated | Manual test |
| HF-SEC-002 | Admin links hidden for USER | Already PASS (no change) |
| HF-SEC-003 | Logout clears all state | Manual + unit test |
| HF-SEC-004 | Refresh cookie isolated | No change expected |
| HF-NAV-001 | /categories resolves (no 404) | Browser test |
| HF-NAV-002 | Category button → /categories | Browser test |
| HF-NAV-003 | Header search → /search?q= | Browser test |
| HF-NAV-004 | Mobile search icon present | Browser test |
| HF-FTR-002 | Footer has 3 link groups | Browser test |
| HF-TEST-001 | 6+ test files passing | Jest output |
| All PASS | No regressions | Full test suite |

### Manual Smoke Test

- Home page: header, footer, bottom nav visible
- Login flow: header auth buttons correct per state
- Categories page loads with category grid
- Search from header works on all page types
- Mobile responsive: header, bottom nav, search access
- Footer links all resolve
- Build and dev server start without errors

---

## 7. File Change Summary

| Phase | Created | Touched | Deleted |
|---|---|---|---|
| 1 | `categories/page.tsx`, `category/[slug]/page.tsx` | `desktop-header.tsx`, `mobile-header.tsx`, `search-field.tsx` | — |
| 2 | `about/page.tsx`, `help/page.tsx`, `help/safety/page.tsx`, `contact/page.tsx` | `site-footer.tsx` | — |
| 3 | 6 test files | — | — |
| 4 | `back-to-top.tsx` | `location-picker.tsx`, `mobile-bottom-nav.tsx`, `layout.tsx` | `site-header.tsx` |
| **Total** | **12** | **7** | **1** |

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Categories page needs unavailable API endpoints | Medium | Medium | Use RouteScaffold placeholder; fetch when API ready |
| Footer renders differently as Server Component in tests | Low | Medium | Test as Client wrapper; verify in browser |
| SiteHeader deletion breaks something | Low | High | Global import search before deletion |
| New pages (about/help/contact) need real content later | High | Low | RouteScaffold makes it clear they're placeholders |
| SearchField redirectToSearch implementation breaks existing search | Low | Medium | Add unit test before implementation; verify home page search unaffected |

---

## 9. Constraints (Repeated from AGENTS.md)

- Backend API frozen at v1.0.0 — never invent endpoints
- Use `weshbazar-backend/docs/openapi.json` as HTTP contract
- Do not modify backend unless contract bug discovered
- Frontend language: Persian/Dari — RTL by default
- Do not replace existing header/footer — fix incrementally
- Master Prompt V5 is the authoritative build contract