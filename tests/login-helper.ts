import { Page } from '@playwright/test';

/**
 * Universal login helper for TheoShift E2E tests
 * Works with the new signin page that has role selection
 */
export async function loginAsAdmin(page: Page, email?: string, password?: string) {
  const testEmail = email || process.env.TEST_USER_EMAIL || 'admin@theoshift.local';
  const testPassword = password || process.env.TEST_USER_PASSWORD || 'AdminPass123!';
  
  // Navigate to signin
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  await page.goto(`${baseUrl}/auth/signin`);
  await page.waitForLoadState('networkidle');
  
  // Click Oversight role button (new signin page has role selector)
  try {
    const oversightButton = page.locator('button:has-text("Oversight")');
    if (await oversightButton.isVisible({ timeout: 2000 })) {
      await oversightButton.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    // Role button might not be visible, continue
  }
  
  // Wait for email field to be visible (try both old and new IDs)
  try {
    await page.waitForSelector('input[id="oversight-email"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[id="oversight-email"]', testEmail);
    await page.fill('input[id="oversight-password"]', testPassword);
  } catch (e) {
    // Fallback to old IDs if new ones don't exist
    await page.waitForSelector('input[id="email"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
  }
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL(/\/(dashboard|events)/, { timeout: 15000 });
  await page.waitForTimeout(1000);
}

/**
 * Legacy login helper - redirects to new login
 * @deprecated Use loginAsAdmin instead
 */
export async function login(page: Page, email?: string, password?: string) {
  return loginAsAdmin(page, email, password);
}
