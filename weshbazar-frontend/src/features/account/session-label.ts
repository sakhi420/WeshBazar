/**
 * Pure session-display helpers (master prompt §33).
 *
 * Sessions rarely carry a friendly `deviceName` (the backend only fills it
 * when a client sends the optional `x-device-name` header), so the label
 * falls back to a small user-agent summary. Zero React/DOM imports so
 * behavior tests stay fast.
 */

/** Friendly Persian names for the browsers we can recognise in a UA string. */
const BROWSER_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  // Edge and Opera first: their UA strings also contain "Chrome".
  [/Edg[ea]?\//, 'اج'],
  [/OPR\/|Opera/, 'اپرا'],
  // Chrome on iOS ships as CriOS; it also contains "Safari" — keep it here.
  [/Chrome\/|CriOS/, 'کروم'],
  [/Firefox\/|FxiOS/, 'فایرفاکس'],
  [/Safari\//, 'سافاری'],
];

/** Platform rules — order matters where UA strings nest (Android ⊃ Linux, iOS ⊃ Mac). */
const SYSTEM_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/Android/, 'اندروید'],
  [/iPhone|iPad|iPod/, 'آیاواس'],
  [/Windows/, 'ویندوز'],
  [/Mac OS X|Macintosh/, 'مک'],
  [/Linux/, 'لینوکس'],
];

function firstMatch(rules: ReadonlyArray<readonly [RegExp, string]>, value: string): string | null {
  for (const [pattern, label] of rules) {
    if (pattern.test(value)) return label;
  }
  return null;
}

/**
 * Human label for a session: the client-provided device name when present,
 * otherwise a `مرورگر · سیستمعامل` summary, otherwise an honest unknown.
 */
export function describeDevice(deviceName: string | null, userAgent: string | null): string {
  const named = deviceName?.trim();
  if (named) return named;

  const ua = userAgent?.trim();
  if (!ua) return 'دستگاه ناشناس';

  const parts = [firstMatch(BROWSER_RULES, ua), firstMatch(SYSTEM_RULES, ua)].filter(
    (part): part is string => part !== null,
  );
  return parts.length > 0 ? parts.join(' · ') : 'دستگاه ناشناس';
}
