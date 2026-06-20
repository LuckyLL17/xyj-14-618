/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transform: {},
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  reporters: [
    'default',
    ['./node_modules/jest-html-reporter', {
      pageTitle: '加密日记应用测试报告',
      outputPath: './test-results/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true
    }]
  ],
  collectCoverage: true,
  coverageDirectory: './test-results/coverage',
  coverageReporters: ['text', 'html', 'json']
};
