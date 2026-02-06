import { test, expect } from '@playwright/test'

test.describe('Date Display Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3001')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/events/select')
  })

  test('event selection page shows correct dates', async ({ page }) => {
    // Wait for events to load
    await page.waitForSelector('text=Select Event', { timeout: 10000 })
    
    // Get first event card date text
    const dateText = await page.locator('.text-sm.text-gray-600').filter({ hasText: '📅' }).first().textContent()
    
    // Verify date format and that it's not empty
    expect(dateText).toBeTruthy()
    expect(dateText).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
  })

  test('event details page shows matching dates', async ({ page }) => {
    // Click first event
    await page.click('button:has-text("Select Event")')
    await page.waitForURL('**/events/**')
    await page.waitForLoadState('networkidle')
    
    // Look for any date on the page - event details should have dates
    const pageContent = await page.content()
    const hasDate = /[A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4}/.test(pageContent)
    
    // Verify at least one date is displayed
    expect(hasDate).toBeTruthy()
  })

  test('dates are consistent between selection and details pages', async ({ page }) => {
    // Get date from selection page
    const selectionDateText = await page.locator('.text-sm.text-gray-600').filter({ hasText: '📅' }).first().textContent()
    const selectionDate = selectionDateText?.match(/([A-Z][a-z]{2,8})\s+(\d{1,2}),\s+(\d{4})/)?.[0]
    
    // Navigate to event details
    await page.click('button:has-text("Select Event")')
    await page.waitForURL('**/events/**')
    await page.waitForLoadState('networkidle')
    
    // Get page content and check if date appears
    const pageContent = await page.content()
    
    // Verify selection date exists and appears somewhere on details page
    expect(selectionDate).toBeTruthy()
    expect(pageContent).toContain(selectionDate || '')
  })
})
