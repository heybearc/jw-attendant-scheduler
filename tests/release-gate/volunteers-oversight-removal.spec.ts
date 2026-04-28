import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../login-helper'

test.describe('Release Gate - Volunteers Oversight', () => {
  test('can assign and clear keyman on volunteers page', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    const eventLink = page
      .locator('a[href^="/events/"]')
      .filter({ hasNotText: 'Create Event' })
      .first()

    await expect(eventLink).toBeVisible({ timeout: 10000 })
    const href = await eventLink.getAttribute('href')
    expect(href).toBeTruthy()

    const eventId = href!.split('/')[2]
    expect(eventId).toBeTruthy()

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
