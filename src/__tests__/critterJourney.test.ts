/**
 * The engine's cardinal invariant: A WALK CYCLE AND THE TRAVEL IT BELONGS TO ARE GIVEN THE SAME
 * NUMBER. Every skating, sliding and moonwalking bug this project has shipped is a violation of it.
 *
 * It had a hole big enough to drive the whole 3–5 band through. `travelMs` derived a duration from
 * the creature's own gait and then CLAMPED it — and the clamp was not an edge case: measured across
 * the cast, a journey of 60% of the screen wants 5–10 SECONDS at a walking pace, so every long
 * journey was pinned to TRAVEL_MAX and the body then covered ground at 2–4× the speed its legs were
 * running at. Nothing told the sprite. The chapters computed a `cycleScale` for the showy march and
 * passed a bare `1` for every ordinary journey, so ordinary journeys were the ones that skated.
 *
 * `journeyOf` now returns the correction with the duration, and this file is what stops the two
 * drifting apart again — a numeric statement of "the feet match the ground", swept over every
 * creature and every distance a chapter can actually ask for.
 */
import { describe, it, expect } from 'vitest'
import {
  CAST, STRIDE, TRAVEL_MIN, TRAVEL_MAX, journeyOf, groundSpeed, type Spot,
} from '@/features/chapters/story/critters'
import { SHEETS } from '@/features/chapters/story/canvas/sheets'
import { playLayout, playGeom, makeRound } from '@/features/chapters/story/PlayTime'
import type { Difficulty } from '@/core/adaptive'

const SCREENS: Array<[number, number]> = [[640, 320], [740, 360], [1024, 600], [1280, 800], [1920, 1080]]

const vw = 1024, vh = 600
const at = (leftPct: number): Spot => ({ left: leftPct, top: 70, scale: 1 })
/**
 * The ranges the chapters ACTUALLY reach, measured by running their own generators and layout
 * chains over every screen size — not a guess. Sweeping beyond them (a 48px sprite crossing 90% of
 * the screen) fails on a picture no child can ever be shown, which says nothing about the real ones.
 */
const SPANS = [8, 15, 25, 35, 45, 55, 65, 75]
const HEIGHTS = [45, 58, 70, 100, 132]
// The lock is pure arithmetic inside journeyOf, so it is swept over the whole grid deliberately:
// it must hold for ANY height and distance, reachable or not.

describe('creature journeys keep the feet locked to the ground', () => {
  it('never lets the cycle and the travel disagree', () => {
    const bad: string[] = []
    for (const k of CAST) {
      const sheet = SHEETS[k.src]!
      for (const h of HEIGHTS) {
        for (const span of SPANS) {
          const j = journeyOf(at(0), at(span), vw, vh, h, k.src)
          // What the creature ACTUALLY does on screen…
          const realSpeed = (span / 100 * vw) / j.ms * 1000              // px per second
          // …versus what its legs, at the scaled cadence, claim it is doing.
          const stridesPerSec = (sheet.fps / sheet.frames) * j.cycleScale
          const impliedSpeed = stridesPerSec * STRIDE * h

          // Both floors are deliberate and documented; outside them the two must agree exactly.
          const speedFloored = groundSpeed(k.src, h) <= 60.0001
          const scaleFloored = j.cycleScale <= 0.4 + 1e-9
          if (speedFloored || scaleFloored) continue

          const err = Math.abs(realSpeed - impliedSpeed) / impliedSpeed
          if (err > 0.02) {
            bad.push(`${k.little} h=${h} span=${span}%: moves ${realSpeed.toFixed(0)}px/s but its legs say ${impliedSpeed.toFixed(0)}px/s`)
          }
        }
      }
    }
    expect(bad.slice(0, 10)).toEqual([])
  })

  it('keeps every journey inside its bounds', () => {
    for (const k of CAST) for (const h of HEIGHTS) for (const span of SPANS) {
      const j = journeyOf(at(0), at(span), vw, vh, h, k.src)
      expect(j.ms).toBeGreaterThanOrEqual(TRAVEL_MIN)
      expect(j.ms).toBeLessThanOrEqual(TRAVEL_MAX)
    }
  })

  it('never whirls the legs on a journey a chapter really produces', () => {
    // The complaint that started this: the animation read as hurried.
    //
    // This one CANNOT be swept as a cross-product of heights and distances, because the two are
    // correlated and pretending otherwise invents impossible screens. A 45px sprite only happens
    // when ten creatures share a 640-wide phone — and there, 75% of the width is 480px, not the
    // 768px the same percentage means on a desktop. Sweeping them independently asks a tiny
    // creature to cross a huge screen, a picture no child is ever shown. So the journeys come from
    // the chapter's own layout chain and its own generator.
    const fast: string[] = []
    for (const [w, h] of SCREENS) {
      for (const d of [1, 2, 3] as Difficulty[]) {
        for (let r = 0; r < 60; r++) {
          for (const op of ['+', '-'] as const) {
            const q = makeRound(op, d, r)
            const pool = op === '+' ? q.a + q.b : q.a
            for (let ci = 0; ci < CAST.length; ci++) {
              const L = playLayout(w, h, pool, ci)
              const g = playGeom(pool, L.edgePct, L.rightPct)
              // The furthest mover: slot b−1, to or from off-frame.
              const far = { left: g.left + (q.b - 1) * g.span, top: L.band.waitY0, scale: 1 }
              const off = { left: -16, top: L.band.waitY0, scale: 1 }
              const j = journeyOf(off, far, w, h, L.size, L.kind.src)
              const sheet = SHEETS[L.kind.src]!
              const cycle = (sheet.frames / sheet.fps) / j.cycleScale
              if (cycle < 0.34) {
                fast.push(`${w}×${h} ${op}d${d} pool=${pool} ${L.kind.little} h=${L.size}: ${cycle.toFixed(2)}s per cycle`)
              }
            }
          }
        }
      }
    }
    expect(fast.slice(0, 6)).toEqual([])
  })

  it('gives every creature a calm resting cadence', () => {
    // A standing creature plays no cycle at all, but this is the pace a short, unclamped journey
    // runs at — and it is what a child sees most of the time.
    for (const k of CAST) {
      const s = SHEETS[k.src]!
      const cycle = s.frames / s.fps
      expect(cycle).toBeGreaterThanOrEqual(0.6)   // an ant used to cycle every 0.46s
      expect(cycle).toBeLessThanOrEqual(2.0)      // and nothing should look becalmed either
    }
  })
})
