import { test, expect } from '@playwright/test'
import { aceKid, reachPractice, IGNORED_ERRORS } from './personas'

/**
 * THE REPRODUCTION, END TO END, THROUGH THE REAL PORTAL.
 *
 * ⚠️ WHAT WAS BROKEN. `advancePlan` had exactly one caller — `/game`'s `handleComplete` — which
 * reaches a chapter as `ChapterProps.onComplete`. Both registry factories in `ChapterPortal`
 * DISCARD that prop (`function StoryChapter(_props)`; `TeenChapter` reads only `props.childName`),
 * and the portal calls `finishAndSync` itself. So a chapter scored, the session was written, and
 * the plan pointer never moved. Production, three months: 797 `chapter_open`, 40 completed
 * sessions, ZERO `practice_complete`, and 77 of 77 `diagnostic_plan_progress` rows still `todo` —
 * every child who finished their plan's first chapter was handed it again, for ever.
 *
 * ⚠️ WHY IT NEEDS A BROWSER AND NOT A UNIT TEST. The unit was always correct; `activePlan.test.ts`
 * was green throughout. What was wrong was that nothing REACHED it. Only driving a real chapter to
 * completion through the real portal proves the wiring, which is exactly the gap that let this
 * ship. `/teen-preview` mounts the same registry component the menu does.
 *
 * `wordProblems` because it answers on the shell's own AnswerPad, which `aceKid` can drive from
 * `data-test-answer`; the instrument chapters have no generic correct-answer hook.
 */
const LEARNER = { id: 'e2e-plan-learner', display_name: 'Plan', avatar_index: 0, age_group: '9-11' }
const PLAN = ['wordProblems', 'factorsMultiples', 'rounding']

test('completing a plan chapter advances the pointer', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  // Seed the learner + plan exactly as the diagnostic does, BEFORE any app code runs.
  await page.addInitScript(([learner, plan]) => {
    sessionStorage.setItem('milo_active_learner', JSON.stringify(learner))
    localStorage.setItem(`milo_active_plan_${(learner as { id: string }).id}`, JSON.stringify({
      learnerId: (learner as { id: string }).id, band: '9-11',
      chapters: plan, index: 0, startedAt: '2026-01-01T00:00:00.000Z',
    }))
  }, [LEARNER, PLAN] as const)

  await page.goto('/teen-preview?c=wordProblems')

  // ⚠️ `reachPractice` only knows the generic openers (`→`, "I've got it", "Let's try"), and this
  // chapter's start card says "Open the brief" — so it polls the start card until the test times
  // out. Press the card's own primary control first: the largest button in `main` that is not the
  // chrome's Menu. (Same shape as the fix recorded for `all-chapters.spec.ts`, where taking the
  // first visible button walked out to the auth page.)
  const opener = page.locator('main button:not([disabled])').filter({ hasNotText: 'Menu' }).first()
  if (await opener.count()) await opener.click({ timeout: 5000 }).catch(() => {})

  expect(await reachPractice(page, { timeoutMs: 90_000 }), 'never reached a live question board').toBe(true)

  const pointer = () => page.evaluate((id) => {
    const raw = localStorage.getItem(`milo_active_plan_${id}`)
    if (!raw) return null
    const p = JSON.parse(raw) as { index: number; chapters: string[] }
    return { index: p.index, current: p.chapters[p.index] ?? null }
  }, LEARNER.id)

  expect(await pointer(), 'plan should start on its first chapter').toEqual({ index: 0, current: 'wordProblems' })

  // Ace it. The mastery early-exit ends the run well before 10 rounds; the cap is a backstop so a
  // chapter that never completes fails here rather than hanging.
  for (let i = 0; i < 40; i++) {
    const turn = await aceKid.play(page)
    if (!turn.acted) await page.waitForTimeout(400)
    const p = await pointer()
    if (p && p.index > 0) break
    await page.waitForTimeout(150)
  }

  // ⚠️ THE ASSERTION THE WHOLE FILE EXISTS FOR. Before the fix this stayed {0,'wordProblems'}
  // for ever while the session was written and the stars were awarded.
  await expect.poll(pointer, { timeout: 15_000, message: 'the plan pointer never advanced — advanceAfterChapter is not reachable from the completion path' })
    .toEqual({ index: 1, current: 'factorsMultiples' })

  expect(errors.filter((e) => !IGNORED_ERRORS.test(e)), 'console errors during the run').toHaveLength(0)
})
