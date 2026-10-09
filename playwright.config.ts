import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

import { BASE_URL } from './tests/e2e/helpers';

dotenv.config({ path: '.env.e2e' });

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    expect: { timeout: 15_000 },
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: [['list']],
    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        ...devices['Desktop Chrome'],
    },
    webServer: {
        command: 'npm run start -- --port 3210',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
