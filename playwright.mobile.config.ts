import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

/** Mobile browser matrix for Early Check-In audit — does not alter default release-gate config. */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/mobile-early-checkin-browsers.spec.ts',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  use: {
    baseURL: process.env.BASE_URL || 'https://theoshift.com',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Mobile Chrome (Pixel 7)',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Safari (iPhone 13)',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Mobile Safari (iPhone SE)',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'iPad Safari',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'Mobile Firefox (Pixel 5)',
      use: {
        ...devices['Pixel 5'],
        browserName: 'firefox',
      },
    },
  ],
});
