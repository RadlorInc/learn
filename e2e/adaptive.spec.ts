import { test, expect } from '@playwright/test'
import { aceKid, strugglerKid, reachPractice } from './personas'

// Correctness-persona specs — activated 2026-07-19 (previously test.fixme; the
// missing piece was reachPractice(), which now lives in personas.ts and polls the
// auto-rolling intro rather than sleeping).
//
// These MUST run against `next dev` on :3017 (the harness default): they read the
// dev-only [data-test-answer]/[data-test-phase] hook, which is dead-code-eliminated
// from every production build.
//
// Demotion after misses is deliberately NOT DOM-observable (the tier is hidden from
// learners) — that behavior is proven in the adaptive-engine unit tests, not here.

const CHAPTER = process.env.E2E_CHAPTER || 'integers'

test('aceKid: consecutive correct answers reach the mastery end-state', async ({ page }) => {
  test.setTimeout(300_000)
  await page.goto(`/teen-preview?c=${CHAPTER}`)
  expect(await reachPractice(page), 'never reached a live board').toBe(true)

  // Answer correctly until the loop ends. Mastery early-exit fires at the top tier
  // on a clean streak, so a perfect run ends BEFORE the full question count; the
  // guided round (if present) is answered first and is unscored.
  let answered = 0
  for (let i = 0; i < 16; i++) {
    const turn = await aceKid.play(page)
    if (turn.phase === null) break // board gone → chapter ended
    expect(turn.acted, `live ${turn.phase} board had no correct choice to tap`).toBe(true)
    answered++
    await page.waitForTimeout(1900) // solved-cue → next board (loadTask fires at 1650ms)
  }
  expect(answered).toBeGreaterThan(0)

  // Mastery end-state: the completion controls render and no further question
  // board exists (the loop ended; a full non-mastery set would also end here, so
  // the early-exit itself is asserted by the engine's unit tests — this spec pins
  // the end-to-end journey and the end screen).
  await expect(page.getByRole('button', { name: /done/i })).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('[data-test-answer]')).toHaveCount(0)
})

test('strugglerKid: a wrong answer warmly reveals the correct one (no punitive UI)', async ({ page }) => {
  test.setTimeout(300_000)
  await page.goto(`/teen-preview?c=${CHAPTER}`)
  expect(await reachPractice(page), 'never reached a live board').toBe(true)

  const turn = await strugglerKid.play(page)
  expect(turn.acted, 'pad had no wrong choice to tap').toBe(true)

  // Wrong answer → warm REVEAL: the board enters the reveal phase and the pad STAYS
  // mounted (correct choice highlighted; no blank stage — the 2026-07-19 fix).
  await expect(page.locator('[data-test-phase="reveal"]')).toBeVisible({ timeout: 5_000 })
  const padButtons = page.locator('button', { hasText: /^[−-]?\d+$/ })
  expect(await padButtons.count(), 'pad vanished on reveal').toBeGreaterThan(0)

  // No punitive UI: math-without-fear means no red ✗ / "Wrong" flash anywhere.
  await expect(page.locator('body')).not.toContainText(/✗|wrong!/i)
})
