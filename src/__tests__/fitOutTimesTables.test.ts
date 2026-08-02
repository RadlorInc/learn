/**
 * The gate for THE FITTING CREW (9–11 `timesTables`).
 *
 * It drives the SAME exported functions the scene renders and grades from — `makeRound`, `grade`,
 * `missFor`, `runOrder`, `fitLayout`, `slotX` — rather than re-implementing them, because a check
 * that carries its own copy of a rule cannot see the rule being removed. That is this repo's own
 * recorded fault, met twice.
 *
 * ⚠️ THE CHECK THAT PAID FOR ITSELF: `fit rounds always leave a spare rail`. It found 3,357
 * unwinnable rounds in 60,000 draws — at L2 the frame drew FEWER rails than the correct answer
 * needs, so the round could not be completed at all. No amount of playing would have surfaced it:
 * it takes several correct answers to reach L2 and then a rows-8 draw.
 */
import { describe, it, expect } from 'vitest'
import {
  SITES, runOrder, makeRound, grade, missFor, fitLayout, slotX,
  tensOf, onesOf, Q_ALL, IMG_W, IMG_H, bandWanted, topCeiling, type FoRound,
} from '@/features/chapters/story/FitOut'
import { bannerBottom } from '@/features/chapters/story/yard'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PUBLIC = join(process.cwd(), 'public')

const TIERS = [1, 2, 3] as const
const draw = (n: number, fn: (q: FoRound, i: number) => void) => {
  for (const d of TIERS) for (let i = 0; i < n; i++) fn(makeRound(d, i % 16, []), i)
}

describe('the run order', () => {
  it('never shows the same site twice in a row', () => {
    for (let t = 0; t < 2000; t++) {
      const r = runOrder(16)
      for (let i = 1; i < r.length; i++) expect(r[i]).not.toBe(r[i - 1])
    }
  })

  it('uses every site inside the first four slots, so none is starved', () => {
    for (let t = 0; t < 2000; t++) {
      expect(new Set(runOrder(16).slice(0, 4)).size).toBe(SITES.length)
    }
  })

  it('is indexed straight rather than modulo — a short run must not wrap onto its own opening', () => {
    const r = runOrder(16)
    expect(r).toHaveLength(16)
  })
})

describe('the question', () => {
  it('always states a total that is rows × per', () => {
    draw(4000, q => expect(q.rows * q.per).toBe(q.total))
  })

  it('keeps every answer inside two digits, so one two-window pad serves the chapter', () => {
    draw(4000, q => {
      expect(q.answer).toBeGreaterThan(0)
      expect(q.answer).toBeLessThan(100)
    })
  })

  it('keeps a rail countable one at a time — the whole run deliberately is not', () => {
    draw(4000, q => expect(q.per).toBeLessThanOrEqual(19))
  })

  it('ALWAYS leaves a spare rail on a fit round, so nothing on screen says "that is enough"', () => {
    draw(6000, q => {
      if (q.qType !== 'fit') return
      expect(q.railsShown).toBeGreaterThan(q.rows)
    })
  })

  it('draws exactly the rails the job needs on an order round — spares there would be gaps', () => {
    draw(4000, q => { if (q.qType !== 'fit') expect(q.railsShown).toBe(q.rows) })
  })

  it('only calls a round `split` when the rail really does split past ten', () => {
    draw(4000, q => { if (q.qType === 'split') expect(q.per).toBeGreaterThan(10) })
  })

  it('reaches the 2-digit payload only at the top tier, and reaches it there', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 3000; i++) seen.add(makeRound(3, i % 16, []).qType)
    expect(seen.has('split')).toBe(true)
    for (let i = 0; i < 3000; i++) expect(makeRound(1, i % 16, []).qType).not.toBe('split')
  })

  it('spends a scarce round on a type the child has NOT met yet', () => {
    // With `fit` already asked, L3 must reach for `split` rather than roll dice — the whole reason
    // `asked` is threaded through the beat.
    for (let i = 0; i < 500; i++) expect(makeRound(3, i % 16, ['fit']).qType).toBe('split')
  })

  it('declares every type it can generate, or the coverage gate withholds mastery for ever', () => {
    const seen = new Set<string>()
    draw(3000, q => seen.add(q.qType))
    for (const t of seen) expect(Q_ALL).toContain(t)
  })
})

describe('grading', () => {
  it('accepts the answer and refuses its neighbours', () => {
    draw(3000, q => {
      expect(grade(q, q.answer)).toBe(true)
      expect(grade(q, q.answer + 1)).toBe(false)
      expect(grade(q, q.answer - 1)).toBe(false)
    })
  })

  it('never states the answer in the miss line — not even on a fit round, where it IS the rail count', () => {
    draw(3000, q => {
      for (const wrong of [q.answer - 1, q.answer + 1, q.answer + 7]) {
        const line = missFor(q, wrong)
        expect(line).not.toContain(String(q.answer))
        expect(line.length).toBeGreaterThan(10)   // it must actually say something
      }
    })
  })

  it('tells the child WHICH way they are wrong, so a miss is information', () => {
    draw(1500, q => {
      expect(missFor(q, q.answer - 1)).not.toBe(missFor(q, q.answer + 1))
    })
  })
})

describe('the tens split', () => {
  it('splits a rail into ten and the remainder, and the two add back to the rail', () => {
    for (let per = 2; per <= 19; per++) expect(tensOf(per) + onesOf(per)).toBe(per)
  })

  it('leaves no remainder below eleven — a short rail has nothing to split', () => {
    for (let per = 2; per <= 10; per++) expect(onesOf(per)).toBe(0)
  })
})

describe('the retry loop', () => {
  /**
   * ⚠️ THE ONE THAT MADE THE CHAPTER UNPLAYABLE, AND NO OTHER CHECK HERE COULD SEE IT. Everything
   * else in this file drives a pure function; this fault was component STATE. `finish(false)`
   * cleared the board and left `settled` true, so the rails lost their `onTap`, the commit button
   * stayed `disabled` and the pad's `live` stayed false — one wrong answer and the child was looking
   * at the question with nothing on screen responding, for ever, on every question type. It survived
   * a build, a gate and a drive because a wrong answer had never once been played.
   *
   * A source check rather than a render: it is anchored on the real call, so deleting the line fails
   * here even though the suite mounts nothing.
   */
  const SRC = readFileSync(join(process.cwd(), 'src/features/chapters/story/FitOut.tsx'), 'utf8')

  it('re-opens the board after a wrong answer — the miss reset must clear `settled`', () => {
    /**
     * ⚠️ ANCHORED ON THE STATEMENT, NOT THE CALL. A bare `toContain('setSettled(false)')` passed the
     * mutation, because it matched the COMMENT above the line explaining why the line is there —
     * this repo's own recorded fault (a `not.toContain('speakSteps')` that matched the prose saying
     * the file avoids it), arrived at from the other side. Strip the comments first, then match the
     * reset in the company of the other two things it resets.
     */
    const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(code).toMatch(/setDigits\(\[\]\);\s*setSettled\(false\)/)
  })

  it('gates the rails, the commit and the pad on that same flag, so one reset re-opens all three', () => {
    // If any of these stops reading `settled`, the reset above is no longer the whole retry and this
    // comment is the place to work out what replaced it.
    expect(SRC).toMatch(/onTapRail=\{usesPad \|\| settled \? undefined : tapRail\}/)
    expect(SRC).toMatch(/disabled=\{settled \|\| railsLaid === 0\}/)
    expect(SRC).toMatch(/live=\{!settled && !done\.current\}/)
  })
})

describe('the units', () => {
  /**
   * ⚠️ A MISSING SPRITE IS SILENT. `Unit` falls back to the old gradient block on `onError`, which is
   * the right fallback and completely invisible from outside: the frame fills, the count is right,
   * and the child is back to counting coloured rectangles in a chapter about fitting panels. A typo
   * in a path would never surface in play, so it is pinned here.
   */
  it('gives every site a real painted unit, and the file is on disk', () => {
    for (const s of SITES) {
      expect(s.sprite, s.id).toMatch(/^\/assets\/objects\/.+\.png$/)
      expect(existsSync(join(PUBLIC, s.sprite)), s.sprite).toBe(true)
    }
  })

  it('gives each site its OWN unit — four sites counting identical objects is one site', () => {
    expect(new Set(SITES.map(s => s.sprite)).size).toBe(SITES.length)
  })
})

describe('layout', () => {
  const SIZES: Array<[number, number]> = [
    [1280, 720], [1024, 620], [1440, 900], [1800, 870], [2000, 970], [2560, 1080],
    [640, 320], [740, 360], [812, 375], [1920, 800],
  ]

  it('maps the ground line through the backdrop\'s own cover transform, at every aspect', () => {
    for (const [vw, vh] of SIZES) for (const s of SITES) {
      const fit = Math.max(vw / IMG_W, vh / IMG_H)
      const painted = (vh - IMG_H * fit) / 2 + s.groundY * IMG_H * fit
      expect(fitLayout(vw, vh, s, 5, 5, true).groundPx).toBe(Math.round(painted))
    }
  })

  it('stands the frame ON the ground — its FOOT is the ground line, at every rail count', () => {
    /**
     * ⚠️ ASSERTED AS AN EQUALITY, AND THAT IS THE WHOLE POINT. The first version of this check said
     * `foot <= groundPx`, which reads as perfectly reasonable and **let the real bug straight
     * through**: with the frame centred in the free band it floated in the SKY (measured on screen,
     * rails y 97–615 against a ground line of 576), and a `<=` cannot see that. It also only tested
     * five rails, where the frame happens to fill the band so centred and bottom-anchored coincide —
     * the mutation is only visible when the frame is SHORT relative to the room. RailLine's gate
     * learned the same lesson: a `<=` where the truth is an equality is not a check.
     */
    for (const [vw, vh] of SIZES) for (const s of SITES) for (const rails of [2, 3, 4, 5, 6, 7, 8]) {
      for (const pad of [true, false]) {
        const L = fitLayout(vw, vh, s, 5, rails, pad)
        const wantFoot = Math.min(L.groundPx, vh - L.padBand - 10)
        expect(L.frameTop + rails * L.railPitch).toBe(wantFoot)
      }
    }
  })

  it('keeps the frame ON the painted surface — never climbing into the sky above it', () => {
    /**
     * ⚠️ Anchoring the foot on the ground is only half of it. A tall job then grows UPWARD past the
     * horizon: measured at the station apron, seven trusses put the top one at y = 3 on a 720px
     * frame, i.e. a ladder hanging in mid-air over the sea. The frame never enters the chrome.
     *
     * ⚠️ THE ORIGINAL FORM OF THIS ASSERTION CONFINED THE FRAME TO THE SURFACE, AND THAT IS WHAT
     * MADE IT A DOORMAT — `open_hills` grants 194px of a 720px screen, so the frame was sized to a
     * band a third the height of the room it actually had and used 212 of its 749px of width. It
     * borrows above the surface when it needs the room now; what is still hard is the chrome.
     */
    for (const [vw, vh] of SIZES) for (const s of SITES) for (const rails of [2, 5, 8]) {
      const L = fitLayout(vw, vh, s, 9, rails, true)
      const fit = Math.max(vw / IMG_W, vh / IMG_H)
      const surfaceTop = (vh - IMG_H * fit) / 2 + s.topY * IMG_H * fit
      // On the surface — unless it is shorter than the band the frame needs to draw its rails at
      // full size, where it borrows height above rather than shrink the units. Stated, not hidden.
      const allowed = Math.min(surfaceTop, L.frameTop + rails * L.railPitch - bandWanted(rails, vh))
      expect(L.frameTop).toBeGreaterThanOrEqual(Math.floor(allowed) - 1)
      expect(L.frameTop).toBeGreaterThanOrEqual(bannerBottom(vh))
      /**
       * ⚠️ AND THE BORROW IS BOUNDED — the half of this that shipped broken for one pass. With the
       * band merely freed, a seven-rail `fit` round at the planting field put its top rail at y=160
       * against a horizon of 381: four of seven rails drawn over open sky. Eight rails is the tallest
       * the chapter can draw, so it is the case that must hold.
       */
      expect(L.frameTop).toBeGreaterThanOrEqual(Math.floor(topCeiling(surfaceTop, L.groundPx)) - 1)
    }
  })

  it('gives every site a surface that starts above where it ends', () => {
    for (const s of SITES) expect(s.topY).toBeLessThan(s.groundY)
  })

  it('never lets the frame reach into the controls', () => {
    for (const [vw, vh] of SIZES) for (const s of SITES) for (const pad of [true, false]) {
      const L = fitLayout(vw, vh, s, 9, 8, pad)
      expect(L.frameTop + 8 * L.railPitch).toBeLessThanOrEqual(vh - L.padBand)
    }
  })

  it('keeps the whole frame on screen, at every rail width the chapter can draw', () => {
    for (const [vw, vh] of SIZES) for (const s of SITES) for (const per of [2, 5, 9, 12, 19]) {
      const L = fitLayout(vw, vh, s, per, 5, true)
      expect(L.frameLeft).toBeGreaterThanOrEqual(0)
      expect(L.frameLeft + L.railW).toBeLessThanOrEqual(vw)
      expect(L.frameTop).toBeGreaterThanOrEqual(0)
    }
  })

  it('never lets the frame be laid out behind Milo OR under his bubble', () => {
    // The bubble is much wider than the sprite and sits at the height of the lower rails, which on a
    // `fit` round are the tap targets. RailLine's own fault, gated here before it could ship.
    for (const [vw, vh] of SIZES) for (const s of SITES) for (const rails of [3, 8]) {
      const L = fitLayout(vw, vh, s, 9, rails, true)
      const bubbleRight = Math.max(8, L.miloX - L.miloH * 0.2) + Math.min(vw * 0.4, 380)
      expect(L.frameLeft).toBeGreaterThan(L.miloX)
      expect(L.frameLeft).toBeGreaterThanOrEqual(bubbleRight)
    }
  })

  it('keeps a unit big enough to see and to count', () => {
    for (const [vw, vh] of SIZES) for (const s of SITES) for (const per of [2, 9, 19]) {
      const L = fitLayout(vw, vh, s, per, 6, true)
      expect(L.unitPx).toBeGreaterThanOrEqual(5)
    }
  })

  it('opens a walkway after the tenth position, and only past ten', () => {
    const L10 = fitLayout(1280, 720, SITES[0], 10, 3, true)
    expect(L10.walkway).toBe(0)
    const L12 = fitLayout(1280, 720, SITES[0], 12, 3, true)
    expect(L12.walkway).toBeGreaterThan(0)
    // the break falls BETWEEN the tenth and eleventh, which is what makes it the tens split
    expect(slotX(10, L12) - slotX(9, L12)).toBeGreaterThan(slotX(9, L12) - slotX(8, L12))
    expect(slotX(9, L12) - slotX(8, L12)).toBeCloseTo(slotX(1, L12) - slotX(0, L12), 6)
  })

  it('never overlaps two units on a rail', () => {
    for (const [vw, vh] of SIZES) for (const per of [5, 12, 19]) {
      const L = fitLayout(vw, vh, SITES[0], per, 5, true)
      for (let i = 1; i < per; i++) expect(slotX(i, L) - slotX(i - 1, L)).toBeGreaterThanOrEqual(L.unitPx)
    }
  })
})

describe('the cast and the palette', () => {
  it('gives every site a backdrop and a full set of words', () => {
    for (const s of SITES) {
      expect(s.scene).toMatch(/^\/assets\/backgrounds\/.+\.(png|jpeg)$/)
      for (const k of ['unit', 'units', 'rail', 'rails', 'job', 'label'] as const) {
        expect(s[k].length).toBeGreaterThan(2)
      }
      expect(s.groundY).toBeGreaterThan(0.5)
      expect(s.groundY).toBeLessThan(1)
    }
  })

  it('keeps every unit inside ONE saturation band, so no site can drift out of the painted range', () => {
    // BlockYard's rule: share the saturation and the brightness, vary only the hue.
    const sats = new Set(SITES.map(s => s.sat))
    expect(sats.size).toBeLessThanOrEqual(2)
    for (const s of SITES) {
      expect(s.sat).toBeGreaterThanOrEqual(0.4)
      expect(s.sat).toBeLessThanOrEqual(0.66)
    }
  })

  it('separates every site from its neighbours by hue, so two rounds never look alike', () => {
    for (let i = 0; i < SITES.length; i++) for (let j = i + 1; j < SITES.length; j++) {
      const d = Math.abs(SITES[i].hue - SITES[j].hue)
      expect(Math.min(d, 360 - d)).toBeGreaterThanOrEqual(45)
    }
  })
})
