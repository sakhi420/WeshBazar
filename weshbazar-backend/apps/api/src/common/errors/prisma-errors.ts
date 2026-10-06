/**
 * Prisma unique-constraint helpers that work with BOTH error shapes:
 *
 * - Classic query engine: `meta.target` carries the field names (string[]).
 * - Driver adapters (PrismaPg, Prisma 7): `meta.target` is EMPTY — the
 *   violated constraint only appears as the database index name inside
 *   `meta.driverAdapterError.cause.constraint.index`
 *   (e.g. "SellerAccount_slug_key"). `meta.modelName` is present in both.
 *
 * Matching against index names must therefore be substring-based
 * (e.g. `'SellerAccount_slug'`), not exact field equality.
 */
import { Prisma } from '../../generated/prisma/client';

export interface UniqueViolationContext {
  /** Prisma model name the failed operation targeted, when reported. */
  model?: string;
  /** Constraint field names and/or database index names. */
  targets: string[];
}

/**
 * Extract unique-constraint details from an error, or `null` when the error
 * is not a P2002 unique-constraint violation.
 */
export function uniqueViolationContext(error: unknown): UniqueViolationContext | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return null;
  }
  const meta = error.meta as
    | {
        modelName?: unknown;
        target?: unknown;
        driverAdapterError?: { cause?: { constraint?: { index?: unknown } } };
      }
    | undefined;

  const targets: string[] = [];
  if (Array.isArray(meta?.target)) {
    targets.push(...meta.target.filter((entry): entry is string => typeof entry === 'string'));
  }
  const index = meta?.driverAdapterError?.cause?.constraint?.index;
  if (typeof index === 'string' && index.length > 0) {
    targets.push(index);
  }

  return {
    model: typeof meta?.modelName === 'string' ? meta.modelName : undefined,
    targets,
  };
}

/**
 * True when the error is a P2002 violation on a constraint whose name
 * contains `name` (substring match — see module note).
 */
export function isUniqueViolation(error: unknown, name: string): boolean {
  const context = uniqueViolationContext(error);
  return context !== null && context.targets.some((target) => target.includes(name));
}
