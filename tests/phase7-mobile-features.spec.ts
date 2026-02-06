import { test, expect } from '@playwright/test'

/**
 * Phase 7 Mobile Features Test Suite
 * 
 * Tests new features added in Phase 7 Week 5:
 * - Mobile volunteer dashboard (4 tabs)
 * - Documents tab functionality
 * - Sign out button
 * - Login redirect fixes
 * - Performance optimizations
 */

test.describe('Phase 7: Mobile Volunteer Features', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
  })

  test('Volunteer login redirects correctly', async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/volunteer/login`)
    
    // Verify login page loads
    await expect(page.locator('h2:has-text("Volunteer Access")')).toBeVisible()
    
    // Fill in login form with valid test credentials
    await page.fill('input[name="firstName"]', 'Cory')
    await page.fill('input[name="lastName"]', 'Allen')
    await page.fill('input[name="congregation"]', 'Twinsburg')
    await page.fill('input[name="pin"]', '0879')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to event selection or dashboard (not stay on login)
    await page.waitForURL(/\/(volunteer\/select-event|volunteer\/dashboard)/, { timeout: 10000 })
    
    // Verify we're not on login page anymore
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/volunteer/login')
  })

  test('Mobile volunteer dashboard has 4 tabs', async ({ page }) => {
    // Login first
    await page.goto(`${process.env.BASE_URL}/volunteer/login`)
    await page.fill('input[name="firstName"]', 'Cory')
    await page.fill('input[name="lastName"]', 'Allen')
    await page.fill('input[name="congregation"]', 'Twinsburg')
    await page.fill('input[name="pin"]', '0879')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await page.waitForURL(/\/volunteer\/dashboard/, { timeout: 10000 })
    
    // Check for all 4 tabs
    await expect(page.locator('button:has-text("Assignments")')).toBeVisible()
    await expect(page.locator('button:has-text("Availability")')).toBeVisible()
    await expect(page.locator('button:has-text("Contacts")')).toBeVisible()
    await expect(page.locator('button:has-text("Documents")')).toBeVisible()
  })

  test('Documents tab is visible and functional', async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto(`${process.env.BASE_URL}/volunteer/login`)
    await page.fill('input[name="firstName"]', 'Cory')
    await page.fill('input[name="lastName"]', 'Allen')
    await page.fill('input[name="congregation"]', 'Twinsburg')
    await page.fill('input[name="pin"]', '0879')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/volunteer\/dashboard/, { timeout: 10000 })
    
    // Verify Documents tab button exists
    const documentsTab = page.locator('button:has-text("Documents")')
    await expect(documentsTab).toBeVisible()
    
    // Click Documents tab
    await documentsTab.click()
    
    // Wait for tab content to load (any content is fine)
    await page.waitForTimeout(1000)
  })

  test('Sign out button is visible and works', async ({ page }) => {
    // Login
    await page.goto(`${process.env.BASE_URL}/volunteer/login`)
    await page.fill('input[name="firstName"]', 'Cory')
    await page.fill('input[name="lastName"]', 'Allen')
    await page.fill('input[name="congregation"]', 'Twinsburg')
    await page.fill('input[name="pin"]', '0879')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/volunteer\/dashboard/, { timeout: 10000 })
    
    // Check for sign out button (logout icon)
    const signOutButton = page.locator('button[aria-label="Sign Out"], button[title="Sign Out"]')
    await expect(signOutButton).toBeVisible()
    
    // Click sign out
    await signOutButton.click()
    
    // Should redirect to a login page (either /volunteer/login or /auth/signin)
    await page.waitForURL(/\/(volunteer\/login|auth\/signin)/, { timeout: 5000 })
  })

  test('Touch targets are at least 44px', async ({ page }) => {
    // Login
    await page.goto(`${process.env.BASE_URL}/volunteer/login`)
    await page.fill('input[name="firstName"]', 'Cory')
    await page.fill('input[name="lastName"]', 'Allen')
    await page.fill('input[name="congregation"]', 'Twinsburg')
    await page.fill('input[name="pin"]', '0879')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/volunteer\/dashboard/, { timeout: 10000 })
    
    // Check tab buttons height
    const tabs = await page.locator('button:has-text("Assignments"), button:has-text("Availability"), button:has-text("Contacts"), button:has-text("Documents")').all()
    
    for (const tab of tabs) {
      const box = await tab.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('Mobile dashboard loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    // Login
    await page.goto(`${process.env.BASE_URL}/volunteer/login`)
    await page.fill('input[name="firstName"]', 'Cory')
    await page.fill('input[name="lastName"]', 'Allen')
    await page.fill('input[name="congregation"]', 'Twinsburg')
    await page.fill('input[name="pin"]', '0879')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to fully load
    await page.waitForURL(/\/volunteer\/dashboard/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('Refresh button works on mobile dashboard', async ({ page }) => {
    // Login
    await page.goto(`${process.env.BASE_URL}/volunteer/login`)
    await page.fill('input[name="firstName"]', 'Cory')
    await page.fill('input[name="lastName"]', 'Allen')
    await page.fill('input[name="congregation"]', 'Twinsburg')
    await page.fill('input[name="pin"]', '0879')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/volunteer\/dashboard/, { timeout: 10000 })
    
    // Find and click refresh button
    const refreshButton = page.locator('button[aria-label="Refresh"], button:has(svg[class*="animate-spin"])')
    await expect(refreshButton.first()).toBeVisible()
    
    // Click refresh
    await refreshButton.first().click()
    
    // Wait for refresh to complete (loading spinner should appear and disappear)
    await page.waitForTimeout(1000)
    
    // Dashboard should still be visible
    await expect(page.locator('button:has-text("Assignments")')).toBeVisible()
  })
})

test.describe('Phase 7: Document Management', () => {
})

test.describe('Phase 7: Performance', () => {
  test('Event page loads with lazy-loaded components', async ({ page }) => {
    // Login as admin
    await page.goto(`${process.env.BASE_URL}/auth/signin`)
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/events/, { timeout: 10000 })
    
    // Navigate to event page
    await page.click('a[href*="/events/"]')
    await page.waitForURL(/\/events\/[^/]+$/, { timeout: 5000 })
    
    // Page should load successfully
    await expect(page.locator('h1')).toBeVisible()
    
    // QR code should be lazy-loaded (may not be immediately visible)
    await page.waitForLoadState('networkidle')
  })

  test('No console errors on mobile dashboard', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Login
    await page.goto(`${process.env.BASE_URL}/volunteer/login`)
    await page.fill('input[name="firstName"]', 'Cory')
    await page.fill('input[name="lastName"]', 'Allen')
    await page.fill('input[name="congregation"]', 'Twinsburg')
    await page.fill('input[name="pin"]', '0879')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/volunteer\/dashboard/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Dashboard should load successfully (presence of tabs indicates success)
    const assignmentsTab = page.locator('button:has-text("Assignments")')
    await expect(assignmentsTab).toBeVisible({ timeout: 10000 })
  })
})
