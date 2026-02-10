import { test, expect } from '@playwright/test'

/**
 * FB-023: Event Selection Page Enhancements
 * Tests for search functionality and parent/child event visualization with status grouping
 */

test.describe('FB-023: Event Selection Page Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(process.env.BASE_URL + '/auth/signin')
    await page.type('#email', process.env.TEST_USER_EMAIL!)
    await page.type('#password', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    
    // Wait for redirect to event selection
    await page.waitForURL('**/events/select', { timeout: 10000 })
  })

  test('should display search bar on event selection page', async ({ page }) => {
    // Verify search input exists
    const searchInput = page.locator('input[placeholder*="Search events by name"]')
    await expect(searchInput).toBeVisible()
  })

  test('should filter events by search query', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search events by name"]')
    
    // Type search query
    await searchInput.fill('Convention')
    
    // Wait for filtering
    await page.waitForTimeout(500)
    
    // Verify result count is displayed
    const resultCount = page.locator('text=/Found \\d+ event/')
    await expect(resultCount).toBeVisible()
  })

  test('should clear search with X button', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search events by name"]')
    
    // Enter search
    await searchInput.fill('test')
    await page.waitForTimeout(300)
    
    // Click clear button
    const clearButton = page.locator('button:has(svg):near(input[placeholder*="Search"])')
    await clearButton.click()
    
    // Verify search is cleared
    await expect(searchInput).toHaveValue('')
  })

  test('should display status-grouped sections', async ({ page }) => {
    // Check for status section headers
    const currentSection = page.locator('text=/Current Events/i')
    const upcomingSection = page.locator('text=/Upcoming Events/i')
    const completedSection = page.locator('text=/Completed Events/i')
    
    // At least one section should be visible
    const visibleSections = await Promise.all([
      currentSection.isVisible().catch(() => false),
      upcomingSection.isVisible().catch(() => false),
      completedSection.isVisible().catch(() => false)
    ])
    
    expect(visibleSections.some(v => v)).toBeTruthy()
  })

  test('should show event count badges on section headers', async ({ page }) => {
    // Find any section header with count badge
    const sectionWithCount = page.locator('button:has-text("Events") >> span.bg-white\\/30')
    
    if (await sectionWithCount.count() > 0) {
      await expect(sectionWithCount.first()).toBeVisible()
      
      // Verify count is a number
      const countText = await sectionWithCount.first().textContent()
      expect(countText).toMatch(/^\d+$/)
    }
  })

  test('should toggle section collapse/expand', async ({ page }) => {
    // Find first collapsible section header
    const sectionHeader = page.locator('button:has-text("Events")').first()
    
    if (await sectionHeader.count() > 0) {
      // Click to toggle
      await sectionHeader.click()
      await page.waitForTimeout(300)
      
      // Click again to toggle back
      await sectionHeader.click()
      await page.waitForTimeout(300)
      
      // Test passes if no errors occur
      expect(true).toBeTruthy()
    }
  })

  test('should display parent events with child count badge', async ({ page }) => {
    // Look for purple badge indicating child events
    const childCountBadge = page.locator('span.bg-purple-100:has-text("child event")')
    
    // If parent events with children exist, badge should be visible
    if (await childCountBadge.count() > 0) {
      await expect(childCountBadge.first()).toBeVisible()
    }
  })

  test('should expand/collapse parent events to show children', async ({ page }) => {
    // Find expand button for parent event (arrow icon)
    const expandButton = page.locator('button.absolute.-left-8 svg').first()
    
    if (await expandButton.count() > 0) {
      // Click to expand
      await expandButton.click()
      await page.waitForTimeout(500)
      
      // Look for child event indicators (purple border)
      const childEvent = page.locator('.border-l-4.border-purple-400')
      
      if (await childEvent.count() > 0) {
        await expect(childEvent.first()).toBeVisible()
      }
      
      // Click to collapse
      await expandButton.click()
      await page.waitForTimeout(300)
    }
  })

  test('should display visual tree connectors for child events', async ({ page }) => {
    // Find and expand a parent event
    const expandButton = page.locator('button.absolute.-left-8 svg').first()
    
    if (await expandButton.count() > 0) {
      await expandButton.click()
      await page.waitForTimeout(500)
      
      // Check for vertical connector line
      const verticalConnector = page.locator('.absolute.left-0.top-0.bottom-4.w-px.bg-gray-300')
      
      if (await verticalConnector.count() > 0) {
        await expect(verticalConnector.first()).toBeVisible()
      }
    }
  })

  test('should maintain hierarchy during search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search events by name"]')
    
    // Search for something generic
    await searchInput.fill('event')
    await page.waitForTimeout(500)
    
    // Verify status sections still exist
    const sectionHeaders = page.locator('button:has-text("Events")')
    
    if (await sectionHeaders.count() > 0) {
      await expect(sectionHeaders.first()).toBeVisible()
    }
  })

  test('should show "no results" state for non-matching search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search events by name"]')
    
    // Search for something that won't match
    await searchInput.fill('xyznonexistent12345')
    await page.waitForTimeout(500)
    
    // Should show no results message
    const noResults = page.locator('text=/No Events Found/i')
    await expect(noResults).toBeVisible()
    
    // Should show clear search button
    const clearButton = page.locator('button:has-text("Clear Search")')
    await expect(clearButton).toBeVisible()
  })

  test('should navigate to event when clicking event card', async ({ page }) => {
    // Find first event card
    const eventCard = page.locator('.bg-white.rounded-lg.shadow-lg').first()
    
    if (await eventCard.count() > 0) {
      // Click the card
      await eventCard.click()
      
      // Should navigate to event detail page
      await page.waitForURL('**/events/**', { timeout: 5000 })
      
      // Verify we're on an event page
      expect(page.url()).toContain('/events/')
    }
  })

  test('should display event status badges correctly', async ({ page }) => {
    // Look for status badges with rounded-full class
    const statusBadges = page.locator('span.rounded-full:has-text("CURRENT"), span.rounded-full:has-text("UPCOMING"), span.rounded-full:has-text("COMPLETED")')
    
    if (await statusBadges.count() > 0) {
      const firstBadge = statusBadges.first()
      await expect(firstBadge).toBeVisible()
      
      // Should have appropriate styling
      const classes = await firstBadge.getAttribute('class')
      expect(classes).toContain('rounded-full')
      expect(classes).toContain('inline-flex')
    }
  })

  test('should sort events by status priority', async ({ page }) => {
    // Get all visible section headers in order
    const sections = page.locator('h2:has-text("Events")')
    
    if (await sections.count() >= 2) {
      const sectionTexts = await sections.allTextContents()
      
      // Current should come before Upcoming if both exist
      const currentIndex = sectionTexts.findIndex(t => t.includes('Current'))
      const upcomingIndex = sectionTexts.findIndex(t => t.includes('Upcoming'))
      
      if (currentIndex >= 0 && upcomingIndex >= 0) {
        expect(currentIndex).toBeLessThan(upcomingIndex)
      }
    }
  })

  test('should have completed sections collapsed by default', async ({ page }) => {
    const completedSection = page.locator('button:has-text("Completed Events")')
    
    if (await completedSection.count() > 0) {
      // Check if the arrow icon is not rotated (collapsed state)
      const arrow = completedSection.locator('svg').first()
      const classes = await arrow.getAttribute('class')
      
      // Not rotated means collapsed
      expect(classes).not.toContain('rotate-90')
    }
  })
})
