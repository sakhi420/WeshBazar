/**
 * Categories feature — view models.
 * Shapes mirror the frozen backend contract (docs/openapi.json):
 * PublicCategorySummaryDto / PublicCategoryNodeDto / PublicCategoryDetailDto /
 * CategoryNameRefDto / FilterSchemaFieldDto. Do not invent fields.
 */

/** `GET /api/v1/categories` list item. */
export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  iconKey: string | null;
  parentId: string | null;
  sortOrder: number;
  hasChildren: boolean;
}

/** `GET /api/v1/categories/tree` node (roots with nested children). */
export interface CategoryNode extends CategorySummary {
  children: CategoryNode[];
}

/** `CategoryNameRefDto` — reference used in breadcrumbs (parent / ancestors). */
export interface CategoryNameRef {
  id: string;
  slug: string;
  name: string;
}

/** `GET /api/v1/categories/{slug}` — detail with breadcrumb and direct children. */
export interface CategoryDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  parent: CategoryNameRef | null;
  /** Root → direct parent (breadcrumb order per the backend). */
  ancestors: CategoryNameRef[];
  children: CategorySummary[];
}

/** `FilterSchemaOptionDto` — selectable option for a filterable field. */
export interface FilterSchemaOption {
  value: string;
  label: string;
}

/** `FilterSchemaFieldDto` — one attribute in a category's effective schema. */
export interface FilterSchemaField {
  field: string;
  label: string;
  /** Definition input type; e.g. SELECT / TEXT / NUMBER / BOOLEAN. */
  type: string;
  unit: string | null;
  placeholder: string | null;
  required: boolean;
  filterable: boolean;
  options: FilterSchemaOption[];
  min: number | null;
  max: number | null;
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  /** Operators the backend accepts for this field (empty when not filterable). */
  operators: string[];
}
