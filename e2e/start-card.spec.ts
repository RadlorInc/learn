import { test, expect } from '@playwright/test'
import { seedSession } from './session'
import { AR_CHAPTERS } from '../src/core/arChapters'

/**
 * THE FIRST SCREEN OF A GAMESHELL CHAPTER, ON THE SHORTEST FRAME A CHILD HOLDS.
 *
 * ⚠️ WHY THIS EXISTS. The start card is the one stage with no FitSlot scaling anything down, so
 * when its ticket + blurb + buttons come out a few pixels taller than the column, the ONLY forward
 * control on the screen is simply not on the screen. Measured 2026-08-23 at 640×320 against a
 * production build: `Switch it on →` at **y 284–330 of 320**, stable across four seconds and every
 * font-load state, in EIGHT chapters — conicSections, systemsMatrices, systemsOfEquations,
 * quadraticAnalysis, expLogFunctions, unitCircleTrig, trigGraphsIdentities, statsInference. Those
 * chapters could not be STARTED on a landscape phone, and it was live on production.
 *
 * ⚠️ AND `all-chapters` COULD NOT SEE IT. That gate clicks the biggest visible control and measures
 * 900 ms later; on this route that lands it on the ExploreStep, one screen EARLIER, which fits
 * perfectly. The nightly run caught two of the eight — from a slower runner that happened to get
 * one screen further — and it read as flakiness because the other six were reported clean. A gate
 * that reaches a DIFFERENT screen than the one with the defect reports green about a screen it
 * never loaded. Hence this spec, which names the screen it is about and enters it deliberately.
 *
 * The floor is 640×320, this repo's `shortPhone` persona. ponytail: below 320 the card's `top`
 * stops responding to viewport height at all (measured constant at 264 for 320/300/280/260), so a
 * sub-320 landscape frame still overflows — main scrolls, so the button stays reachable, but it is
 * not laid out for it. Widen HEIGHTS here the day a real device that short matters.
 */
const CHAPTERS = [
  'conicSections', 'systemsMatrices', 'systemsOfEquations', 'quadraticAnalysis',
  'expLogFunctions', 'unitCircleTrig', 'trigGraphsIdentities', 'statsInference',
  /**
   * ⚠️⚠️ AND EVERY AR CHAPTER, BECAUSE THIS CARD SPENDS ITS MARGIN A SECOND WAY THERE: it carries
   * TWO controls (`Turn on the camera` + `Use taps instead`), and the second one is the door for the
   * child who cannot or will not use a camera. Measured at 640×320 before the fix, `dataGraphs`
   * rendered "Use taps instead" at **y 299–343 of 320** — the escape hatch half off the screen
   * while the camera button was whole. The nightly had been reporting it for seven nights inside a
   * job that had never once been green.
   * ⚠️ Listing the eight explore chapters ONLY is how this spec missed it: the list was the eight
   * that failed the day it was written, so it could only ever re-catch those eight.
   */
  ...AR_CHAPTERS,
]
const HEIGHTS = [320]

/** The AR card's two doors, by their rendered words — both must be whole, not just the one that
 *  happened to be failing. A camera chapter with only the camera door on screen is a dead end for
 *  exactly the child the second door exists for. */
const AR_DOORS = ['Turn on the camera', 'Use taps instead']

/** Enter the chapter the way a child does: the biggest control that is not the Menu chip. */
const enterStep = () => {
  let best: HTMLElement | null = null, bestA = 0
  for (const el of document.querySelectorAll('button, a[href]')) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    if (getComputedStyle(el).visibility === 'hidden') continue
    if (/^\s*‹?\s*(menu|back)/i.test(el.textContent || '')) continue
    if (r.width * r.height > bestA) { bestA = r.width * r.height; best = el as HTMLElement }
  }
  best?.click()
}

test('GameShell start card — every control is on screen at 640x320', async ({ page }) => {
  test.setTimeout(300_000)
  // ⚠️ Without this an AR chapter renders the CameraConsentCard to a logged-out visitor, and this
  // spec would grade that screen — the same wrong-screen fault it was written to close.
  await seedSession(page)
  const bad: string[] = []
  for (const h of HEIGHTS) {
    await page.setViewportSize({ width: 640, height: h })
    for (const id of CHAPTERS) {
      await page.goto(`/teen-preview?c=${id}`)
      await page.waitForTimeout(700)
      // ⚠️ ONLY the explore chapters need a click to reach the card; clicking on one that has no
      // explore step presses START and grades the walkthrough instead — a wrong screen again.
      await page.evaluate(() => {
        const skip = [...document.querySelectorAll('button')].find(b => /skip to the game/i.test(b.textContent || ''))
        if (skip) (skip as HTMLElement).click()
      })
      await page.waitForTimeout(1300)
      const m = await page.evaluate(() => {
        // The card must actually be the card — otherwise this spec silently grades the screen
        // before it, which is exactly the failure mode it was written to close.
        const start = [...document.querySelectorAll('button')]
          .find(b => {
            const t = (b.textContent || '').trim()
            // ⚠️ An AR chapter's start button says "Turn on the camera" — no arrow. Keying the
            // card's identity on "→" alone made this spec report "never reached a start card" for
            // every camera chapter, which is a green-shaped failure.
            return !/^\s*‹/.test(t) && (/→\s*$/.test(t) || t === 'Turn on the camera')
          })
        let worst: { gap: number; top: number; label: string } | null = null
        for (const el of document.querySelectorAll('button, a[href]')) {
          const r = el.getBoundingClientRect()
          if (!r.width || !r.height) continue
          if (getComputedStyle(el).visibility === 'hidden') continue
          const gap = Math.round(innerHeight - r.bottom)
          if (!worst || gap < worst.gap) worst = { gap, top: Math.round(r.top), label: (el.textContent || '').trim().slice(0, 22) || el.tagName }
        }
        const labels = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim())
        return { worst, onCard: !!start, labels, startLabel: (start?.textContent || '').trim().slice(0, 24) }
      })
      if (!m.onCard) { bad.push(`${id} @${h}: never reached a start card — this spec graded the wrong screen`); continue }
      // ⚠️ BOTH DOORS PRESENT, not just whole. A card that renders only the camera button would
      // pass every geometry check on this page while being the dead end the second door prevents.
      if (AR_CHAPTERS.includes(id as never)) {
        const missing = AR_DOORS.filter(d => !m.labels.some(l => l === d))
        if (missing.length) bad.push(`${id} @640x${h}: the AR card is missing ${missing.join(' + ')}`)
      }
      if (!m.worst || m.worst.gap < 0 || m.worst.top < 0) {
        bad.push(`${id} @640x${h}: "${m.worst?.label}" off screen (top ${m.worst?.top}, ${m.worst?.gap}px past the bottom) — start button "${m.startLabel}"`)
      }
      /**
       * ⚠️⚠️ AND THE PROPERTY BEHIND ALL OF IT: THE LAYOUT MUST NOT BE A FUNCTION OF HOW MANY LINES
       * THE BLURB TAKES. 10px of clearance is one wrapped line from failing, and that is exactly
       * what the CI runner shows — measured 2026-08-31, the same blurb is 5 lines here (116px) and
       * **6 lines on the runner** (140px), because the declared face is not the one rendering and
       * Linux falls back to DejaVu Sans, ~5% wider (canvas probe 312.09 vs 328). One line = 23.25px
       * = the -13px overflow the nightly reported.
       * So the check is not "does today's text fit" — it is "does the card hold when the text grows".
       * Watched on the known-bad build: `Switch it on →` goes 10 → **-13** with one line added, and
       * `Use taps instead` -23 → -46.
       */
      await page.evaluate(() => {
        const p = [...document.querySelectorAll('p')].sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
        if (p) p.innerHTML += ' ' + Array.from({ length: 4 }, () => 'One more line of blurb this card did not plan for.').join(' ')
      })
      // ⚠️ Measure on the NEXT frame. Read in the same statement as the mutation and the flex
      // column has not re-solved, so a card that does hold reports as if it did not.
      await page.waitForTimeout(400)
      const grown = await page.evaluate(() => {
        let worst: { gap: number; label: string } | null = null
        for (const el of document.querySelectorAll('button, a[href]')) {
          const r = el.getBoundingClientRect()
          if (!r.width || !r.height) continue
          const gap = Math.round(innerHeight - r.bottom)
          if (!worst || gap < worst.gap) worst = { gap, label: (el.textContent || '').trim().slice(0, 22) }
        }
        return worst
      })
      if (grown && grown.gap < 0) {
        bad.push(`${id} @640x${h}: four extra lines of blurb push "${grown.label}" ${grown.gap}px off — the card's height still follows the text`)
      }
    }
  }
  expect(bad, bad.join('\n')).toEqual([])
})
