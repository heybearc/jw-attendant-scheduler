import { Page } from '@playwright/test';

/**
 * Reusable test helper functions for TheoShift
 */

export async function login(page: Page, email?: string, password?: string) {
  const testEmail = email || process.env.TEST_USER_EMAIL || 'admin@test.com';
  const testPassword = password || process.env.TEST_USER_PASSWORD || 'admin123';
  
  await page.goto('/login');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|events)/, { timeout: 10000 });
}

export async function navigateToEvents(page: Page) {
  if (!page.url().includes('/events')) {
    await page.goto('/events');
  }
  await page.waitForTimeout(1000);
}

export async function takeScreenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${testName}-${Date.now()}.png`,
    fullPage: true 
  });
}
