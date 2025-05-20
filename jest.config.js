// jest.config.js
export default {
  // Using node environment for server-side tests
  testEnvironment: 'node',
  
  // Configure ES modules support
  transform: {},
  
  // Don't need extensionsToTreatAsEsm since it's inferred from package.json type:module
  
  // Configure module name mapping for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Set the test match pattern
  testMatch: ['**/tests/**/*.test.js'],
  
  // Collect coverage from all .js files in src
  collectCoverage: false,
  collectCoverageFrom: ['index.js'],
  
  // Set the coverage directory
  coverageDirectory: 'coverage',
  
  // Configure the coverage reporters
  coverageReporters: ['text', 'lcov'],
  
  // Set the test timeout
  testTimeout: 10000,
  
  // Output verbose test results
  verbose: true
};