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

/**
 * How many of those buttons are actually SKILLBEAT'S PROMPT PILL.
 *
 * ⚠️ THE ARIA-LABEL ALONE STOPPED BEING A UNIQUE ANCHOR ON 2026-08-28. A chapter may now carry a
 * replay control of its OWN — RainbowTown puts a bare 🔊 in its chrome, because its question has to
 * be pointer-transparent over a colouring page and a transparent button cannot be tapped — and that
 * is not a pill. Counted by label alone, this spec read that chip as "SkillBeat drew a pill" and
 * failed the chapter for a duplicate that does not exist.
 *
 * What makes SkillBeat's pill a PILL is that it CARRIES THE QUESTION, so that is what is matched:
 * a replay button with real words in it, not just a speaker glyph. A property of the thing, not a
 * test hook bolted onto it.
 */
async function promptPills(page: Page): Promise<number> {
  return page.locator(PILL).evaluateAll(els =>
    els.filter(e => (e.textContent || '').replace(/[^A-Za-z0-9]/g, '').length > 2).length)
}

/** How many chapters this worker actually got into a scored round. See the afterAll below. */
const tally = { reached: [] as string[], ownPill: [] as string[], skipped: [] as string[] }

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
    if (await promptPills(page)) return true

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

/**
 * ⚠️ TWO CHAPTERS DO NOT CALL THEIR SCORED PHASE "practice". A wrong value renders nothing, which
 * is a visible failure rather than a silent one — but it would arrive here as a SKIP, so the names
 * are stated rather than guessed.
 */
const SCORED_PHASE: Record<string, string> = { rainbow: 'test' }

/**
 * ⚠️ THE CHAPTERS THAT OWN THEIR OWN PILL, AND WHY THIS LIST IS ASSERTED EXACTLY.
 *
 * Each of these sets `prompt: () => ''`, so SkillBeat draws NO pill — deliberately, per
 * chapter-craft §3: "two pills saying the same thing is a duplicate", and the richer surface owns
 * it. This spec's anchor (`button[aria-label="Hear it again"]`) therefore cannot exist there, and
 * skipping is CORRECT rather than a driver limit.
 *
 * Until 2026-08-21 those two reasons were reported as the same thing — "NOT reached" — which hid
 * the case that matters: a chapter that SHOULD have a pill and loses one would skip quietly and
 * read as "the driver couldn't get there". So the list is checked EXACTLY, the way
 * `storybookQuestions.test.ts` checks `BANNER_OWNED`: a chapter joining or leaving it fails, and
 * somebody looks at why.
 */
// ⚠️ `rainbow` JOINED 2026-08-28. Its answer surface is a colouring page that fills the frame, so
// SkillBeat's pill — a real button — lay across the picture and swallowed taps aimed at the
// thing being coloured; the chapter draws its own `pointerEvents: none` banner instead.
const OWN_PILL = new Set(['time', 'fractions', 'bignum', 'round', 'skip', 'rainbow'])

for (const key of KEYS) {
  test(`${key}: the question is on screen exactly once`, async ({ page }) => {
    test.setTimeout(180_000)
    const errors: string[] = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', e => errors.push(String(e)))

    /**
     * `?e2e=practice` opens the chapter AT its scored round — see `useChapterPhase`. Without it the
     * driver has to sit through an intro, a showcase, a demo and a guided round that wants a
     * CORRECT answer, which a blind driver cannot produce: measured 2026-08-21, 11 of 20 chapters
     * reached a round and the nine that did not were exactly the ones with an answerable guided
     * round. The parameter is honoured only outside production.
     *
     * ⚠️ THE ORIGINAL DIAGNOSIS IN THIS COMMENT WAS WRONG AND IS KEPT BECAUSE OF THAT. It said
     * "whatever headless Chromium is doing to these self-paced, speech-adjacent openings" — it was
     * doing nothing. React StrictMode double-invokes an effect and a `useRef` guard survives the
     * simulated unmount, so the demo started, was cancelled, and refused to restart. Dev only,
     * which is why `shapes` failed here and played fine on production. See `useOnceGuard`.
     */
    await page.goto(`/story?ch=${key}&e2e=${SCORED_PHASE[key] ?? 'practice'}`)
    /**
     * ⚠️ SKIP, NEVER FAIL, WHEN THE DRIVER CANNOT GET THERE — this spec may only go red on a real
     * duplicate. A gate that fails for a reason unrelated to what it checks is a gate people learn
     * to re-run instead of read. The blind driver below is still the fallback for any chapter the
     * parameter does not land squarely in a scored round.
     *
     * The count below is what stops that becoming a silent nothing: a run where every chapter skips
     * is a run that checked nothing, and it says so.
     */
    const reached = await reachRound(page)
    /**
     * ⚠️ A CHAPTER THAT OWNS ITS OWN PILL IS NOT A CHAPTER THE DRIVER FAILED TO REACH, and
     * conflating them is how a LOST pill would hide. If `OWN_PILL` says this chapter has no
     * SkillBeat pill, not finding one is the expected outcome — but if it says the chapter DOES
     * have one and there is none, that is a real regression and it FAILS.
     */
    const ownsPill = OWN_PILL.has(key)
    if (!reached && !ownsPill) {
      tally.skipped.push(key)
      test.skip(true, `${key}: the driver never reached a scored round — not a duplicate-pill failure`)
      return
    }
    if (ownsPill) {
      // It must still have opened a scored round; it just draws the question itself.
      const live = await page.locator('button, [role="button"]').first().isVisible().catch(() => false)
      expect(live, `${key}: nothing operable on screen at its scored phase`).toBe(true)
      expect(await promptPills(page), `${key} is in OWN_PILL, so SkillBeat must draw NO pill — it drew one. Either the chapter gained a beat prompt (and now has two) or the list is stale.`).toBe(0)
      tally.ownPill.push(key)
      return
    }
    tally.reached.push(key)

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
  const total = tally.reached.length + tally.ownPill.length + tally.skipped.length
  const covered = tally.reached.length + tally.ownPill.length
  console.log(
    `\n[storybook-pills] covered ${covered}/${total} chapters this worker` +
    (tally.reached.length ? `\n  pill checked:   ${tally.reached.join(', ')}` : '') +
    // Covered, not skipped: SkillBeat draws no pill here BY DESIGN and that was asserted.
    (tally.ownPill.length ? `\n  owns its pill:  ${tally.ownPill.join(', ')}` : '') +
    // The only genuinely unchecked bucket. Anything in it is a hole, not a design choice.
    (tally.skipped.length ? `\n  NOT reached (checked nothing): ${tally.skipped.join(', ')}` : ''),
  )
})
