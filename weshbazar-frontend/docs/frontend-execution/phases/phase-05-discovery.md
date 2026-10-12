# Phase 05: Discovery — Search & Category Polish
**Status:** PLAN MODE — Awaiting ACT approval
**Date:** 2026-10-11

---

## 0. Current State Analysis

### What's Already Working ✅
- Search page: SearchField + FilterPanelDesktop + MobileFilterSheet + ActiveFilterChips + SortControl + DiscoveryResults
- Category page: Breadcrumbs + child categories + dynamic filterSchema + same filter stack
- SortControl: native select with nuqs URL state
- ActiveFilterChips: comprehensive — province, city, price, condition, dynamic attributes, clear-all
- FilterPanel: desktop sidebar + mobile `<dialog>` sheet with footer
- DiscoveryResults: infinite scroll with useInfiniteQuery
- Loading states: ListingGridSkeleton + Skeleton components
- Error states: ErrorState with retry + requestId

### What Needs Fixing 🔧
1. **`JSON.stringify(query)` as React key** — lines 95/143 in search/category pages. Object key ordering is not guaranteed in JS. Can cause stale renders.
2. **No result count** — missing "۱۲۳ آگهی پیدا شد" heading. Essential marketplace UX (§21).
3. **Child category pills on category page** use `rounded-full` — should be `rounded-card` to match CategoryShortcutGrid design language.
4. **Filter sheet styling** — native `<dialog>` is functional but basic. Needs padding/margin polish.
5. **No "active sort" indicator** — SortControl doesn't show which sort is active visually in the select (the value is set, but no highlight on the label).

### What's Good & Stays
- Filter logic, URL state, parsers — all correct
- Desktop/mobile filter architecture — correct patterns
- Error/empty/loading states — complete
- Dynamic attribute filters — working correctly
---

## 1. Fix — JSON.stringify Key

**Problem:** `key={JSON.stringify(query)}` on both search (line 95) and category (line 143) pages is fragile. JS object key order is not guaranteed.

**Fix:** Add `discoveryKey()` to `search/params.ts`. Replace `JSON.stringify(query)` with `discoveryKey(query)`.

## 2. Fix — Result Count

Add Persian result count between chips and results: "۱۲۳ آگهی پیدا شد".

## 3. Fix — Category Pill Radius

Change `rounded-full` → `rounded-card` on child category pills (line 112).

## 4. Fix — Filter Sheet Safe Area

Add `pb-[env(safe-area-inset-bottom)]` to sheet footer, `py-3` header.

## 5. Files
| File | Change |
|---|---|
| `search/params.ts` | Add `discoveryKey()` |
| `search/page.tsx` | Key + result count |
| `category/[slug]/page.tsx` | Key + pills + count |
| `filter-panel.tsx` | Sheet polish |

## 6. Gates
- Deterministic key ✔
- Result count visible ✔
- Pills rounded-card ✔
- Sheet safe-area ✔
- Tests + TS clean ✔