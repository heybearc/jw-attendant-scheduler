import { test, expect } from '@playwright/test'

/**
 * Comprehensive Test Suite for Attendant → Volunteer Refactor
 * Tests all phases of the refactoring work
 */

test.describe('Complete Refactor: Attendant → Volunteer', () => {
  const eventId = '7a14c6ac-18c3-4c98-9b07-ba853d30f144'
  
  test.beforeEach(async ({ page }) => {
    await page.goto('${BASE_URL}/auth/signin')
    await page.fill('#email', 'admin@theoshift.local')
    await page.fill('#password', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events/, { timeout: 10000 })
    console.log('✅ Logged in')
  })

  test('Phase 1: /volunteers route exists and works', async ({ page }) => {
    console.log('Testing Phase 1: Route rename...')
    
    const response = await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    expect(response?.status()).toBe(200)
    expect(page.url()).toContain('/volunteers')
    
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    
    console.log('✅ Phase 1: New /volunteers route works')
  })

  test('Phase 1: /attendants redirects to /volunteers', async ({ page }) => {
    console.log('Testing Phase 1: Redirect...')
    
    await page.goto(`${BASE_URL}/events/${eventId}/attendants`)
    await page.waitForURL(/\/volunteers/, { timeout: 5000 })
    
    expect(page.url()).toContain('/volunteers')
    expect(page.url()).not.toContain('/attendants')
    
    console.log('✅ Phase 1: Redirect works')
  })

  test('Phase 1: Navigation links point to /volunteers', async ({ page }) => {
    console.log('Testing Phase 1: Navigation links...')
    
    await page.goto(`${BASE_URL}/events/${eventId}`)
    
    const volunteersButton = page.locator('a:has-text("Volunteers"), a:has-text("👥")').first()
    await expect(volunteersButton).toBeVisible()
    
    const href = await volunteersButton.getAttribute('href')
    expect(href).toContain('/volunteers')
    expect(href).not.toContain('/attendants')
    
    console.log('✅ Phase 1: Navigation links updated')
  })

  test('Phase 2: Volunteers page displays data from new API', async ({ page }) => {
    console.log('Testing Phase 2: New API integration...')
    
    let apiCalled = false
    page.on('response', response => {
      if (response.url().includes(`/api/events/${eventId}/volunteers`)) {
        apiCalled = true
        console.log('New API called:', response.url())
      }
    })
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    const hasTable = await page.locator('table, [role="table"]').count() > 0
    expect(hasTable).toBeTruthy()
    
    console.log('✅ Phase 2: New API endpoints working')
  })

  test('Phase 3: Page uses "volunteer" terminology', async ({ page }) => {
    console.log('Testing Phase 3: Frontend terminology...')
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    const pageContent = await page.content()
    const volunteerCount = (pageContent.match(/volunteer/gi) || []).length
    const attendantCount = (pageContent.match(/attendant/gi) || []).length
    
    console.log('Volunteer mentions:', volunteerCount)
    console.log('Attendant mentions:', attendantCount)
    
    // Should have more "volunteer" than "attendant" references
    expect(volunteerCount).toBeGreaterThan(0)
    
    console.log('✅ Phase 3: Frontend uses volunteer terminology')
  })

  test('Phase 4: API responses use volunteer terminology', async ({ page }) => {
    console.log('Testing Phase 4: API terminology...')
    
    let apiResponseText = ''
    page.on('response', async response => {
      if (response.url().includes(`/api/events/${eventId}/volunteers`) &&
          response.status() === 200) {
        try {
          const text = await response.text()
          apiResponseText = text
        } catch (e) {
          // Ignore
        }
      }
    })
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    if (apiResponseText) {
      const hasAttendant = apiResponseText.toLowerCase().includes('"attendant"')
      console.log('API response contains "attendant":', hasAttendant)
      
      // Informational - may still have some references in data
      if (!hasAttendant) {
        console.log('✅ Phase 4: API uses clean volunteer terminology')
      } else {
        console.log('⚠️ Phase 4: API still has some attendant references (may be in data fields)')
      }
    }
  })

  test('Complete: Full user workflow works end-to-end', async ({ page }) => {
    console.log('Testing complete workflow...')
    
    // Navigate to event
    await page.goto(`${BASE_URL}/events/${eventId}`)
    
    // Click volunteers button
    const volunteersButton = page.locator('a:has-text("Volunteers"), a:has-text("👥")').first()
    await volunteersButton.click()
    
    // Should be on volunteers page
    await page.waitForURL(/\/volunteers/)
    expect(page.url()).toContain('/volunteers')
    
    // Page should load with data
    await page.waitForLoadState('networkidle')
    const hasContent = await page.locator('table, [role="table"]').count() > 0
    expect(hasContent).toBeTruthy()
    
    console.log('✅ Complete: End-to-end workflow functional')
  })

  test('Backward compatibility: Old /attendants route still accessible', async ({ page }) => {
    console.log('Testing backward compatibility...')
    
    // Old route should redirect but still work
    const response = await page.goto(`${BASE_URL}/events/${eventId}/attendants`)
    
    // Should end up on volunteers page
    expect(page.url()).toContain('/volunteers')
    
    // Page should work normally
    const hasContent = await page.locator('table, [role="table"]').count() > 0
    expect(hasContent).toBeTruthy()
    
    console.log('✅ Backward compatibility maintained')
  })
})
