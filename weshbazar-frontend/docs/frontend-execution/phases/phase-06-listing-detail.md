# Phase 06: Listing Detail Polish
**Status:** PLAN MODE
**Date:** 2026-10-11

## Current State: 90% Complete

The listing detail page is well-built. Gallery, price, attributes, description, seller card, contact reveal, report dialog, share, favorite, safety, related listings — all present and working.

## 3 Improvements

### 1. Mobile Sticky Contact Bar
**Problem:** Contact actions are in the desktop sidebar which scrolls away on mobile. User must scroll past gallery+price+title+attributes+description to reach "show phone."
**Fix:** Add a sticky bottom bar on `<lg` that shows primary contact button. Uses same ContactSection state via shared context or a simpler approach — just a prominent button that scrolls to the contact section.

### 2. Sold Badge on Gallery
**Problem:** SOLD listings show status text near price, but gallery image doesn't visually indicate "sold."
**Fix:** When `isSold`, overlay a semi-transparent dark badge on the main gallery image: "فروخته شد".

### 3. Back Navigation
**Problem:** No quick way back to category/search from listing detail.
**Fix:** Add a subtle back link near breadcrumbs: "← بازگشت به {category}" using the category from the listing.

## Files Changed
| File | Change |
|---|---|
| `listing/[slug]/page.tsx` | Back link + sold gallery overlay + mobile contact bar |
| `gallery.tsx` | Accept `sold` prop, show overlay badge |

## Gates
- [ ] Mobile sticky contact button visible <lg
- [ ] Sold overlay on gallery image
- [ ] Back-to-category link present
- [ ] Tests + TS clean
- [ ] All 185 tests pass