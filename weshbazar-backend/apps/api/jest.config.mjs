/** Unit-test configuration — colocated `*.spec.ts` files under `src/`. */
/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
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
  clearMocks: true,
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.ts', '!src/generated/**', '!src/main.ts'],
};
