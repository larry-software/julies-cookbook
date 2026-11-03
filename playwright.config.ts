import { defineConfig } from '@playwright/test';
const node = JSON.stringify(process.execPath);
export default defineConfig({
  testDir: './tests/e2e', workers: 1, retries: 0, timeout: 30_000,
  outputDir: './outputs/playwright', reporter: [['list']],
  use: { browserName: 'chromium', headless: true, serviceWorkers: 'block' },
  webServer: [
    { command: `${node} node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort --outDir outputs/e2e-demo`, url: 'http://127.0.0.1:4173', reuseExistingServer: false },
    { command: `${node} node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174 --strictPort --outDir outputs/e2e-locked`, url: 'http://127.0.0.1:4174', reuseExistingServer: false },
    { command: `${node} node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4175 --strictPort`, url: 'http://127.0.0.1:4175/tests/e2e/auth.html', reuseExistingServer: false },
  ],
});
