# Deliverable Three — Target State & Implementation Plan
**Date:** 2026-10-13

## 1. Capability Matrix

| Capability | Status | Priority |
|-----------|--------|----------|
| Dashboard counters + marketplace summary | ✅ Implemented | — |
| Listing moderation queue | ✅ Implemented | — |
| Listing detail + moderation trail | ✅ Implemented | — |
| Report queue viewing | ✅ Implemented | — |
| Report resolve/dismiss | ❌ Missing | P0 |
| User search + suspend/ban/restore | ⚠️ Partial | P1 |
| Category CRUD | ⚠️ Partial | P1 |
| Category attribute/option CRUD | ❌ Missing | P1 |
| Location management | ❌ Missing | P1 |
| Audit log viewer | ❌ Missing | P1 |
| Admin entry from public UI | ❌ Missing | P2 |
| Bulk moderation | ❌ Missing | P2 |
| User detail drill-down | ❌ Missing | P2 |
| Destructive action confirmations | ⚠️ Partial | P1 |
| Responsive QA | ⚪ Not Verified | P1 |
| Accessibility (WCAG 2.2 AA) | ⚪ Not Verified | P2 |

## 2. Proposed Admin IA

```
/admin
├── داشبورد (Dashboard)
├── آگهی‌ها (Listings)
├── گزارش‌ها (Reports)          ← Add resolve/dismiss
├── کاربران (Users)             ← Add confirmation dialogs + detail
├── دسته‌بندی‌ها (Taxonomy)     ← Add attribute/option management
├── مکان‌ها (Locations)         ← NEW
└── رویدادها (Audit)            ← NEW
```

### 2.1 Reports Enhancement (P0)
- Add `resolveReport()`, `dismissReport()` to `api.ts`
- Add `useResolveReport`, `useDismissReport` hooks
- Add Resolve/Dismiss buttons with note modals to report cards
- Invalidate reports cache on settle

### 2.2 Locations — New Page (P1)
- Route: `app/admin/locations/page.tsx`
- API: 9 wrappers (provinces CRUD + cities CRUD)
- UI: Two-panel — province list + cities for selected province
- Inline add/edit with nameFa/nameEn/slug
- Delete blocked while cities/listings exist

### 2.3 Audit — New Page (P1)
- Route: `app/admin/audit/page.tsx`
- API: `fetchAuditLogs(params)` with action/entity/actor filters
- UI: Table (timestamp, actor, action, entity) + expandable metadata
- Page pagination

### 2.4 Taxonomy Enhancement (P1)
- Click category → show attributes below
- Attribute form: name, type, required
- Option management for SELECT/MULTI_SELECT
### 2.5 Users Enhancement (P1)
- Confirmation dialog before suspend/ban
- User detail expandable row (GET /admin/users/:id)

## 3. Security Target State

### Permission Matrix (Confirmed)

| Action | MODERATOR | ADMIN |
|--------|-----------|-------|
| View queue | ✅ | ✅ |
| Approve/Reject | ✅ | ✅ |
| Archive/Restore | ❌ | ✅ |
| View Reports | ✅ | ✅ |
| Resolve/Dismiss | ✅ | ✅ |
| View Users | ✅ | ✅ |
| Suspend/Ban/Restore | ❌ | ✅ |
| Manage Categories | ❌ | ✅ |
| Manage Locations | ❌ | ✅ |
| View Audit | ❌ | ✅ |
| View Analytics | ✅ | ✅ |

### Authorization Hardening (P1)
- Boundary tests: USER → all admin = 403
- MODERATOR → archive/ban/taxonomy/locations/audit = 403
- Cross-account isolation tests
- Self-moderation prevention tests

## 4. Design Tokens (Preserved)

| Token | Value |
|-------|-------|
| Primary Teal | `#0F766E` |
| Dark Teal | `#0B2F2B` |
| Soft Teal | `#E6F5F3` |
| Orange | `#F59E0B` |
| Background | `#F8FAFC` |
| Border | `#E2E8F0` |

**Font:** Vazirmatn self-hosted (replace Google Fonts)
**Direction:** RTL, Persian locale

### New Components Needed
- `ConfirmDialog` — modal for destructive actions
- `FilterChip` — active filter with remove
- `ExpandableRow` — detail drill-down
- `TwoPanelLayout` — locations list + detail

## 5. Implementation Roadmap

### P0 — Critical (Week 1)
| Task | Effort |
|------|--------|
| Wire report resolve/dismiss (api.ts + hooks + UI) | 6-8h |
| Fix TS 5.7 Jest compatibility | 1-2h |
| Run and verify existing test suite | 1h |

### P1 — Important (Week 2)
| Task | Effort |
|------|--------|
| Create /admin/locations (page + API + hooks + view) | 6-8h |
| Create /admin/audit (page + API + hook + view) | 4-6h |
| Add attribute/option management to taxonomy | 6-8h |
| Add confirmation dialogs (ConfirmDialog + wire up) | 3-4h |
| Browser-test all admin pages 390px + 1440px | 3-4h |
| Self-host Vazirmatn | 2-3h |

### P2 — Quality (Week 3)
| Task | Effort |
|------|--------|
| User detail drill-down | 3-4h |
| Admin component tests | 4-6h |
| Authorization boundary tests | 4-6h |
| WCAG 2.2 AA accessibility pass | 6-8h |
| Bundle analysis + perf audit | 3-4h |
| Active filter chips + clear all | 2-3h |

### P3 — Future
- Bulk moderation (needs new API endpoints)
- E2E test suite (Playwright)
- Real-time notifications (needs WebSocket backend)

## 6. Definition of Done (Per Task)
1. TypeScript strict typecheck passes
2. Unit tests written + passing
3. Browser verified at 390×844 + 1440×900
4. Keyboard navigation tested
5. Persian labels reviewed
6. Error states tested (network, 401, 403, 409, 500)
7. Empty states verified
8. No regressions in existing functionality