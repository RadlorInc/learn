import { test, expect } from '@playwright/test'

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
]
const HEIGHTS = [320]

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
  const bad: string[] = []
  for (const h of HEIGHTS) {
    await page.setViewportSize({ width: 640, height: h })
    for (const id of CHAPTERS) {
      await page.goto(`/teen-preview?c=${id}`)
      await page.waitForTimeout(500)
      await page.evaluate(enterStep)          // ExploreStep → the GameShell start card
      await page.waitForTimeout(1100)
      const m = await page.evaluate(() => {
        // The card must actually be the card — otherwise this spec silently grades the screen
        // before it, which is exactly the failure mode it was written to close.
        const start = [...document.querySelectorAll('button')]
          .find(b => /→\s*$/.test((b.textContent || '').trim()) && !/^\s*‹/.test(b.textContent || ''))
        let worst: { gap: number; top: number; label: string } | null = null
        for (const el of document.querySelectorAll('button, a[href]')) {
          const r = el.getBoundingClientRect()
          if (!r.width || !r.height) continue
          if (getComputedStyle(el).visibility === 'hidden') continue
          const gap = Math.round(innerHeight - r.bottom)
          if (!worst || gap < worst.gap) worst = { gap, top: Math.round(r.top), label: (el.textContent || '').trim().slice(0, 22) || el.tagName }
        }
        return { worst, onCard: !!start, startLabel: (start?.textContent || '').trim().slice(0, 24) }
      })
      if (!m.onCard) { bad.push(`${id} @${h}: never reached a start card — this spec graded the wrong screen`); continue }
      if (!m.worst || m.worst.gap < 0 || m.worst.top < 0) {
        bad.push(`${id} @640x${h}: "${m.worst?.label}" off screen (top ${m.worst?.top}, ${m.worst?.gap}px past the bottom) — start button "${m.startLabel}"`)
      }
    }
  }
  expect(bad, bad.join('\n')).toEqual([])
})
