/**
 * Chapter 5 (Bigger or Smaller) layout and value invariants.
 *
 * Sweeps every screen size × bunch combination × creature and asserts the layout holds, using the
 * SAME `compareLayout` the scene renders from — a check that re-implements the sizing chain can
 * agree with its own copy of the constants while the screen it protects falls apart.
 *
 * THE INVARIANT THIS CHAPTER LIVES OR DIES ON is that two bunches read as TWO BUNCHES. Members
 * alternate rows, so same-row neighbours sit `step × rows` apart; if the gap between bunches is not
 * clearly wider than that, the picture is one long line and there is nothing to compare. The first
 * draft set the gap to 2.2·step against a same-row spacing of 2·step — a 10% difference, which is
 * no difference at all. That is the regression this file exists to prevent.
 */
import { describe, it, expect } from 'vitest'
import { CAST, aspectOf, BANNER_PX, STRIP_PX } from '@/features/chapters/story/critters'
import {
  compareLayout, groupSpot, groupGeom, makeRound, GROUP_GAP_K,
} from '@/features/chapters/story/BigOrSmall'
import type { Difficulty } from '@/core/progression'

const OFF_RIGHT = 124
const MAX_ON_SCREEN = 10

const SIZES: Array<[number, number]> = [
  [640, 320], [667, 375], [740, 360], [812, 375], [844, 390], [896, 414],
  [1024, 400], [1024, 600], [1180, 820], [1280, 800], [1512, 860], [1920, 1080],
]

/**
 * Every bunch combination the generator can actually produce, HARVESTED FROM THE GENERATOR rather
 * than hand-enumerated. A hand-written list drifts from the code the moment the tiers change, and
 * the first version of it swept combinations (three bunches of one) that `makeRound` cannot emit —
 * so the sweep failed on a screen no child can ever reach while saying nothing about the real ones.
 */
const COMBOS: number[][] = (() => {
  const seen = new Map<string, number[]>()
  for (const d of [1, 2, 3] as Difficulty[])
    for (let r = 0; r < 3000; r++) {
      const c = makeRound(d, r).counts
      seen.set(c.join(','), c)
    }
  return [...seen.values()]
})()

function box(leftPct: number, topPct: number, size: number, aspect: number, vw: number, vh: number) {
  const cx = leftPct / 100 * vw
  const half = size * aspect / 2
  const feet = topPct / 100 * vh
  return { left: cx - half, right: cx + half, feet, head: feet - size }
}

describe('Bigger or Smaller layout invariants', () => {
  it('holds across every screen × bunch combination × creature', () => {
    const fail: string[] = []
    for (const [vw, vh] of SIZES) {
      for (const counts of COMBOS) {
        for (let ci = 0; ci < CAST.length; ci++) {
          const L = compareLayout(vw, vh, counts, ci)
          const tag = `${vw}×${vh} [${counts}] ${L.kind.little}`
          const geom = groupGeom(counts, L.edgePct, L.rightPct, L.gapK)

          const boxes = counts.map((n, gi) => Array.from({ length: n }, (_, j) => {
            const s = groupSpot(gi, j, counts, L.band, L.edgePct, L.rows, L.rightPct, L.gapK)
            return box(s.left, s.top, L.size, L.aspect, vw, vh)
          }))

          boxes.flat().forEach((b, i) => {
            if (b.left < -1) fail.push(`${tag}: creature ${i} off the LEFT edge`)
            if (b.right > vw + 1) fail.push(`${tag}: creature ${i} off the RIGHT edge`)
            if (b.head < BANNER_PX - 1) fail.push(`${tag}: creature ${i} head behind the prompt`)
            if (b.feet > vh - STRIP_PX + 1) fail.push(`${tag}: creature ${i} feet below the reserved strip`)
          })

          // COUNTABILITY: same-row neighbours inside a bunch must not overlap.
          boxes.forEach((g, gi) => {
            for (let i = 0; i + L.rows < g.length; i++) {
              const gap = g[i + L.rows].left - g[i].right
              if (gap < 0) fail.push(`${tag}: bunch ${gi} same-row overlap of ${(-gap).toFixed(0)}px`)
            }
          })

          // AND THE ROWS MUST ACTUALLY READ AS ROWS. Checking same-row spacing alone is what let a
          // three-row layout through with the creatures burying each other: cross-row overlap is
          // only acceptable if the rows are far enough APART vertically to separate them. They were
          // ~29px apart against an 83px sprite, which is a pile, not a huddle.
          if (L.rows > 1) {
            const vsep = (L.band.waitY1 - L.band.waitY0) / (L.rows - 1) / 100 * vh
            if (vsep < L.size * 0.5) {
              fail.push(`${tag}: rows only ${vsep.toFixed(0)}px apart for a ${L.size}px sprite — they bury each other`)
            }
          }

          // THE ONE THAT MATTERS: the gap between bunches must clearly beat the spacing inside one,
          // or the bunches merge into a single line and there is nothing to compare.
          const sameRowPct = geom.step * L.rows
          if (counts.length > 1 && geom.gap < sameRowPct * 1.35) {
            fail.push(`${tag}: bunch gap ${geom.gap.toFixed(1)}% barely beats same-row ${sameRowPct.toFixed(1)}%`)
          }
          // And measured in real pixels between the nearest two sprites across the divide.
          for (let gi = 0; gi + 1 < counts.length; gi++) {
            const between = boxes[gi + 1][0].left - boxes[gi][boxes[gi].length - 1].right
            if (between < 4) fail.push(`${tag}: bunches ${gi}/${gi + 1} touch (${between.toFixed(0)}px)`)
          }

          // Milo must fit and stand clear of the bunches.
          const mHalf = (L.size * 1.3 * aspectOf(L.miloSrc)) / 2
          if (L.mx / 100 * vw + mHalf > vw + 1) fail.push(`${tag}: Milo off the right edge`)
          const setRight = boxes[boxes.length - 1].slice(-1)[0].right
          if (L.mx / 100 * vw - mHalf < setRight - 1) fail.push(`${tag}: Milo overlaps the bunches`)

          // Every winning bunch must be able to clear the frame — including the LEFTMOST one, which
          // has the furthest to go.
          const marchDist = OFF_RIGHT - geom.bounds[0].left
          if (boxes[0][0].left + marchDist / 100 * vw < vw) fail.push(`${tag}: march leaves the tail in frame`)

          if (L.size < 40) fail.push(`${tag}: sprite ${L.size}px is too small to count`)
        }
      }
    }
    expect(fail.slice(0, 12)).toEqual([])
  })
})

describe('Bigger or Smaller value generation', () => {
  it('always has exactly one right answer, inside the on-screen ceiling', () => {
    const bad: string[] = []
    for (const d of [1, 2, 3] as Difficulty[]) {
      for (let r = 0; r < 500; r++) {
        const q = makeRound(d, r)
        const total = q.counts.reduce((s, n) => s + n, 0)
        if (!q.numerals && total > MAX_ON_SCREEN) bad.push(`d${d}: ${total} on screen`)
        if (q.counts.some(n => n < 1)) bad.push(`d${d}: empty bunch`)
        if (q.want < 0 || q.want >= q.counts.length) bad.push(`d${d}: want out of range`)

        const vals = q.numerals ?? q.counts
        const best = q.mode === 'more' ? Math.max(...vals) : Math.min(...vals)
        // Exactly one winner, or "the most" has two right answers and any tap is arguable.
        if (vals.filter(v => v === best).length !== 1) bad.push(`d${d}: ${vals} has a tie for ${q.mode}`)
        if (vals[q.want] !== best) bad.push(`d${d}: want points at ${vals[q.want]}, not ${best}`)
        // A numeral round is the only place a bunch may be a single creature.
        if (!q.numerals && q.counts.length < 2) bad.push(`d${d}: fewer than two bunches`)
      }
    }
    expect(bad.slice(0, 8)).toEqual([])
  })

  it('grows the numbers, closes the gap, then drops the objects', () => {
    const sample = (d: Difficulty) => Array.from({ length: 500 }, (_, r) => makeRound(d, r))
    const t1 = sample(1), t2 = sample(2), t3 = sample(3)

    // Tier 1 is the plain-to-see tier: a difference of at least 2, and only ever "more".
    expect(t1.every(q => Math.abs(q.counts[0] - q.counts[1]) >= 2)).toBe(true)
    expect(t1.every(q => q.mode === 'more')).toBe(true)
    expect(t1.some(q => q.mode === 'fewer')).toBe(false)

    // Tier 2 introduces "fewer" AND the gap of one, which is what forces counting.
    expect(t2.some(q => q.mode === 'fewer')).toBe(true)
    expect(t2.some(q => Math.abs(q.counts[0] - q.counts[1]) === 1)).toBe(true)

    // Tier 3 drops the objects entirely for some rounds — the un-shortcuttable symbolic round.
    expect(t3.some(q => !!q.numerals)).toBe(true)
    expect(t3.some(q => q.counts.length === 3)).toBe(true)
    // The numeral round is free of the on-screen ceiling, so it can use the whole 1–10 range.
    const nums = t3.filter(q => q.numerals).flatMap(q => q.numerals!)
    expect(Math.max(...nums)).toBeGreaterThan(6)
  })

  it('keeps the gap constant relative to what is inside a bunch, at every combination', () => {
    // The regression that made this file necessary: a gap defined against the STEP rather than the
    // same-row spacing looks fine at rows=1 and dissolves at rows=2.
    for (const counts of COMBOS.filter(c => c.length > 1)) {
      for (const rows of [1, 2, 3]) {
        const g = groupGeom(counts, 5, 74, GROUP_GAP_K * rows)
        expect(g.gap).toBeGreaterThan(g.step * rows * 1.35)
      }
    }
  })
})
