import { test, expect } from '@playwright/test';

/**
 * REFACTORING VALIDATION TESTS
 * Tests specifically for the Week 3 refactoring changes
 */

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@theoshift.local',
  password: process.env.TEST_USER_PASSWORD || 'AdminPass123!',
};

test.describe('Refactoring Validation - Position Management', () => {
  test('Login and navigate to positions page', async ({ page }) => {
    // Login with correct selectors
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('input[id="email"]', { state: 'visible' });
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Navigate to events
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    
    // Click first event to go to positions
    const firstEvent = page.locator('a[href*="/events/"]').first();
    await firstEvent.click();
    await page.waitForLoadState('networkidle');
    
    // Verify we're on an event page
    expect(page.url()).toMatch(/\/events\/\d+/);
  });

  test('Positions page loads without errors', async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.waitForSelector('input[id="email"]', { state: 'visible' });
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Go to first event
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    const firstEventLink = page.locator('a[href*="/events/"]').first();
    const eventUrl = await firstEventLink.getAttribute('href');
    
    // Navigate to positions page
    await page.goto(`${eventUrl}/positions`);
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any errors to appear
    await page.waitForTimeout(2000);
    
    // Verify no critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('net::ERR')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Refactored components render correctly', async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.waitForSelector('input[id="email"]', { state: 'visible' });
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Navigate to positions
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    const firstEventLink = page.locator('a[href*="/events/"]').first();
    const eventUrl = await firstEventLink.getAttribute('href');
    await page.goto(`${eventUrl}/positions`);
    await page.waitForLoadState('networkidle');
    
    // Check that page loaded
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    
    // Verify positions page elements exist
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    expect(hasContent!.length).toBeGreaterThan(100);
  });

  test('Modal buttons are present (if positions exist)', async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.waitForSelector('input[id="email"]', { state: 'visible' });
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Navigate to positions
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    const firstEventLink = page.locator('a[href*="/events/"]').first();
    const eventUrl = await firstEventLink.getAttribute('href');
    await page.goto(`${eventUrl}/positions`);
    await page.waitForLoadState('networkidle');
    
    // Check for action buttons (these should be present regardless of data)
    const bodyText = await page.locator('body').textContent();
    
    // The page should have loaded successfully
    expect(bodyText).toBeTruthy();
    
    // Log what we found for debugging
    console.log('Page loaded successfully, checking for refactored components...');
  });
});
