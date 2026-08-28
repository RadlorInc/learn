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


/**
 * AND THE SAME THING ON THE OTHER ENGINE.
 *
 * ⚠️ WHY THIS EXISTS SEPARATELY. The storybook drive above proves `SkillBeat`. `GameShell` is a
 * DIFFERENT implementation of the same feature — its own `idx`/`correct`/`wrong`, its own
 * `loadTask` seam, its own start card — and it serves the other ten 9–11 chapters plus all of
 * 12–18. "Same store, same wiring" is an argument, not a measurement, and this repo has lost three
 * months to a unit that was always correct and simply never called.
 *
 * `wordProblems` because it answers on the shared AnswerPad and is NOT an AR chapter — no camera
 * door to consent to, and the pad exposes `data-test-answer` (dev-only, dead-code-eliminated in a
 * production build) so the driver can answer without solving the arithmetic itself.
 */
const TEEN = 'wordProblems'
const TEEN_KEY = 'milo-chres-teen-e2e-wordProblems'

async function teenStored(page: Page) {
  return page.evaluate((key: string) => new Promise<Record<string, unknown> | null>(resolve => {
    const req = indexedDB.open('milo', 1)
    req.onerror = () => resolve(null)
    req.onsuccess = () => {
      const os = req.result.transaction('kv', 'readonly').objectStore('kv')
      const g = os.get(key)
      g.onsuccess = () => resolve(g.result ? JSON.parse(g.result as string) : null)
      g.onerror = () => resolve(null)
    }
  }), TEEN_KEY)
}

/** The "N / M" the shell prints top-right while playing. */
async function teenProgress(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    for (const s of [...document.querySelectorAll('span')]) {
      const t = (s.textContent || '').trim()
      if (/^\d+ \/ \d+$/.test(t)) return t
    }
    return null
  })
}

/**
 * Through the start card and any walkthrough, into the scored run.
 *
 * ⚠️ THE START CARD IS NOT SKIPPED EVEN ON A RESUME, deliberately — it carries `unlockSpeech()` (a
 * real gesture, or the whole run is silent) and, on an AR chapter, BOTH camera doors. So the driver
 * has to press it both times, and that is the behaviour, not a limitation.
 */
async function teenEnterPlay(page: Page) {
  await page.goto(`/teen-preview?c=${TEEN}`)
  await page.waitForTimeout(2500)
  const start = page.locator('button').filter({ hasNotText: /Menu/ }).first()
  if (await start.count()) await start.click({ timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(2500)
  // The walkthrough's quiet skip, when this chapter shows one.
  const gotIt = page.locator('button', { hasText: /got it/ }).first()
  if (await gotIt.count()) { await gotIt.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(2500) }
}

/** Answer the live question correctly, using the shell's dev-only hook. */
async function teenAnswer(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-test-phase]')
    const a = el?.getAttribute('data-test-answer')
    if (!a) return false
    const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim() === a)
    if (!b) return false
    ;(b as HTMLButtonElement).click()
    return true
  })
}

/**
 * Answer the live question WRONG on purpose.
 *
 * ⚠️ WITHOUT ONE OF THESE THE DRIVE CANNOT SEE `wrong` AT ALL. Mutation-tested: seeding it from 0
 * instead of from the stored run survived every assertion, because a run made only of right answers
 * leaves `wrong` at 0 either way — the check agreed with the bug by never disagreeing with anything.
 */
async function teenAnswerWrong(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-test-phase]')
    const a = el?.getAttribute('data-test-answer')
    if (!a) return false
    const b = [...document.querySelectorAll('button')]
      .filter(x => /^\d+$/.test((x.textContent || '').trim()))
      .find(x => (x.textContent || '').trim() !== a)
    if (!b) return false
    ;(b as HTMLButtonElement).click()
    return true
  })
}

test('GameShell resumes its run too, on a 9–11 chapter', async ({ page }) => {
  await seedLearner(page, 'teen-e2e')
  await teenEnterPlay(page)
  expect(await teenProgress(page), 'never reached the scored run').toBe('1 / 10')

  expect(await teenAnswer(page), 'the dev answer hook is gone — this drive cannot answer').toBe(true)
  await page.waitForTimeout(3000)
  expect(await teenAnswer(page), 'could not answer the second question').toBe(true)
  await page.waitForTimeout(3000)
  // One WRONG on purpose, so the run carries a non-zero `wrong` for the resume to preserve.
  expect(await teenAnswerWrong(page), 'could not answer the third question').toBe(true)
  await page.waitForTimeout(4500)
  expect(await teenProgress(page), 'expected to be on question 4').toBe('4 / 10')

  await page.waitForTimeout(800)
  const rec = await teenStored(page)
  expect(rec, 'GameShell stored nothing for this chapter').not.toBeNull()
  expect(rec!.round, 'the stored round is not where the child got to').toBe(3)
  expect(rec!.correct, 'the stored score lost an answer').toBe(2)
  expect(rec!.wrong, 'the stored run forgot the miss').toBe(1)

  await page.goto('/menu')
  await page.waitForTimeout(800)
  await teenEnterPlay(page)
  expect(await teenProgress(page), 'the chapter restarted from question 1 — the whole defect').toBe('4 / 10')

  /**
   * ⚠️ AND THE SCORE HAS TO CONTINUE, NOT JUST THE PLACE — which the round number alone cannot
   * show. Mutation-tested: seeding `correct` from 0 instead of from the stored run SURVIVED every
   * assertion above, because the "3 / 10" a child sees is driven by `idx` and says nothing about
   * what they have got right. So answer one more and read the ledger: 2 carried over plus 1 is 3.
   * With the score reset it stores 1, and this is the only line that notices.
   */
  expect(await teenAnswer(page), 'could not answer after resuming').toBe(true)
  await page.waitForTimeout(3000)
  const after = await teenStored(page)
  expect(after, 'nothing was stored after resuming').not.toBeNull()
  expect(after!.correct, 'the score restarted at zero on the way back in').toBe(3)
  expect(after!.wrong, 'the miss was forgotten on the way back in').toBe(1)
  expect(after!.round, 'the round did not advance after resuming').toBe(4)
})

/** The same positive control: no learner, nothing stored, back to question 1. */
test('GameShell with no learner stores nothing and restarts', async ({ page }) => {
  await teenEnterPlay(page)
  expect(await teenProgress(page)).toBe('1 / 10')
  expect(await teenAnswer(page)).toBe(true)
  await page.waitForTimeout(3000)
  await page.waitForTimeout(800)
  expect(await teenStored(page), 'a run was stored against no learner').toBeNull()
  await page.goto('/menu')
  await teenEnterPlay(page)
  expect(await teenProgress(page), 'a chapter with no learner resumed from somewhere').toBe('1 / 10')
})
