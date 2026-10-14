# WeshBazar — Complete Header, Navigation & Footer Audit and Redesign Specification

## 1. Role and mission

Act as a senior full-stack engineer, UX architect, accessibility specialist, security reviewer, and performance engineer.

Conduct a complete, evidence-based investigation of the shared header, global navigation, mobile navigation, footer, and all related authentication-dependent interface states across WeshBazar.

Deliver three documents:

1. Verified current-state audit.
2. Comprehensive criteria catalogue and gap analysis.
3. Target design specification and implementation roadmap.

Do not start by replacing the existing header or footer. First inspect the complete repository, understand the current implementation, trace all dependencies, and verify real behavior.

Do not limit the investigation to the issues explicitly listed here. Independently discover relevant problems, dependencies, and opportunities.

Read the complete Master Prompt V5. The repository, API contracts, and verified product requirements remain authoritative. Do not invent routes, features, data, or backend capabilities.

## 2. Required documents

Create:

- `docs/audit/header-footer/README.md`
- `docs/audit/header-footer/review-inventory.md`
- `docs/audit/header-footer/findings.md`
- `docs/audit/header-footer/criteria-register.json`
- `docs/audit/header-footer/01-current-state.md`
- `docs/audit/header-footer/02-criteria-and-gap-analysis.md`
- `docs/audit/header-footer/03-target-design-and-roadmap.md`

Maintain progress and continue across multiple installments when necessary.

## 3. Repository and implementation investigation

Inspect the actual implementation of:

- Root layouts and nested layouts.
- Shared header and footer components.
- Desktop navigation.
- Mobile navigation and drawers.
- Search and location controls in the header.
- Account menus and authentication buttons.
- Registration, login, verification, and recovery pages.
- Sell-listing entry points.
- Favorites and personal listing links.
- Public seller profiles and listing pages.
- Help, safety, about, contact, and legal pages where implemented.
- Error, forbidden, not-found, and loading layouts.
- Styling, design tokens, icons, fonts, and responsive breakpoints.
- Session providers, current-user loaders, query caches, and authentication hooks.
- API clients and backend endpoints used by shared navigation.
- Existing unit, integration, and browser tests.

Discover all actual routes and relevant components; do not assume this list is exhaustive.

For each component, record its file path, line ranges, callers, dependencies, data sources, tests, and review status.

Trace the complete flow from the rendered control through its handler and API request to the actual result.

A link rendering correctly does not prove its destination works. A menu item appearing conditionally does not prove access is secure.

## 4. Authentication and interface states

Document and verify the header and footer behavior in every relevant state:

### A. Anonymous visitor

- First visit.
- Direct entry to a listing or seller profile.
- Browsing search results and categories.
- Opening navigation on mobile.
- Attempting an authenticated action such as saving a favorite or creating a listing.
- Visiting login and registration pages.

### B. Authenticated user

- Initial authenticated page load.
- Client-side navigation.
- Browser refresh.
- Session renewal.
- Expired or revoked session.
- Logout.
- Switching from account A to account B.
- Visiting a protected route without authorization.

### C. Registration and verification

- Registration form.
- Successful registration.
- Verification required, if supported.
- Verification success and failure.
- Expired verification session or code.
- Login after registration.
- Recovery and password reset where supported.

### D. Seller and administrator

- User creating or editing a listing.
- Seller visiting their own public profile.
- Administrator accessing admin routes.
- Navigation between public marketplace and admin interface.
- Permission-denied states.

Do not create new authentication states to fit the design. Derive states from the actual authentication and account contracts.

For each state, document which navigation items appear, which are hidden, which actions are available, what happens on failure, and how the interface recovers.

## 5. Header audit

### 5.1 Brand and primary navigation

Evaluate:

- Official WeshBazar logo and correct asset usage.
- Logo link destination.
- Search prominence.
- Category navigation.
- Location selector where supported.
- Sell-listing call to action.
- Login and registration actions for visitors.
- Account menu for authenticated users.
- Favorites and personal listings where supported.
- Help and safety entry points.
- Current-page and current-category indicators.
- Responsive layout and visual hierarchy.

Use only real routes and implemented capabilities.

### 5.2 Search behavior

Verify:

- Search input and submission behavior.
- Enter-key handling.
- Clear-search behavior.
- Search query preservation during navigation.
- Mobile keyboard and viewport behavior.
- Search suggestions only if actually implemented.
- Error handling and network failures.
- Search state when the user logs in or out.
- Accessible label and focus behavior.

Do not add a decorative search box that is disconnected from the actual search implementation.

### 5.3 Account menu

Inspect:

- Trigger and dismissal behavior.
- Keyboard and touch interaction.
- Focus management.
- Account information displayed.
- Navigation to account settings, listings, favorites, and security.
- Logout confirmation if justified.
- Handling of expired sessions.
- Loading and failed current-user requests.
- Stale account data after logout or account switching.
- Private-data exposure in cached menus.

Never rely on hiding links as an authorization mechanism.

### 5.4 Sell action

Verify that the sell CTA:

- Navigates to the real sell flow.
- Preserves intended return navigation when authentication is required.
- Returns the user to the appropriate step after successful login, if supported.
- Handles incomplete profiles or verification requirements only when those requirements exist.
- Does not discard a valid draft.
- Does not show false success or verification states.

### 5.5 Sticky and scrolling behavior

Investigate:

- Header height and position.
- Sticky behavior, if any.
- Search accessibility while scrolling.
- Overlap with page content, dialogs, and mobile keyboards.
- Layout shifts.
- Scroll restoration.
- Back navigation.
- Performance cost.

Do not introduce sticky behavior simply because it is common on other marketplaces.

## 6. Mobile navigation audit

Use 390 × 844 CSS pixels as the primary mobile reference and test additional widths.

Evaluate:

- Compact header hierarchy.
- Reachable search and sell actions.
- Menu opening and closing.
- Backdrop and Escape behavior.
- Focus trapping where appropriate.
- Scroll locking while drawers are open.
- Browser back behavior.
- Nested category navigation.
- Menu dismissal after navigation.
- Long Dari labels and RTL alignment.
- Touch target size and spacing.
- Safe areas and viewport changes.
- No accidental horizontal overflow.
- No overlap with page content or fixed bottom navigation.

If a mobile bottom navigation already exists, verify its real behavior and usefulness. Do not add another navigation system without evaluating duplication and space cost.

Use desktop and mobile layouts appropriate to their interaction patterns; do not force a desktop mega-menu into a narrow viewport.

## 7. Footer audit

### 7.1 Information architecture

Inspect current footer content and classify links into meaningful groups, such as:

- About WeshBazar.
- Help and user guidance.
- Safety and responsible marketplace use.
- Relevant marketplace categories.
- Contact or issue-reporting routes.
- Privacy and legal information where required.
- Existing official social channels, if verified.
- Brand and copyright information.

These are candidate groups, not a requirement to create every section. Include only useful, real, and appropriately approved content.

### 7.2 Link integrity

For every footer link:

- Verify the actual destination.
- Confirm the page exists and is accessible.
- Check for dead links and redirects.
- Confirm internal links do not point to the wrong route.
- Ensure external links use appropriate security attributes where applicable.
- Verify behavior on mobile.
- Avoid duplicate links that add no value.
- Avoid placeholder links and invented contact details.

Check previously discovered public information routes such as `/about` and `/help/safety`, but verify their current implementation rather than assuming they still work.

### 7.3 Responsive footer

Evaluate:

- Semantic link groups.
- Readable section headings.
- Desktop columns where appropriate.
- Mobile stacking or collapsible groups when useful.
- Touch target spacing.
- Long text and mixed-direction values.
- Footer density and scrolling cost.
- Accessible link names.
- Contrast and focus visibility.

The footer should make important destinations findable without becoming an oversized sitemap.

### 7.4 Product scope and trust

Do not add shipping policies, return workflows, payment policies, refunds, or order tracking unless the current product actually supports or requires them.

For this marketplace, prioritize relevant safety guidance, seller-contact expectations, reporting, account guidance, privacy, and real support channels where available.

Do not invent phone numbers, email addresses, social accounts, trust certifications, or legal claims.

## 8. Public versus authenticated layouts

Investigate whether public marketplace pages, authentication pages, private account pages, and admin pages should share one layout or use different layout variants.

Recommend the simplest maintainable architecture consistent with the existing Next.js App Router implementation.

Consider route groups and nested layouts only if they improve real separation of concerns without unnecessary file moves.

Document which components are shared and which intentionally differ.

Ensure that authentication forms can remain focused and avoid unnecessary global navigation when justified by usability and the existing design system.

Do not hide the logo or remove useful navigation from authentication pages without evidence that the change improves the flow.

Do not use layout-level UI conditions as the only authorization boundary. Verify sensitive access close to the relevant data and operation.

## 9. Session correctness and cache isolation

Pay special attention to shared layout behavior and authentication-dependent rendering.

Verify:

- The correct account is displayed after login.
- Logout removes private navigation and cached personal data.
- Logging in as account B after account A never displays account A's identity or private links.
- In-flight requests cannot restore stale private data after logout.
- Session renewal does not create inconsistent header state.
- Server-rendered requests do not incorrectly consume rotating refresh tokens.
- Expired sessions produce a predictable and recoverable UI.
- Direct route access is still protected by server-side authorization.

Test hard reload, client-side navigation, multiple tabs where relevant, session expiration, logout, and account switching.

Do not claim security from client-side conditionals alone.

## 10. Design and visual requirements

Follow Master Prompt V5 and the existing brand:

- Primary teal: `#0F766E`
- Dark teal: `#0B2F2B`
- Soft teal: `#E6F5F3`
- Orange: `#F59E0B`
- Dark orange: `#D97706`
- Background: `#F8FAFC`
- White: `#FFFFFF`
- Border: `#E2E8F0`

Preserve official logo assets unchanged.

Use Dari/Persian language, RTL direction, suitable typography, and consistent spacing.

The header should prioritize search, navigation, and the main marketplace action. The footer should prioritize findability, help, safety, and legitimate supporting information.

Avoid oversized headers, excessive whitespace, unnecessary gradients, duplicate navigation, decorative controls, excessive icons without labels, and heavy animation.

The design must remain lightweight on slow connections.

## 11. Accessibility and responsive verification

Use WCAG 2.2 as the reference standard where applicable.

Check:

- Keyboard navigation.
- Visible focus.
- Correct landmarks and heading hierarchy.
- Accessible names for icon-only buttons.
- Menu semantics and expanded state.
- Focus management for drawers and dialogs.
- Target size and spacing.
- Contrast and non-color status cues.
- RTL reading order.
- Screen-reader announcements for meaningful state changes.
- Reflow and zoom.
- Reduced-motion preferences where animations exist.

Inspect at minimum:

- 390 × 844.
- 768 × 1024.
- 1024 × 768.
- 1440 × 900.

Capture screenshots and run browser tests when tools are available. Record unavailable tests explicitly.

## 12. Performance and maintainability

Investigate:

- Server versus Client Component boundaries.
- Unnecessary hydration.
- Repeated current-user API requests.
- Layout-level data fetching and caching.
- Duplicate navigation implementations.
- Unnecessary icon or animation dependencies.
- Layout shift and font loading.
- Search responsiveness.
- Event-handler and state complexity.
- Bundle impact.
- Mobile rendering cost.

Do not fetch private user details merely to render a public page's header if a lighter and correct approach is available.

Do not cache sensitive user data across accounts.

Prefer reusable components and design tokens where they reduce duplication, but avoid abstracting a simple component without a real benefit.

## 13. Criteria register and gap analysis

Create a deduplicated, traceable catalogue covering all applicable header, navigation, footer, authentication-state, privacy, accessibility, responsive, and performance requirements.

Every criterion must include:

- Stable ID.
- Requirement.
- Applicability.
- Current status: PASS, PARTIAL, FAIL, NOT VERIFIED, or NOT APPLICABLE.
- File and line-level evidence.
- Relevant route and state.
- Verification method.
- Severity and priority.
- Remediation.
- Acceptance criteria.

Do not mark a criterion PASS because a component renders or a test exists. Verify the actual behavior.

Do not chase an arbitrary line count. Comprehensive coverage and traceable evidence matter more than the number of checklist entries.

## 14. Target-state specification and roadmap

The third document must specify:

- Current and recommended header structure.
- Desktop and mobile navigation behavior.
- Guest and authenticated navigation variants.
- Registration and verification behavior.
- Public versus private layout boundaries.
- Footer information architecture.
- Real link inventory and required repairs.
- Session-state and cache behavior.
- Design tokens and responsive rules.
- Accessibility requirements.
- Performance constraints.
- Required tests.
- Acceptance criteria.

Prioritize:

- P0: Security, privacy, account-switching, or session correctness defects.
- P1: Broken primary navigation, authentication transitions, or core marketplace actions.
- P2: Major usability, accessibility, responsive, and performance defects.
- P3: Optional visual polish.

For every task, specify affected files, dependencies, regression risks, tests, and definition of done.

Do not begin a broad redesign before the current state and critical defects are documented.

## 15. Verification and completion rules

Run relevant type-checks, lint, unit tests, integration tests, and production build where possible.

Verify real browser behavior where the environment supports it.

Inspect the final diff for unrelated changes.

Never claim:

- All links work without checking them.
- All breakpoints are correct without testing them.
- Authentication behavior is secure because the UI changes.
- Performance improved without measurements.
- Accessibility is compliant without appropriate checks.

Record exact test results and remaining uncertainty.

## 16. First action

Read Master Prompt V5 and inspect the repository.

Create the inventory and baseline report before modifying code.

Complete the three documents systematically. Do not stop after suggesting a design and do not immediately replace the existing header or footer.

The objective is a secure, consistent, accessible, RTL-correct, mobile-first, low-bandwidth global navigation system for WeshBazar that behaves correctly for guests, authenticated users, sellers, and administrators.