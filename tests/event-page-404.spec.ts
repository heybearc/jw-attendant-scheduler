/**
 * E2E Test: Event Page 404 Issue
 * Tests the scenario where a logged-in user gets 404 on event detail page
 */

import { test, expect } from '@playwright/test'

test.describe('Event Detail Page Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('https://blue.theoshift.com/auth/signin')
    await page.fill('input[name="email"]', 'admin@theoshift.local')
    await page.fill('input[name="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    
    // Wait for redirect after login
    await page.waitForURL(/\/events|\/admin/, { timeout: 10000 })
  })

  test('should access event detail page without 404', async ({ page }) => {
    const eventId = 'ba89b1c7-4790-418f-a4f5-c400931ef28d'
    
    // Navigate to event detail page
    const response = await page.goto(`https://blue.theoshift.com/events/${eventId}`)
    
    // Should not get 404
    expect(response?.status()).not.toBe(404)
    expect(response?.status()).toBe(200)
    
    // Should see event content
    await expect(page.locator('h1, h2')).toContainText(/Regional Convention|Event/)
    
    // Should not see 404 error message
    await expect(page.locator('body')).not.toContainText('404')
    await expect(page.locator('body')).not.toContainText('Page not found')
  })

  test('should display volunteer terminology on event page', async ({ page }) => {
    const eventId = 'ba89b1c7-4790-418f-a4f5-c400931ef28d'
    
    await page.goto(`https://blue.theoshift.com/events/${eventId}`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Should use "Volunteers" terminology
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Volunteer')
    
    // Should NOT use "Attendant" terminology
    expect(bodyText).not.toContain('Attendant')
  })

  test('should have working navigation buttons', async ({ page }) => {
    const eventId = 'ba89b1c7-4790-418f-a4f5-c400931ef28d'
    
    await page.goto(`https://blue.theoshift.com/events/${eventId}`)
    
    // Should have navigation to volunteers page
    const volunteersLink = page.locator('a[href*="/attendants"], a[href*="/volunteers"]')
    await expect(volunteersLink).toBeVisible()
  })

  test('should log server-side errors if any', async ({ page }) => {
    const eventId = 'ba89b1c7-4790-418f-a4f5-c400931ef28d'
    
    // Capture console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Capture network errors
    const networkErrors: string[] = []
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`)
      }
    })
    
    await page.goto(`https://blue.theoshift.com/events/${eventId}`)
    
    // Log any errors found
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors)
    }
    if (networkErrors.length > 0) {
      console.log('Network errors:', networkErrors)
    }
    
    // Test should pass even if there are errors (we're just logging them)
    expect(true).toBe(true)
  })
})
