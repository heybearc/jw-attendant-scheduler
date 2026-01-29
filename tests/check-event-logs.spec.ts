/**
 * Test to trigger the event page and capture server logs
 */

import { test } from '@playwright/test'

test('trigger event page access to see server logs', async ({ page }) => {
  // This test will fail but will trigger server-side logging
  // Check PM2 logs after running this test
  
  const eventId = 'ba89b1c7-4790-418f-a4f5-c400931ef28d'
  
  try {
    await page.goto(`https://blue.theoshift.com/events/${eventId}`, {
      waitUntil: 'networkidle',
      timeout: 5000
    })
  } catch (e) {
    console.log('Page load failed (expected)')
  }
  
  console.log('Check server logs now: ssh blue-theoshift "tail -100 /root/.pm2/logs/theoshift-blue-out-0.log | grep -A10 Error"')
})
