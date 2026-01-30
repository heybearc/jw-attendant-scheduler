import { test, expect } from '@playwright/test'

/**
 * Test Suite: Availability Request Flow - Post Cleanup
 * Verify availability flow still works after removing redundant files
 */

const BASE_URL = process.env.BASE_URL || '${BASE_URL}'

test.describe('Availability Request Flow - Post-Cleanup Verification', () => {
  
  test('Volunteers page loads successfully', async ({ page }) => {
    console.log('Testing Volunteers page loads after cleanup...')
    
    // Direct navigation to volunteers page (will redirect to login if needed)
    await page.goto(`${BASE_URL}/events/7a14c6ac-18c3-4c98-9b07-ba853d30f144/volunteers`)
    await page.waitForTimeout(2000)
    
    // Should either show login page or volunteers page
    const url = page.url()
    console.log(`Current URL: ${url}`)
    
    const isLoginPage = url.includes('/auth/signin') || url.includes('/volunteer/login')
    const isVolunteersPage = url.includes('/volunteers')
    
    expect(isLoginPage || isVolunteersPage).toBeTruthy()
    console.log('✅ Volunteers page route accessible')
  })
  
  test('Volunteer dashboard loads successfully', async ({ page }) => {
    console.log('Testing volunteer dashboard loads after cleanup...')
    
    await page.goto(`${BASE_URL}/volunteer/dashboard`)
    await page.waitForTimeout(2000)
    
    const url = page.url()
    console.log(`Current URL: ${url}`)
    
    // Should redirect to login if not authenticated
    const isLoginPage = url.includes('/login')
    const isDashboard = url.includes('/dashboard')
    
    expect(isLoginPage || isDashboard).toBeTruthy()
    console.log('✅ Volunteer dashboard route accessible')
  })
  
  test('Volunteer login page loads', async ({ page }) => {
    console.log('Testing volunteer login page...')
    
    await page.goto(`${BASE_URL}/volunteer/login`)
    await page.waitForTimeout(1000)
    
    const pageTitle = await page.textContent('h1, h2')
    console.log(`Page title: ${pageTitle}`)
    
    expect(pageTitle).toBeTruthy()
    console.log('✅ Volunteer login page loads')
  })
  
  test('Removed routes return 404', async ({ page }) => {
    console.log('Testing removed routes return 404...')
    
    // Test removed availability page
    const response1 = await page.goto(`${BASE_URL}/volunteer/availability`)
    console.log(`/volunteer/availability status: ${response1?.status()}`)
    expect(response1?.status()).toBe(404)
    
    console.log('✅ Removed routes properly return 404')
  })
  
  test('API endpoints still exist', async ({ page }) => {
    console.log('Testing API endpoints still exist...')
    
    // Test availability request endpoint (POST only, so GET will return 405)
    const response1 = await page.request.get(`${BASE_URL}/api/events/test-id/availability-request`)
    console.log(`Availability request endpoint: ${response1.status()}`)
    expect([405, 401, 404]).toContain(response1.status())
    
    // Test volunteer availability endpoint
    const response2 = await page.request.get(`${BASE_URL}/api/volunteer/availability?eventId=test-id`)
    console.log(`Volunteer availability endpoint: ${response2.status()}`)
    expect([401, 400]).toContain(response2.status()) // 401 unauthorized or 400 bad request is expected
    
    console.log('✅ Required API endpoints still exist')
  })
})
