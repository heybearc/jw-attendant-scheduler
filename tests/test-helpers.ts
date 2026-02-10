import { Page } from '@playwright/test';

/**
 * Reusable test helper functions for TheoShift
 */

export async function login(page: Page, email?: string, password?: string) {
  const testEmail = email || process.env.TEST_USER_EMAIL || 'admin@theoshift.local';
  const testPassword = password || process.env.TEST_USER_PASSWORD || 'AdminPass123!';
  
  await page.goto('/auth/signin');
  await page.fill('#email', testEmail);
  await page.fill('#password', testPassword);
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

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

export async function waitForDataLoad(page: Page) {
  const loadingSelectors = ['text=Loading...', '[data-loading="true"]', '.loading'];
  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 2000 });
    } catch {
      // Continue
    }
  }
  await page.waitForTimeout(500);
}

export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export async function selectEvent(page: Page, eventName?: string) {
  await navigateToEvents(page);
  const eventCard = eventName 
    ? page.locator(`text=${eventName}`).first()
    : page.locator('[class*="card"], [class*="Card"]').first();
  
  if (await eventCard.isVisible()) {
    await eventCard.click();
    await page.waitForTimeout(1000);
  }
}

export async function navigateToEventById(page: Page, eventId: string) {
  await page.goto(`/events/${eventId}`);
  await waitForDataLoad(page);
}

export async function navigateToEventPage(page: Page, eventId: string, pagePath: string) {
  await page.goto(`/events/${eventId}/${pagePath}`);
  await waitForDataLoad(page);
}
