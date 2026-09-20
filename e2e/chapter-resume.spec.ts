import { test, expect, Page } from '@playwright/test'
import { seedSession, seedLearner } from './session'

/**
 * COMING BACK MID-CHAPTER KEEPS THE PLACE **AND** THE SCORE.
 *
 * Reported by a student, 2026-08-27: *"Mid game, i left to go visit another part of the website.
 * When I came back, none of my progress saved and I had to restart."* It was worse than the place:
 * `SkillBeat` reports ONCE, at the end, and that single `onComplete` is what writes the session row,
 * the stars and the XP — so leaving after seven of ten questions threw the seven answers away too.
 *
 * ⚠️ WHY THIS HAS TO BE AN E2E AND NOT A UNIT TEST. The store round-trips in vitest and the wiring
 * is source-gated, and neither can see the one thing that matters: whether a real chapter, in a real
 * browser, actually comes back where it was. A unit test calls the store itself; a source check
 * reads the caller. This repo has lost three months to exactly that gap once already — `advancePlan`
 * had six passing tests and no live caller.
 *
 * ⚠️ AND IT NEEDS A LEARNER, NOT JUST A SESSION. Every per-child store keys on `getActiveLearner()`,
 * which is null on the logged-out `/story` previews — so without `seedLearner` this spec would drive
 * a chapter that stores nothing and pass on an app with the whole feature deleted. That is the
 * control below.
 */
const CH = 'numbers'          // NumberTown: three tappable doors, retry-in-place, a visible counter

/**
 * ⚠️ THE SEEDING IS PER TEST, NOT SHARED, BECAUSE THE LEARNER IS THE ONLY DIFFERENCE BETWEEN THEM.
 * Put `seedLearner` in a `beforeEach` and the control below stops being a control.
 */
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await seedSession(page)
})

/** The round number SkillBeat prints in the top-right corner. */
async function roundShown(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    for (const e of [...document.querySelectorAll('div')]) {
      if (e.children.length) continue
      const t = (e.textContent || '').trim()
      if (!/^\d{1,2}$/.test(t)) continue
      const r = e.getBoundingClientRect()
      if (r.top < 70 && r.right > window.innerWidth - 90) return parseInt(t, 10)
    }
    return null
  })
}

/** What the app actually stored for this chapter, read from IndexedDB the way the app writes it. */
async function stored(page: Page) {
  return page.evaluate(() => new Promise<Record<string, unknown> | null>(resolve => {
    const req = indexedDB.open('milo', 1)
    req.onerror = () => resolve(null)
    req.onsuccess = () => {
      const db = req.result
      const os = db.transaction('kv', 'readonly').objectStore('kv')
      const g = os.get('milo-chres-e2e-learner-1-numbersTo100')
      g.onsuccess = () => resolve(g.result ? JSON.parse(g.result as string) : null)
      g.onerror = () => resolve(null)
    }
  }))
}

/** Enter the chapter's scored practice, picking a world on the way if it has a picker. */
async function enterPractice(page: Page) {
  await page.goto(`/story?ch=${CH}&e2e=practice`)
  await page.waitForTimeout(1200)
  const card = page.locator('button', { hasText: /Tap to explore/ }).first()
  if (await card.count()) { await card.click(); await page.waitForTimeout(1200) }
}

/**
 * Answer the live round however it takes — the target is SPOKEN and never written, so this tries the
 * doors in turn and commits until the round counter moves on. Retry-in-place makes that safe.
 *
 * ⚠️ IT ROTATES, AND THAT IS THE WHOLE HELPER. Clicking the FIRST numeric door every time is a
 * deterministic dead end: a wrong first door is chosen, committed, marked wrong, and then chosen
 * again on the next pass, for ever. It passed once by luck — the first door happened to be the
 * answer — which is the worst way for a driver to be wrong, because the green looks earned.
 */
async function clearOneRound(page: Page, from: number) {
  for (let i = 0; i < 12; i++) {
    const doors = []
    for (const d of await page.locator('button:not([disabled])').all()) {
      const t = (await d.innerText().catch(() => '')).trim()
      if (/^\d{1,3}$/.test(t)) doors.push(d)
    }
    if (doors.length) await doors[i % doors.length].click({ timeout: 1000 }).catch(() => {})
    await page.waitForTimeout(300)
    const ready = page.locator('button', { hasText: /^Ready/ }).first()
    if (await ready.count()) await ready.click({ timeout: 1000 }).catch(() => {})
    await page.waitForTimeout(1500)
    if ((await roundShown(page) ?? from) > from) return true
  }
  return false
}

test('comes back to the round it was on, with the score intact', async ({ page }) => {
  await seedLearner(page)
  await enterPractice(page)
  expect(await roundShown(page), 'never reached a scored round').toBe(1)

  expect(await clearOneRound(page, 1), 'could not finish round 1').toBe(true)
  expect(await clearOneRound(page, 2), 'could not finish round 2').toBe(true)
  const before = await roundShown(page)
  expect(before, 'expected to be on round 3').toBe(3)

  // The write is IndexedDB and asynchronous; a child closing a tab is not, which is why it happens
  // per answer rather than on the way out. Give it a moment before pulling the rug.
  await page.waitForTimeout(800)
  const rec = await stored(page)
  expect(rec, 'nothing was stored for this chapter at all').not.toBeNull()
  expect(rec!.round, 'the stored round is not where the child got to').toBe(2)
  expect((rec!.correct as number) + (rec!.wrong as number), 'the stored score lost an answer').toBe(2)

  // Leave, as the student did, and come back.
  await page.goto('/menu')
  await page.waitForTimeout(600)
  await enterPractice(page)

  expect(await roundShown(page), 'the chapter restarted from question 1 — the whole defect').toBe(before)
})

/**
 * ⚠️ THE POSITIVE CONTROL. Without a learner every per-child store no-ops, so the spec above must be
 * able to tell "it resumed" from "there was nothing to resume". Same drive, no learner: it has to
 * come back at round 1 and store nothing — if this ever goes green alongside the test above, one of
 * them is measuring something other than the resume.
 */
test('with no learner it stores nothing and restarts, exactly as before', async ({ page }) => {
  // Same drive, same viewport, same session — only `seedLearner` is missing.
  await enterPractice(page)
  expect(await roundShown(page)).toBe(1)
  expect(await clearOneRound(page, 1), 'could not finish round 1').toBe(true)
  await page.waitForTimeout(800)
  expect(await stored(page), 'a logged-out visitor had a run stored against them').toBeNull()
  await page.goto('/menu')
  await enterPractice(page)
  expect(await roundShown(page), 'a chapter with no learner resumed from somewhere').toBe(1)
})
