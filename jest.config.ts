import type { Config } from 'jest';

/**
 * Jest configuration for NexArena
 *
 * - Uses ts-jest preset for TypeScript compilation
 * - jsdom environment simulates a browser for React component testing
 * - Module name mapper mirrors the @/ alias from tsconfig.json
 * - Coverage thresholds enforce minimum quality standards
 */
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Mirror the @/ path alias from tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
    // Stub out CSS/image imports (irrelevant in unit tests)
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.ts',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.ts',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/components/**/*.tsx',
    'src/store/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 65,
      statements: 65,
    },
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        // Allow slightly less strict settings in test environment
        strict: false,
      },
    }],
  },
  // Improved test isolation
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  // Show verbose output per test
  verbose: true,
};

export default config;
