# P2 Analysis — Deep Dive & Implementation Plan

**Date:** 2026-10-14 | **Status:** In Progress (2/7 complete)  
**Done:** Task 7 `a06d0de`, Task 1 `ffc29b8` `a0cc662`  
**Next:** Task 6 — Filter Chips

---

## 1. P2 Task Overview

| # | Task | Effort | Gap | Approach |
|---|------|--------|-----|----------|
| 1 | User detail drill-down | 3-4h | No `fetchAdminUser`, no expandable row | API + hook + ExpandableRow |
| 2 | Admin component tests | 4-6h | 0 component tests for 7 views | Jest + RTL per view |
| 3 | Auth boundary tests | 4-6h | Backend tests exist but not run; frontend not tested | Backend test run + frontend boundary mocks |
| 4 | WCAG 2.2 AA accessibility | 6-8h | No keyboard/ARIA audit done | Per-view audit + remediation |
| 5 | Bundle analysis + perf | 3-4h | Never measured | `@next/bundle-analyzer` + Lighthouse |
| 6 | Filter chips + clear all | 2-3h | Filters applied via URL but no visible chips | ActiveFilterChips per admin view |
| 7 | Admin entry from public UI | 0.5h | `HeaderAuthActions` has user menu, no admin link | Add `<Link>` when role ∈ {MODERATOR, ADMIN} |

---

## 2. User Detail Drill-Down (Task 1)

### 2.1 Backend Contract
```
GET /api/v1/admin/users/{id} → AdminUserDetailDto
```

**Response shape** (from `admin.presenter.ts:48-52` and `admin-responses.dto.ts:60-71`):
```ts
{
  // ...all AdminUserDto fields (id, phone, displayName, role, status, etc.)
  listingsByStatus: { DRAFT: 0, PENDING_REVIEW: 1, ACTIVE: 4, REJECTED: 0, SOLD: 2, ARCHIVED: 1 },
  openReportsAbout: 2,
  reportsSubmitted: 0
}
```

### 2.2 Current Frontend State
- `AdminUserItem` type: flat — id, phone, displayName, role, status, phoneVerified, activeListings, createdAt
- No `fetchAdminUser(id)` in api.ts — **GAP**
- No `useAdminUser(id)` hook — **GAP**
- `admin-users-view.tsx`: flat table with no expandable row — **GAP**
- Action buttons (suspend/ban/restore) work via inline form + ConfirmDialog ✅

### 2.3 Implementation Plan

**Step 1 — Types** (`types.ts`):
```ts
export interface AdminUserDetail extends AdminUserItem {
  listingsByStatus: Record<string, number>;
  openReportsAbout: number;
  reportsSubmitted: number;
}
```

**Step 2 — API** (`api.ts`):
```ts
export function fetchAdminUser(id: string): Promise<AdminUserDetail> {
  return get<AdminUserDetail>(`${ADMIN_BASE}/users/${id}`);
}
```

**Step 3 — Hook** (`hooks.ts`):
```ts
export function useAdminUserDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.user(id ?? ''),
    queryFn: () => fetchAdminUser(id as string),
    enabled: enabled && id !== null,
    staleTime: 30_000,
    retry: false,
  });
}
```

**Step 4 — UI** (`admin-users-view.tsx`):
- Add expand/collapse toggle per row
- When expanded, fetch detail and show:
  - Listing counts by status (badges)
  - Reports about this user
  - Reports submitted by this user
- Follow same pattern as admin-listing-detail-panel.tsx

**Files to touch:** `types.ts`, `api.ts`, `hooks.ts`, `query-keys.ts`, `admin-users-view.tsx`
---

## 3. Admin Component Tests (Task 2)

### 3.1 Current Coverage
| File | Tests | Status |
|------|-------|--------|
| `model.test.ts` | 13 | ✅ Pure unit |
| `errors.test.ts` | Classification | ✅ Pure unit |
| 7 admin views | 0 | ❌ None |

### 3.2 Test Strategy
- **Session states** (all views): checking→spinner, anonymous→redirect, unreachable→error, USER→denied, 403→denied, 401→redirect
- **Data states** (per view): loading→skeleton, error→error+retry, empty→empty, data→renders
- **Interactions**: form CRUD, ConfirmDialog open/confirm/cancel, pagination, search

### 3.3 Views Test Matrix
| View | Min Tests |
|------|-----------|
| admin-dashboard-view | 5 |
| admin-locations-view | 8 |
| admin-taxonomy-view | 10 |
| admin-users-view | 8 |
| admin-reports-view | 8 |
| admin-audit-view | 6 |
| admin-listings-view | 10 |
| **Total** | **~55** |

**Infrastructure:** Jest + RTL (already configured), mock `useAuthBootstrap` + TanStack Query hooks.

---

## 4. Authorization Boundary Tests (Task 3)

| Scenario | Expected |
---

## 6. Bundle Analysis + Perf (Task 5)

### Setup: `pnpm add -D @next/bundle-analyzer`
### Targets
| Metric | Target |
|--------|--------|
| First admin page JS | < 200 KB gzipped |
| Admin code-split | Verify route-based splitting |
| Images | All < 100 KB |
| Font | Vazir self-hosted ✅ |
| Lighthouse | ≥ 90 Performance |

### Code Split Audit
- 7 views: lazy via App Router route splitting ✅
- `admin-nav.tsx`: only Lucide icons (lightweight)
- Verify no admin code in public chunks via analyzer report

---

## 7. Filter Chips + Clear All (Task 6)

### Current State per View
| View | Filters | URL State | Chips |
|------|---------|-----------|-------|
| Listings | status, reported, category, seller, q, sort | ✅ nuqs | ❌ |
| Reports | status tab | ✅ nuqs | ❌ |
| Users | q (search) | useState | ❌ |
| Audit | action, entityType, entityId, actorUserId | params | ❌ |

### Implementation
- Adapt existing `ActiveFilterChips` from public search (or create new admin variant)
- Each chip: label + value + remove → clears URL param
- "پاک‌سازی همه فیلترها" when 2+ filters active
- Invalidate query on clear

---

## 8. Admin Entry from Public UI (Task 7)

### Current State
`HeaderAuthActions` shows user name + account link + logout. No admin link for staff.

### Implementation (`header-auth-actions.tsx`)
```tsx
{(user.role === 'MODERATOR' || user.role === 'ADMIN') && (
  <Button asChild variant="ghost" size="sm">
    <Link href="/admin">پنل مدیریت</Link>
  </Button>
)}
```
Also add to `mobile-bottom-nav.tsx`.

---

## 9. Recommended Execution Order

```
Task 7 (admin link) ← 30min, zero deps → FIRST
  ↓
Task 1 (user detail) ← types/api/hook/UI → 3-4h
  ↓
Task 6 (filter chips) ← touches 4 views → 2-3h
  ↓
Task 5 (bundle) ← measure only → 3-4h
  ↓
Task 4 (WCAG) ← per-view audit → 6-8h
  ↓
Task 2 (component tests) ← stable UI needed → 4-6h
  ↓
Task 3 (auth boundary) ← backend+frontend → 4-6h
```

---

## 10. Files Manifest

### New Files
| File | Task |
|------|------|
| `docs/audit/p2-analysis.md` | This doc |
| `features/admin/__tests__/admin-dashboard-view.test.tsx` | Tests |
| `features/admin/__tests__/admin-locations-view.test.tsx` | Tests |
| `features/admin/__tests__/admin-taxonomy-view.test.tsx` | Tests |
| `features/admin/__tests__/admin-users-view.test.tsx` | Tests |
| `features/admin/__tests__/auth-boundary.test.tsx` | Auth tests |

### Modified Files
| File | Task(s) |
|------|---------|
| `api.ts` | T1: +fetchAdminUser |
| `hooks.ts` | T1: +useAdminUserDetail |
| `types.ts` | T1: +AdminUserDetail |
| `query-keys.ts` | T1: +admin.user key |
| `admin-users-view.tsx` | T1: expandable rows |
| `header-auth-actions.tsx` | T7: admin link |
| `mobile-bottom-nav.tsx` | T7: admin link |
| All 7 view files | T4: WCAG fixes |
| `next.config.mjs` | T5: bundle analyzer |

---

## 11. Acceptance Criteria

### T1 — User Detail
- [ ] Click row → expand detail (listing counts + reports)
- [ ] Loading/error states for detail fetch
- [ ] Click again / different user → collapse/switch

### T2 — Component Tests
- [ ] `pnpm test` passes ≥ 50 new tests
- [ ] Each view: session-state + data-state tests
- [ ] No flakes on rerun

### T3 — Auth Boundary
- [ ] Backend: 403 for unauthorized roles
- [ ] Frontend: AccessDenied on 403

### T4 — WCAG
- [ ] axe-core: 0 critical, 0 serious per page
- [ ] Keyboard: all CRUD workflows operable
- [ ] Focus: visible + trapped in modals

### T5 — Bundle
- [ ] Report generated, admin JS < 200 KB gzip
- [ ] No admin code in public chunks

### T6 — Filter Chips
- [ ] Chips visible + removable, "clear all" when 2+
- [ ] URL resets + query refetches on clear

### T7 — Admin Link
- [ ] MOD/ADMIN see "پنل مدیریت", USER does not
- [ ] Middleware still protects
|----------|----------|
| USER → any /admin/* API | 403 |
| USER → /admin page | AccessDenied |
| MODERATOR → archive/ban/taxonomy/locations/audit | 403 |
| ADMIN → all endpoints | 200 ✅ |
| Cross-account moderation | 403 |
| Self-moderation (admin ban self) | 403 |
| Suspended admin → any admin | 403 |

**Implementation:** Run backend test suite to verify guard chain. Frontend: mock 403 responses, verify `AdminAccessDenied` renders.

---

## 5. WCAG 2.2 AA Accessibility (Task 4)

### Per-View Audit
| Check | Current | Target |
|-------|---------|--------|
| Keyboard reachable | ⚪ Unknown | All interactive elements |
| Focus visible | ⚪ Unknown | `focus-visible:ring-2` |
| Focus trapped in modal | ⚪ Not tested | Tab cycles inside ConfirmDialog |
| Table headers | ✅ `<th>` | Add `scope="col"` |
| Status not color-only | ✅ Text badges | Verified |
| Dynamic content | ❌ | `aria-live` for mutations |
| Heading hierarchy | ⚪ Unchecked | One h1, h2/h3 descend |
| Contrast ≥ 4.5:1 | Unknown | Audit all text |
| RTL properties | ✅ | start/end used |

**Implementation:** Run axe-core per page, fix critical+serious, test keyboard CRUD workflows.