import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const baseConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/e2e/'],
};

// nextJest merges its own CSS/image mocks into moduleNameMapper, which
// silently overwrites our user-defined `@/*` alias. Post-process the config
// to force the path alias to the very top of the matcher list so component
// imports resolve exactly as they do during `next build`.
const makeConfig = async () => {
  const resolved = await createJestConfig(baseConfig)();
  return {
    ...resolved,
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      ...(resolved.moduleNameMapper ?? {}),
    },
  };
};

export default makeConfig;
