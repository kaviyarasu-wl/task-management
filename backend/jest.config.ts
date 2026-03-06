import type { Config } from 'jest';

const moduleNameMapper = {
  '^@config$': '<rootDir>/src/config/index.ts',
  '^@config/(.*)$': '<rootDir>/src/config/$1',
  '^@core/(.*)$': '<rootDir>/src/core/$1',
  '^@api/(.*)$': '<rootDir>/src/api/$1',
  '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  '^@modules$': '<rootDir>/src/modules/index.ts',
  '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  '^@types-app/(.*)$': '<rootDir>/src/types/$1',
  '^@app$': '<rootDir>/src/app.ts',
};

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper,
  setupFiles: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/types/**',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/infrastructure/database/migrations/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher coverage for critical services
    './src/modules/auth/**/*.ts': {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 30000, // 30 seconds for integration tests
  verbose: true,
  // Test categorization by folder with shared config
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper,
      setupFiles: ['<rootDir>/tests/setup.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
      },
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper,
      setupFiles: ['<rootDir>/tests/setup.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
      },
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper,
      setupFiles: ['<rootDir>/tests/setup.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
      },
    },
  ],
};

export default config;
