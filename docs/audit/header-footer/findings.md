<!-- @format -->

# Findings — Header, Navigation & Footer Audit

Condensed defect and observation list. Severity: P0 (critical), P1 (blocking), P2 (major), P3 (minor).

## P0 — Security, Privacy, Session Correctness

### P0-001: ~~No server-side page middleware~~ RESOLVED — Middleware EXISTS

- **Where:** `src/middleware.ts` (47 lines, 1833 bytes).
- **Updated Evidence (2026-10-14):** Middleware was found during re-verification. It implements full auth gating: reads `weshbazar_session` cookie, redirects guests from protected routes, redirects authenticated users from login/register. Protected prefixes: `/favorites`, `/account`, `/my-listings`, `/sell`, `/admin`.
- **Status:** CLOSED — middleware is implemented and functional.

### P0-002: Admin link visibility based on client-side role check only

- **Where:** `header-auth-actions.tsx` lines 38-45.
- **Evidence:** `user.role === 'MODERATOR' || user.role === 'ADMIN'` is client-side.
- **Risk:** Low (backend enforces). UI-only checks are not security boundaries.
- **Remediation:** Document that backend is the real authorization. No code change required if backend protection is verified.

### P0-003: Logout clears caches but stale data possible for one render cycle

- **Where:** `auth-provider.tsx` lines 90-123.
- **Evidence:** Between `performLogout()` completion and `router.replace('/')`, stale auth data may render briefly.
- **Risk:** Very low (immediate redirect).
- **Remediation:** Invalidate `auth.me` query key before clearing other caches.

## P1 — Broken Navigation, Auth Transitions

### P1-001: Mobile bottom nav `/categories` link is 404

- **Where:** `mobile-bottom-nav.tsx` line 12.
- **Evidence:** Link points to `/categories` which does not exist.
- **Risk:** One of 5 primary bottom nav tabs leads to 404.
- **Remediation:** Create `/categories` page or change link to `/search`.

### P1-002: Desktop header category button navigates to `/search`

- **Where:** `desktop-header.tsx` lines 27-31.
- **Evidence:** `<Link href="/search">` with `Grid3X3` icon labeled "دسته‌بندی‌ها".
- **Risk:** Misleading — user taps category icon expecting categories but lands on search.
- **Remediation:** Change icon/label to reflect search, or create dedicated categories page.

### P1-003: Search in header writes `q` to current URL, not `/search`

- **Where:** `desktop-header.tsx` line 25 and `search-field.tsx`.
- **Evidence:** `SearchField` uses nuqs `useQueryState('q')` which writes to current page URL. On non-search pages, no results appear. The `redirectToSearch` prop is **defined** in the interface but **never implemented** in the component body — it's destructured but unused.
- **Risk:** Searching from account/admin/seller pages produces no results.
- **Remediation:** Implement `redirectToSearch` logic in `SearchField` (navigate to `/search?q=...` on submit when prop is true), then pass `redirectToSearch={true}` from `DesktopHeader`.

### P1-004: No mobile search in mobile header

- **Where:** `mobile-header.tsx` lines 12-35.
- **Evidence:** Mobile header has logo + auth only, no search entry.
- **Risk:** Search requires an extra tap to bottom nav. Primary marketplace action is hidden.
- **Remediation:** Add search icon/link to mobile header that navigates to `/search`.

### P1-005: Footer account links are static (Server Component)

- **Where:** `site-footer.tsx` lines 10-15.
- **Evidence:** `accountLinks` array shows `/auth/login`, `/favorites`, `/my-listings`, `/account` regardless of auth state.
- **Risk:** Auth users see "ورود به حساب" link. Anonymous users see links to protected routes. Routes handle redirect — low severity.
- **Remediation:** Acceptable as-is (routes handle redirection). Consider client-side auth awareness for polish.

## P2 — Usability, Accessibility, Responsive, Performance

### P2-001: No footer link to safety/help/about content

- **Where:** `site-footer.tsx` lines 1-81.
- **Evidence:** Footer has 2 link groups only.
- **Risk:** Users cannot find safety guidance from footer.
- **Remediation:** Add third link group with about, safety, help links. Create those pages.

### P2-002: Footer rendered on all pages including auth forms

- **Where:** `layout.tsx` line 71.
- **Risk:** Increased scroll on auth forms. Minor. Acceptable as-is.

### P2-003: Sticky headers + bottom nav consume ~120px on mobile

- **Evidence:** 56px header + 64px bottom nav = 120px fixed on 390x844.
- **Risk:** Reduced content area with keyboard open.
- **Assessment:** Standard marketplace pattern. Acceptable.

### P2-004: No mobile hamburger/drawer navigation exists

- **Evidence:** Bottom nav covers primary. Secondary links have no mobile entry.
- **Remediation:** Add hamburger menu to mobile header or "more" tab to bottom nav.

### P2-005: LocationPicker dropdown options lack focus-visible styles

- **Where:** `location-picker.tsx` lines 69-78.
- **Remediation:** Add focus-visible styles to option buttons.

### P2-006: `SiteHeader` component is dead code (never imported)

- **Where:** `src/components/layout/site-header.tsx`.
- **Remediation:** Remove it.

### P2-007: Auth pages share marketplace layout

- **Assessment:** Acceptable. Consistent brand. Consider route group for auth layout.

### P2-008: Zero test coverage for header, nav, footer, or auth

- **Remediation:** Add unit tests for `HeaderAuthActions`, `MobileBottomNav`, `SiteFooter`, `AuthProvider`.

## P3 — Visual Polish, Minor

### P3-001: No "Back to top" button

- **Remediation:** Add floating button after scroll.

### P3-002: Bottom nav active state is color-only

- **Assessment:** ACCEPTABLE. Consider top border for accessibility.

### P3-003: Footer year uses Persian digits — correct

- **Assessment:** PASS.
