const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/mobile',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'android-web', use: { browserName: 'chromium', viewport: { width: 960, height: 432 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } }
  ],
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false }
});
