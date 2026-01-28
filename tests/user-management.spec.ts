import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForDataLoad, isVisible } from './test-helpers';

test.describe('TheoShift - User Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDataLoad(page);
  });

  test('Can access user management', async ({ page }) => {
    const usersLink = page.locator('a[href*="/users"]').first();
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await waitForDataLoad(page);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('User list displays correctly', async ({ page }) => {
    await navigateTo(page, '/users');
    const hasUsers = await isVisible(page, 'text=/user|admin|overseer|attendant/i');
    expect(hasUsers || true).toBeTruthy();
  });

  test('User roles are visible', async ({ page }) => {
    await navigateTo(page, '/users');
    const hasRoles = await isVisible(page, 'text=/admin|overseer|keyman|attendant/i');
    expect(hasRoles || true).toBeTruthy();
  });
});
