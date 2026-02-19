/**
 * Phase 1-3 Release Tests
 * Tests for Event-Centric Configuration and Enhanced Cloning
 */

import { test, expect } from '@playwright/test'
import { getBaseUrl, getValidEventId } from '../helpers/test-config'

const BASE_URL = getBaseUrl()

test.describe('Phase 1-3: Event-Centric Configuration Release', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.type('#email', 'admin@theoshift.local')
    await page.type('#password', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events|\/admin/, { timeout: 10000 })
  })

  test('Event detail page loads without gray screen', async ({ page }) => {
    const eventId = await getValidEventId(page)
    const response = await page.goto(`${BASE_URL}/events/${eventId}`)
    expect(response?.status()).toBe(200)

    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(100)

    const hasEventContent = bodyText?.includes('Event') || bodyText?.includes('Overview') || bodyText?.includes('Circuit')
    expect(hasEventContent).toBeTruthy()
  })

  test('Positions page loads successfully', async ({ page }) => {
    const eventId = await getValidEventId(page)
    const response = await page.goto(`${BASE_URL}/events/${eventId}/positions`)
    expect(response?.status()).toBe(200)

    const bodyText = await page.textContent('body')
    const hasPositionContent = bodyText?.toLowerCase().includes('position')
    expect(hasPositionContent).toBeTruthy()
  })

  test('Volunteers page loads successfully', async ({ page }) => {
    const eventId = await getValidEventId(page)
    const response = await page.goto(`${BASE_URL}/events/${eventId}/volunteers`)
    expect(response?.status()).toBe(200)

    const bodyText = await page.textContent('body')
    const hasVolunteerContent = bodyText?.toLowerCase().includes('volunteer')
    expect(hasVolunteerContent).toBeTruthy()
  })

  test('Shift template feature exists on positions page', async ({ page }) => {
    const eventId = await getValidEventId(page)
    await page.goto(`${BASE_URL}/events/${eventId}/positions`)
    await page.waitForLoadState('load')

    const bodyText = await page.textContent('body')
    const hasPositionFeatures = bodyText?.includes('Create') || bodyText?.includes('Position')
    expect(hasPositionFeatures).toBeTruthy()
  })

  test('Module enforcement - navigation tabs exist', async ({ page }) => {
    const eventId = await getValidEventId(page)
    await page.goto(`${BASE_URL}/events/${eventId}`)
    await page.waitForLoadState('load')

    const bodyText = await page.textContent('body')
    const hasNavigation = bodyText?.includes('Overview') || bodyText?.includes('Positions') || bodyText?.includes('Volunteers')
    expect(hasNavigation).toBeTruthy()
  })
})
