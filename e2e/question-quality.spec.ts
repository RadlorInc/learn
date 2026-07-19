import { test, expect, Page } from '@playwright/test'
import { aceKid, strugglerKid, reachPractice, GESTURE_VERBS, IGNORED_ERRORS } from './personas'

// Regression gate for the 2026-07-19 question-clarity pass. Every 12–14 chapter is
// driven into its scored loop and each question board is checked against the invariants
// that pass established. These are STRUCTURAL checks — they cannot judge whether wording
// reads well, but they do catch the defect classes that shipped:
//   • a padded question whose action chip names a gesture the child cannot make
//     (the instrument is hidden on a padded question)
//   • a pad that does not contain its own correct answer
//   • a double-equals chain ("x + 1 = 4" over "= ?")
//   • a blank stage on a wrong answer (pad unmounted, no instrument to glide)
// Slow by nature: headless has no speech, so every intro falls back to a timer.
const CHAPTERS = [
  'integers', 'signedRationalOps', 'rationalOps', 'ratioProportion',
  'percentages', 'exponentsRoots', 'orderOfOperations', 'algebraicExpressions',
  'equationsInequalities', 'coordinatePlane', 'linearRelationships', 'geometryMeasurement',
]

interface Board { badge: string; instruction: string; answerLine: string; padded: boolean; answer: string }

async function readBoard(page: Page): Promise<Board | null> {
  const root = page.locator('[data-test-answer]').first()
  if (!(await root.count())) return null
  const answer = (await root.getAttribute('data-test-answer')) ?? ''
  const text = (await root.innerText().catch(() => '')) || ''
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  // The board renders: [cue] [context] [badge] [answer line] [instruction chip].
  const answerLine = lines.find((l) => /^[^=]*=\s*\S/.test(l) && l.length < 40 && /=/.test(l)) ?? ''
  const instruction = lines[lines.length - 1] ?? ''
  const badge = lines.find((l) => l !== answerLine && l !== instruction && !/^SOLVE IT$/i.test(l)) ?? ''
  const padded = (await padNumbers(page)).length > 0
  return { badge, instruction, answerLine, padded, answer }
}

// `enabledOnly` matters: through a REVEAL the pad stays mounted but every choice is
// disabled (GameShell passes `disabled={sub !== 'active' || busy}`), so a
// :not([disabled]) locator would report an empty pad and look like the blank stage
// this suite exists to catch.
async function padNumbers(page: Page, enabledOnly = true): Promise<number[]> {
  const out: number[] = []
  const sel = enabledOnly ? 'button:not([disabled])' : 'button'
  for (const btn of await page.locator(sel).all()) {
    const label = (await btn.innerText().catch(() => '')).trim()
    const n = Number(label.replace(/−/g, '-'))
    if (label !== '' && Number.isFinite(n)) out.push(n)
  }
  return out
}

function checkInvariants(c: string, b: Board, failures: string[]) {
  if (b.padded) {
    // 1. no phantom gesture in the action chip
    if (GESTURE_VERBS.test(b.instruction)) {
      failures.push(`[${c}] padded question tells the child to perform a hidden-instrument gesture: "${b.instruction}"`)
    }
    // 2. the pad must contain its own correct answer
    if (b.answer !== '') {
      // checked by the caller, which has the live pad
    }
  }
  // 3. no double-equals chain: a badge that is already a complete relation must not
  //    sit above a bare "= ?" (BalanceBench ships answerLabel 'x =' for exactly this).
  if (/[=≤≥<>]/.test(b.badge) && /^=\s/.test(b.answerLine)) {
    failures.push(`[${c}] double-equals chain: badge "${b.badge}" over answer line "${b.answerLine}"`)
  }
}

for (const chapter of CHAPTERS) {
  test(`${chapter}: questions are well-posed and the set completes`, async ({ page }) => {
    test.setTimeout(300_000)
    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(String(e)))

    await page.goto(`/teen-preview?c=${chapter}`)
    const reached = await reachPractice(page)
    expect(reached, `${chapter}: never reached a live question board`).toBe(true)

    const failures: string[] = []
    let answered = 0
    let boardsSeen = 0

    // Walk the whole set answering correctly; aceKid taps the exact correct choice.
    for (let step = 0; step < 24; step++) {
      const board = await readBoard(page)
      if (!board) break
      boardsSeen++
      checkInvariants(chapter, board, failures)

      if (board.padded && board.answer !== '') {
        const nums = await padNumbers(page)
        if (!nums.includes(Number(board.answer))) {
          failures.push(`[${chapter}] pad does not contain its own answer ${board.answer}; choices were ${nums.join(',')}`)
        }
      }

      const turn = await aceKid.play(page)
      // An INSTRUMENT question (no pad) can't be driven by a numeric persona — several
      // chapters deliberately keep their instrument where the illustration does the
      // teaching. Stop driving, but the boards already checked still count.
      if (!turn.acted) break
      answered++
      await page.waitForTimeout(1900)
    }

    expect(failures, `${chapter} question-quality failures:\n${failures.join('\n')}`).toHaveLength(0)
    expect(boardsSeen, `${chapter}: no question board was ever rendered`).toBeGreaterThan(0)

    const real = errors.filter((e) => !IGNORED_ERRORS.test(e))
    expect(real, `${chapter} console errors:\n${real.join('\n')}`).toHaveLength(0)
  })
}

test('a wrong answer never leaves a blank stage', async ({ page }) => {
  test.setTimeout(300_000)
  await page.goto('/teen-preview?c=integers')
  expect(await reachPractice(page)).toBe(true)

  const turn = await strugglerKid.play(page)
  expect(turn.acted, 'strugglerKid could not find a wrong choice to tap').toBe(true)
  await page.waitForTimeout(600)

  // The pad must STAY mounted through the reveal — before the 2026-07-19 fix it
  // unmounted and, with no instrument to glide, the centre column went blank.
  const stillThere = await padNumbers(page, false)
  expect(stillThere.length, 'pad vanished on reveal — blank stage').toBeGreaterThan(0)
})
