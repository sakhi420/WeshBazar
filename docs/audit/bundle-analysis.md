# Bundle Analysis — P2 Task 5

**Date:** 2026-10-14 | **Commit:** `d1fe9b8` (analyzer setup)

## 1. Methodology

- Installed `@next/bundle-analyzer` v1.3.2
- Wrapped `next.config.mjs` with `withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })`
- Added `npm run analyze` script
- Ran production build with `ANALYZE=true`
- Analyzed `.next/analyze/*.html` treemaps + `.next/server/app/**/page.js` sizes

## 2. Server-Side Page Sizes

| Page | Uncompressed | Verdict |
|------|-------------|---------|
| `/search` | **1,496 KB** | 🔴 1.5 MB — categories tree + provinces + listing data all serialized inline for client hydration |
| `/` (home) | **1,351 KB** | 🔴 1.3 MB — likely same root cause (category nav + hero data) |
| `/_not-found` | 683 KB | 🟡 0.7 MB — could be lighter |
| `/sell/[id]/edit` | 50 KB | 🟢 |
| `/listing/[slug]` | 35 KB | 🟢 |
| `/my-listings` | 21 KB | 🟢 |
| `/category/[slug]` | 16 KB | 🟢 |
| `/sell/*` (steps) | 9–18 KB | 🟢 |
| **Admin pages (7x)** | **3–7 KB** | ✅ All admin pages are well under 10 KB |

## 3. Client-Side Chunks (Top 15)

| Chunk | Size | Notes |
|-------|------|-------|
| `1517` | 195.8 KB | Largest shared chunk (likely lucide-react icons or React itself) |
| `3654` | 76.8 KB | |
| `5875` | 32.8 KB | |
| `8917` | 30.6 KB | |
| `9316` | 24.5 KB | |
| 10 others | 9–22 KB | |
| **Total top 15** | **~513 KB** | Uncompressed; gzip typically 30-40% of this |

## 4. Root Cause: Search/Home Page Bloat

The search page fetches 3 data sources server-side and serializes all of them inline for client hydration:

```tsx
// search/page.tsx — server component
const [listings, categories, provinces] = await Promise.all([
  fetchListingsServer(query),    // page of listings
  fetchCategoriesServer(),        // FULL category tree → serialized as JSON
  fetchProvincesServer(),         // FULL province list → serialized as JSON
]);
```

The `categories` and `provinces` data is passed as props to `FilterPanelDesktop`, `MobileFilterSheet`, and `ActiveFilterChips` — all client components. Next.js serializes these props into `<script>` tags (self.__next_f.push([...])), inflating the HTML payload.

The home page (`/`) likely does the same for the navigation and category menu.

## 5. Admin Pages — Already Optimal

All 7 admin pages are **3–7 KB** each. No optimization needed. The lean sizes result from:
- Thin server-component pages that just mount a single client component
- No large inline data serialization
- All heavy data (tables, forms) fetched client-side via React Query

This is the correct pattern.

## 6. Recommendations

### Quick Wins (P2 scope)
1. ✅ **Bundle analyzer wired** — `npm run analyze` available for CI
2. ✅ **Admin pages verified lean** — 3-7 KB each, no action needed
3. ⚪ **Search page**: Consider lazy-loading categories/provinces client-side instead of server-side serialization (saves ~800 KB from HTML payload)
4. ⚪ **Home page**: Same pattern — move heavy data to client-side fetch
5. ⚪ **Add `<Suspense>` boundaries**: Allow streaming HTML for search/home pages

### Future (P3+)
- Add Lighthouse CI for perf regression detection
- Audit `lucide-react` tree-shaking (195 KB chunk may include unused icons)
- Consider `next/dynamic` for heavy admin components (though they're already lean)

## 7. Bundle Analyzer HTML Reports

Generated reports in `.next/analyze/`:
- `client.html` (551 KB) — client bundle treemap
- `nodejs.html` (563 KB) — server bundle treemap
- `edge.html` (278 KB) — edge runtime treemap

Open any with `npx serve .next/analyze` or drag into browser.