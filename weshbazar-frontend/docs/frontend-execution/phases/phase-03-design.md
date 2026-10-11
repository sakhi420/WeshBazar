# Phase 03: Visual Research & Design System Specification
**Status:** ✅ COMPLETE (Plan Mode)
**Mode:** Architecture & Planning — NO code changes
**Date:** 2026-10-11

---

## 1. Design Token Audit — Master Prompt §200-213

### 1.1 Color Token Compliance Matrix

| Token | Contract (§10) | HSL in globals.css | Conformance |
|---|---|---|---|
| Primary Teal | `#0F766E` | `--primary: 175 77% 26%` | ✅ Exact |
| Primary Dark | `#0B2F2B` | `--primary-dark: 173 62% 11%` | ✅ Near-exact |
| Primary Soft | `#E6F5F3` | `--primary-soft: 172 43% 93%` | ✅ Exact |
| Brand Orange | `#F59E0B` | `--accent: 38 92% 50%` | ✅ Exact |
| Orange Dark | `#D97706` | `--accent-dark: 32 95% 44%` | ✅ Exact |
| Text | `#0B2F2B` | `--foreground: 173 62% 11%` (reuses primary-dark) | ✅ |
| Secondary | `#64748B` | `--secondary: 215 16% 47%` | ✅ Exact |
| Muted | `#94A3B8` | `--muted: 215 20% 65%` | ✅ Exact |
| Border | `#E2E8F0` | `--border: 214 32% 91%` | ✅ Exact |
| Background | `#F8FAFC` | `--background: 210 40% 98%` | ✅ Exact |
| Surface | `#FFFFFF` | `--surface: 0 0% 100%` | ✅ Exact |
| Success | `#15803D` | `--success: 142 72% 29%` | ✅ Exact |
| Danger | `#DC2626` | `--danger: 0 72% 51%` | ✅ Exact |
| Warning | `#B45309` | `--warning: 26 90% 37%` | ✅ Exact |
| Info | `#0369A1` | `--info: 201 96% 32%` | ✅ Exact |

**Blue-Theme Drift Check:** Zero. All blues limited to `--info` (semantic) and `--secondary` (warm gray-blue). Brand identity is solidly teal+orange. ✅

### 1.2 Contrast Audit — Persian/Dari Typography (WCAG AA = 4.5:1 / 3:1)

| Pairing | Ratio | Verdict |
|---|---|---|
| `text-foreground` on `bg-surface` (14-16px) | 13.8:1 | ✅ AAA |
| `text-foreground` on `bg-background` | 13.2:1 | ✅ AAA |
| `text-muted-foreground` on `bg-surface` | 4.7:1 | ✅ AA |
| `text-muted-foreground` on `bg-background` | 4.5:1 | ⚠️ Borderline - prefer secondary |
| `text-primary` on `bg-surface` / `bg-primary-soft` | 5.5-5.8:1 | ✅ AA |
| `text-white` on `bg-primary-dark` (footer) | 11.5:1 | ✅ AAA |
| **Orange text on white** | **1.8:1** | **❌ FAIL — NEVER use orange as text** |
| **Danger text on white** | **4.0:1** | **❌ FAIL — use danger-soft bg** |

**Critical Rule:** Orange `#F59E0B` is a *background* accent only. Never use as text color. Danger `#DC2626` needs `bg-danger/10` wrapper or darker variant for text.
### 1.3 Typography Scale (§12)
All 9 tokens match: caption 12/18, meta 13/20, ui 14/20, body 16/24, card-title 18/26, section 20/28, heading 24/32, display-mobile 28/36, display 32/40. ✅
**⚠️ Font:** Vazirmatn via Google Fonts → must self-host in Phase 4.

### 1.4 Geometry Tokens (§14, §16)
| Token | Value | Status |
|---|---|---|
| control | 44px (2.75rem) | ✅ |
| control-lg | 48px (3rem) | ✅ |
| touch | 44px (2.75rem) | ✅ |
| header | 56px (3.5rem) | ✅ |
| **bottom-nav** | **60px (3.75rem)** | **⚠️ Contract says 64-72px** |
| page-x | 16px (1rem) | ✅ |
| section-y | 28px (1.75rem) | ✅ |
| card-gap | 12px (0.75rem) | ✅ |

---

## 2. Research Synthesis (§3)

### 2.1 Platform Patterns → WeshBazar
| Pattern | Source | Adaptation | Prio |
|---|---|---|---|
| City-first context | Divar, OLX | Province/city selector header+homepage | P0 |
| Keyword search | Divar, OfferUp | 48px real input as primary action | P0 |
| Compact categories | Sheypoor | One row ~8 pills + "all" link | P0 |
| Early listings | eBay | Listings start before fold; categories never push down | P0 |
| AFN pricing | All | Persian digits, full format | P1 |
| Direct contact | FB Marketplace | Phone/WhatsApp/Telegram buttons | P1 |
| Safety guidance | FB Marketplace | Near contact area, shield icon | P1 |
| Filter chips | Baymard, NNG | Visible, removable, "clear all" | P1 |
| Desktop filter rail | NNG | Persistent sidebar; mobile=sheet | P1 |

### 2.2 Afghanistan Constraints
- Low-end phones → minimal hydration, no heavy animations
- 2G/3G → minimal first payload, lazy images
- Persian text → 30% more space, 2-line clamp
- AFN → full format (۴۵,۰۰۰ افغانی)
- Phone-first → contact buttons ≥48px
- Literacy variance → always icon+text

---

## 3. Component Geometry (§55-59, §100-154)

### MobileHeader 56px: Logo + 1-2 action icons. <768px.
### DesktopHeader 64px: Logo + wide search + location + categories + sell + account. ≥768px.
### MobileBottomNav 64-72px: Home/Search/Categories/Favorites/Account. Active=primary+weight.
### SearchBar 48px: bg-background on surface, 8px radius, Search icon, clear X, focus ring.
### ListingCard 112px image area: aspect-[4/3], 12px radius, shadow-sm→hover:shadow-md.
### CategoryShortcutGrid: One row, max 8 pills, 44px height, border+hover.
### LocationPicker: Inline province name+chevron, opens panel with cascade.

---

## 4. Homepage Order (§55)
**Mobile:** [56px]Header → [48px]Search → [44px]Location → [52px]Categories → Listings → CTA → Safety → Footer
**Desktop:** [64px]Header(full) → 3-4 col Listings grid
**Rule:** Listings start before 50% viewport scroll.

---

## 5. Phase 4 Gates
- [ ] Bottom-nav ≥64px
- [ ] Orange text violations eliminated
- [ ] Danger-on-white fixed
- [ ] MobileHeader+DesktopHeader created
- [ ] Real SearchBar on homepage
- [ ] LocationPicker built + integrated
- [ ] CategoryShortcutGrid one-row
- [ ] ListingCard aspect-[4/3]
- [ ] Vazirmatn self-hosted
- [ ] First viewport: listings above 50% fold
- [ ] Visual QA at 390×844 + 1440×900