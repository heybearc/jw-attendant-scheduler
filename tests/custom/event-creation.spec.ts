import { test, expect } from '@playwright/test'

test.describe('Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3001')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
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
    await page.fill('input[name="location"]', 'Test Location')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify no 500 error
    await page.waitForURL('**/events/**', { timeout: 10000 })
    
    // Verify we're on event details page (not error page)
    await expect(page.locator('h3:has-text("Event Command Center")')).toBeVisible({ timeout: 5000 })
  })

  test('creator gets ADMIN role on new event', async ({ page }) => {
    // Create event
    await page.click('a[href="/events/create"]')
    await page.waitForURL('**/events/create')
    
    const timestamp = Date.now()
    await page.fill('input[name="name"]', `Test Event ${timestamp}`)
    await page.selectOption('select[name="eventType"]', 'CIRCUIT_ASSEMBLY')
    
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateString = futureDate.toISOString().split('T')[0]
    
    await page.fill('input[name="startDate"]', dateString)
    await page.fill('input[name="endDate"]', dateString)
    await page.fill('input[name="location"]', 'Test Location')
    
    await page.click('button[type="submit"]')
    await page.waitForURL('**/events/**')
    
    // Navigate to permissions page - it's a tab in EventPageLayout
    await page.click('a[href$="/permissions"]')
    await page.waitForURL('**/permissions')
    
    // Verify creator has ADMIN role
    const adminBadge = page.locator('text=ADMIN').first()
    await expect(adminBadge).toBeVisible()
  })
})
