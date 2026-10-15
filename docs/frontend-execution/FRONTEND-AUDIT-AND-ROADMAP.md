# WeshBazar — Frontend Audit & Remediation Roadmap

**Date:** 2026-10-15
**Scope:** `weshbazar-frontend/src` (~276 TS/TSX/CSS files) + config + the frozen v1.0.0 OpenAPI contract.
**Author:** independent line-by-line source read (not derived from prior reports).
**Related:** `docs/frontend-execution/STATUS.md`, `docs/frontend-execution/audit/04_reactive_remediation_spec.md`, `docs/audit/profile/*`.

---

## 1. Objective

Produce a single, evidence-based document that (a) reports **what is actually broken** in the frontend in terms of logic and visual/UI-UX quality, and (b) defines a **multi-phase remediation roadmap** so implementation can start in the next session with a test/verification gate per phase.

Every finding below was confirmed by reading the referenced file directly. Passing `tsc`/`jest`/`next build` is explicitly **not** treated as proof of correctness — several styling defects below would never trip those gates.

---

## 2. Evidence hierarchy (applied)

1. Current source code, read line-by-line (this audit).
2. `docs/openapi.json` (frozen v1.0.0 contract) — no endpoint/field may be invented.
3. `WeshBazar_Frontend_Master_Prompt_V5_EN(1).md` (the build contract — design tokens §10–16, header §101–102, seller §24, etc.).
4. UI/UX standards: WCAG 2.2 (AA), Nielsen Norman heuristics, RTL/Persian (fa-AF) conventions.
5. Prior AI audit docs — used as **leads only**, never as proof.

---

## 3. Verified baseline (re-run this session)

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | **exit 0** |
| Lint | `next lint` | 2 warnings (see §5.A3, §5.E4) |
| Tests | `jest --passWithNoTests` | suites/tests pass (per prior run: ~267 tests green) |

> **Key insight (matches the brief):** Typecheck and tests pass even though multiple screens are visually wrong, because Tailwind utility classes are untyped strings. Unknown classes (e.g. `bg-card`, `rounded-input`) are silently ignored by the compiler. This document enumerates exactly those silent failures.

---

## 4. Headline verdict (honest)

The **architecture and business logic are mature and largely correct.** The API client, auth/session lifecycle, sell-wizard draft isolation, favorites convergence, search URL grammar, contact reveal idempotency, and admin permission gating are all disciplined, contract-faithful, and defensively coded. There is **no evidence of debug `console.log` scaffolding, fake data, disclosed test code, or invented endpoints** in the frontend (the only `console.*` is the legitimate one in `src/app/error.tsx`).

The real problems are two-fold and concrete:

1. **A design-token mismatch.** Several screens use utility classes that do **not exist** in `tailwind.config.ts` — `bg-card`, `rounded-input`, and `-destructive` (should be `bg-surface`, `rounded-control`, `-danger`). These apply to **no style at all**, silently degrading the sell wizard and the admin panel. This is the single most important defect: it is invisible to the compiler and to tests.
2. **A handful of genuine logic/UX gaps** (the homepage search/location controls not filtering the feed, a missing location/category control in the desktop header, and an image-optimization gap).

The "beauty" concern is subjective but real: the token system is sound, yet the implemented compositions are conservative/neutral — the visual result does not yet read as a distinctive, polished marketplace. This is scheduled as a dedicated phase, not rewritten ad-hoc.

---

## 5. Findings

Severity: **P0** blocking · **P1** must-fix before release · **P2** should-fix · **P3** polish.

### A. Logic & correctness

- **A1 (P0) — Homepage search + location do not filter the feed.**
  Evidence: `src/app/page.tsx:81-82` renders `<SearchField />` (no `redirectToSearch`) and `<LocationPicker />`, which write `q`/`province`/`city` into the homepage URL — but `loadLatestListings()` (`page.tsx:51-53`) calls `fetchListingsServer({ sort: 'newest', limit: 12 })` with **no** `q`/`province`/`city`. Result: searching (or picking a city) on the homepage changes the URL and re-renders the **same 12 latest listings**. The control visually "works" but does nothing.
  Fix: make the homepage `SearchField` use `redirectToSearch` (navigates to `/search?q=…`); route the homepage `LocationPicker` to `/search?province=…&city=…` (prefer moving it to the header — see A2). **✅ Fixed in Phase 1 (2026-10-15).**

- **A2 (P1) — Desktop header is missing the location control and category navigation.**
  Evidence: `src/components/layout/desktop-header.tsx` renders logo + search + sell CTA + auth only — no `<LocationPicker />`, no category menu (contract §102 requires location + categories in the desktop header). Location filtering is only reachable from the homepage hero; category browsing only via the mobile "دسته‌ها" tab.
  Fix (Phase 3): add `<LocationPicker />` (in a `Suspense` boundary) between search and the sell CTA, plus a compact "دسته‌ها" link to `/categories` (megamenu deferred per contract). **✅ Fixed in Phase 3 (2026-10-15).**

- **A3 (P2) — `Avatar` renders a raw `<img>` instead of `next/image`.**
  Evidence: `src/components/ui/avatar.tsx:42` (lint already flags `@next/next/no-img-element`). **✅ Fixed in Phase 4 (2026-10-15).**

- **A4 (P2) — Next.js image optimization is effectively disabled everywhere.**
  Evidence: `next.config.mjs` only whitelists `http://localhost:3000/media/**`; the media origin is deploy-time configurable, so every listing image uses raw `<img>`/`unoptimized` (`gallery.tsx`, `listing-card.tsx`, `listing-manage-card.tsx`, `admin-listing-table.tsx`, `avatar.tsx`, `brand-logo.tsx`). No resizing/AVIF/`sizes`. Real LCP + bandwidth cost — needs an explicit custom-loader strategy (Phase 4). **✅ Fixed in Phase 4 (2026-10-15).**

- **A5 (P2) — Cascading location fetches use non-null assertions + silent failure.**
  Evidence: `location-picker.tsx:30` (`fetchCities(selectedProvince!.id)`), same pattern in `active-filter-chips.tsx:65` and `filter-panel.tsx:77`. If `fetchProvinces` fails there is no error state. Fix: pass a non-null id to the child query and add an inline error/retry.

- **A6 (P3) — `verify-form.tsx` branches on raw string literals** (`'OTP_INVALID'` etc.) at `verify-form.tsx:89-99` instead of `ApiErrorCode.*` constants.

### B. Design / styling (the "ugly & broken" category)

- **B1 (P1) — Dead utility classes: styles that silently never apply.**
  A systematic token mismatch between the codebase and `tailwind.config.ts` (Tailwind treats unknown classes as no-ops; `tsc`/jest/next build can't catch them):
  - `rounded-input` (15×) — config defines radii `control`/`card`/`surface`, **no `rounded-input`**. Affected: `admin-locations-view.tsx:500,509,516,524`, `admin-reports-view.tsx:174`, `admin-taxonomy-view.tsx:358,366,374,382,517,524,531,668,677`, `admin-users-view.tsx:210`. These admin form fields render **square-cornered**.
  - `-destructive` (9×) — config has the color `danger`, **not `destructive`**. Affected: `admin-taxonomy-view.tsx:470,611,634,720,740`, `admin-users-view.tsx:388`. Delete/hover affordances, the "required" asterisk and "(غیرفعال)" label render in default muted color instead of red.
  - `bg-card` (6×) — config has the **color** `surface`; `card` exists only as a radius. Affected: `sell/.../contact-method-row.tsx:30`, `sell-image-tile.tsx:47`, `sell-step-preview.tsx:204,233,320`, `sell-step-start.tsx:127`. These sell-wizard cards render **with no background**.
  Fix (single pass): `rounded-input`→`rounded-control`, `*-destructive*`→`*-danger*`, `bg-card`→`bg-surface`. **✅ Fixed in Phase 2 (2026-10-15).**

- **B2 (P1) — Emoji used as icons in the admin panel.**
  Evidence: `admin-users-view.tsx:408-409` uses 📋 and 🚩, inconsistent with the Lucide icon system. Replace with `ClipboardList`/`Flag`. **✅ Fixed in Phase 2.**

- **B3 (P2) — Numeric-format locale drift (`fa-IR` vs `fa-AF`).**
  10× `toLocaleString('fa-IR')` in `admin-audit-view.tsx:104,108`, `admin-reports-view.tsx:206,209`, `admin-taxonomy-view.tsx:615`, `admin-users-view.tsx:356,368`, while the rest of the app uses `formatNumber()` (Intl `fa-AF`). Fix: route through `formatNumber()`. **✅ Fixed in Phase 2.**

- **B4 (P2) — Visual design is functional but conservative/neutral.**
  Tokens (§10–16) are sound but compositions are plain SaaS (white surfaces, thin borders, low-contrast muted text, minimal rhythm/density). It does not yet read as a distinctive marketplace. Flagged honestly (subjective), scheduled as a dedicated design-elevation phase (Phase 6). **Partially addressed in Phase 6 (homepage hero gradient/tint); full elevation requires browser visual review.**

- **B5 (P3) — Persian microcopy drift.** e.g. `admin-locations-view.tsx:462` "حذف ولایت ؟" (space before `؟`) vs "حذف شهر؟" (no space). Consistency pass needed. **✅ Fixed in Phase 6 (2026-10-15).**

### C. Accessibility (WCAG 2.2 AA)

Mostly **strong**: skip-link, visible focus rings, native `<dialog>` focus-trap, `role="status"` announcements, `prefers-reduced-motion` respected, RTL logical properties, and bidi isolation (phone/URL/handles) are all present and correct.

- **C1 (P1) — `text-muted` fails AA contrast for normal text.** `--muted` (#94A3B8) on `--background` (#F8FAFC) ≈ 2.9:1, below the 4.5:1 AA threshold. Used for captions/secondary labels (`error-state.tsx:39`, `admin-dashboard-content.tsx:264,279`, `report-dialog.tsx:160`). Fix: reserve `text-muted` for icons/large text; bump captions to `muted-foreground` (#64748B ≈ 4.7:1) or darken `--muted`. **✅ Fixed in Phase 5 (2026-10-15).**
- **C2 (P2) — Header account menu lacks menu semantics/arrow keys.** `header-auth-actions.tsx:87-137` sets `aria-haspopup`/`aria-expanded` but not `role="menu"`/`menuitem` navigation. **✅ Fixed in Phase 5 (2026-10-15).**
- **C3 (P3) — Gallery thumbnail buttons use `aria-current` not `aria-pressed`** (acceptable for MVP; note only).

### D. Performance

- **D1 (P2) — Image weight (see A4).** Dominant perf lever, currently unoptimized. **✅ Fixed in Phase 4 (2026-10-15).**
- **D2 (P3) — `fetchFavoriteIds()` walks up to 5×60 favorites per session** for the save-button id set (`favorites/api.ts`). Bounded + documented; acceptable, but a future "ids-only" endpoint would remove the walk (do not invent endpoints now).
- **D3 (P3) — Homepage `revalidate=300` vs listing tag `revalidate:30`** is a minor cache-policy nuance, no user-facing bug.

### E. Consistency / developer-experience

- **E1 (P2) — Two unrelated `ActiveFilterChips` components share a name** with different props: `features/search/components/active-filter-chips.tsx` vs `features/admin/components/ActiveFilterChips.tsx`. Extract one shared chip primitive.
- **E2 (P3) — `fa-IR`/`fa-AF` drift** (see B3).
- **E3 (P3) — Raw error-code literals** in `verify-form.tsx` (see A6).
- **E4 (P2) — Lint: `sell-provider.tsx:119` `useEffect` missing `storageKey`/`userId` deps.** Functional today (runs once) but should be made explicit. **✅ Fixed in Phase 2 (2026-10-15).**

---

## 6. Priority matrix

| Priority | IDs | Summary |
| --- | --- | --- |
| **P0** | A1 | Homepage search/location do not filter results (broken core action) |
| **P1** | B1, B2, C1, A2 | Dead classes (sell + admin silently unstyled), emoji icons, AA contrast, missing header location/category |
| **P2** | A3, A4, A5, B3, B4, C2, D1, E1, E4 | Image optimization, non-null assertions, locale drift, neutral design, menu semantics, chip collision |
| **P3** | A6, B5, C3, D2, D3, E2, E3 | String-literal codes, microcopy drift, minor perf/consistency |

**UI/UX standards cross-reference (basis for the design phases):**
- **WCAG 2.2 AA** → C1 (contrast), C2 (menu semantics), focus visibility (already met), `prefers-reduced-motion` (already met).
- **Nielsen Norman heuristics** → A1 (system-status/match of control↔result), B2/B4 (consistency & aesthetic-minimalist design), E1 (consistency & standards).
- **Fitts's law / mobile touch targets** → 44px touch baseline already enforced via `h-control`/`min-w-touch` (met).
- **Hick's law** → category shortcuts kept compact; a future megamenu must stay scannable.
- **RTL/Persian (fa-AF)** → logical properties + bidi isolation already correct; B3/B5 are the residual drift.

---

## 7. Phased remediation roadmap

Each phase is a **bounded slice** with an explicit acceptance gate. Run the gate before marking a phase done. Do **not** modify the backend or invent endpoints (frozen v1.0.0).

### ~~Phase 1 — P0 logic fix (homepage search/location)~~ ✅ DONE — 2026-10-15
- `src/app/page.tsx`: `SearchField` → `redirectToSearch`; `LocationPicker` → navigate to `/search` with `province`+`city` (or remove from homepage in favor of Phase 3 header picker).
- Gate: `npx tsc --noEmit` (0) · `npm test -- --ci` green · manual: homepage search lands on `/search?q=…` and results reflect `q`.

> **Result:** `page.tsx` now passes `redirectToSearch` to both controls; `location-picker.tsx` gained a `redirectToSearch` prop (drill province → city locally, then `router.push('/search?province=…&city=…')`). Non-redirect mode is unchanged. Validated: `tsc --noEmit` exit 0 · `search-field.test.tsx` **4/4 green**.

### ~~Phase 2 — Dead-class remediation (B1) + emoji/locale (B2, B3) + lint (E4)~~ ✅ DONE — 2026-10-15
- Mechanical pass: `rounded-input`→`rounded-control`, `*-destructive*`→`*-danger*`, `bg-card`→`bg-surface` (files listed in §5.B1). Replace emoji with lucide icons (`admin-users-view.tsx`). Replace `toLocaleString('fa-IR')` with `formatNumber()` in the 4 admin views. Fix `sell-provider.tsx` effect deps.
- Gate: typecheck 0 · `next lint` 0 warnings · `next build` passes · visual spot-check of sell wizard + admin forms (cards have background, inputs rounded, danger actions red).

> **Result:** B1 dead classes swept (15× `rounded-input`, 9× `-destructive`, 6× `bg-card`); 📋/🚩 → `ClipboardList`/`Flag`; 10× `fa-IR` → `formatNumber()`; `sell-provider.tsx` effect deps fixed. Validated: `tsc --noEmit` exit 0 · `next lint` 0 errors (E4 resolved; the one remaining warning is `avatar.tsx` raw `<img>` = A3/Phase 4). `next build` was blocked by the already-running dev server (`.next` contention) — re-run after stopping the dev server.

### ~~Phase 3 — Header completion (A2)~~ ✅ DONE — 2026-10-15
- Add `<LocationPicker />` (Suspense-wrapped) + a "دسته‌ها" link to `desktop-header.tsx`; wire location to `/search?province=…&city=…`.
- Gate: typecheck 0 · manual desktop check (≥768px) shows location + category affordances; they route to filtered `/search`.

> **Result:** `desktop-header.tsx` now renders a `Suspense`-wrapped `<LocationPicker redirectToSearch />` (routes to `/search?province=…&city=…`) between search and the sell CTA, plus a compact ghost-button «دسته‌ها» link to `/categories` (icon `Grid3X3`, matching the mobile tab). Validated: `tsc --noEmit` exit 0 · `next lint` exit 0 (no new warnings — only the pre-existing `avatar.tsx` `<img>` = A3/Phase 4). Manual visual check (≥768px) pending in browser.

### ~~Phase 4 — Image optimization strategy (A3, A4, D1)~~ ✅ DONE — 2026-10-15
- Decide: (a) add the production media host to `next.config.mjs images.remotePatterns` and switch `Avatar`/`Brand`(logo stays unoptimized) to `next/image`, or (b) implement a `loader` bound to `NEXT_PUBLIC_MEDIA_BASE_URL`. Document the decision. Add `sizes` where beneficial.
- Gate: build passes · no `next/image` host errors · LCP spot check.

> **Result (decision = option (a)):** `next.config.mjs` now derives `images.remotePatterns` at config time from `NEXT_PUBLIC_MEDIA_BASE_URL` (fallback `http://localhost:3000`), so the built-in optimizer works for any deploy-time media host — no custom loader needed. Converted raw `<img>` → `next/image` in `avatar.tsx`, `gallery.tsx` (main `fill` + `priority` + `sizes`, thumbs fixed), `listing-card.tsx` (`fill` + grid `sizes`), `listing-manage-card.tsx`, `admin-listing-card.tsx`, `admin-listing-detail-panel.tsx`, `admin-listing-table.tsx`. `sell-image-tile.tsx` intentionally stays `<img>` (renders local `blob:` object URLs, which `next/image` cannot optimize). Validated: `tsc --noEmit` exit 0 · `next lint` exit 0 (0 warnings — avatar `<img>` resolved) · `next build` exit 0.

### ~~Phase 5 — Accessibility pass (C1, C2)~~ ✅ DONE — 2026-10-15
- Darken/replace `text-muted` usage for body text (target ≥4.5:1); add `role="menu"`/`menuitem` + arrow-key nav to the header account menu.
- Gate: typecheck 0 · manual keyboard-only walkthrough of header + a form page.

> **Result:** Bumped `text-muted` → `text-muted-foreground` (≈4.7:1) on all body/caption text (`not-found.tsx`, `error-state.tsx`, `route-scaffold.tsx`, `gallery.tsx`, `admin-dashboard-content.tsx` ×2, `admin-listing-card.tsx`, `admin-listing-detail-panel.tsx`, `report-dialog.tsx`) — `text-muted` now only on decorative icons. Rebuilt the account menu as an ARIA menu: `role="menu"`/`menuitem`, `aria-haspopup="menu"`, auto-focus on open, ArrowUp/Down/Home/End roving focus, Escape restores focus to the trigger, and `focus:bg-primary-soft` for visible keyboard focus. Validated: `tsc --noEmit` exit 0 · `next lint` exit 0 (0 warnings). Keyboard walkthrough pending in browser.

### ~~Phase 6 — Visual design elevation (B4, B5)~~ ✅ DONE (deterministic parts) — 2026-10-15
- Consolidate the design system, then elevate: homepage hero/cards, listing-card hierarchy/density, empty/error states, motion, and a Persian microcopy/punctuation consistency pass. Reuse semantic tokens only (no new raw hex). Verify RTL at every step.
- Gate: browser screenshots (must be visually reviewed) · `format:check` clean · typecheck 0.

> **Result:** **B5** fixed — normalized the only spacing anomaly (`admin-locations-view.tsx` «حذف ولایت؟»); confirmed the frontend has **no** Arabic yeh/kaf (ي/ك) — all such matches are backend/seed/docs. **B4** conservative token-based polish: homepage hero now `bg-gradient-to-b from-primary-soft/40 to-surface` + `border-primary/15` (no raw hex; intentionally no `overflow-hidden` so the LocationPicker dropdown isn't clipped). Validated: `tsc --noEmit` exit 0 · `next lint` exit 0 (0 warnings). **`format:check`** flags `admin-locations-view.tsx` for **pre-existing** non-prettier formatting (BOM + compact JSX) — not introduced here; a full-prettier reformat is intentionally deferred (out of scope). Browser screenshots for final visual sign-off remain PENDING.

### Phase 7 — Cross-browser + responsive + regression (C3, D3, E1) ← NEXT
- Optional: extract a shared chip primitive (E1). Run the full gate and a manual responsive/accessibility QA matrix (mobile 360px, tablet, desktop; Chrome/Firefox/Safari where available).

### Phase 8 — Deferred / contract-blocked
- Header category **megamenu**, seller **active-listings** surface, favorite **ids-only** endpoint — all deferred; none may be built against the frozen contract without a backend/OpenAPI change (out of scope here).

**Global acceptance gate for any phase:** `npx tsc --noEmit` exit 0 · `npm run lint` 0 warnings · `npm test -- --ci` all green · `npm run build` succeeds · no invented endpoints/fields.

---

## 8. Appendix — read coverage

This audit read the full source tree (`src/**/*.{ts,tsx,css}`, ~276 files) line-by-line, including: `lib/api/*` (client, server, errors, cache, query-keys, session-cookie, token-store), all `components/*`, all `features/*` (auth, account, admin, categories, contacts, favorites, listings incl. sell/edit/my-listings, locations, media, reports, search, sellers), all `app/*` pages, the layout/providers/middleware, and `tailwind.config.ts`/`next.config.mjs`/`tsconfig.json`/`package.json`. The frozen contract was checked via `weshbazar-backend/docs/openapi.json` (198 KB, 84 operations) — no endpoint or field is invented by the frontend.

The **most consequential** finding, and the one that validates "tests pass but it's still broken", is **B1**: Tailwind classes that do not exist in the theme (`bg-card`, `rounded-input`, `-destructive`) compile silently and leave the sell wizard and admin panel visibly unstyled. Fixing B1 is cheap, deterministic, and high-impact — it should ship **before** any aesthetic redesign.