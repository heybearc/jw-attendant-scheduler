import { test, expect } from '@playwright/test'

test.describe('Phase 1: Volunteers Route Rename', () => {
  const eventId = '7a14c6ac-18c3-4c98-9b07-ba853d30f144'
  
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('#email', 'admin@theoshift.local')
    await page.fill('#password', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events/, { timeout: 10000 })
    console.log('✅ Logged in successfully')
  })

  test('new /volunteers route works', async ({ page }) => {
    console.log('Testing new /volunteers route...')
    
    const response = await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    
    console.log('Response status:', response?.status())
    console.log('Final URL:', page.url())
    
    // Should be 200 OK
    expect(response?.status()).toBe(200)
    
    // Should stay on /volunteers URL
    expect(page.url()).toContain('/volunteers')
    
    // Should have volunteer-related content
    const pageTitle = await page.title()
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    
    // Should not be a 404 page (check title and main heading)
    expect(pageTitle).not.toContain('404')
    expect(pageTitle).not.toContain('Page Not Found')
    
    // Should have volunteers page content
    const hasVolunteerContent = bodyText?.toLowerCase().includes('volunteer') || false
    expect(hasVolunteerContent).toBeTruthy()
    
    console.log('✅ New /volunteers route works correctly')
  })

  test('old /attendants route redirects to /volunteers', async ({ page }) => {
    console.log('Testing old /attendants route redirect...')
    
    const response = await page.goto(`${BASE_URL}/events/${eventId}/attendants`)
    
    console.log('Response status:', response?.status())
    console.log('Final URL:', page.url())
    
    // Should redirect to /volunteers
    await page.waitForURL(/\/volunteers/, { timeout: 5000 })
    expect(page.url()).toContain('/volunteers')
    expect(page.url()).not.toContain('/attendants')
    
    console.log('✅ Old /attendants route redirects correctly')
  })

  test('navigation links point to /volunteers', async ({ page }) => {
    console.log('Testing navigation links...')
    
    // Go to event detail page
    await page.goto(`${BASE_URL}/events/${eventId}`)
    
    // Find the volunteers button
    const volunteersButton = page.locator('a:has-text("Volunteers"), a:has-text("👥")')
    await expect(volunteersButton.first()).toBeVisible()
    
    // Check that it links to /volunteers
    const href = await volunteersButton.first().getAttribute('href')
    console.log('Volunteers button href:', href)
    expect(href).toContain('/volunteers')
    expect(href).not.toContain('/attendants')
    
    // Click it and verify navigation
    await volunteersButton.first().click()
    await page.waitForURL(/\/volunteers/, { timeout: 5000 })
    expect(page.url()).toContain('/volunteers')
    
    console.log('✅ Navigation links work correctly')
  })

  test('volunteers page functionality intact', async ({ page }) => {
    console.log('Testing volunteers page functionality...')
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check for key UI elements
    const hasAddButton = await page.locator('button:has-text("Add"), button:has-text("➕")').count() > 0
    const hasTable = await page.locator('table, [role="table"]').count() > 0
    const hasVolunteerText = await page.textContent('body')
    
    console.log('Has Add button:', hasAddButton)
    console.log('Has table/list:', hasTable)
    console.log('Page contains "volunteer":', hasVolunteerText?.toLowerCase().includes('volunteer'))
    
    // Should have basic functionality elements
    expect(hasAddButton || hasTable).toBeTruthy()
    
    console.log('✅ Volunteers page functionality appears intact')
  })
})
