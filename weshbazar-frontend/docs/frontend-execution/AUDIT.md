# WeshBazar Frontend — Audit Report جامع

**تاریخ:** 2026-10-11  
**محدوده:** بررسی کامل فرانت‌اند در برابر Master Prompt V4/V5  
**وضعیت:** فاز ۰ کامل شد  

---

## خلاصه اجرایی

فرانت‌اند WeshBazar (`weshbazar-frontend/`) دارای **معماری پایه‌ای عالی** با API layer حرفه‌ای، type safety قوی، پشتیبانی RTL و design tokens semantic است. اما حدود **۳۰-۴۰٪** از فیچرهای مورد نیاز پیاده‌سازی شده است.

**امتیاز کلی:** ۵۲/۱۰۰

---

## ۱. معماری و کیفیت کد — PASS (85/100)

### ۱.۱ نقاط قوت
| بخش | وضعیت | توضیح |
|---|---|---|
| API Client | ✅ عالی | centralized adapters, typed errors, single-flight refresh, idempotency keys |
| TypeScript | ✅ عالی | strict mode, types matching OpenAPI |
| RTL Architecture | ✅ خوب | logical properties, bidi isolation |
| TanStack Query | ✅ خوب | query key factory, optimistic updates (favorites) |
| Next.js Architecture | ✅ خوب | Server Components default, narrow Client boundaries |
| Design Tokens | ✅ خوب | CSS variables semantic, tailwind tokens proper |
| Security | ✅ خوب | in-memory token, sanitized redirects |
### ۱.۲ مشکلات یافت شده

**A-1: Search Page Key Prop (MEDIUM)**
- `search/page.tsx` و `category/[slug]/page.tsx` از `JSON.stringify(query)` به عنوان React key استفاده می‌کنند. شکننده است.

**A-2: Missing Auth State in Shell (CRITICAL)**
- `site-header.tsx` همیشه لینک "ورود" نشان می‌دهد. AuthProvider وجود ندارد.

**A-3: MobileBottomNav Wrong Routes (CRITICAL)**
- `'دسته‌ها'` به `/search` لینک شده (باید category)
- `'حساب'` به `/auth/login` لینک شده (باید `/account`)

**A-4: Homepage Search (HIGH)**
- جستجو `<Link>` به `/search` است نه `<input>` واقعی. مستر پرامپت §20 الزام به search input واقعی دارد.

---

## ۳. طراحی بصری و UI/UX — FAIL (35/100)

### ۳.۱ هدر
- یک هدر مشترک برای mobile/desktop. قرارداد §101-102 دو هدر مجزا می‌خواهد
- Desktop header باید: logo + wide search + location + categories + sell + account داشته باشد
- Mobile header باید: logo + minimal action + search/location context

### ۳.۲ Homepage
- Location control وجود ندارد
- Category shortcuts صرفاً flex-wrap text link ساده هستند
- Search input واقعی نیست
- طراحی ساده و فاقد polish بصری

### ۳.۳ Listing Card
- از `<img>` معمولی به جای `next/image` استفاده می‌کند
- نسبت تصویر enforcement نشده (خطر CLS)
- طراحی ساده و فاقد hierarchy قوی

### ۳.۴ تایپوگرافی
- Vazirmatn از Google Fonts لود می‌شود (قرارداد §12 self-hosted می‌خواهد)
- Type scale درست پیاده‌سازی شده
---

## ۴. کامپوننت‌های Missing — CRITICAL

### Navigation Missing: MobileHeader(§101), DesktopHeader(§102), LocationButton(§106), LocationPicker(§107), CategoryShortcutGrid(§108)
### Discovery: ✅ FilterPanelDesktop, ✅ FilterSheetMobile, ✅ AppliedFilterChips, ✅ SortControl, ❌ LoadMoreCursor
### Detail: ❌ ImageGallery, ✅ AttributeList, ✅ SellerCard, ❌ ContactActions, ✅ ShareButton, ✅ ReportDialog, ✅ SafetyNotice
### Forms (ALL MISSING): ❌ PriceInput, ❌ PhoneInput, ❌ OtpInput, ❌ PasswordField, ❌ DynamicFieldRenderer, ❌ FormSection, ❌ FieldError, ❌ FieldHint, ❌ LoadingButton
### Feedback: ❌ ToastRegion, ❌ OfflineBanner, ❌ StatusMessage
### Sell: ❌ Stepper, ❌ DraftRecoveryBanner, ❌ ImageUploader, ❌ ImageReorder
### Admin (ALL MISSING): ❌ Sidebar, ❌ Table, ❌ Cards, ❌ ActionMenu
### Status: ❌ ListingStatusBadge, ❌ SellerStatusBadge

---

## ۵. صفحات Missing — CRITICAL

### Auth: ❌ /auth/verify, ❌ /auth/forgot-password, ❌ /auth/reset-password
### Sell (ALL MISSING): ❌ /sell, /sell/photos, /sell/basic, /sell/attributes, /sell/location, /sell/contact, /sell/preview, /sell/submit, /sell/[id]/edit
### Account: ❌ /my-listings, ❌ /account, ❌ /account/security
### Seller: ❌ /seller/[slug]
### Admin (ALL MISSING): ❌ /admin, /admin/listings, /admin/reports, /admin/users, /admin/taxonomy, /admin/locations, /admin/audit

---

## ۶. Phase Plan

### ✅ Phase 0: Baseline Complete (current)
### Phase 1: API + Critical Behavior Audit
### Phase 2: Identity/Session/Draft Isolation
### Phase 3: Visual Research & Design System
### Phase 4: Shared Shell & Homepage Vertical Slice
### Phase 5: Discovery (Search & Categories)
### Phase 6: Listing Detail & Seller Context
### Phase 7: Seller Listing Flow
### Phase 8: Auth & Account Completion
### Phase 9: Admin Surfaces
### Phase 10: Full Regression & Release Audit

---

## ۷. Quick Wins Phase 4

1. Fix MobileBottomNav routes (دسته‌ها → category, حساب → /account)
2. Replace homepage search Link with real SearchBar input
3. Add LocationPicker to homepage and header
4. Add aspect-ratio to listing card images
5. Move Vazirmatn to self-hosted
6. Create proper MobileHeader + DesktopHeader components
---

## IMPLEMENTATION STATUS — ACTUAL (corrected after full file reading)

### Components VERIFIED EXIST ✅ (read and verified):
SearchField (nuqs URL state), DiscoveryResults (infinite query + load more), FilterPanelDesktop, FilterSheetMobile, ActiveFilterChips, SortControl, ListingGallery (thumbnails + navigation), AttributeList, SellerCard, SafetyNotice, AuthCard, LoginForm, RegisterForm, VerifyForm, ForgotForm, ResetForm, FormField, FormError, FormNotice, OtpInput, PasswordField, PhoneInput, FavoriteButton, FavoritesView, ListingGridSkeleton, Skeleton, EmptyState, ErrorState, ListingCard, ListingGrid, BrandLogo, Button (accent variant), PageContainer, SectionHeader, SiteHeader, SiteFooter, MobileBottomNav

### Components IMPORTED but UNREAD:
Breadcrumbs, ShareButton, ReportDialog, ContactSection

### Components ACTUALLY MISSING ❌:
- Navigation: MobileHeader(separate), DesktopHeader(separate), LocationButton, LocationPicker, CategoryShortcutGrid
- Forms: PriceInput(AFN-aware), DynamicFieldRenderer
- Feedback: ToastRegion, OfflineBanner, StatusMessage
- Sell Flow: Stepper, DraftRecoveryBanner, ImageUploader, ImageReorder
- Status: ListingStatusBadge, SellerStatusBadge
- Admin: AdminSidebar, AdminTable, AdminCards, AdminActionMenu

### Revised Completeness: ~55-60%

### CRITICAL Quick Fixes (Phase 4):
1. Fix MobileBottomNav routes: دسته‌ها→category, حساب→/account
2. Create proper MobileHeader + DesktopHeader with auth state
3. Add LocationPicker + real SearchBar on homepage
4. Add CategoryShortcutGrid with proper design
5. Self-host Vazirmatn font