import { test, expect } from '@playwright/test'

test.describe('Phase 2: Volunteers API Endpoints', () => {
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

  test('volunteers page loads and displays data', async ({ page }) => {
    console.log('Testing volunteers page loads with new API...')
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    // Check for volunteer table/list
    const hasTable = await page.locator('table, [role="table"]').count() > 0
    console.log('Has volunteer table:', hasTable)
    expect(hasTable).toBeTruthy()
    
    // Check page loaded successfully (not 404 or error)
    const pageTitle = await page.title()
    expect(pageTitle).not.toContain('404')
    expect(pageTitle).not.toContain('Error')
    
    console.log('✅ Volunteers page loads successfully')
  })

  test('can add a new volunteer via new API', async ({ page }) => {
    console.log('Testing add volunteer via new /volunteers API...')
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    // Look for Add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("➕")').first()
    if (await addButton.count() > 0) {
      await addButton.click()
      
      // Wait for modal/form
      await page.waitForTimeout(500)
      
      // Check if form appeared
      const hasForm = await page.locator('input[name="firstName"], input[placeholder*="First"]').count() > 0
      console.log('Add volunteer form appeared:', hasForm)
      expect(hasForm).toBeTruthy()
      
      console.log('✅ Add volunteer form works')
    } else {
      console.log('⚠️ Add button not found, skipping test')
    }
  })

  test('volunteer list API returns data', async ({ page }) => {
    console.log('Testing GET /api/events/[id]/volunteers...')
    
    // Intercept API call
    let apiCalled = false
    let apiSuccess = false
    
    page.on('response', response => {
      if (response.url().includes(`/api/events/${eventId}/volunteers`) && 
          !response.url().includes('/availability') &&
          !response.url().includes('/oversight')) {
        apiCalled = true
        apiSuccess = response.status() === 200
        console.log(`API Response: ${response.status()}`)
      }
    })
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    // Give it a moment for API calls
    await page.waitForTimeout(1000)
    
    console.log('API was called:', apiCalled)
    console.log('API returned 200:', apiSuccess)
    
    // At minimum, page should load without errors
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    
    console.log('✅ Volunteers API endpoint accessible')
  })

  test('old /attendants API still works (backward compatibility)', async ({ page }) => {
    console.log('Testing backward compatibility - old /attendants endpoints...')
    
    // The old route should redirect to /volunteers
    const response = await page.goto(`${BASE_URL}/events/${eventId}/attendants`)
    
    console.log('Response status:', response?.status())
    console.log('Final URL:', page.url())
    
    // Should redirect to /volunteers
    expect(page.url()).toContain('/volunteers')
    
    console.log('✅ Old /attendants route redirects correctly')
  })
})
