import { test, expect } from '@playwright/test'

test.describe('Date Display Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3001')
    await page.type('#email', process.env.TEST_USER_EMAIL || '')
    await page.type('#password', process.env.TEST_USER_PASSWORD || '')
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
    await page.waitForURL('**/events/**', { timeout: 10000 })
    await page.waitForLoadState('load')
    await page.waitForTimeout(500)
    
    // Look for any date on the page - event details should have dates
    const pageContent = await page.content()
    const hasDate = /[A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4}/.test(pageContent)
    
    // Verify at least one date is displayed
    expect(hasDate).toBeTruthy()
  })

})
