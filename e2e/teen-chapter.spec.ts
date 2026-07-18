import { test, expect } from '@playwright/test'
import { rageTapper, IGNORED_ERRORS } from './personas'

// Public flow — no auth. Exercises the real adaptive/mastery/reteach engine, which is
// the highest-bug-density code and where unit tests can't reach.
const CHAPTER = process.env.E2E_CHAPTER || 'integers'

test('teen chapter mounts (rig proof)', async ({ page }) => {
  await page.goto(`/teen-preview?c=${CHAPTER}`)
  await expect(page.locator('body')).not.toContainText('Unknown chapter')
  await expect(page.locator('button').first()).toBeVisible()
})

test('unknown chapter id is handled, not crashed', async ({ page }) => {
  await page.goto('/teen-preview?c=definitely-not-a-real-chapter')
  await expect(page.locator('body')).toContainText('Unknown chapter')
})

test('rageTapper does not crash the chapter (timer-bleed / double-submit class)', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(`/teen-preview?c=${CHAPTER}`)
  await expect(page.locator('button').first()).toBeVisible()

  for (let round = 0; round < 5; round++) {
    await rageTapper.play(page)
    await page.waitForTimeout(400)
  }

  const real = errors.filter((e) => !IGNORED_ERRORS.test(e))
  expect(real, `Unexpected errors:\n${real.join('\n')}`).toHaveLength(0)
})
