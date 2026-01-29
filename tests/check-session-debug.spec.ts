/**
 * Test to check what the session actually contains
 */

import { test } from '@playwright/test'

test('check session via debug endpoint', async ({ page, context }) => {
  // Login
  await page.goto('https://blue.theoshift.com/auth/signin')
  await page.fill('#email', 'admin@theoshift.local')
  await page.fill('#password', 'AdminPass123!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/events/, { timeout: 10000 })
  
  console.log('Logged in successfully')
  
  // Get cookies
  const cookies = await context.cookies()
  const sessionCookie = cookies.find(c => c.name.includes('session-token'))
  console.log('Session cookie:', sessionCookie?.name, sessionCookie?.value.substring(0, 50))
  
  // Call debug endpoint
  const response = await page.goto('https://blue.theoshift.com/api/debug-session')
  const data = await response?.json()
  
  console.log('Debug session response:', JSON.stringify(data, null, 2))
  
  if (data.authenticated) {
    console.log('✅ Session is valid')
    console.log('User ID:', data.user?.id)
    console.log('User role:', data.user?.role)
    console.log('User email:', data.user?.email)
  } else {
    console.log('❌ Session is NOT valid')
  }
})
