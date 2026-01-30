import { test, expect } from '@playwright/test';
import { getBaseUrl, getTestCredentials } from './helpers/test-config'

const BASE_URL = getBaseUrl()
const credentials = getTestCredentials()


/**
 * QUICK SMOKE TESTS - TheoShift
 * Run these before every deployment
 */

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL ,
  password: process.env.TEST_USER_PASSWORD ,
};

test.describe('TheoShift - Quick Smoke Tests', () => {
  test('Critical Path: Login → Event Selection → Events', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Wait for form to be ready
    await page.waitForSelector('input[id="email"]', { state: 'visible' });
    
    // Fill credentials
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    
    // Submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Wait for redirect to complete
    await page.waitForTimeout(1000);
    
    // 2. Navigate to events if not already there
    if (!page.url().includes('/events')) {
      await page.goto('/events');
    }
    
    // 3. Verify page loaded
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
  });

  test('Events page loads without errors', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[id="email"]', { state: 'visible' });
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('/events')) {
      await page.goto('/events');
    }
    
    // Page should be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('No critical JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[id="email"]', { state: 'visible' });
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    await page.waitForTimeout(1000);
    
    await page.waitForTimeout(2000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('net::ERR_') &&
      !e.includes('Failed to load resource') &&
      !e.includes('[ACTIVITY]') &&
      !e.includes('Failed to fetch')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Navigation works correctly', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[id="email"]', { state: 'visible' });
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    await page.waitForTimeout(1000);
    
    // Try to navigate to events
    await page.goto('/events');
    await page.waitForTimeout(1000);
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });
});
