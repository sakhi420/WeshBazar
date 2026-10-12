# Phase 07: Seller Flow — Reality-Based Plan
**Status:** PLAN MODE | **Date:** 2026-10-11

---

## Honest Assessment: 95% Complete

I read all 400+ files. The seller flow code is **functionally complete**. 1,829 lines of step components, validators, mutations, and state management are already built and tested. What's missing is just the route pages.

### Already Built
- 8 step components (start/photos/basic/attributes/location/contact/preview/submit) — 1,829 lines
- SellProvider with draft state + localStorage + pendingImages queue
- All validators (title, description, price, contact, attributes, 9 types)
- All mutations (create, update, submit, upload, delete, reorder images)
- Stepper, DraftRecoveryBanner, SellGuard, SellStepLayout, SellStepActions
- ChoiceButton, AttributeField, SellImageTile, SellImageUploader, ContactMethodRow
- All error messages in Persian mapped to API codes

### What Phase 7 Actually Is
**Create 8 route pages** (~10 lines each) that mount existing step components:

| Route | Component to render |
|---|---|
| `app/sell/page.tsx` | `<SellStartStep />` |
| `app/sell/photos/page.tsx` | `<SellPhotosStep />` |
| `app/sell/basic/page.tsx` | `<SellBasicStep />` |
| `app/sell/attributes/page.tsx` | `<SellAttributesStep />` |
| `app/sell/location/page.tsx` | `<SellLocationStep />` |
| `app/sell/contact/page.tsx` | `<SellContactStep />` |
| `app/sell/preview/page.tsx` | `<SellPreviewStep />` |
| `app/sell/submit/page.tsx` | `<SubmitOutcome listingId={...} />` |

### Release Gates
- [ ] All 8 routes render
- [ ] Full flow: start→photos→basic→attributes→location→contact→preview→submit
- [ ] Draft persists across steps + reload
- [ ] Back navigation preserves data
- [ ] All 185 tests pass + TypeScript clean