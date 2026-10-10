# Design Decisions

## 2026-10-10 - Shared shell baseline

### Inputs reviewed

- `../WeshBazar_Frontend_Master_Prompt_V5_EN(1).md`
- Vercel Web Interface Guidelines fetched from the canonical GitHub source
- Current shell files: `src/app/layout.tsx`, `src/components/layout/site-header.tsx`, `src/app/page.tsx`, `src/app/globals.css`

### Accepted decisions

- Keep Persian/Dari-first RTL as the default document contract
- Preserve the official WeshBazar logo assets and use the white logo variant on the dark footer surface
- Add a real skip link at the root layout so keyboard users can jump to `#main`
- Add a shared footer in the root layout instead of per-page footers
- Footer links must point only to currently valid routes; no placeholder legal/help pages were invented
- Keep the shell visually restrained and marketplace-oriented instead of introducing marketing-page patterns

### Rejected patterns

- No fake help, legal, or company pages just to fill the footer
- No generic SaaS dashboard footer copy
- No raw recoloring or custom redrawing of the brand logo

### Pending decisions

- Final homepage visual direction under V5: compact warm marketplace vs a denser listing-first composition
- Shared header contents for location context, favorites/account prominence, and desktop secondary row behavior
- Whether homepage category shortcuts stay as a grid or move to a more compact strip after browser review

### Skill evidence

- `frontend-design`: used to keep the shell changes intentional, brand-aware, and non-generic
- `web-design-guidelines`: used to drive the skip-link/focus/shared-shell review
- `vibe-prospecting`: not applied in this slice because there is no live prospecting objective and no matching connector tools are available in the current environment
