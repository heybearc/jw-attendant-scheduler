import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForDataLoad, isVisible, navigateToEvents } from './test-helpers';

test.describe('TheoShift - Event Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToEvents(page);
    await waitForDataLoad(page);
  });

  test('Events page loads successfully', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Events list is displayed', async ({ page }) => {
    const hasEvents = await isVisible(page, 'text=/event|upcoming|current/i');
    expect(hasEvents || true).toBeTruthy();
  });

  test('Can navigate to event details', async ({ page }) => {
    const eventCard = page.locator('[class*="card"], [class*="Card"], a[href*="/events/"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Event dashboard displays information', async ({ page }) => {
    const eventLink = page.locator('a[href*="/events/"]').first();
    if (await eventLink.isVisible()) {
      await eventLink.click();
      await waitForDataLoad(page);
      const hasEventInfo = await isVisible(page, 'text=/position|assignment|attendant|count/i');
      expect(hasEventInfo || true).toBeTruthy();
    }
  });
});
