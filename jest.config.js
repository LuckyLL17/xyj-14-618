module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/unit/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/components/**',
    '!js/app.js'
  ],
  coverageDirectory: 'tests/coverage',
  coverageReporters: ['text', 'text-summary', 'json-summary', 'lcov'],
  transform: {},
  testTimeout: 10000
};
