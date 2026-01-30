/**
 * Diagnostic Test: Event Page 404 Issue
 * Simple test to diagnose the actual problem
 */

import { test, expect } from '@playwright/test'

test.describe('Event Page Diagnostic', () => {
  test('check signin page structure', async ({ page }) => {
    await page.goto('${BASE_URL}/auth/signin')
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/signin-page.png', fullPage: true })
    
    // Get page HTML
    const html = await page.content()
    console.log('Signin page loaded')
    
    // Check what form fields exist
    const inputs = await page.locator('input').all()
    console.log(`Found ${inputs.length} input fields`)
    
    for (const input of inputs) {
      const type = await input.getAttribute('type')
      const name = await input.getAttribute('name')
      const id = await input.getAttribute('id')
      console.log(`Input: type=${type}, name=${name}, id=${id}`)
    }
  })

  test('check event page directly without login', async ({ page }) => {
    const eventId = 'ba89b1c7-4790-418f-a4f5-c400931ef28d'
    
    const response = await page.goto(`${BASE_URL}/events/${eventId}`)
    
    console.log(`Response status: ${response?.status()}`)
    console.log(`Final URL: ${page.url()}`)
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/event-page-no-auth.png', fullPage: true })
    
    // Check if redirected
    if (page.url().includes('/auth/signin')) {
      console.log('Redirected to signin (expected)')
    } else if (page.url().includes('/events/')) {
      console.log('Stayed on event page (unexpected - should require auth)')
    } else {
      console.log(`Redirected to: ${page.url()}`)
    }
  })

  test('check event page with cookie auth', async ({ page, context }) => {
    // Try to set auth cookie manually
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-token',
        domain: 'blue.theoshift.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
      }
    ])
    
    const eventId = 'ba89b1c7-4790-418f-a4f5-c400931ef28d'
    const response = await page.goto(`${BASE_URL}/events/${eventId}`)
    
    console.log(`Response status: ${response?.status()}`)
    console.log(`Final URL: ${page.url()}`)
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/event-page-with-cookie.png', fullPage: true })
    
    // Get page content
    const bodyText = await page.textContent('body')
    
    if (bodyText?.includes('404')) {
      console.log('❌ Got 404 error')
    } else if (bodyText?.includes('Regional Convention')) {
      console.log('✅ Event page loaded successfully')
    } else {
      console.log('⚠️ Unknown page state')
    }
  })
})
