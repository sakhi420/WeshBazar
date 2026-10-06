/**
 * End-to-end / security-test configuration — boots the full Nest application
 * against the test database through `test/e2e`.
 */
/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/test/e2e'],
  testRegex: '.*\\.e2e-spec\\.ts$',
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
  testTimeout: 120000,
};
