/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Or 'jsdom' if DOM APIs are needed, but 'node' is typical for unit/integration tests not involving UI rendering
  testMatch: [
    '<rootDir>/src/tests/**/*.test.ts' // Pattern to find Jest test files
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/src/tests/tsconfig.json' // Use the specific tsconfig for these tests
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Optional: setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.js'] // If you need a setup file
};
