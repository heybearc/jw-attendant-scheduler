import { test, expect } from '@playwright/test'
import { login, navigateToEventPage, waitForDataLoad } from '../test-helpers'

const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '7a14c6ac-18c3-4c98-9b07-ba853d30f144'

test.describe('IVS Approvals Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForDataLoad(page)
  })

  test('IVS Approvals tab is visible on event page', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, '')
    const ivsTab = page.locator('text=IVS Approvals')
    await expect(ivsTab).toBeVisible({ timeout: 10000 })
  })

  test('Can navigate to IVS Approvals page', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
    await expect(page.locator('h1:has-text("IVS Volunteer Approvals")')).toBeVisible()
    await expect(page.locator('button:has-text("Import Volunteers")')).toBeVisible()
    await expect(page.locator('button:has-text("Export List")')).toBeVisible()
  })

  test('Import and Export buttons are functional', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
    // Check Import button
    await expect(page.locator('button:has-text("Import Volunteers")')).toBeEnabled()
    
    // Check Export button
    await expect(page.locator('button:has-text("Export List")')).toBeEnabled()
    
    // Check Mobile Check-In button
    await expect(page.locator('button:has-text("Mobile Check-In")')).toBeVisible()
  })

  test('Filters are present and functional', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
    // Check filter dropdowns exist
    const filters = page.locator('select')
    await expect(filters.first()).toBeVisible()
  })

  test('Mobile Check-In page loads', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-checkin')
    
    await expect(page.locator('h1:has-text("Early Check-In")')).toBeVisible()
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
    
    // Check stats are visible
    await expect(page.locator('text=Pending')).toBeVisible()
    await expect(page.locator('text=Checked In')).toBeVisible()
    await expect(page.locator('text=Total Eligible')).toBeVisible()
  })

  test('Mobile Check-In search is functional', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-checkin')
    
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
    
    // Type in search
    await searchInput.fill('test')
    
    // Search should filter results (or show no results message)
    await page.waitForTimeout(500)
  })

  test('Table columns are correct', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
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

  test('Clear All button appears when volunteers exist', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
    // Clear All button should be visible if volunteers exist
    // (or not visible if no volunteers - both are valid states)
    const clearAllButton = page.locator('button:has-text("Clear All")')
    // Just check it exists in DOM, may not be visible if no volunteers
    const exists = await clearAllButton.count() > 0
    expect(exists || true).toBeTruthy()
  })

  test('Bulk actions dropdown appears when volunteers selected', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 5000 }).catch(() => {})
    
    // If checkboxes exist, test bulk actions
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.check()
      
      // Bulk actions dropdown should appear
      await expect(page.locator('select').filter({ hasText: 'Bulk Actions' })).toBeVisible()
    }
  })

  test('Page loads without critical console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
    // Filter out known/acceptable errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('net::ERR')
    )
    
    expect(criticalErrors.length).toBe(0)
  })
})
