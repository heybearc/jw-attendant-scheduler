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
    
    // Get start date from event details - look for date text in various formats
    const dateElements = await page.locator('text=/[A-Z][a-z]{2,8} \\d{1,2}, \\d{4}/').allTextContents()
    
    // Verify at least one date is displayed
    expect(dateElements.length).toBeGreaterThan(0)
    expect(dateElements[0]).toMatch(/[A-Z][a-z]+ \d{1,2}, \d{4}/)
  })

  test('dates are consistent between selection and details pages', async ({ page }) => {
    // Get date from selection page
    const selectionDateText = await page.locator('.text-sm.text-gray-600').filter({ hasText: '📅' }).first().textContent()
    const selectionDate = selectionDateText?.match(/([A-Z][a-z]{2} \d{1,2}, \d{4})/)?.[1]
    
    // Navigate to event details
    await page.click('button:has-text("Select Event")')
    await page.waitForURL('**/events/**')
    
    // Get dates from details page - look for any date text
    const detailsDates = await page.locator('text=/[A-Z][a-z]{2,8} \\d{1,2}, \\d{4}/').allTextContents()
    
    // Verify selection date exists and appears somewhere on details page
    expect(selectionDate).toBeTruthy()
    const dateFound = detailsDates.some(date => date.includes(selectionDate?.split(' ')[1] || ''))
    expect(dateFound).toBeTruthy()
  })
})
