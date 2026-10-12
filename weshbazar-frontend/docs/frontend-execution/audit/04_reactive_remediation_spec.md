# Reactive Remediation Audit — Critical Architecture Patterns
**Date:** 2026-10-11 | **Mode:** Plan | **Scope:** State + Location + Auth Shell

---

## Pattern 1: State Reactivity & Query Desync

### Flow Trace (search/page.tsx + DiscoveryResults.tsx)
SSR: `searchParams → parseDiscoverySearchParams() → toDiscoveryQuery() → fetchListingsServer()` → `query` + `CursorPage` pass to `<DiscoveryResults query initialPage>`.  
Client: `useInfiniteQuery({ queryKey: queryKeys.listings.discovery(query), initialData, staleTime: 30s })`.  
Filter: nuqs `useQueryStates({history:'push'})` → URL change → Next.js re-renders Server Component → new SSR → `key={discoveryKey(query)}` remounts.

### Findings
| # | Finding | Severity | File:Line |
|---|---|---|---|
| **A1** | SSR→Client handoff is correct. `initialData` + `queryKey` + `staleTime:30s`. No desync. | ✅ OK | search:100 |
| **A2** | `discoveryKey()` remount is correct. Minor waste but DiscoveryResults has no internal state to lose. | ⚠️ Minor | search:101 |
| **A3** | **Double SearchField on search page.** DesktopHeader has `<SearchField>` (desktop-header:25) AND search page body has `<SearchField>` (search/page:71). Both read/write same `q` param via nuqs — synced, but visually TWO inputs at desktop. | ❌ DUP | desktop-header:25, search:71 |
| **A4** | **Homepage SearchField doesn't filter.** Homepage SearchField writes `q` to URL but homepage `fetchListingsServer({sort,limit:12})` does NOT pass `q` param. Searching from homepage changes URL but shows same listings. | ❌ BUG | page.tsx:49,78 |
| **A5** | Filter controls use `history:'push'` for all params. Rapid changes create long history stack. Better: `replace` for non-keyword filters. | ⚠️ UX | filter-panel:68 |

### Fix Plan
- **A3:** Remove `<SearchField>` from search page body at desktop (the header one suffices).
- **A4:** Homepage SearchField should navigate to `/search?q=...` on submit instead of writing `q` to homepage URL.
---

## Pattern 2: Server-to-Client Location Data Hydration

### Flow Trace (LocationPicker.tsx)
```
L16-17: useQueryState('province') + useQueryState('city') → URL params
L20-24: useQuery({ queryKey: provinces, staleTime: 1h }) → provinces[]
L26: selectedProvince = provinces.find(p => p.slug === provinceParam)
L28-33: useQuery({ queryKey: cities(selectedProvince?.id ?? ''), enabled: !!selectedProvince })
L35: selectedCity = cities.find(c => c.slug === cityParam)
L50: label = selectedCity?.name ?? selectedProvince ? `${p} (همه)` : 'انتخاب شهر'
```

### Findings
| # | Finding | Severity | File:Line |
|---|---|---|---|
| **B1** | **Provinces query has no error state.** If `fetchProvinces()` fails, `provinces = []` silently. User sees "انتخاب شهر" with no dropdown. No toast/inline error. | ❌ BUG | location-picker:20 |
| **B2** | **Non-null assertion risk.** `fetchCities(selectedProvince!.id)` at L30. `enabled: !!selectedProvince` should prevent call when null, but TS `!` assertion could crash at runtime if race occurs during React strict mode double-mount. | ⚠️ RISK | location-picker:30 |
| **B3** | **City query key uses empty string fallback.** `cities(selectedProvince?.id ?? '')` — when no province, key = `cities('')`. May collide with stale cache or cause unnecessary fetch. | ⚠️ CACHE | location-picker:29 |
| **B4** | **Dropdown shows empty province list during loading.** On mount, provinces = [] (query pending) → dropdown shows no options. No loading indicator. | ⚠️ UX | location-picker:67 |
| **B5** | **URL sync with search page is correct.** LocationPicker writes province/city to URL. Search page reads searchParams and passes to fetchListingsServer. ✅ | ✅ OK | picker:16, search:50 |

### Fix Plan
- **B1:** Wrap provinces useQuery with error handling; show inline "بارگذاری موقعیت‌ها ناموفق بود" + retry.
- **B2:** Guard queryFn: `if (!selectedProvince) return []` instead of `!`.
- **B3:** Use a disabled sentinel: `enabled: !!selectedProvince, queryKey: queryKeys.locations.cities(selectedProvince?.id ?? '__none__')`.
- **B4:** Show skeleton/spinner while `isLoading` in dropdown panel.

---

## Pattern 3: Authenticated Shell Redundancy & Session Guarding

### Layout Trace
```
layout.tsx → <MobileHeader lg:hidden> + <DesktopHeader hidden lg:flex> → <main> → <MobileBottomNav> → <SiteFooter>
MobileHeader: Logo + Sell CTA (hidden <360px) + AuthActions
DesktopHeader: Logo + SearchField + Categories icon + Sell CTA + AuthActions
```

### Findings
| # | Finding | Severity | File:Line |
|---|---|---|---|
| **C1** | **SearchField duplicated on search page.** DesktopHeader SearchField (desktop-header:25) + search page body SearchField (search/page:71). Both synced to same `q` param. Visual redundancy — header one suffices at desktop. | ❌ DUP | desktop-header:25, search:71 |
| **C2** | **LocationPicker MISSING from DesktopHeader.** Contract §102 requires `location + categories` in desktop header. Only homepage has inline LocationPicker. DesktopHeader has no location control. | ❌ MISSING | desktop-header:13-43 |
| **C3** | **No route guard for /auth/* when authenticated.** Logged-in users can navigate to `/auth/login` or `/auth/register`. Forms render, redirect only after submit. Should redirect immediately if session active. | ⚠️ MISSING | No middleware |
| **C4** | **HeaderAuthActions routes correctly.** Signed-in: `/account`. Anonymous: `/auth/login`. No regression. ✅ | ✅ OK | header-auth-actions:30,47 |
| **C5** | **BottomNav account tab uses auth state.** `status==='ready'?'/account':'/auth/login'`. ✅ | ✅ OK | bottom-nav:25 |
| **C6** | **DesktopHeader category navigation is minimal.** Only Grid3X3 icon → `/search`. Contract §102 specifies full `categories` in header. No dropdown/megamenu. | ⚠️ MINIMAL | desktop-header:27-31 |
| **C7** | **No server-side middleware for protected routes.** `/favorites`, `/account`, `/my-listings` render layout shell before client auth redirect kicks in. | ⚠️ MISSING | No middleware.ts |

### Fix Plan
- **C1:** Remove `<SearchField>` from search/page.tsx body (header provides it).
- **C2:** Add `<LocationPicker />` to DesktopHeader (between SearchField and Categories icon).
- **C3:** Add `middleware.ts` that checks auth cookie on `/auth/login` and `/auth/register` → redirect to `/` if authenticated.
- **C6:** Phase 8 — add category dropdown. Current icon acceptable for MVP.
- **C7:** Add `middleware.ts` for private route protection → redirect to `/auth/login?next=`.

---

## Summary: Critical Remediation Priority

| Priority | # | Description | Action |
|---|---|---|---|
| P0 | A4 | Homepage SearchField doesn't filter | Fix search redirect |
| P0 | C1 | Double SearchField on search page | Remove from body |
| P0 | C2 | Missing LocationPicker in DesktopHeader | Add inline picker |
| P0 | B1 | LocationPicker silent failure | Add error state |
| P1 | C3 | No auth route guard | Add middleware |
| P1 | B2 | Non-null assertion risk | Guard queryFn |
| P2 | A5 | Filter history pollution | push→replace |
| P2 | C7 | No private route middleware | Add middleware |
| P2 | C6 | DesktopHeader minimal categories | Phase 8 dropdown |
- **A5:** Use `history:'replace'` for province/city/price/condition/filter params.