/**
 * Recent search history (master prompt §112) — localStorage-backed, client-only.
 * Kept in its own module (no React/API imports) so it is trivially unit-testable
 * and never leaks into Server Components via the search barrel.
 */

const RECENT_STORAGE_KEY = 'weshbazar.recent-searches';
const MAX_RECENT = 10;

export function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  if (typeof window === 'undefined') return;
  try {
    const next = [trimmed, ...readRecentSearches().filter((item) => item !== trimmed)].slice(
      0,
      MAX_RECENT,
    );
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private mode / quota) — history is best-effort.
  }
}