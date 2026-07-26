import { test, expect, Page } from '@playwright/test'
import { reachPractice, IGNORED_ERRORS } from './personas'

// Short-landscape gate for the 17–18 band (13 chapters, ~19 instruments).
//
// Why this exists: every size in the teen shell is `clamp(px, vw, px)` — WIDTH-derived,
// with no vh term — so a WIDE-but-SHORT frame gets near-desktop sizes with no vertical
// room for them. `useFrame`'s `short` gate (innerHeight < 470) is what buys that back:
// it flips the play area into a two-column row and lets FitSlot scale the instrument
// column down. This suite proves the result is still OPERABLE rather than merely
// non-overlapping — the 15–16 pass found that scale-to-fit is not reflow, and honestly
// shrank a commit button to 61×13.
//
// Three stages are measured because each has failed before:
//   • EXPLORE     — the read-only sim, the first screen a child meets
//   • WALKTHROUGH — 15–16 shipped scenes that were CLIPPED, not scaled
//   • PRACTICE    — where the instrument and its own commit button live
//
// ⚠️ COVERAGE LIMIT, stated rather than implied: only the FIRST scored question is
// measured, and which question KIND that is depends on the generator's draw. A chapter
// with five kinds therefore gets one of them measured per run, sampled differently each
// time — visible in the 2026-07-26 run, where complexNumbers showed its compass at
// 640×320 and its PartsBuilder at 1024×400 (and the PartsBuilder is the tighter of the
// two). Repeat runs widen the sample; forcing every kind needs a per-chapter hook.
const CHAPTERS = [
  'functionToolkit', 'quadraticAnalysis', 'polynomialFunctions', 'complexNumbers',
  'rationalFunctions', 'expLogFunctions', 'unitCircleTrig', 'trigGraphsIdentities',
  'conicSections', 'systemsMatrices', 'sequencesSeries', 'statsInference', 'introCalculus',
]

// ExploreStep is shared by EVERY teen chapter, so its short-frame reflow is swept
// across all 37 rather than only the 13 this file was written for.
const ALL_TEEN = [
  // 12–14
  'integers', 'signedRationalOps', 'rationalOps', 'ratioProportion',
  'percentages', 'exponentsRoots', 'orderOfOperations', 'algebraicExpressions',
  'equationsInequalities', 'coordinatePlane', 'linearRelationships', 'geometryMeasurement',
  // 15–16
  'signedNumberFluency', 'expressionsVariables', 'linearEquationsInequalities',
  'slopeLinearGraphs', 'functionsFamilies', 'systemsOfEquations',
  'exponentsPolynomials', 'radicalsPythagorean', 'factoringPolynomials',
  'quadraticsParabolas', 'geometryTransformations', 'geometryProofTrig',
  ...CHAPTERS,
]

const SIZES = [
  { w: 640, h: 320 }, { w: 667, h: 375 }, { w: 740, h: 360 }, { w: 1024, h: 400 },
]

// A finger wants ~44px (WCAG 2.5.5). Below MIN_TAP a control is not operable at all and
// this FAILS; between the two it is tight and is only REPORTED — 15–16 shipped a
// measured 29×29 stepper at 640×320 as a stated, accepted ceiling.
const MIN_TAP = 24
const TIGHT_TAP = 44

interface Box { label: string; x: number; y: number; w: number; h: number; inBoard: boolean; scrollable: boolean }
interface Shot { W: number; H: number; scrollW: number; ctrls: Box[]; art: Box[]; board: Box | null }

async function measure(page: Page): Promise<Shot> {
  return page.evaluate(() => {
    const board = document.querySelector('[data-test-answer]')
    // Below the fold is only a DEFECT when it is unreachable, so ask the DOM which it
    // is rather than hard-coding the distinction per stage. `strict` (see check) is
    // what decides whether a merely-scrollable element is tolerated: the explore
    // screen must fit outright, the play stages may scroll (GameShell gives `main`
    // overflowY:auto while the scratch drawer is open).
    const canScrollTo = (el: Element) => {
      for (let n: Element | null = el; n; n = n.parentElement) {
        const oy = getComputedStyle(n).overflowY
        if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) return true
      }
      return document.documentElement.scrollHeight > window.innerHeight + 1
    }
    const box = (el: Element, label: string) => {
      const r = el.getBoundingClientRect()
      return {
        label: label.replace(/\s+/g, ' ').trim().slice(0, 28),
        x: Math.round(r.left), y: Math.round(r.top),
        w: Math.round(r.width), h: Math.round(r.height),
        // The board column is deliberately `overflowY: auto` on a short frame, so its
        // own content extending past the fold is by design, not a defect.
        inBoard: !!board && board.contains(el),
        scrollable: canScrollTo(el),
      }
    }
    const seen = (el: Element) => {
      const r = el.getBoundingClientRect()
      return r.width > 1 && r.height > 1 && getComputedStyle(el).visibility !== 'hidden'
    }
    return {
      W: window.innerWidth,
      H: window.innerHeight,
      scrollW: document.documentElement.scrollWidth,
      ctrls: [...document.querySelectorAll('button:not([disabled])')]
        .filter(seen).map((b) => box(b, (b as HTMLElement).innerText || b.getAttribute('aria-label') || 'button')),
      // The instrument art. `svg` covers every shared and in-file instrument in this
      // band plus every walkthrough scene; canvas covers the ScribblePad.
      art: [...document.querySelectorAll('main svg, main canvas')].filter(seen).map((s) => box(s, s.tagName)),
      board: board && seen(board) ? box(board, 'BOARD') : null,
    }
  })
}

/** `strict` — a scroll is a FAILURE, not a note. Used on the explore screen, which
 *  is now height-bounded by construction (ExploreStep caps at 100dvh and reflows the
 *  sim on a short frame), so anything below the fold there is a real regression. The
 *  play stages stay lenient: GameShell gives `main` overflowY:auto while the scratch
 *  drawer is open, so a scroll there can be legitimate. */
function check(tag: string, s: Shot, failures: string[], notes: string[], strict = false) {
  const off = (b: Box) =>
    b.x < -1 || b.y < -1 || b.x + b.w > s.W + 1 || b.y + b.h > s.H + 1

  if (s.scrollW > s.W + 1) {
    failures.push(`${tag}: page overflows horizontally — scrollWidth ${s.scrollW} > ${s.W}`)
  }

  for (const c of s.ctrls) {
    // A control in the scrollable board strip is reachable by scrolling that strip.
    if (off(c) && !c.inBoard) {
      if (!c.scrollable) failures.push(`${tag}: control "${c.label}" is CLIPPED at ${c.x},${c.y} ${c.w}×${c.h} (frame ${s.W}×${s.H})`)
      else if (strict) failures.push(`${tag}: control "${c.label}" is below the fold at ${c.x},${c.y} ${c.w}×${c.h} — this screen must fit`)
      else notes.push(`${tag}: "${c.label}" needs a scroll — ${c.x},${c.y} ${c.w}×${c.h}`)
    }
    const min = Math.min(c.w, c.h)
    if (min < MIN_TAP) {
      failures.push(`${tag}: control "${c.label}" is ${c.w}×${c.h} — under the ${MIN_TAP}px operable floor`)
    } else if (min < TIGHT_TAP) {
      notes.push(`${tag}: tight tap target "${c.label}" ${c.w}×${c.h}`)
    }
  }

  for (const a of s.art) {
    if (!off(a)) continue
    if (!a.scrollable) failures.push(`${tag}: ${a.label} art is CLIPPED at ${a.x},${a.y} ${a.w}×${a.h}`)
    else if (strict) failures.push(`${tag}: ${a.label} art is below the fold at ${a.x},${a.y} ${a.w}×${a.h} — this screen must fit`)
    else notes.push(`${tag}: ${a.label} art needs a scroll — ${a.x},${a.y} ${a.w}×${a.h}`)
  }

  // On a short frame board and instrument are flex-row siblings, so an intersection
  // means something escaped its column (the pinned absolute board is the classic way).
  if (s.board) {
    for (const a of s.art) {
      const ox = Math.min(s.board.x + s.board.w, a.x + a.w) - Math.max(s.board.x, a.x)
      const oy = Math.min(s.board.y + s.board.h, a.y + a.h) - Math.max(s.board.y, a.y)
      if (ox > 2 && oy > 2) {
        failures.push(`${tag}: board overlaps ${a.label} art by ${ox}×${oy}px`)
      }
    }
  }
}

for (const chapter of CHAPTERS) {
  for (const { w, h } of SIZES) {
    test(`${chapter} @ ${w}×${h}`, async ({ page }) => {
      test.setTimeout(180_000)
      const errors: string[] = []
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
      page.on('pageerror', (e) => errors.push(String(e)))

      await page.setViewportSize({ width: w, height: h })
      await page.goto(`/teen-preview?c=${chapter}`)

      const failures: string[] = []
      const notes: string[] = []

      // 1. EXPLORE is swept separately across all 37 teen chapters below — it is a
      //    shared component, so covering only this band would under-test it.

      // 2. WALKTHROUGH — measured at the "I've got it →" offer, which exists only once
      //    the scene is mounted and playing. Two screens sit in the way (the explore
      //    continue and the start card) and BOTH end in an arrow, so advance on any
      //    arrow button that is not the walkthrough's own skip.
      const gotIt = page.locator('button:not([disabled])').filter({ hasText: /I've got it/ }).first()
      const advance = async () => {
        for (const b of await page.locator('button:not([disabled])').all()) {
          const t = (await b.innerText().catch(() => '')).trim()
          if (/→\s*$/.test(t) && !/I've got it|Let's try/.test(t)) { await b.click({ timeout: 1000 }).catch(() => {}); return }
        }
      }
      const deadline = Date.now() + 60_000
      while (Date.now() < deadline && !(await gotIt.count())) {
        await advance()
        await page.waitForTimeout(900)
      }
      if (await gotIt.count()) {
        check(`walkthrough ${w}×${h}`, await measure(page), failures, notes)
      } else {
        notes.push(`walkthrough ${w}×${h}: never offered "I've got it" — not measured`)
      }

      // 3. PRACTICE — the instrument plus its own commit button.
      expect(await reachPractice(page), `${chapter}: never reached a live board`).toBe(true)
      await page.waitForTimeout(600)
      check(`practice ${w}×${h}`, await measure(page), failures, notes)

      if (notes.length) console.log(`[${chapter}] ${notes.join('\n[' + chapter + '] ')}`)
      const real = errors.filter((e) => !IGNORED_ERRORS.test(e))
      expect(failures, `${chapter} short-landscape failures:\n${failures.join('\n')}`).toHaveLength(0)
      expect(real, `${chapter} console errors:\n${real.join('\n')}`).toHaveLength(0)
    })
  }
}

// ── EXPLORE, across every teen chapter ────────────────────────────────────────
// The explore screen needs no reachPractice, so this is seconds per case rather
// than the ~40s the full walk costs — cheap enough to cover all 37.
//
// STRICT: this screen must FIT. It used to be a `minHeight: 100dvh` stack inside the
// portal's `overflowY: auto`, which measured 2.7 screens of content at 640×320 with
// "Skip to the game →" 504px below the fold. ExploreStep now caps at 100dvh and
// reflows the sim to a grid (square graph left, controls right) under
// `@media (max-height: 469px)`, so anything off-screen here is a regression.
for (const chapter of ALL_TEEN) {
  for (const { w, h } of SIZES) {
    test(`explore: ${chapter} @ ${w}×${h}`, async ({ page }) => {
      test.setTimeout(60_000)
      const errors: string[] = []
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
      page.on('pageerror', (e) => errors.push(String(e)))

      await page.setViewportSize({ width: w, height: h })
      await page.goto(`/teen-preview?c=${chapter}`)
      // The sim is what we are measuring, so wait for it rather than a fixed beat.
      const ok = await page.locator('.mb-explore-fit svg, .mb-explore-fit canvas, .mb-explore-fit input')
        .first().waitFor({ timeout: 20_000 }).then(() => true).catch(() => false)
      if (!ok) { test.skip(true, `${chapter} has no explore sim`); return }
      await page.waitForTimeout(400)

      const failures: string[] = []
      const notes: string[] = []
      check(`explore ${w}×${h}`, await measure(page), failures, notes, true)

      if (notes.length) console.log(`[${chapter}] ${notes.join('\n[' + chapter + '] ')}`)
      const real = errors.filter((e) => !IGNORED_ERRORS.test(e))
      expect(failures, `${chapter} explore failures:\n${failures.join('\n')}`).toHaveLength(0)
      expect(real, `${chapter} console errors:\n${real.join('\n')}`).toHaveLength(0)
    })
  }
}
