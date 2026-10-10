/**
 * Locations feature — view models (master prompt §38).
 * Mirror of PublicProvinceSummaryDto / PublicCitySummaryDto (docs/openapi.json).
 * Do not invent fields.
 */

/** `PublicProvinceSummaryDto` — active province with localized name. */
export interface Province {
  id: string;
  /** ISO-style code, e.g. `AF-KAB`. */
  code: string;
  slug: string;
  name: string;
  sortOrder: number;
}

/** `PublicCitySummaryDto` — active city of a province. */
export interface City {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}
