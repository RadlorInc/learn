/**
 * Chapters 9 & 10 (Play Time — addition / subtraction) layout and value invariants.
 *
 * Every founder-visible layout fault in the creature chapters — the moonwalk, the pile-up, the
 * cut-off leader, feet one pixel behind a button — was a hand-tuned constant that happened to hold
 * at 1024×600 with three rabbits and broke on a wider sprite or a fifth creature. So the layout is
 * a set of INVARIANTS derived from each sprite's own aspect, and this sweeps every screen size ×
 * set size × creature and asserts them.
 *
 * THE ONE THAT MATTERS MOST HERE IS COUNTABILITY. This chapter's entire question is "how many are
 * there", so two creatures in the same row overlapping is not a cosmetic blemish — it is the
 * chapter causing a wrong answer. Chapter 4 could get away with a compact, overlapping huddle
 * because its set is counted out one deliberate tap at a time; a set of ten counted in one glance
 * cannot.
 *
 * Note this imports the SAME `playLayout` the scene renders from, rather than re-implementing the
 * sizing chain the way the chapter-4 sweep does. A check that mirrors its own copy of the
 * constants will happily agree with itself while the screen it exists to protect falls apart.
 */
import { describe, it, expect } from 'vitest'
import { CAST, aspectOf, BANNER_PX } from '@/features/chapters/story/critters'
import {
  playLayout, playSpot, playGeom, markerHeight, makeRound, choicesFor, PLAY_RIGHT,
} from '@/features/chapters/story/PlayTime'
import type { Difficulty } from '@/core/progression'

const EXIT_X = -16, OFF_RIGHT = 124

const SIZES: Array<[number, number]> = [
  [640, 320], [667, 375], [740, 360], [812, 375], [844, 390], [896, 414],
  [1024, 400], [1024, 600], [1180, 820], [1280, 800], [1512, 860], [1920, 1080],
]
const POOLS = [2, 3, 4, 5, 6, 7, 8, 9, 10]

/** Screen-space box of one creature. Critter draws at left/top with translate(-50%,-100%), so the
 *  anchor is the FEET and the horizontal centre. */
function box(leftPct: number, topPct: number, size: number, scale: number, aspect: number, vw: number, vh: number) {
  const cx = leftPct / 100 * vw
  const half = size * scale * aspect / 2
  const feet = topPct / 100 * vh
  return { left: cx - half, right: cx + half, feet, head: feet - size * scale }
}

describe('Play Time layout invariants', () => {
  it('holds across every screen × set size × creature', () => {
    const failures: string[] = []
    for (const [vw, vh] of SIZES) {
      for (const n of POOLS) {
        for (let ci = 0; ci < CAST.length; ci++) {
          const L = playLayout(vw, vh, n, ci)
          const tag = `${vw}×${vh} n=${n} ${L.kind.little}`
          const stripTop = vh - 8 - markerHeight(vh)

          const boxes = Array.from({ length: n }, (_, i) => {
            const s = playSpot(i, n, L.band, L.edgePct, L.rows, L.rightPct)
            return box(s.left, s.top, L.size, s.scale, L.aspect, vw, vh)
          })

          boxes.forEach((b, i) => {
            // Nothing may cross a screen edge — measured from the sprite's own width, since a
            // shark is 1.75× wider than tall and hung off the edge at a flat percentage.
            if (b.left < -1) failures.push(`${tag}: creature ${i} off the LEFT edge (${b.left.toFixed(0)}px)`)
            if (b.right > vw + 1) failures.push(`${tag}: creature ${i} off the RIGHT edge (${b.right.toFixed(0)} > ${vw})`)
            // A head behind the prompt is the reef bug: its band is tuned for a tall screen and at
            // 640×320 the prompt alone owns the top third.
            if (b.head < BANNER_PX - 1) failures.push(`${tag}: creature ${i} head behind the prompt (${b.head.toFixed(0)} < ${BANNER_PX})`)
            // Feet in the answer strip means a creature standing on the answer.
            if (b.feet > stripTop + 1) failures.push(`${tag}: creature ${i} feet in the marker strip (${b.feet.toFixed(0)} > ${stripTop})`)
          })

          // COUNTABILITY: neighbours alternate rows, so two creatures in the SAME row are `rows`
          // apart by index. They must not overlap, or the set cannot be counted.
          for (let i = 0; i + L.rows < n; i++) {
            const gap = boxes[i + L.rows].left - boxes[i].right
            if (gap < 0) failures.push(`${tag}: same-row creatures ${i}/${i + L.rows} overlap by ${(-gap).toFixed(0)}px`)
          }

          // Every journey must run the way the sprite faces. Arrivals come from off-frame left to a
          // slot; departures go the other way. Both are guaranteed by the layout, not by animation.
          const first = playSpot(0, n, L.band, L.edgePct, L.rows, L.rightPct)
          if (first.left <= EXIT_X) failures.push(`${tag}: slot 0 (${first.left.toFixed(1)}%) is not right of the entry point (${EXIT_X}%)`)

          // Milo must fit, and stand clear of the set rather than on top of it.
          const mHalf = (L.size * 1.3 * aspectOf(L.miloSrc)) / 2
          const mRight = L.mx / 100 * vw + mHalf
          if (mRight > vw + 1) failures.push(`${tag}: Milo off the right edge (${mRight.toFixed(0)} > ${vw})`)
          const setRight = boxes[n - 1].right
          if (L.mx / 100 * vw - mHalf < setRight - 1) failures.push(`${tag}: Milo overlaps the set`)

          // The march has to clear the frame from the LEFTMOST of them, or the tail is still on
          // screen when Milo has gone.
          const marchDist = OFF_RIGHT - playGeom(n, L.edgePct, L.rightPct).left
          if (boxes[0].left + marchDist / 100 * vw < vw) failures.push(`${tag}: march leaves the tail in frame`)

          // A sprite that has shrunk below this is no longer countable at arm's length.
          if (L.size < 40) failures.push(`${tag}: sprite ${L.size}px is too small`)
        }
      }
    }
    expect(failures.slice(0, 12)).toEqual([])
  })

  it('never places the set past its right limit', () => {
    for (const [vw, vh] of SIZES) for (const n of POOLS) for (let ci = 0; ci < CAST.length; ci++) {
      const L = playLayout(vw, vh, n, ci)
      const last = playSpot(n - 1, n, L.band, L.edgePct, L.rows, L.rightPct)
      expect(last.left).toBeLessThanOrEqual(Math.min(PLAY_RIGHT, L.rightPct) + 0.01)
    }
  })
})

describe('Play Time value generation', () => {
  it('keeps every set countable on screen and every answer reachable', () => {
    const bad: string[] = []
    for (const op of ['+', '-'] as const) {
      for (const d of [1, 2, 3] as Difficulty[]) {
        for (let r = 0; r < 400; r++) {
          const q = makeRound(op, d, r)
          const pool = op === '+' ? q.a + q.b : q.a
          // Ten on screen is the ceiling — everything here is object-driven, so the arithmetic
          // cannot outgrow what a short landscape phone can hold at a countable size.
          if (pool > 10) bad.push(`${op} d${d}: ${pool} on screen`)
          if (q.a < 1 || q.b < 1) bad.push(`${op} d${d}: degenerate ${q.a},${q.b}`)
          // Subtraction must leave someone behind, so the answer is a number still visible.
          if (op === '-' && q.answer < 1) bad.push(`- d${d}: answer ${q.answer} leaves nobody`)
          if (q.answer !== (op === '+' ? q.a + q.b : q.a - q.b)) bad.push(`${op} d${d}: answer mismatch`)
          if (!q.choices.includes(q.answer)) bad.push(`${op} d${d}: answer ${q.answer} not among choices`)
          if (new Set(q.choices).size !== q.choices.length) bad.push(`${op} d${d}: duplicate choices`)
          if (q.choices.length !== 3) bad.push(`${op} d${d}: ${q.choices.length} choices`)
          if (q.choices.some(c => c < 0)) bad.push(`${op} d${d}: negative choice`)
        }
      }
    }
    expect(bad.slice(0, 8)).toEqual([])
  })

  it('offers off-by-one distractors, because that is the miscount a child actually makes', () => {
    for (const op of ['+', '-'] as const) {
      for (let ans = 1; ans <= 10; ans++) {
        const c = choicesFor(ans, op)
        expect(c).toContain(ans)
        expect(c.length).toBe(3)
        // At least one neighbour, so a lost place shows up as a near miss rather than noise.
        expect(c.some(v => Math.abs(v - ans) === 1)).toBe(true)
      }
    }
  })

  it('grows both the count and the ceiling with difficulty', () => {
    const maxAt = (op: '+' | '-', d: Difficulty) => {
      let m = 0
      for (let r = 0; r < 400; r++) { const q = makeRound(op, d, r); m = Math.max(m, op === '+' ? q.a + q.b : q.a) }
      return m
    }
    // A tier that does not raise the ceiling is the chapter-2 bug: difficulty controlled only HOW
    // MANY numbers there were, never how big, so tier 1 could open a three-year-old on 7·8·9.
    expect(maxAt('+', 1)).toBeLessThan(maxAt('+', 2))
    expect(maxAt('+', 2)).toBeLessThan(maxAt('+', 3))
    expect(maxAt('-', 1)).toBeLessThan(maxAt('-', 2))
    expect(maxAt('-', 2)).toBeLessThan(maxAt('-', 3))
  })
})
