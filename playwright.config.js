// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    expect: { timeout: 5000 },
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: [
        ['list'],
        ['json', { outputFile: 'playwright-results.json' }]
    ],
    use: {
        baseURL: 'http://127.0.0.1:8080',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    webServer: {
        command: 'npx http-server -p 8080 -c-1 -s .',
        url: 'http://127.0.0.1:8080',
        reuseExistingServer: true,
        timeout: 30000
    }
});
