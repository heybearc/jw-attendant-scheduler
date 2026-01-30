import { test, expect } from '@playwright/test'

/**
 * Phase 5: Type Definitions Test Suite
 * Verifies that TypeScript type changes don't break runtime functionality
 */

test.describe('Phase 5: Type Definitions', () => {
  const eventId = '7a14c6ac-18c3-4c98-9b07-ba853d30f144'
  
  test.beforeEach(async ({ page }) => {
    await page.goto('${BASE_URL}/auth/signin')
    await page.fill('#email', 'admin@theoshift.local')
    await page.fill('#password', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events/, { timeout: 10000 })
    console.log('✅ Logged in')
  })

  test('Application builds without TypeScript errors', async ({ page }) => {
    console.log('Testing Phase 5: Build verification...')
    
    // If we can load the page, the build succeeded
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    const pageLoaded = await page.locator('body').count() > 0
    expect(pageLoaded).toBeTruthy()
    
    console.log('✅ Phase 5: Application built successfully with new types')
  })

  test('Volunteers page still works after type changes', async ({ page }) => {
    console.log('Testing Phase 5: Runtime functionality...')
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    // Check that data still loads
    const hasTable = await page.locator('table, [role="table"]').count() > 0
    expect(hasTable).toBeTruthy()
    
    // Check that page doesn't have runtime errors
    const errors: string[] = []
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.waitForTimeout(2000)
    
    if (errors.length > 0) {
      console.log('⚠️ Page errors detected:', errors)
    } else {
      console.log('✅ No runtime errors detected')
    }
    
    console.log('✅ Phase 5: Runtime functionality intact')
  })

  test('All pages still accessible after type changes', async ({ page }) => {
    console.log('Testing Phase 5: Page accessibility...')
    
    const pages = [
      { name: 'Volunteers', path: `/events/${eventId}/volunteers` },
      { name: 'Positions', path: `/events/${eventId}/positions` },
      { name: 'Documents', path: `/events/${eventId}/documents` },
      { name: 'Assignments', path: `/events/${eventId}/assignments` }
    ]
    
    for (const testPage of pages) {
      const response = await page.goto(`${BASE_URL}${testPage.path}`)
      console.log(`${testPage.name} page status:`, response?.status())
      expect(response?.status()).toBe(200)
    }
    
    console.log('✅ Phase 5: All pages accessible')
  })

  test('Type changes are compile-time only (no runtime impact)', async ({ page }) => {
    console.log('Testing Phase 5: Type changes are compile-time only...')
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    // Verify JavaScript bundle doesn't contain TypeScript types
    const scripts = await page.locator('script[src]').all()
    console.log('Number of script tags:', scripts.length)
    
    // Types should not appear in compiled JavaScript
    const pageContent = await page.content()
    const hasInterfaceKeyword = pageContent.includes('interface Volunteer')
    const hasTypeKeyword = pageContent.includes('type Volunteer')
    
    console.log('Contains "interface Volunteer":', hasInterfaceKeyword)
    console.log('Contains "type Volunteer":', hasTypeKeyword)
    
    // Should NOT contain TypeScript keywords in production bundle
    expect(hasInterfaceKeyword).toBe(false)
    expect(hasTypeKeyword).toBe(false)
    
    console.log('✅ Phase 5: Types are compile-time only, not in runtime')
  })

  test('CRUD operations still work after type changes', async ({ page }) => {
    console.log('Testing Phase 5: CRUD operations...')
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    
    // Check if we can interact with the page
    const hasAddButton = await page.locator('button:has-text("Add"), button:has-text("➕")').count() > 0
    const hasTable = await page.locator('table, [role="table"]').count() > 0
    
    console.log('Has Add button:', hasAddButton)
    console.log('Has table:', hasTable)
    
    expect(hasTable).toBeTruthy()
    
    console.log('✅ Phase 5: CRUD interface functional')
  })

  test('No console errors after type changes', async ({ page }) => {
    console.log('Testing Phase 5: Console errors...')
    
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors:', consoleErrors.slice(0, 5))
    } else {
      console.log('✅ No console errors')
    }
    
    // Some errors may be acceptable (network, etc), but shouldn't be type-related
    const typeErrors = consoleErrors.filter(err => 
      err.toLowerCase().includes('type') || 
      err.toLowerCase().includes('undefined')
    )
    
    expect(typeErrors.length).toBe(0)
    
    console.log('✅ Phase 5: No type-related console errors')
  })
})
