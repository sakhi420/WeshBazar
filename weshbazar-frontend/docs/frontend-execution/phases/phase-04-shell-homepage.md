# Phase 4: Shared Shell & Homepage Vertical Slice

**Status:** ✅ Completed  
**Date:** 2026-10-11  
**Focus:** Mobile/Desktop header separation, homepage overhaul, component geometry fixes

---

## Summary

Phase 4 completed the critical infrastructure changes for the WeshBazar frontend, introducing:
- Dual-header architecture (MobileHeader + DesktopHeader)
- Fully responsive homepage with real SearchBar, LocationPicker, and CategoryShortcutGrid
- CLS-free image handling with next/image
- Self-hosted font infrastructure

---

## Changes Implemented

### 1. Mobile Bottom Navigation (§103, §458, §492)

**File:** `src/components/layout/mobile-bottom-nav.tsx`

**Changes:**
- ✅ Height increased from 60px to 64px (`var(--bottom-nav)`)
- ✅ Safe-area padding support via `pb-[env(safe-area-inset-bottom)]`
- ✅ Fixed route paths:
  - 'دسته‌ها' → `/categories` (category exploration structure)
  - 'حساب' → `/account` when signed in, `/auth/login` otherwise
- ✅ Proper authentication-aware navigation

### 2. Header Architecture Redesign (§101, §102)

**Files Created:**
- `src/components/layout/mobile-header.tsx` (56px height)
- `src/components/layout/desktop-header.tsx` (64px height)

**Files Modified:**
- `src/app/layout.tsx` — replaced `SiteHeader` with conditional rendering

**MobileHeader Features:**
- Minimal logo (24px height)
- Quick action icons (search, sell CTA, auth)
- Hidden on lg+ breakpoints (`lg:hidden`)
- Sticky positioning with z-header

**DesktopHeader Features:**
- Full logo (36px height)
- Wide SearchBar component with nuqs URL state
- Sell CTA button (orange accent)
- Auth-aware user menu
- Visible only at lg+ breakpoints (`hidden lg:block`)

### 3. Homepage Overhaul (§16, §55, §105, §107, §108)

**File:** `src/app/page.tsx`

**Major Changes:**

#### Hero Section
- ❌ Removed fake search Link
- ✅ Added real `SearchBar` component with `variant="compact"` and nuqs URL state
- ✅ Integrated `LocationPicker` component for province/city cascade selection
- ✅ Moved Sell CTA to top section with orange accent button
- ✅ Added security notice (SafetyNotice) inline with Sell CTA
- ✅ Responsive layout: stacked on mobile, side-by-side on sm+

#### Category Section
- ❌ Removed manual pill grid implementation
- ✅ Added `CategoryShortcutGrid` component
- ✅ Single row design with max 8 pills
- ✅ Height: 44px (h-control)
- ✅ Border + hover states with primary-soft background
- ✅ "مشاهده همه" link routes to `/categories`

#### Latest Listings Section
- ✅ Connected to real API via `fetchListingsServer()`
- ✅ Uses `ListingGrid` component for responsive grid layout
- ✅ Proper empty/error/loading states

**Phase 4 Complete!** Ready for Phase 5: Remaining Pages & Advanced Features.