import { test, expect } from '@playwright/test'
import { aceKid, strugglerKid } from './personas'

// ─────────────────────────────────────────────────────────────────────────────
// Correctness-persona specs — INTENTIONALLY test.fixme (collected + SKIPPED, never
// run, so they can't fail the gate). They DOCUMENT the intended assertions; the
// full intro→walkthrough→practice drive is a later task.
//
// TO UN-FIXME (what's still needed):
//  1. reachPractice(): drive the public /teen-preview?c=integers from mount to the
//     first live practice board. Per handoff.md, the integers flow is:
//       Open the ledger  →  intro auto-rolls (~10s)  →  "I've got it →" (skip
//       walkthrough)  →  "Let's try →"  →  practice. Button labels/paths need to be
//       confirmed against the live dev DOM (they may differ; on the narrow preview,
//       ref clicks miss — click by role/name, not coordinates). Wait on
//       [data-test-phase="practice"] rather than fixed sleeps.
//  2. Mastery end-state selector (aceKid): confirm what the chapter renders on
//     mastery early-exit — a MasteryState / "You solved it" / stars screen. Assert on
//     that, plus that no more [data-test-answer] boards appear (loop ended early,
//     before TOTAL questions). Also: on RESUME at the top tier the guided round is
//     skipped — a second, separately-seeded run would prove guided-skip.
//  3. Wrong-answer behavior (strugglerKid): the "show me how"/showSolve helper is
//     REMOVED (enabled by no chapter). Current behavior on a wrong answer is a warm
//     REVEAL via the QuestionBoard (the correct answer is shown, no red-X/punitive UI),
//     then the loop advances. Assert the reveal (data-test-phase → "solved" / the answer
//     surfaced), NOT a "show me how" button. Demotion (harder→easier) is deliberately
//     hidden from learners, so it's not DOM-observable — prove it in the adaptive engine
//     unit tests, not here.
//  4. The hook is dev-only (dead-code-eliminated in production builds), so these MUST
//     run against `next dev` on :3017 (the harness default) — they read
//     [data-test-answer], which never exists in a deployed DOM.
//
// The personas themselves (aceKid/strugglerKid) ARE real + reviewable now and read
// the live hook; only the end-to-end navigation + end-state assertions are deferred.
// ─────────────────────────────────────────────────────────────────────────────

const CHAPTER = process.env.E2E_CHAPTER || 'integers'

// TODO(un-fixme): implement — mount → practice board. Sketch only.
async function reachPractice(page: import('@playwright/test').Page) {
  await page.goto(`/teen-preview?c=${CHAPTER}`)
  // e.g. await page.getByRole('button', { name: /open the ledger/i }).click()
  //      await page.getByRole('button', { name: /i've got it/i }).click()
  //      await page.getByRole('button', { name: /let's try/i }).click()
  await expect(page.locator('[data-test-phase="practice"]')).toBeVisible()
}

test.fixme('aceKid: consecutive correct answers reach a mastery end-state', async ({ page }) => {
  await reachPractice(page)

  // Answer correctly until the practice loop ends (mastery early-exit fires before
  // the full question count is exhausted).
  for (let i = 0; i < 12; i++) {
    const turn = await aceKid.play(page)
    if (turn.phase === null) break // board gone → chapter ended
    expect(turn.acted).toBe(true) // a live board must have a correct choice to tap
    await page.waitForTimeout(400) // TODO: wait on next board / reveal, not a fixed sleep
  }

  // TODO: assert the mastery end-state (MasteryState / stars screen) is shown and no
  // further [data-test-answer] board renders.
  await expect(page.locator('[data-test-answer]')).toHaveCount(0)
})

test.fixme('strugglerKid: a wrong answer warmly reveals the correct one (no punitive UI)', async ({ page }) => {
  await reachPractice(page)

  const turn = await strugglerKid.play(page)
  expect(turn.acted).toBe(true) // integers pad always has a distractor to tap

  // show-me-how is removed; the expected wrong-answer behavior is a REVEAL via the
  // QuestionBoard. TODO: assert the board enters "solved" (answer surfaced) and that no
  // red-X / punitive element appears. Demotion after 3 misses is not DOM-observable
  // (tier hidden) → assert that in the adaptive engine unit tests, not here.
  await expect(page.locator('[data-test-phase="solved"]')).toBeVisible()
})
