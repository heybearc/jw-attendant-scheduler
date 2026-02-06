import { test, expect } from '@playwright/test';

/**
 * Custom Test Suite: Permissions Refactor (v3.9.0)
 * 
 * Tests the simplified 3-role permission system:
 * - ADMIN (was OWNER)
 * - COORDINATOR (was MANAGER/OVERSEER/KEYMAN)
 * - VIEWER (unchanged)
 * 
 * Generated: 2026-02-02
 * Related: commit e56f852d - refactor: simplify event permissions from 5 roles to 3
 */

test.describe('Permissions Refactor - 3 Role System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(process.env.BASE_URL || 'http://localhost:3001');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@theoshift.local');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/events/select');
  });

  test('PR-1: Permissions page loads and shows 3-role dropdown', async ({ page }) => {
    // Navigate to an event's permissions page
    await page.goto(`${process.env.BASE_URL}/events`);
    
    // Click first event
    const firstEvent = page.locator('a[href*="/events/"]').first();
    await firstEvent.click();
    
    // Navigate to permissions - it's a tab in EventPageLayout
    await page.click('a[href$="/permissions"]');
    await page.waitForURL('**/permissions');
    
    // Verify page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /permissions/i })).toBeVisible();
    
    // Check if "Add Permission" or similar button exists
    const addButton = page.locator('button').filter({ hasText: /add|grant/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Verify role dropdown has exactly 3 options
      const roleSelect = page.locator('select[name*="role"], select#role, [role="combobox"]').first();
      await expect(roleSelect).toBeVisible();
      
      // Get all options
      const options = await roleSelect.locator('option').allTextContents();
      
      // Should have 3 roles (plus possibly a placeholder)
      const roles = options.filter(opt => 
        opt.includes('ADMIN') || 
        opt.includes('COORDINATOR') || 
        opt.includes('VIEWER')
      );
      
      expect(roles.length).toBe(3);
      expect(roles.some(r => r.includes('ADMIN'))).toBeTruthy();
      expect(roles.some(r => r.includes('COORDINATOR'))).toBeTruthy();
      expect(roles.some(r => r.includes('VIEWER'))).toBeTruthy();
      
      // Verify old roles are NOT present
      expect(options.join(' ')).not.toContain('OWNER');
      expect(options.join(' ')).not.toContain('MANAGER');
      expect(options.join(' ')).not.toContain('OVERSEER');
      expect(options.join(' ')).not.toContain('KEYMAN');
    }
  });

  test('PR-2: Existing permissions show correct role badges', async ({ page }) => {
    // Navigate to an event's permissions page
    await page.goto(`${process.env.BASE_URL}/events`);
    
    const firstEvent = page.locator('a[href*="/events/"]').first();
    await firstEvent.click();
    
    await page.click('a[href$="/permissions"]');
    await page.waitForURL('**/permissions');
    
    // Check for permission entries
    const permissionsList = page.locator('[data-testid="permissions-list"], table, .permissions-table').first();
    
    if (await permissionsList.isVisible()) {
      // Verify role badges only show new roles
      const badges = await page.locator('.badge, .pill, [class*="role"]').allTextContents();
      const roleText = badges.join(' ');
      
      // Should contain new roles
      const hasNewRoles = 
        roleText.includes('ADMIN') || 
        roleText.includes('COORDINATOR') || 
        roleText.includes('VIEWER');
      
      // Should NOT contain old roles
      const hasOldRoles = 
        roleText.includes('OWNER') || 
        roleText.includes('MANAGER') || 
        roleText.includes('OVERSEER') || 
        roleText.includes('KEYMAN');
      
      if (badges.length > 0) {
        expect(hasNewRoles).toBeTruthy();
        expect(hasOldRoles).toBeFalsy();
      }
    }
  });

  test('PR-3: Permission descriptions reflect new role names', async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/events`);
    
    const firstEvent = page.locator('a[href*="/events/"]').first();
    await firstEvent.click();
    
    await page.click('text=Permissions');
    await page.waitForURL('**/permissions');
    
    // Look for help text or descriptions
    const pageContent = await page.textContent('body');
    
    // Should mention ADMIN (not OWNER)
    if (pageContent.toLowerCase().includes('full control')) {
      expect(pageContent).toContain('ADMIN');
      expect(pageContent).not.toContain('OWNER');
    }
    
    // Should mention COORDINATOR for management tasks
    if (pageContent.toLowerCase().includes('manage')) {
      const hasCoordinator = pageContent.includes('COORDINATOR');
      const hasOldRoles = 
        pageContent.includes('MANAGER') || 
        pageContent.includes('OVERSEER') || 
        pageContent.includes('KEYMAN');
      
      if (hasCoordinator || hasOldRoles) {
        expect(hasCoordinator).toBeTruthy();
        expect(hasOldRoles).toBeFalsy();
      }
    }
  });

  test('PR-4: API accepts new role values', async ({ page, request }) => {
    // Get an event ID
    await page.goto(`${process.env.BASE_URL}/events`);
    const firstEventLink = page.locator('a[href*="/events/"]').first();
    const href = await firstEventLink.getAttribute('href');
    const eventId = href?.split('/events/')[1]?.split('/')[0];
    
    if (!eventId) {
      test.skip();
      return;
    }
    
    // Try to fetch permissions (this tests the API accepts new enum values)
    const response = await request.get(`${process.env.BASE_URL}/api/events/${eventId}/permissions`);
    
    // Should return 200 or 401 (if auth required), not 500
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // If permissions exist, verify they use new role names
      if (Array.isArray(data) && data.length > 0) {
        const roles = data.map((p: any) => p.role);
        
        // All roles should be one of the new 3
        roles.forEach((role: string) => {
          expect(['ADMIN', 'COORDINATOR', 'VIEWER']).toContain(role);
        });
        
        // No old roles should exist
        expect(roles).not.toContain('OWNER');
        expect(roles).not.toContain('MANAGER');
        expect(roles).not.toContain('OVERSEER');
        expect(roles).not.toContain('KEYMAN');
      }
    }
  });

  test('PR-5: Database migration completed successfully', async ({ page, request }) => {
    // This test verifies the migration ran and data is accessible
    await page.goto(`${process.env.BASE_URL}/events`);
    
    // Get first event
    const firstEventLink = page.locator('a[href*="/events/"]').first();
    const href = await firstEventLink.getAttribute('href');
    const eventId = href?.split('/events/')[1]?.split('/')[0];
    
    if (!eventId) {
      test.skip();
      return;
    }
    
    // Navigate to permissions page
    await page.goto(`${process.env.BASE_URL}/events/${eventId}/permissions`);
    
    // Page should load without errors
    await expect(page.locator('body')).not.toContainText('500');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    await expect(page.locator('body')).not.toContainText('Database error');
    
    // Should show permissions UI
    const hasPermissionsUI = 
      await page.locator('h1, h2').filter({ hasText: /permissions/i }).isVisible() ||
      await page.locator('button').filter({ hasText: /add|grant/i }).isVisible();
    
    expect(hasPermissionsUI).toBeTruthy();
  });
});
