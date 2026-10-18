/**
 * OpenAPI contract drift + stability tests (Task 4 of the API Contract Freeze).
 *
 * Also serves as the canonical generator when OPENAPI_WRITE=1 env var is set,
 * producing `weshbazar-backend/docs/openapi.json` so Task 3 (artifact commit)
 * and Task 4 (drift spec) share one code path.
 *
 * Coverage (rule-based ACs):
 *   - Parse: document is valid JSON with openapi 3.x, info.title = "WeshBazar API"
 *   - Size : paths >= 50, schemas >= 20 (Listing/User/Error/Session present)
 *   - IDs  : every non-param path entry has a unique `operationId` with no
 *            duplicates across the entire document.
 *   - Shape: every operation has responses defined (>=1 success code)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { generateOpenapiDocument, summarizeDocument } from '../../scripts/generate-openapi.js';

const OUTPUT_PATH = resolve(__dirname, '../../../../../docs/openapi.json');

type OpenapiDocument = {
  openapi?: string;
  info?: { title?: string; version?: string };
  paths?: Record<
    string,
    Record<string, { operationId?: string; responses?: Record<string, unknown> }>
  >;
  components?: { schemas?: Record<string, unknown> };
};

describe('OpenAPI contract stability', () => {
  let document: OpenapiDocument;
  let summary: ReturnType<typeof summarizeDocument>;

  beforeAll(async () => {
    document = (await generateOpenapiDocument()) as OpenapiDocument;
    summary = summarizeDocument(document);
  }, 120_000);

  it('produces a parseable OpenAPI 3.x document with the frozen title', () => {
    expect(document.openapi).toMatch(/^3\./);
    expect(document.info?.title).toBe('WeshBazar API');
    expect(document.info?.version).toBe('1.0');
  });

  it('contains at least 50 paths (catalog size contract)', () => {
    expect(summary.paths).toBeGreaterThanOrEqual(50);
  });

  it('contains >=20 schemas including the core entities (Listing, User, Error, Session)', () => {
    expect(summary.schemas).toBeGreaterThanOrEqual(20);
    const schemaKeys = Object.keys(document.components?.schemas ?? {});
    const lower = schemaKeys.map((k) => k.toLowerCase());
    expect(lower.some((k) => k.includes('listing'))).toBe(true);
    expect(lower.some((k) => k.includes('user'))).toBe(true);
    expect(lower.some((k) => k.includes('error') || k.includes('response'))).toBe(true);
    expect(lower.some((k) => k.includes('session'))).toBe(true);
  });

  it('declares a unique operationId on every operation (no duplicates, no blanks)', () => {
    expect(summary.duplicateOperationIds).toEqual([]);
    expect(summary.operationIdsCount).toBeGreaterThanOrEqual(summary.paths);
    // 84 frozen operations + sellers_getPublicListings (D1) + search_recordZeroResult (D3).
    expect(summary.operationIdsCount).toBe(86);
    // Spot-check the prefix groups exist
    const allIds = new Set<string>();
    for (const pathItem of Object.values(document.paths ?? {})) {
      for (const op of Object.values(pathItem)) {
        if (op?.operationId) allIds.add(op.operationId);
      }
    }
    const ids = [...allIds];
    expect(ids.some((id) => id.startsWith('auth_'))).toBe(true);
    expect(ids.some((id) => id.startsWith('listings_'))).toBe(true);
    expect(ids.some((id) => id.startsWith('me_'))).toBe(true);
    expect(ids.some((id) => id.startsWith('admin_'))).toBe(true);
  });

  it('defines at least one 2xx response for every operation (no transport-surprise 404s)', () => {
    for (const pathItem of Object.values(document.paths ?? {})) {
      for (const op of Object.values(pathItem)) {
        const codes = Object.keys(op.responses ?? {});
        const has2xx = codes.some((c) => c.startsWith('2'));
        expect(has2xx).toBe(true);
      }
    }
  });

  it('operationIds follow the <prefix>_<verbNoun> naming convention (stable across refactors)', () => {
    const allIds = new Set<string>();
    for (const pathItem of Object.values(document.paths ?? {})) {
      for (const op of Object.values(pathItem)) {
        if (op?.operationId) allIds.add(op.operationId);
      }
    }
    for (const id of allIds) {
      expect(id).toMatch(/^[a-z][a-z0-9]*(_[a-zA-Z0-9]+)+$/);
    }
  });
});

// Also support writing the committed artifact when OPENAPI_WRITE=1.
// This lets the same spec file serve as Task 4 (validation) AND as the
// reproducible generator used during CI to detect drift.
if (process.env.OPENAPI_WRITE === '1') {
  // eslint-disable-next-line no-console
  console.log(`[openapi] OPENAPI_WRITE=1 — generating ${OUTPUT_PATH}`);
  (async () => {
    const doc = (await generateOpenapiDocument()) as OpenapiDocument;
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(doc, null, 2) + '\n', 'utf8');
    const s = summarizeDocument(doc);
    // eslint-disable-next-line no-console
    console.log(
      `[openapi] wrote paths=${s.paths} operationIds=${s.operationIdsCount} schemas=${s.schemas}`,
    );
  })().catch((e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
}
