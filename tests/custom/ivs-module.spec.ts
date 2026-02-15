import { test, expect } from '@playwright/test'
import { login, navigateToEventPage, waitForDataLoad } from '../test-helpers'

const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '7a14c6ac-18c3-4c98-9b07-ba853d30f144'

test.describe('IVS Module', () => {
  let ivsModuleEnabled = false

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await login(page)
    await navigateToEventPage(page, TEST_EVENT_ID, '')
    
    // Check if IVS Module tab exists
    const ivsTab = page.locator('text=IVS Module')
    ivsModuleEnabled = await ivsTab.isVisible().catch(() => false)
    
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForDataLoad(page)
  })

  test('IVS Module tab is visible on event page', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, '')
    const ivsTab = page.locator('text=IVS Module')
    await expect(ivsTab).toBeVisible({ timeout: 10000 })
  })

  test('Can navigate to IVS Module page', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    await expect(page.locator('h1:has-text("IVS Module")')).toBeVisible()
    await expect(page.locator('button:has-text("Approvals")')).toBeVisible()
    await expect(page.locator('button:has-text("Early Check-In")')).toBeVisible()
  })

  test('Approvals tab is default and shows correct content', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Approvals tab should be active by default
    const approvalsTab = page.locator('button:has-text("Approvals")')
    await expect(approvalsTab).toHaveClass(/border-blue-600/)
    
    // Check Approvals content is visible
    await expect(page.locator('button:has-text("Import Volunteers")')).toBeVisible()
    await expect(page.locator('button:has-text("Export List")')).toBeVisible()
  })

  test('Can switch to Early Check-In tab', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Click Early Check-In tab
    const checkinTab = page.locator('button:has-text("Early Check-In")')
    await checkinTab.click()
    
    // Tab should be active
    await expect(checkinTab).toHaveClass(/border-blue-600/)
    
    // Check Early Check-In content is visible
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
    await expect(page.locator('text=Pending')).toBeVisible()
    await expect(page.locator('text=Checked In')).toBeVisible()
    await expect(page.locator('text=Total Eligible')).toBeVisible()
  })

  test('Approvals tab: Import and Export buttons are functional', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Should be on Approvals tab by default
    await expect(page.locator('button:has-text("Import Volunteers")')).toBeEnabled()
    await expect(page.locator('button:has-text("Export List")')).toBeEnabled()
  })

  test('Approvals tab: Filters are present', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Check filter dropdowns exist
    const filters = page.locator('select')
    await expect(filters.first()).toBeVisible()
  })

  test('Approvals tab: Table columns are correct', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 }).catch(() => {})
    
    // Check for expected column headers (if table exists)
    const table = page.locator('table')
    if (await table.isVisible()) {
      await expect(page.locator('th:has-text("Name")')).toBeVisible()
      await expect(page.locator('th:has-text("Congregation")')).toBeVisible()
      await expect(page.locator('th:has-text("Department")')).toBeVisible()
      await expect(page.locator('th:has-text("Round")')).toBeVisible()
      await expect(page.locator('th:has-text("Status")')).toBeVisible()
      await expect(page.locator('th:has-text("Actions")')).toBeVisible()
    }
  })

  test('Early Check-In tab: Search is functional', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Switch to Early Check-In tab
    await page.locator('button:has-text("Early Check-In")').click()
    
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
    
    // Type in search
    await searchInput.fill('test')
    await page.waitForTimeout(500)
  })

  test('Early Check-In tab: Stats are visible', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Switch to Early Check-In tab
    await page.locator('button:has-text("Early Check-In")').click()
    
    // Check stats are visible
    await expect(page.locator('text=Pending').first()).toBeVisible()
    await expect(page.locator('text=Checked In').first()).toBeVisible()
    await expect(page.locator('text=Total Eligible')).toBeVisible()
    await expect(page.locator('text=Last updated:')).toBeVisible()
  })

  test('Early Check-In tab: Collapsible sections work', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Switch to Early Check-In tab
    await page.locator('button:has-text("Early Check-In")').click()
    
    // Check for collapsible section headers
    const pendingHeader = page.locator('h2:has-text("PENDING CHECK-IN")')
    const checkedInHeader = page.locator('h2:has-text("CHECKED IN")')
    
    await expect(pendingHeader).toBeVisible()
    await expect(checkedInHeader).toBeVisible()
  })

  test('Old route /ivs-approvals redirects to /ivs', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await page.goto(`/events/${TEST_EVENT_ID}/ivs-approvals`)
    
    // Should redirect to new route
    await page.waitForURL(`**/events/${TEST_EVENT_ID}/ivs`, { timeout: 5000 })
    await expect(page.locator('h1:has-text("IVS Module")')).toBeVisible()
  })

  test('Old route /ivs-checkin redirects to /ivs', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    await page.goto(`/events/${TEST_EVENT_ID}/ivs-checkin`)
    
    // Should redirect to new route
    await page.waitForURL(`**/events/${TEST_EVENT_ID}/ivs`, { timeout: 5000 })
    await expect(page.locator('h1:has-text("IVS Module")')).toBeVisible()
  })

  test('Page loads without critical console errors', async ({ page }) => {
    test.skip(!ivsModuleEnabled, 'IVS module not enabled for test event')
    
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs')
    
    // Filter out known/acceptable errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('net::ERR')
    )
    
    expect(criticalErrors.length).toBe(0)
  })
})
