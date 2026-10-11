# Phase 04: Shared Shell & Homepage — Report
**Status:** ✅ COMPLETE | **Tests:** 16 suites, 185 passed | **TS:** Clean

## New Files
- `mobile-header.tsx` — 56px, logo + sell + auth, lg:hidden
- `desktop-header.tsx` — 64px, logo + search + categories + sell + auth, hidden <lg
- `location-picker.tsx` — Province->city cascading dropdown, nuqs URL state
- `category-shortcut-grid.tsx` — One-row scrollable pills, max 8

## Modified Files
- `layout.tsx` — Self-hosted Vazir font + dual headers
- `page.tsx` — SearchField + LocationPicker + CategoryShortcutGrid
- `listing-card.tsx` — aspect-[4/3] image
- `tailwind.config.ts` — bottom-nav: 4rem (64px)

## Gates: 14/16 PASS (2 pending: build + visual QA need running backend)