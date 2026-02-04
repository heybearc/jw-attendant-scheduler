import { test, expect } from '@playwright/test';

test.describe('Template Module Enforcement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3001');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@theoshift.local');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/events/select');
  });

  test('should hide Count Times button when module disabled in template', async ({ page }) => {
    // Navigate to an Audio/Video event (has template with null moduleConfig)
    await page.click('text=Audio-Video');
    await page.waitForURL('**/events/**');
    
    // Count Times button should NOT be visible
    const countTimesButton = page.locator('a:has-text("Count Times")').first();
    await expect(countTimesButton).not.toBeVisible();
  });

  test('should hide Count Times Summary when module disabled', async ({ page }) => {
    // Navigate to an Audio/Video event
    await page.click('text=Audio-Video');
    await page.waitForURL('**/events/**');
    
    // Count Times Summary card should NOT be visible
    const summaryCard = page.locator('text=Count Times Summary');
    await expect(summaryCard).not.toBeVisible();
  });

  test('should hide Lanyards button when module disabled in template', async ({ page }) => {
    // Navigate to an Audio/Video event
    await page.click('text=Audio-Video');
    await page.waitForURL('**/events/**');
    
    // Lanyards button should NOT be visible
    const lanyardsButton = page.locator('a:has-text("Lanyards")').first();
    await expect(lanyardsButton).not.toBeVisible();
  });

  test('should show Positions button (always enabled)', async ({ page }) => {
    // Navigate to an Audio/Video event
    await page.click('text=Audio-Video');
    await page.waitForURL('**/events/**');
    
    // Positions button SHOULD be visible
    const positionsButton = page.locator('a:has-text("Positions")').first();
    await expect(positionsButton).toBeVisible();
  });

  test('event edit page should have department template selector', async ({ page }) => {
    // Navigate to any event
    await page.click('text=Regional Convention 2026');
    await page.waitForURL('**/events/**');
    
    // Click Edit Event
    await page.click('text=Edit Event');
    await page.waitForURL('**/edit');
    
    // Department Template dropdown should exist
    const templateSelect = page.locator('select[name="departmentTemplateId"]');
    await expect(templateSelect).toBeVisible();
    
    // Should have "No template" option
    const noTemplateOption = templateSelect.locator('option:has-text("No template")');
    await expect(noTemplateOption).toBeVisible();
  });

  test('should be able to assign template to event', async ({ page }) => {
    // Navigate to any event without a template
    await page.click('text=Regional Convention 2026');
    await page.waitForURL('**/events/**');
    
    // Click Edit Event
    await page.click('text=Edit Event');
    await page.waitForURL('**/edit');
    
    // Select a template
    await page.selectOption('select[name="departmentTemplateId"]', { index: 1 }); // Select first template
    
    // Save
    await page.click('button[type="submit"]');
    
    // Should redirect back to event page
    await page.waitForURL('**/events/*', { waitUntil: 'networkidle' });
    
    // Success message should appear
    const successMessage = page.locator('text=Event updated successfully');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should redirect when accessing disabled module page directly', async ({ page }) => {
    // Try to access Count Times page for Audio/Video event directly
    // First get an Audio/Video event ID
    await page.click('text=Audio-Video');
    const url = page.url();
    const eventId = url.split('/events/')[1].split('/')[0];
    
    // Try to navigate to count-times page
    await page.goto(`${process.env.BASE_URL}/events/${eventId}/count-times`);
    
    // Should redirect back to event page (not count-times)
    await page.waitForURL(`**/events/${eventId}`, { timeout: 5000 });
    expect(page.url()).not.toContain('count-times');
  });
});
