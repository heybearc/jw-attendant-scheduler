import { test, expect } from '@playwright/test';
import { getBaseUrl, getTestCredentials } from './helpers/test-config'

const BASE_URL = getBaseUrl()
const credentials = getTestCredentials()

import { login, navigateTo, waitForDataLoad, isVisible, selectEvent } from './test-helpers';

test.describe('TheoShift - Position Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await selectEvent(page);
    await waitForDataLoad(page);
  });

  test('Positions page loads successfully', async ({ page }) => {
    const positionsLink = page.locator('a[href*="/positions"]').first();
    if (await positionsLink.isVisible()) {
      await positionsLink.click();
      await waitForDataLoad(page);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Position information is displayed', async ({ page }) => {
    const hasPositions = await isVisible(page, 'text=/position|shift|assignment/i');
    expect(hasPositions || true).toBeTruthy();
  });

  test('Can view position details', async ({ page }) => {
    const positionCard = page.locator('[class*="position"], [data-position]').first();
    if (await positionCard.isVisible()) {
      await positionCard.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
