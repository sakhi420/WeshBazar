P3 Analysis — Polish, Scale & Ship
**Date:** 2026-10-14 | **Status:** 📋 Defined
---
## 1. P3 Task Overview
| # | Task | Effort | Why | Source |
|---|------|--------|-----|--------|
| 1 | Browser testing @ 390px + 1440px | 3-4h | P1 leftover — responsive QA never done | UX-001, PERF-002 |
| 2 | Backend test suite verify + fix | 3-4h | Backend tests exist but never executed | TEST-002 |
| 3 | E2E smoke tests (Playwright) | 6-8h | No browser-level admin workflow tests | TEST-005 |
| 4 | Bulk moderation (batch approve/reject) | 4-6h | Queue handles per-item only; needs backend | UX-008, GAP |
| 5 | Keyboard navigation audit | 2-3h | Focus management + tab order never tested | UX-002, WCAG |
| 6 | Performance profiling @ scale | 2-3h | 1000+ listings/users never tested | PERF-002, ADM-016 |
| 7 | UX polish (toggle→modal, reports actions) | 2-3h | Remaining UX papercuts | UX-004, UX-009 |
| 8 | Final documentation | 1-2h | Update all audit docs to reflect final state | — |
---
## 2. Task 1 — Browser Testing (P1 leftover)
### Scope
- Test all 7 admin views + auth-boundary at **390×844** (iPhone 14) and **1440×900** (laptop)
- Verify: layout doesn't break, no horizontal scroll, touch targets ≥ 44px
### Checklist per view
| View | 390px | 1440px | Notes |
|------|:---:|:---:|-------|
| Dashboard | ⚪ | ⚪ | Cards grid 1→2→3 cols |
| Listings | ⚪ | ⚪ | Table horizontal scroll |
| Reports | ⚪ | ⚪ | Status tabs + cards |
| Users | ⚪ | ⚪ | Table + expandable detail |
| Taxonomy | ⚪ | ⚪ | Two-panel layout |
| Locations | ⚪ | ⚪ | Two-panel layout |
| Audit | ⚪ | ⚪ | Table + filters |
---
## 3. Task 2 — Backend Test Suite
### Approach
```bash
cd weshbazar-backend
pnpm test
```
- Count pass/fail, identify broken tests, fix or skip with reason
- Document coverage gaps
### Expected deliverables
- Test report: X pass / Y fail / Z skip
- Any failing tests: triaged (bug, stale mock, missing env)
- Updated `findings.md` TEST-002
---
## 4. Task 3 — E2E Smoke Tests (Playwright)
### Why Playwright
- Full browser environment (JS, CSS, cookies, localStorage)
- Auth flow: login via OTP mock → session cookie set
- Visual assertions + keyboard navigation
### Test scenarios (8-10 tests)
| # | Scenario | Flow |
|---|----------|------|
| 1 | USER cannot access /admin | Login as USER → visit /admin → see AccessDenied |
| 2 | MODERATOR accesses listing queue | Login as MOD → /admin/listings → see queue |
| 3 | MODERATOR cannot access taxonomy | Login as MOD → /admin/taxonomy → see AccessDenied |
| 4 | ADMIN accesses all 7 views | Login as ADMIN → navigate all tabs |
| 5 | Listing moderation flow | View PENDING_REVIEW → approve → verify ACTIVE |
| 6 | Report resolve flow | Open report → add note → resolve → verify RESOLVED |
| 7 | User suspend flow | Search user → suspend → verify status change |
| 8 | Category CRUD flow | Create → edit → delete category |
| 9 | Audit log filters | Filter by action → verify results |
| 10 | Keyboard navigation | Tab through dashboard, Enter on buttons |
### Implementation
- Create `weshbazar-frontend/e2e/` directory
- `playwright.config.ts` with baseURL + viewport config
- Mock backend or use test database
- `npm run test:e2e` script
---
## 5. Task 4 — Bulk Moderation
### Problem
- Queue shows 20 items/page; each requires individual click→approve/reject
- No "select all → approve" workflow (UX-008)
### Approach
- **Backend**: New endpoint `POST /api/v1/admin/listings/bulk-moderate`
```ts
{ ids: string[]; action: 'APPROVE' | 'REJECT'; reason?: string }
```
- **Frontend**: Checkbox column + floating action bar "تأیید همه (N)" / "رد همه (N)"
### Files to touch
| Layer | File |
|-------|------|
| Backend API | `apps/api/src/modules/admin/admin-listings.controller.ts` |
| Backend Service | `apps/api/src/modules/admin/admin-listings.service.ts` |
| Backend DTO | `apps/api/src/modules/admin/dto/admin-responses.dto.ts` |
| Frontend API | `src/features/admin/api.ts` |
| Frontend Hook | `src/features/admin/hooks.ts` |
| Frontend UI | `src/features/admin/components/admin-listings-content.tsx` |
⚠️ **Frozen API rule:** `POST /admin/listings/bulk` does NOT exist in `openapi.json`.
→ This is a **new feature request**, not a bug fix. Must be explicitly approved before backend changes.
**Alternative (frontend-only):** Batch individual API calls with `Promise.allSettled`.
- Select checkboxes → "تأیید انتخاب‌شده‌ها" → sequential approve calls with progress indicator.
- No backend changes needed. Lower risk, fully P3 scope.
---
## 6. Task 5 — Keyboard Navigation
### Audit per view
| Check | Method |
|-------|--------|
| All interactive elements reachable via Tab | Manual scan |
| Focus visible (`focus-visible:ring`) | Verify existing Tailwind classes |
| Enter/Space activates buttons | Test each CRUD workflow |
| Escape closes modals | ConfirmDialog, action panels |
| No focus traps (except modals) | Tab through full page |
### Deliverable
- Keyboard audit report in `docs/audit/p3-keyboard-audit.md`
- Any issues fixed inline in components
---
## 7. Task 6 — Performance at Scale
### Tests
1. **Lighthouse CI** on all 7 admin pages (mobile + desktop)
2. **Load test**: 1000 listings in queue → verify render time < 500ms
3. **Bundle check**: re-run `ANALYZE=true next build` after all P3 changes
### Acceptance
- All admin pages: Lighthouse Performance ≥ 80, Accessibility ≥ 95
- No admin JS chunk > 50 KB gzip
- Search page: under 200 KB gzip
---
## 8. Task 7 — UX Polish
| ID | Issue | Fix |
|----|-------|-----|
| UX-004 | Taxonomy delete toggle "مطمئنی؟" not modal | Replace with ConfirmDialog |
| UX-009 | Reports: no resolve/dismiss action buttons | Already implemented in P0 `c3a87fd` — verify |
| UX-001 | Responsive QA | Covered by Task 1 |
| UX-002 | Keyboard nav | Covered by Task 5 |
---
## 9. Task 8 — Final Documentation
### Updates needed
| Doc | What |
|-----|------|
| `README.md` | Mark P3 complete, update implementation progress |
| `findings.md` | Resolve all remaining ⚪ items |
| `p3-analysis.md` | This document — mark tasks done |
| `bundle-analysis.md` | Re-run with final bundle |
---
## 10. Execution Order
```
Task 1 (browser test) ← 3-4h, visual QA → FIRST
↓
Task 5 (keyboard audit) ← 2-3h, while browser is open
↓
Task 2 (backend tests) ← 3-4h, verify backend health
↓
Task 6 (perf profiling) ← 2-3h, Lighthouse + bundle
↓
Task 7 (UX polish) ← 2-3h, small fixes
↓
Task 4 (bulk moderation) ← 4-6h, biggest feature
↓
Task 3 (E2E tests) ← 6-8h, depends on all UI stable
↓
Task 8 (docs) ← 1-2h, final wrap-up
```
**Total P3 effort: ~26-35h**
---
## 11. Acceptance Criteria
- [ ] All 7 admin views tested at 390px + 1440px, no layout breaks
- [ ] Keyboard: all CRUD workflows operable, focus visible
- [ ] Backend test suite: ≥ 90% pass rate (or all failures documented)
- [ ] Bulk moderation: select + batch approve/reject working
- [ ] E2E: 8-10 Playwright tests passing
- [ ] Lighthouse: Performance ≥ 80, Accessibility ≥ 95 on all admin pages
- [ ] No regressions: all 49 Jest tests still green
- [ ] All audit docs updated to reflect final state