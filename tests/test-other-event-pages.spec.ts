/**
 * Test if other event pages work to isolate the issue
 */

import { test, expect } from '@playwright/test'

test.describe('Test Other Event Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/signin')
    await page.fill('#email', 'admin@theoshift.local')
    await page.fill('#password', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events|\/admin/, { timeout: 10000 })
  })

  test('check if /events/select works', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/select')
    const title = await page.title()
    console.log('Events select page title:', title)
    
    const bodyText = await page.textContent('body')
    if (bodyText?.includes('404')) {
      console.log('❌ /events/select returns 404')
    } else {
      console.log('✅ /events/select works')
    }
  })

  test('check if /events/[id]/positions works', async ({ page }) => {
    const eventId = '7a14c6ac-18c3-4c98-9b07-ba853d30f144'
    const response = await page.goto(`${BASE_URL}/events/${eventId}/positions`)
    
    console.log('Positions page status:', response?.status())
    console.log('Final URL:', page.url())
    
    const bodyText = await page.textContent('body')
    if (bodyText?.includes('404')) {
      console.log('❌ /events/[id]/positions returns 404')
    } else {
      console.log('✅ /events/[id]/positions works')
    }
  })

  test('check if /events/[id]/attendants works', async ({ page }) => {
    const eventId = '7a14c6ac-18c3-4c98-9b07-ba853d30f144'
    const response = await page.goto(`${BASE_URL}/events/${eventId}/attendants`)
    
    console.log('Attendants page status:', response?.status())
    console.log('Final URL:', page.url())
    
    const bodyText = await page.textContent('body')
    if (bodyText?.includes('404')) {
      console.log('❌ /events/[id]/attendants returns 404')
    } else {
      console.log('✅ /events/[id]/attendants works')
    }
  })
})
