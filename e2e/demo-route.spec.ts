import { test, expect } from '@playwright/test'
import { aceKid, reachPractice } from './personas'

/**
 * /demo — try two chapters, then the account.
 *
 * ⚠️⚠️ WHAT THIS SPEC EXISTS FOR IS THE COMPLETION CALLBACK, AND NOTHING ELSE CAN SEE IT. The unit
 * tests drive `completeDemoChapter` directly; the source gate checks the page mentions it. Neither
 * can tell whether the CHAPTER ever calls the `onComplete` it is handed — and `/teen-preview` right
 * next door passes a no-op, so the shape is one keystroke away at all times. This repo lost three
 * months to exactly that (`ChapterPortal` discarding `onComplete`, no child's plan advancing), and
 * the only instrument that catches it is playing a real chapter to its end.
 *
 * ⚠️ MUST run against `next dev` (the harness default): it reads the dev-only [data-test-answer]
 * hook, which is dead-code-eliminated from production builds.
 */
test('a demo chapter played to the end advances the demo', async ({ page }) => {
  test.setTimeout(300_000)

  await page.goto('/demo')
  await page.getByRole('button', { name: /Ages 12–14/ }).click()

  // The band picker hands over to the first chapter of that band's grade-start plan.
  await expect(page.getByText(/Chapter 1 of 2/)).toBeVisible()
  const first = page.getByRole('button', { name: /Integers/ })
  await expect(first, 'the demo offered no chapter to play').toBeVisible()
  await first.click()

  /**
   * ⚠️ WAIT FOR THE CHAPTER TO BE ON SCREEN BEFORE HANDING OVER. Chapters are `lazy()`-loaded, so on
   * a cold `next dev` the compile can outlast the demo screen — and `reachPractice` opens by
   * clicking the first button whose label ends in an arrow, which on the demo screen is the button
   * we just clicked. Handing over mid-transition made this spec fail on the first run after a server
   * start and pass on every one after: a coin-flip gate, which gets re-run instead of read.
   */
  await expect(page.getByText(/Chapter 1 of 2/), 'the chapter never replaced the demo screen')
    .toHaveCount(0, { timeout: 90_000 })

  expect(await reachPractice(page), 'never reached a live board').toBe(true)
  for (let i = 0; i < 24; i++) {
    const turn = await aceKid.play(page)
    if (turn.phase === null) break
    await page.waitForTimeout(1900)   // solved-cue → next board (loadTask fires at 1650ms)
  }

  /**
   * ⚠️ THE CHAPTER'S OWN END SCREEN IS NOT THE ASSERTION. A chapter that finishes and never calls
   * back looks identical here — same "Done", same cleared board — which is precisely how a discarded
   * callback survives. The claim is that the DEMO moved on, so assert the demo's own screen.
   */
  const done = page.getByRole('button', { name: /done/i })
  if (await done.count()) await done.first().click()

  await expect(page.getByText(/Chapter 2 of 2|that's two done/i),
    'the chapter ended but the demo did not advance — onComplete never reached it')
    .toBeVisible({ timeout: 30_000 })
})

test('the wall appears after the cap, and sells the account', async ({ page }) => {
  // Drive the state rather than playing two full chapters: this spec is about the WALL, and the
  // callback that fills the record is proven above. Seeded through the app's own kv so a change to
  // where the run is stored fails here rather than silently passing.
  await page.goto('/demo')
  await page.evaluate(async () => {
    const put = (v: string) => new Promise(res => {
      const r = indexedDB.open('milo', 1)
      r.onsuccess = () => { const tx = r.result.transaction('kv', 'readwrite')
        tx.objectStore('kv').put(v, 'milo-demo-run'); tx.oncomplete = () => res(null) }
    })
    // ⚠️ THE REAL SHAPE, not a hand-rolled approximation of it. This seed carried `done: string[]`
    // after the record moved to `results: DemoResult[]`, and `readDemo`'s shape guard correctly
    // rejected it — the spec went red on working code. A seeded fixture is a second copy of the
    // schema; when it drifts, the gate reports on a state the app can never be in.
    await put(JSON.stringify({
      band: '12-14',
      results: [
        { chapter: 'integers', correct: 8, wrong: 2, mastered: false },
        { chapter: 'signedRationalOps', correct: 10, wrong: 0, mastered: true },
      ],
      startedAt: new Date().toISOString(),
    }))
  })
  await page.reload()

  await expect(page.getByRole('link', { name: /free account/i }),
    'the wall does not offer the account').toBeVisible({ timeout: 15_000 })
  // ⚠️ It must not read as "you ran out" — the honest sentence is what an account BUYS.
  await expect(page.locator('body')).not.toContainText(/used up|run out|no more free|limit reached/i)
  await expect(page.getByRole('button', { name: /Integers/ }), 'a spent demo still offered a chapter').toHaveCount(0)
})

test('abandoning a chapter returns to the demo, not a login wall', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/demo')
  await page.getByRole('button', { name: /Ages 12–14/ }).click()
  await page.getByRole('button', { name: /Integers/ }).click()

  // ⚠️ THE MAIN EXIT, NOT AN EDGE CASE. Most visitors who open a chapter look, poke and leave —
  // finishing is the rarer path. Untouched, the chapter's back button goes to /menu, which bounces
  // a logged-out parent to /auth: a login wall at the moment we were trying to earn the right to
  // ask for one.
  const back = page.getByRole('button', { name: /Menu/i }).first()
  await back.waitFor({ state: 'visible', timeout: 30_000 })
  await back.click()

  await expect(page.getByText(/Chapter 1 of 2/),
    'abandoning left the demo — the chapter is unplayed and should still be offered')
    .toBeVisible({ timeout: 15_000 })
  expect(page.url(), 'a logged-out visitor was dropped on the auth page').not.toContain('/auth')
})
