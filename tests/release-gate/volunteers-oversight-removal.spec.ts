import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../login-helper'

test.describe('Release Gate - Volunteers Oversight', () => {
  test('can assign and clear keyman on volunteers page', async ({ page }) => {
    await loginAsAdmin(page)

    const eventsResponse = await page.request.get('/api/events')
    expect(eventsResponse.ok()).toBeTruthy()
    const eventsBody = await eventsResponse.json()
    const events = eventsBody?.data?.events || eventsBody?.events || eventsBody
    expect(Array.isArray(events)).toBeTruthy()

    let eventId: string | null = null
    for (const event of events as any[]) {
      const id = event?.id
      if (!id) continue
      const volunteersResponse = await page.request.get(`/api/events/${id}/volunteers`)
      if (!volunteersResponse.ok()) continue
      const volunteersBody = await volunteersResponse.json()
      const volunteers = volunteersBody?.volunteers || []
      if (Array.isArray(volunteers) && volunteers.length > 0) {
        eventId = id
        break
      }
    }
    test.skip(!eventId, 'No event with volunteers available for this test user/environment')

    await page.goto(`/events/${eventId}/volunteers`)
    await page.waitForLoadState('networkidle')

    const firstRow = page.locator('table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 10000 })

    // Row has two oversight dropdowns: overseer then keyman.
    const keymanSelect = firstRow.locator('select').nth(1)
    await expect(keymanSelect).toBeVisible({ timeout: 10000 })

    const optionCount = await keymanSelect.locator('option').count()
    test.skip(optionCount < 2, 'No keyman options available in this event')

    const assignResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/oversight') && res.request().method() === 'PUT',
      { timeout: 10000 }
    )
    await keymanSelect.selectOption({ index: 1 })
    const assignResponse = await assignResponsePromise
    expect(assignResponse.ok()).toBeTruthy()

    const clearResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/oversight') && res.request().method() === 'PUT',
      { timeout: 10000 }
    )
    await keymanSelect.selectOption('')
    const clearResponse = await clearResponsePromise
    expect(clearResponse.ok()).toBeTruthy()
  })
})
