import { test, expect } from '@playwright/test'
import { getBaseUrl, getTestCredentials } from './helpers/test-config'

const BASE_URL = getBaseUrl()
const credentials = getTestCredentials()

test('simple event page test', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/auth/signin`)
  await page.fill('#email', 'admin@theoshift.local')
  await page.fill('#password', 'AdminPass123!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/events/, { timeout: 10000 })
  
  console.log('✅ Logged in successfully')
  
  // Navigate to event page
  const eventId = '7a14c6ac-18c3-4c98-9b07-ba853d30f144'
  const response = await page.goto(`${BASE_URL}/events/${eventId}`)
  
  console.log('Response status:', response?.status())
  console.log('Final URL:', page.url())
  
  // Wait a bit for page to load
  await page.waitForTimeout(2000)
  
  // Get page title
  const title = await page.title()
  console.log('Page title:', title)
  
  // Check if it's a 404 page
  const bodyText = await page.textContent('body')
  const is404 = bodyText?.includes('404') || bodyText?.includes('This page could not be found')
  
  if (is404) {
    console.log('❌ Page returned 404')
    console.log('Page content preview:', bodyText?.substring(0, 500))
  } else {
    console.log('✅ Page loaded successfully!')
    // Try to find event name or other content
    const hasEventContent = bodyText?.includes('Circuit Assembly') || bodyText?.includes('Event Details')
    console.log('Has event content:', hasEventContent)
  }
  
  expect(response?.status()).toBe(200)
  expect(is404).toBe(false)
})
