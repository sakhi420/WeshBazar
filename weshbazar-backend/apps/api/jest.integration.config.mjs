/**
 * Integration-test configuration — real PostgreSQL via `test/integration`.
 * Applies pending migrations to the test database before running.
 */
/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/test/integration'],
  testRegex: '.*\\.integration-spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    // ts-jest emits `require('./x.js')` for explicit `.ts` relative imports
    // (rewriteRelativeImportExtensions in tsconfig, used by the generated
    // Prisma client). Map back so Jest resolves the real `.ts` sources.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/test/setup/test-env.ts'],
  globalSetup: '<rootDir>/test/setup/global-setup.ts',
  clearMocks: true,
  maxWorkers: 1,
  testTimeout: 60000,
};
