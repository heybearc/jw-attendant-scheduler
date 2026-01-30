/**
 * Test to reproduce the 404 error on event pages
 * This will help us see the actual error
 */

import { test, expect } from '@playwright/test'
import { getBaseUrl, getTestCredentials } from './helpers/test-config'

const BASE_URL = getBaseUrl()
const credentials = getTestCredentials()


test.describe('Reproduce 404 Error', () => {
  test('access event page and capture 404 details', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]:`, msg.text())
    })
    
    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ ${response.status()} ${response.url()}`)
      }
    })
    
    const eventId = '7a14c6ac-18c3-4c98-9b07-ba853d30f144'
    
    console.log('Step 1: Going to signin page...')
    await page.goto(`${BASE_URL}/auth/signin`)
    
    // Take screenshot of signin page
    await page.screenshot({ path: 'test-results/01-signin-page.png' })
    
    console.log('Step 2: Filling in credentials...')
    // Find the email input - it uses id="email"
    await page.fill('#email', 'admin@theoshift.local')
    await page.fill('#password', 'AdminPass123!')
    
    console.log('Step 3: Submitting login...')
    await page.click('button[type="submit"]')
    
    // Wait for navigation after login
    await page.waitForURL(/\/events|\/admin|\/dashboard/, { timeout: 10000 })
    
    console.log('Step 4: Login successful, current URL:', page.url())
    await page.screenshot({ path: 'test-results/02-after-login.png' })
    
    console.log('Step 5: Navigating to event page...')
    const response = await page.goto(`${BASE_URL}/events/${eventId}`)
    
    console.log('Response status:', response?.status())
    console.log('Final URL:', page.url())
    
    // Take screenshot of result
    await page.screenshot({ path: 'test-results/03-event-page-result.png', fullPage: true })
    
    // Get page content
    const bodyText = await page.textContent('body')
    const pageTitle = await page.title()
    
    console.log('Page title:', pageTitle)
    
    if (bodyText?.includes('404')) {
      console.log('❌ GOT 404 ERROR')
      console.log('Page contains:', bodyText.substring(0, 500))
      
      // Check if it's the Next.js 404 page
      if (bodyText.includes('This page could not be found')) {
        console.log('This is a Next.js 404 page')
      }
      
      // Fail the test to show the issue
      expect(response?.status()).not.toBe(404)
      expect(bodyText).not.toContain('404')
    } else if (bodyText?.includes('Circuit Assembly')) {
      console.log('✅ Event page loaded successfully!')
      console.log('Event name found in page')
    } else {
      console.log('⚠️  Unknown page state')
      console.log('Page content preview:', bodyText?.substring(0, 200))
    }
  })

  test('check if session persists', async ({ page }) => {
    console.log('Testing session persistence...')
    
    // Login
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('#email', 'admin@theoshift.local')
    await page.fill('#password', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events|\/admin/, { timeout: 10000 })
    
    // Get cookies
    const cookies = await page.context().cookies()
    console.log('Cookies after login:', cookies.map(c => c.name).join(', '))
    
    const sessionCookie = cookies.find(c => c.name.includes('session-token'))
    if (sessionCookie) {
      console.log('✅ Session cookie found:', sessionCookie.name)
    } else {
      console.log('❌ No session cookie found!')
    }
    
    // Try to access event page
    await page.goto(`${BASE_URL}/events/7a14c6ac-18c3-4c98-9b07-ba853d30f144`)
    
    console.log('After navigation, URL:', page.url())
    
    if (page.url().includes('/auth/signin')) {
      console.log('❌ Redirected back to signin - session not working')
    } else if (page.url().includes('/events/')) {
      console.log('✅ Stayed on event page - session working')
    }
  })
})
