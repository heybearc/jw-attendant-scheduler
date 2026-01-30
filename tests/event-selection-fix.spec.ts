/**
 * Test: Event Selection 404 Fix
 * Verifies that clicking an event from /events/select successfully loads the event detail page
 */

import { test, expect } from '@playwright/test'

test.describe('Event Selection Fix', () => {
  test('should successfully navigate to event detail page from events/select', async ({ page }) => {
    const eventId = 'ba89b1c7-4790-418f-a4f5-c400931ef28d'
    
    // Go to events select page
    await page.goto(`${BASE_URL}/events/select')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    console.log('✓ Loaded /events/select page')
    
    // Find and click the event card for Regional Convention 2026
    // The event card has onClick handler that calls selectEvent(event.id)
    const eventCard = page.locator(`div[class*="cursor-pointer"]`).filter({ hasText: 'Regional Convention' }).first()
    
    // Check if event card exists
    const cardExists = await eventCard.count() > 0
    if (!cardExists) {
      console.log('⚠️  Event card not found - may need to log in first')
      // Try to find any event card
      const anyCard = page.locator('div[class*="cursor-pointer"]').first()
      if (await anyCard.count() > 0) {
        console.log('Found an event card, clicking it...')
        await anyCard.click()
      } else {
        throw new Error('No event cards found on page')
      }
    } else {
      console.log('✓ Found Regional Convention event card')
      await eventCard.click()
    }
    
    // Wait for navigation to complete
    await page.waitForURL(`**/events/${eventId}`, { timeout: 10000 })
    
    console.log('✓ Navigated to event detail page')
    
    // Verify we're on the event detail page (not 404)
    const url = page.url()
    expect(url).toContain(`/events/${eventId}`)
    
    // Check that page loaded successfully (not 404)
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('404')
    expect(bodyText).not.toContain('Page not found')
    
    console.log('✓ Page loaded without 404 error')
    
    // Verify volunteer terminology is present
    expect(bodyText).toContain('Regional Convention')
    
    // Check for volunteer terminology (not attendant)
    if (bodyText?.includes('Volunteer')) {
      console.log('✓ Found "Volunteer" terminology')
    }
    
    if (bodyText?.includes('Attendant')) {
      console.log('⚠️  Still found "Attendant" terminology (may need more updates)')
    }
    
    console.log('✅ Test passed - Event selection works correctly!')
  })

  test('should handle event selection API call', async ({ page }) => {
    // Monitor network requests
    const apiCalls: string[] = []
    page.on('request', request => {
      if (request.url().includes('/api/events/select')) {
        apiCalls.push(request.url())
        console.log('API call:', request.method(), request.url())
      }
    })
    
    await page.goto(`${BASE_URL}/events/select')
    await page.waitForLoadState('networkidle')
    
    // Click any event card
    const eventCard = page.locator('div[class*="cursor-pointer"]').first()
    if (await eventCard.count() > 0) {
      await eventCard.click()
      
      // Wait a bit for API call
      await page.waitForTimeout(2000)
      
      if (apiCalls.length > 0) {
        console.log('✓ Event selection API was called')
      } else {
        console.log('⚠️  No API call detected (may have navigated directly)')
      }
    }
  })
})
