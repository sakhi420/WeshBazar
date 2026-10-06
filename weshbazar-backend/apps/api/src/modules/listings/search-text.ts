/**
 * Marketplace text normalization (spec §47).
 *
 * Produces the `searchText` representation stored on every listing: a
 * Persian/Dari-friendly folding of the title and description that makes
 * searches robust against the common inconsistencies of the script —
 * Arabic vs Persian letter variants, Arabic-Indic digits, zero-width
 * characters, harakat (diacritics), tatweel and repeated whitespace.
 *
 * The folding is intentionally lossy for the search index only; the original
 * user text is stored untouched on the listing itself.
 */

/** Arabic letter variants folded to their Persian counterparts. */
const LETTER_FOLDING: ReadonlyMap<string, string> = new Map([
  ['\u064A', '\u06CC'], // ARABIC YEH ي → FARSI YEH ی
  ['\u0649', '\u06CC'], // ALEF MAKSURA ى → ی
  ['\u0643', '\u06A9'], // ARABIC KAF ك → KEHEH ک
  ['\u0629', '\u0647'], // TEH MARBUTA ة → HEH ه
  ['\u06C0', '\u0647'], // HEH WITH YEH ABOVE ۀ → ه
]);

/** Zero-width and bidi-control characters that must never break matching. */
const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u00AD]/gu;

/** Harakat/diacritics and tatweel are decoration for search purposes. */
const HARAKAT_AND_TATWEEL = /[\u064B-\u065F\u0670\u0640]/gu;

const WHITESPACE = /\s+/gu;

const DIGIT_FOLDING: ReadonlyMap<string, string> = new Map([
  // Extended Arabic-Indic (Persian) digits ۰-۹
  ...Array.from({ length: 10 }, (_, digit): [string, string] => [
    String.fromCodePoint(0x06f0 + digit),
    String(digit),
  ]),
  // Arabic-Indic digits ٠-٩
  ...Array.from({ length: 10 }, (_, digit): [string, string] => [
    String.fromCodePoint(0x0660 + digit),
    String(digit),
  ]),
]);

export function normalizeSearchText(input: string): string {
  // Compatibility composition first so presentation-form glyphs fold with
  // the rest (e.g. isolated Arabic letters typed by some keyboards).
  let text = input.normalize('NFKC');
  text = text.replace(ZERO_WIDTH, '');
  text = text.replace(HARAKAT_AND_TATWEEL, '');

  let folded = '';
  for (const character of text) {
    folded += DIGIT_FOLDING.get(character) ?? LETTER_FOLDING.get(character) ?? character;
  }
  return folded.toLowerCase().replace(WHITESPACE, ' ').trim();
}
