/**
 * Brand asset contract (master prompt §9).
 * Official assets are copied into /public/brand from the WeshBazar brand kit.
 * NEVER redraw, recolor, stretch, or approximate the logo. Use these canonical
 * paths and pick the variant that matches the surface.
 *
 * Variant notes (from the brand kit README):
 *  - logo.svg            primary horizontal vector logo (light surfaces)
 *  - logo-white.svg      white monochrome for dark surfaces
 *  - logo-with-tagline.svg  logo + "BUY • SELL • CONNECT"
 *  - logo-mark.svg       icon-only mark
 *  - logo-mark-teal.svg / -orange.svg / -white.svg  mark color variants
 *  - favicon.svg, favicon-32.png, app-icon.svg  icons
 */
export const brandAssets = {
  logo: '/brand/logo.svg',
  logoPng: '/brand/logo.png',
  logoWhite: '/brand/logo-white.svg',
  logoWithTagline: '/brand/logo-with-tagline.svg',
  mark: '/brand/logo-mark.svg',
  markTeal: '/brand/logo-mark-teal.svg',
  markOrange: '/brand/logo-mark-orange.svg',
  markWhite: '/brand/logo-mark-white.svg',
  appIcon: '/brand/app-icon.svg',
  favicon: '/brand/favicon.svg',
  favicon32: '/brand/favicon-32.png',
} as const;

/** Intrinsic viewBox sizes of the official vector assets (preserve aspect). */
export const logoDimensions = { width: 1250, height: 260 } as const;
export const markDimensions = { width: 512, height: 512 } as const;
