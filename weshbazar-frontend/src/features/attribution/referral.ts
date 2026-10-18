/**
 * Referral attribution (growth loop, owner decision D3).
 *
 * Captures the acquisition source carried in `?ref=` / `?utm_source=` (and the
 * common UTM companions) on first page entry and keeps it in session storage
 * until the customer signals contact intent. Session storage persists across
 * in-tab navigation but not across browser restarts — exactly the retention
 * window the attribution loop needs.
 *
 * All accessors are SSR-safe (guard on `typeof window`), so they can be called
 * from any component.
 */

const STORAGE_KEY = 'weshbazar_referral';

/** Priority order matches the canonical UTM attribution convention. */
const PARAM_KEYS = ['ref', 'utm_source', 'utm_medium', 'utm_campaign'] as const;

/** Capture the first non-empty referral param from a raw query string. */
export function captureReferralFromSearch(search: string): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(search);
  for (const key of PARAM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, value);
      } catch {
        // Private browsing or full storage — attribution is best-effort.
      }
      return;
    }
  }
}

/** The currently captured referral source, or null when the visit was organic. */
export function readReferral(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearReferral(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}