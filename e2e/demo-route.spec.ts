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
    await put(JSON.stringify({ band: '12-14', done: ['integers', 'signedRationalOps'], startedAt: new Date().toISOString() }))
  })
  await page.reload()

  await expect(page.getByRole('link', { name: /free account/i }),
    'the wall does not offer the account').toBeVisible({ timeout: 15_000 })
  // ⚠️ It must not read as "you ran out" — the honest sentence is what an account BUYS.
  await expect(page.locator('body')).not.toContainText(/used up|run out|no more free|limit reached/i)
  await expect(page.getByRole('button', { name: /Integers/ }), 'a spent demo still offered a chapter').toHaveCount(0)
})
