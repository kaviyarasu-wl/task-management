import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@types-app/(.*)$': '<rootDir>/src/types/$1',
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/types/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

export default config;
