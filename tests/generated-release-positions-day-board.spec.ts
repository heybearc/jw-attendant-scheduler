/**
 * Generated release tests for Positions day-board redesign (v4.32.x candidate).
 * Covers BASE_REV v4.31.0..HEAD behavior: preview entry, day board, collapse UX.
 */
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './login-helper'
import { getBaseUrl, getValidEventId } from './helpers/test-config'

const BASE_URL = getBaseUrl()

let cachedEventId: string | null = null

async function getEventId(page: import('@playwright/test').Page): Promise<string> {
  if (!cachedEventId) {
    cachedEventId = await getValidEventId(page)
  }
  return cachedEventId
}

test.describe('Generated release — Positions day board', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('classic Positions offers Try new layout preview link', async ({ page }) => {
    const eventId = await getEventId(page)
    await page.goto(`${BASE_URL}/events/${eventId}/positions`)
    await page.waitForLoadState('domcontentloaded')

    const tryNew = page.getByRole('link', { name: /Try new layout/i })
    await expect(tryNew).toBeVisible({ timeout: 15000 })
    await expect(tryNew).toHaveAttribute('href', new RegExp(`/events/${eventId}/positions-next`))
  })

  test('positions-next loads day board with redesign chrome', async ({ page }) => {
    const eventId = await getEventId(page)
    await page.goto(`${BASE_URL}/events/${eventId}/positions-next`)
    await page.waitForLoadState('domcontentloaded')

    await expect(
      page.getByText(/Positions redesign preview|Stations by day/i).first()
    ).toBeVisible({ timeout: 15000 })

    await expect(page.getByRole('link', { name: /Back to classic/i })).toBeVisible()

    await expect(page.getByText(/Underfilled only/i).first()).toBeVisible()
  })

  test('day board exposes underfilled filter and expand controls when stations exist', async ({
    page,
  }) => {
    const eventId = await getEventId(page)
    await page.goto(`${BASE_URL}/events/${eventId}/positions-next`)
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByText(/Underfilled only/i).first()).toBeVisible({
      timeout: 15000,
    })

    const emptyState = page.getByText(/No shifts for this day/i)
    const expandAll = page.getByRole('button', { name: /Expand all/i })

    if (await expandAll.isVisible().catch(() => false)) {
      await expandAll.click()
      await expect(page.getByRole('button', { name: /Collapse filled/i })).toBeVisible()
    } else {
      await expect(emptyState.or(page.locator('section')).first()).toBeVisible()
    }
  })

  test('day board Actions or Create control is available to managers', async ({ page }) => {
    const eventId = await getEventId(page)
    await page.goto(`${BASE_URL}/events/${eventId}/positions-next`)
    await page.waitForLoadState('domcontentloaded')

    const actions = page.getByLabel('Actions')
    const createBtn = page.getByRole('button', { name: /^Create$/ })

    const hasActions = await actions.isVisible().catch(() => false)
    const hasCreate = await createBtn.first().isVisible().catch(() => false)

    expect(hasActions || hasCreate).toBeTruthy()
  })
})
