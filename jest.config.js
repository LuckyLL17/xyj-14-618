module.exports = {
    testEnvironment: 'jsdom',
    testMatch: [
        '<rootDir>/tests/unit/**/*.test.js'
    ],
    setupFiles: [
        '<rootDir>/tests/setup/jest.polyfills.js'
    ],
    moduleFileExtensions: ['js', 'json'],
    collectCoverageFrom: [
        'js/services/**/*.js',
        'js/utils/**/*.js',
        '!js/services/mock-api.service.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'json-summary', 'lcov', 'html'],
    verbose: true,
    testEnvironmentOptions: {
        url: 'http://localhost/'
    }
};
