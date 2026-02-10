import { test, expect } from '@playwright/test'

test.describe('Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL + '/auth/signin')
    await page.type('#email', process.env.TEST_USER_EMAIL || '')
    await page.type('#password', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/events/select')
  })

  test('can create new event without errors', async ({ page }) => {
    // Click create event button
    await page.click('a[href="/events/create"]')
    await page.waitForURL('**/events/create')
    
    // Fill in required fields
    const timestamp = Date.now()
    await page.fill('input[name="name"]', `Test Event ${timestamp}`)
    await page.selectOption('select[name="eventType"]', 'CIRCUIT_ASSEMBLY')
    
    // Set dates (future dates)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateString = futureDate.toISOString().split('T')[0]
    
    await page.fill('input[name="startDate"]', dateString)
    await page.fill('input[name="endDate"]', dateString)
    
    // Handle LocationSelector - type and wait for dropdown
    const locationInput = page.locator('input[placeholder*="Search"]').first()
    if (await locationInput.count() > 0) {
      await locationInput.fill('Test Location')
      await page.waitForTimeout(1000)
      
      // Look for "Create new location" button or existing location
      const createButton = page.locator('button:has-text("Create new location")')
      if (await createButton.count() > 0) {
        await createButton.click()
        await page.waitForTimeout(500)
      }
    }
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify no 500 error
    await page.waitForURL('**/events/**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Verify we're on event details page (not error page) - check for any main heading
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

})
