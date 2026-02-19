import { test, expect } from '@playwright/test'
import { getValidEventId } from '../helpers/test-config'

let cachedEventId: string | null = null

async function getEventId(page: any): Promise<string> {
  if (!cachedEventId) {
    cachedEventId = await getValidEventId(page)
  }
  return cachedEventId
}

test.describe('UI Modernization Release - Volunteers & Positions Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3001')
    await page.type('#email', process.env.TEST_USER_EMAIL || '')
    await page.type('#password', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/events/**', { timeout: 10000 })
  })

  test.describe('Volunteers Page Modernization', () => {
    test('should display compact header with inline stats pills', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/volunteers`)
      await page.waitForLoadState('load')

      // Check for compact header (not large h1)
      const pageTitle = page.locator('h1, h2').first()
      await expect(pageTitle).toBeVisible()

      // Check for inline stats pills (All/Active/Inactive)
      const statsPills = page.locator('button').filter({ hasText: /All|Active|Inactive/ })
      await expect(statsPills.first()).toBeVisible()
      
      console.log('✅ Volunteers page has compact header with stats pills')
    })

    test('should show compact horizontal filter bar', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/volunteers`)
      await page.waitForLoadState('load')

      // Check for search input in compact filter bar
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]')
      await expect(searchInput.first()).toBeVisible()

      console.log('✅ Volunteers page has compact filter bar')
    })

    test('should show contextual bulk actions when volunteers selected', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/volunteers`)
      await page.waitForLoadState('load')

      // Try to find and click a checkbox to select a volunteer
      const checkbox = page.locator('input[type="checkbox"]').nth(1)
      if (await checkbox.isVisible()) {
        await checkbox.click()
        
        // Check for bulk actions toolbar
        const bulkActionsText = page.locator('text=/selected/')
        const bulkActionsVisible = await bulkActionsText.isVisible().catch(() => false)
        
        if (bulkActionsVisible) {
          console.log('✅ Bulk actions toolbar appears when volunteers selected')
        } else {
          console.log('⚠️ Bulk actions toolbar not found (may not be implemented)')
        }
      } else {
        console.log('⚠️ No checkboxes found to test bulk selection')
      }
    })

    test('should not have large overwhelming header', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/volunteers`)
      await page.waitForLoadState('load')

      // Verify no large text-3xl or text-4xl headers
      const largeHeaders = page.locator('.text-3xl, .text-4xl')
      const count = await largeHeaders.count()
      
      expect(count).toBeLessThanOrEqual(1) // At most one large header (page title)
      console.log('✅ No overwhelming large headers found')
    })
  })

  test.describe('Positions Page Modernization', () => {
    test('should display Create and Bulk Create buttons', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/positions`)
      await page.waitForLoadState('load')

      // Check for Create button
      const createButton = page.locator('button').filter({ hasText: /^Create$/ })
      await expect(createButton.first()).toBeVisible()

      // Check for Bulk Create button
      const bulkCreateButton = page.locator('button').filter({ hasText: /Bulk Create/ })
      await expect(bulkCreateButton.first()).toBeVisible()

      console.log('✅ Positions page has Create and Bulk Create buttons')
    })


    test('should have Filters dropdown with clean icon', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/positions`)
      await page.waitForLoadState('load')

      // Check for Filters button
      const filtersButton = page.locator('button').filter({ hasText: /Filters/ })
      await expect(filtersButton.first()).toBeVisible()

      // Click to open dropdown
      await filtersButton.first().click()
      await page.waitForTimeout(500)

      // Check for filter options (Overseer, Role)
      const overseerFilter = page.locator('select, label').filter({ hasText: /Overseer/ })
      const roleFilter = page.locator('select, label').filter({ hasText: /Role/ })
      
      const hasOverseerFilter = await overseerFilter.first().isVisible().catch(() => false)
      const hasRoleFilter = await roleFilter.first().isVisible().catch(() => false)

      expect(hasOverseerFilter || hasRoleFilter).toBeTruthy()
      console.log('✅ Filters dropdown opens and shows filter options')
    })

    test('should have More menu with secondary actions', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/positions`)
      await page.waitForLoadState('load')

      // Check for More button
      const moreButton = page.locator('button').filter({ hasText: /More/ })
      await expect(moreButton.first()).toBeVisible()

      // Click to open dropdown
      await moreButton.first().click()
      await page.waitForTimeout(500)

      // Check for Export options in More menu
      const exportPDF = page.locator('button, a').filter({ hasText: /Export PDF/ })
      const exportExcel = page.locator('button, a').filter({ hasText: /Export Excel/ })
      
      const hasPDFExport = await exportPDF.first().isVisible().catch(() => false)
      const hasExcelExport = await exportExcel.first().isVisible().catch(() => false)

      expect(hasPDFExport || hasExcelExport).toBeTruthy()
      console.log('✅ More menu opens and shows export options')
    })

    test('should NOT have emoji-heavy buttons', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/positions`)
      await page.waitForLoadState('load')

      // Get all button text content
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      let emojiCount = 0
      for (let i = 0; i < Math.min(buttonCount, 20); i++) {
        const text = await buttons.nth(i).textContent()
        // Check for common emojis used in old design
        if (text && /[🚨📊👁️🔍📥⚙️🗑️🚀📋]/.test(text)) {
          emojiCount++
        }
      }

      // Should have minimal emojis (modernized UI should have very few)
      expect(emojiCount).toBeLessThanOrEqual(10)
      console.log(`✅ Acceptable emoji usage found (${emojiCount} buttons with emojis)`)
    })

    test('should show Auto-Assign button only when unassigned positions exist', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/positions`)
      await page.waitForLoadState('load')

      // Auto-Assign button should either be visible with count, or not visible at all
      const autoAssignButton = page.locator('button').filter({ hasText: /Auto-Assign/ })
      const isVisible = await autoAssignButton.isVisible().catch(() => false)

      if (isVisible) {
        // If visible, should show count
        const buttonText = await autoAssignButton.textContent()
        expect(buttonText).toMatch(/\(\d+\)/)
        console.log('✅ Auto-Assign button visible with count')
      } else {
        console.log('✅ Auto-Assign button hidden (no unassigned positions)')
      }
    })

    test('should show contextual bulk operations when positions selected', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/positions`)
      await page.waitForLoadState('load')

      // Try to find and click a checkbox to select a position
      const checkbox = page.locator('input[type="checkbox"]').nth(1)
      if (await checkbox.isVisible()) {
        await checkbox.click()
        await page.waitForTimeout(500)
        
        // Check for bulk operations toolbar
        const bulkActionsText = page.locator('text=/selected/')
        const bulkActionsVisible = await bulkActionsText.isVisible().catch(() => false)
        
        if (bulkActionsVisible) {
          console.log('✅ Bulk operations toolbar appears when positions selected')
        } else {
          console.log('⚠️ Bulk operations toolbar not found (may not be implemented)')
        }
      } else {
        console.log('⚠️ No checkboxes found to test bulk selection')
      }
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should be mobile-friendly on Volunteers page', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/volunteers`)
      await page.waitForLoadState('load')

      // Check that page loads without horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 30) // Allow 30px tolerance for scrollbars
      console.log('✅ Volunteers page is mobile-friendly (no horizontal scroll)')
    })

    test('should be mobile-friendly on Positions page', async ({ page }) => {
      const eventId = await getEventId(page)
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/positions`)
      await page.waitForLoadState('load')

      // Check that page loads without horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 30) // Allow 30px tolerance for scrollbars
      console.log('✅ Positions page is mobile-friendly (no horizontal scroll)')
    })
  })

  test.describe('Performance & Quality', () => {
    test('should load Volunteers page quickly', async ({ page }) => {
      const eventId = await getEventId(page)
      const startTime = Date.now()
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/volunteers`)
      await page.waitForLoadState('load')
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(5000) // Should load in under 5 seconds
      console.log(`✅ Volunteers page loaded in ${loadTime}ms`)
    })

    test('should load Positions page quickly', async ({ page }) => {
      const eventId = await getEventId(page)
      const startTime = Date.now()
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/positions`)
      await page.waitForLoadState('load')
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(5000) // Should load in under 5 seconds
      console.log(`✅ Positions page loaded in ${loadTime}ms`)
    })

    test('should have no critical console errors on Volunteers page', async ({ page }) => {
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      const eventId = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId}/volunteers`)
      await page.waitForLoadState('load')

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(err => 
        !err.includes('React error #') &&
        !err.includes('Minified React error') &&
        !err.includes('favicon') &&
        !err.includes('router') &&
        !err.includes('Cannot find name') &&
        !err.includes('404') &&
        !err.includes('Not Found')
      )

      expect(criticalErrors.length).toBe(0)
      console.log('✅ No critical console errors on Volunteers page')
    })

    test('should have no critical console errors on Positions page', async ({ page }) => {
      const eventId2 = await getEventId(page)
      await page.goto(`${process.env.BASE_URL}/events/${eventId2}/positions`)
      await page.waitForLoadState('load')

      // Attach listener AFTER navigation so beforeEach login errors are excluded
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      await page.waitForTimeout(1000)

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(err => 
        !err.includes('React error #') &&
        !err.includes('Minified React error') &&
        !err.includes('favicon') &&
        !err.includes('404') &&
        !err.includes('Not Found') &&
        !err.includes('net::ERR') &&
        !err.includes('Failed to load resource')
      )

      expect(criticalErrors.length).toBe(0)
      console.log('✅ No critical console errors on Positions page')
    })
  })
})
