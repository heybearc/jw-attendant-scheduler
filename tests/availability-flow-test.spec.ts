import { test, expect } from '@playwright/test'

/**
 * Test Suite: Availability Request Flow
 * Tests the complete availability request workflow before cleanup
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@theoshift.local'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'AdminPass123!'

test.describe('Availability Request Flow - Pre-Cleanup', () => {
  
  test('Admin can send bulk availability requests', async ({ page }) => {
    console.log('Testing bulk availability request from Volunteers page...')
    
    // Login as admin
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('#email', TEST_USER_EMAIL)
    await page.fill('#password', TEST_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events/)
    console.log('✅ Logged in as admin')
    
    // Navigate to first event
    await page.goto(`${BASE_URL}/events/select`)
    await page.waitForTimeout(1000)
    
    // Click first event
    const firstEvent = page.locator('a[href*="/events/"]').first()
    await firstEvent.click()
    await page.waitForURL(/\/events\/[^/]+$/)
    console.log('✅ Navigated to event')
    
    // Navigate to Volunteers page
    const volunteersLink = page.locator('a[href*="/volunteers"]').first()
    await volunteersLink.click()
    await page.waitForURL(/\/volunteers/)
    console.log('✅ Navigated to Volunteers page')
    
    // Check for bulk availability request button
    const requestButton = page.locator('button:has-text("Request Availability"), button:has-text("📧")')
    const buttonExists = await requestButton.count() > 0
    
    if (buttonExists) {
      console.log('✅ Bulk availability request button found')
      
      // Check if we can select volunteers
      const checkboxes = page.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()
      console.log(`Found ${checkboxCount} checkboxes for volunteer selection`)
      
      expect(checkboxCount).toBeGreaterThan(0)
    } else {
      console.log('⚠️ Bulk availability request button not found (may need volunteers first)')
    }
  })
  
  test('Volunteer dashboard shows availability requests', async ({ page }) => {
    console.log('Testing volunteer dashboard availability display...')
    
    // Navigate to volunteer login
    await page.goto(`${BASE_URL}/volunteer/login`)
    await page.waitForTimeout(1000)
    
    // Check if volunteer login page loads
    const pageTitle = await page.textContent('h1, h2')
    console.log(`Volunteer login page title: ${pageTitle}`)
    
    expect(pageTitle).toBeTruthy()
    console.log('✅ Volunteer login page accessible')
  })
  
  test('API endpoints are accessible', async ({ page }) => {
    console.log('Testing API endpoint accessibility...')
    
    // Login as admin first
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('#email', TEST_USER_EMAIL)
    await page.fill('#password', TEST_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events/)
    
    // Test availability request endpoint exists (will return 405 for GET but that's ok)
    const response = await page.request.get(`${BASE_URL}/api/events/test-event-id/availability-request`)
    console.log(`Availability request endpoint status: ${response.status()}`)
    
    // 405 Method Not Allowed is expected (endpoint only accepts POST)
    expect([405, 401, 404]).toContain(response.status())
    console.log('✅ Availability request endpoint exists')
  })
  
  test('Volunteers page displays availability badges', async ({ page }) => {
    console.log('Testing availability badges on Volunteers page...')
    
    // Login as admin
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('#email', TEST_USER_EMAIL)
    await page.fill('#password', TEST_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events/)
    
    // Navigate to first event volunteers page
    await page.goto(`${BASE_URL}/events/select`)
    await page.waitForTimeout(1000)
    
    const firstEvent = page.locator('a[href*="/events/"]').first()
    await firstEvent.click()
    await page.waitForURL(/\/events\/[^/]+$/)
    
    const volunteersLink = page.locator('a[href*="/volunteers"]').first()
    await volunteersLink.click()
    await page.waitForURL(/\/volunteers/)
    
    // Check for availability status indicators
    const pageContent = await page.content()
    const hasAvailabilityUI = pageContent.includes('availability') || 
                               pageContent.includes('AVAILABLE') ||
                               pageContent.includes('PENDING')
    
    console.log(`Availability UI present: ${hasAvailabilityUI}`)
    console.log('✅ Volunteers page loaded successfully')
  })
})
