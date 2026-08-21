import { test, expect, Page } from '@playwright/test'
import { IGNORED_ERRORS } from './personas'

/**
 * NOBODY WAS COUNTING THE PILLS, AND THAT IS HOW SHAPE STUDIO SHIPPED TWO OF THEM FOR MONTHS.
 *
 * `SkillBeat` draws a prompt pill from `beat.prompt`, so a chapter whose own play surface ALSO
 * draws one puts the same sentence on screen twice (chapter-craft §3: "TWO PILLS SAYING THE SAME
 * THING IS A DUPLICATE, NOT A FALLBACK"). Measured on production 2026-08-20 at
 * adaptivelearn.radlor.com: Shape Studio rendered "Tap the triangle!" at y55 and "Tap The
 * Triangle!" at y76, the lower one `text-transform: capitalize`.
 *
 * ⚠️ NO UNIT TEST CAN SEE THIS. Both halves are individually correct — the beat's prompt is right,
 * the chapter's pill is right — and the duplication is a property of the RENDERED DOM. It survived
 * every gate in the repo and was caught by looking at a screenshot. This spec is the instrument that
 * looking-at-a-screenshot deserved.
 *
 * ⚠️ AND IT WAS INVISIBLE UNTIL THE TWO COPIES AGREED: for months the beat said "Tap the triangle"
 * and the pill said "Tap The Triangle!", different enough to read as a heading above a question.
 * So the check is on the pill's own text, not on a hand-written list of sentences.
 *
 * The anchor is exact: SkillBeat's pill is the only `button[aria-label="Hear it again"]` on screen,
 * and it exists ONLY while a scored round is live — which is also how this spec knows it got there.
 *
 * ⚠️ NOT A PER-COMMIT GATE. Driving a storybook chapter into a scored round means sitting through a
 * self-paced intro, showcase, demo and guided round with no voice to pace them, and some chapters
 * cannot be got there headlessly at all (see the skip below). It belongs on a timer, beside
 * `all-chapters.spec.ts`, and its value is the run where it goes red.
 */

/** `/story?ch=` keys whose chapter states its question through `beat.prompt`. The four that leave it
 *  empty on purpose (Block Yard ×2, Building Blocks, Coin Shop) render no SkillBeat pill at all, so
 *  a duplicate is not expressible there and they are not in this list. */
const KEYS = [
  'order', 'kitchen', 'nest', 'home', 'shapes', 'rainbow', 'beads', 'add', 'sub', 'measure',
  'numbers', 'skip', 'compare', 'story', 'multiply', 'fractions', 'time', 'solids',
  'bignum', 'round',
]

const PILL = 'button[aria-label="Hear it again"]'

/** How many chapters this worker actually got into a scored round. See the afterAll below. */
const tally = { reached: [] as string[], skipped: [] as string[] }

/** Walk a storybook chapter from its intro into a scored round. Every chapter's opening differs, so
 *  this clicks whatever moves FORWARD and never the Menu, then stops when SkillBeat's pill appears. */
async function reachRound(page: Page, budgetMs = 120_000): Promise<boolean> {
  const deadline = Date.now() + budgetMs
  /**
   * ⚠️ ROTATE THE BLIND PICK. Falling back to `candidates[0]` means pressing the SAME control every
   * iteration, which in a guided round is the same wrong answer for the whole budget — a
   * deterministic dead end that looks like the chapter hanging. Measured 2026-08-21: only 3 of 20
   * chapters reached a round, and `order`'s guided round wants its creatures tapped in ASCENDING
   * order, so re-tapping one of them can never advance. Rotating stumbles through in a few tries
   * and stays honest: the loop still stops the instant SkillBeat's pill appears, so nothing is
   * answered before the check runs.
   */
  let tick = 0
  while (Date.now() < deadline) {
    if (await page.locator(PILL).count()) return true

    const candidates: Array<{ click: () => Promise<void>; forward: boolean }> = []
    for (const b of await page.locator('button:not([disabled])').all()) {
      const label = (await b.innerText().catch(() => '')).trim()
      const aria = (await b.getAttribute('aria-label').catch(() => '')) ?? ''
      if (/menu/i.test(label) || /hear it again/i.test(aria)) continue
      candidates.push({
        click: () => b.click({ timeout: 1000 }).then(() => {}, () => {}),
        forward: /→\s*$|▶|Watch|Let'?s|Start|Play|Got it|Next|Go\b/i.test(label),
      })
    }

    /**
     * ⚠️ FALL BACK TO *ANY* BUTTON, NOT ONLY A FORWARD-LOOKING LABEL. The first draft matched a
     * fixed set of words and `shapes` and `compare` never reached a round in 90s — both open on a
     * WORLD PICKER whose buttons are named after the world ("The Toy Room"), which no such list
     * predicts. A chapter-specific driver is a driver that silently skips chapters, and this spec's
     * whole job is to reach all of them. Clicking blind is safe here: the loop stops the moment
     * SkillBeat's pill appears, so nothing is ever answered before the check runs.
     */
    const pick = candidates.find(c => c.forward) ?? candidates[tick++ % Math.max(1, candidates.length)]
    if (pick) await pick.click()
    else await page.waitForTimeout(900)     // mid-demo: nothing to press, let the narration run
    await page.waitForTimeout(600)
  }
  return false
}

/** Every leaf element carrying exactly `text`, with where it sits — so a failure names both. */
async function copiesOf(page: Page, text: string) {
  return page.evaluate((t: string) => {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
    return [...document.querySelectorAll('*')]
      .filter(e => e.children.length === 0 && norm(e.textContent || '') === norm(t))
      .map(e => {
        const r = e.getBoundingClientRect()
        return { y: Math.round(r.top), transform: getComputedStyle(e).textTransform, inPill: !!e.closest('button[aria-label="Hear it again"]') }
      })
  }, text)
}

for (const key of KEYS) {
  test(`${key}: the question is on screen exactly once`, async ({ page }) => {
    test.setTimeout(180_000)
    const errors: string[] = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', e => errors.push(String(e)))

    await page.goto(`/story?ch=${key}`)
    /**
     * ⚠️ SKIP, NEVER FAIL, WHEN THE DRIVER CANNOT GET THERE — this spec may only go red on a real
     * duplicate. Measured 2026-08-20: `solids` reached a round on one run and not the next, and
     * `shapes` never reached one in 120s against the dev server OR against production, sitting on
     * its "Meet the shapes!" showcase — a phase whose own timers are a deterministic 9.5s. Whatever
     * headless Chromium is doing to these self-paced, speech-adjacent openings, it is not something
     * this spec can assert about, and a gate that fails for a reason unrelated to what it checks is
     * a gate people learn to re-run instead of read.
     *
     * The count below is what stops that becoming a silent nothing: a run where every chapter skips
     * is a run that checked nothing, and it says so.
     */
    const reached = await reachRound(page)
    ;(reached ? tally.reached : tally.skipped).push(key)
    test.skip(!reached, `${key}: the driver never reached a scored round — not a duplicate-pill failure`)

    // Two rounds, because a chapter can render one phase cleanly and duplicate in another.
    const seen: string[] = []
    for (let round = 0; round < 2; round++) {
      if (!(await page.locator(PILL).count())) break
      const text = (await page.locator(PILL).first().innerText()).trim()
      if (!text.length) break
      seen.push(text)

      const copies = await copiesOf(page, text)
      const outside = copies.filter(c => !c.inPill)
      expect(
        outside.length,
        `${key}: "${text}" is drawn ${copies.length} times — SkillBeat's pill plus ` +
        `${outside.length} more at y=${outside.map(c => c.y).join(',')} ` +
        `(text-transform: ${outside.map(c => c.transform).join(',')}). ` +
        'chapter-craft §3: two pills saying the same thing is a duplicate.',
      ).toBe(0)

      // move on: tap something in the play surface, then let the round settle
      const btns = await page.locator('button:not([disabled])').all()
      for (const b of btns) {
        const l = (await b.innerText().catch(() => '')).trim()
        if (/menu/i.test(l) || /hear it again/i.test(await b.getAttribute('aria-label') ?? '')) continue
        await b.click({ timeout: 800 }).catch(() => {})
        break
      }
      await page.waitForTimeout(2600)
    }

    expect(seen.length, `${key}: no question pill was ever read`).toBeGreaterThan(0)
    const real = errors.filter(e => !IGNORED_ERRORS.test(e))
    expect(real, `${key} console errors:\n${real.join('\n')}`).toHaveLength(0)
  })
}

/**
 * ⚠️ NO SILENT COVERAGE. Every chapter this spec cannot reach is SKIPPED rather than failed, which
 * means a run in which nothing was reachable is a run that checked nothing and still went green.
 * This prints what was actually covered, so that shrinking is visible in the log rather than
 * inferred from a passing tick. (Per worker — with several workers, read the lines together.)
 */
test.afterAll(async () => {
  const total = tally.reached.length + tally.skipped.length
  console.log(
    `\n[storybook-pills] checked ${tally.reached.length}/${total} chapters this worker` +
    (tally.reached.length ? `\n  reached: ${tally.reached.join(', ')}` : '') +
    (tally.skipped.length ? `\n  NOT reached (checked nothing): ${tally.skipped.join(', ')}` : ''),
  )
})
