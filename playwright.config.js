module.exports = {
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx http-server . -p 8080 -c-1',
    port: 8080,
    reuseExistingServer: true,
    timeout: 10000,
  },
  reporter: [['list'], ['json', { outputFile: 'tests/playwright-report.json' }]],
};
