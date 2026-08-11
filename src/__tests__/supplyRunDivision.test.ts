/**
 * The gate for THE SUPPLY RUN (9–11 `division`).
 *
 * It drives the SAME exported functions the scene renders and grades from — `makeRound`, `grade`,
 * `missFor`, `slotCounts`, `stepCost`, `runLayout`, `pileSpot`, `runOrder` — rather than
 * re-implementing them, because a check that carries its own copy of a rule cannot see the rule
 * being removed. That is this repo's own recorded fault, met twice.
 *
 * ⚠️ THE TWO CHECKS THIS FILE EXISTS FOR, because neither is reachable by playing:
 *   • `a group round always draws MORE slots than the job needs`. FitOut shipped the mirror image —
 *     a frame holding FEWER rails than the answer needed, i.e. 3,357 unwinnable rounds in 60,000
 *     draws, all at a tier that takes several correct answers to reach.
 *   • `a part-dealt round is refused`. The whole design turns on a step the crate cannot cover
 *     being ALLOWED and WRONG; if the grader ever accepted it, the chapter would mark a short crew
 *     as a fair share.
 */
import { describe, it, expect } from 'vitest'
import {
  SITES, runOrder, makeRound, grade, missFor, slotCounts, stepCost, capacityOf,
  runLayout, pileSpot, bubbleW, explainBeats, Q_ALL, MAX_LOAD, MAX_SLOTS, MILO_VAL, IMG_W, IMG_H, CTRL_BAND, topCeiling,
  dealAsk, CAM_W, CAM_BOTTOM, bottomBand, laneMinW, type DvRound, type LaneState,
} from '@/features/chapters/story/SupplyRun'
import { bannerBottom } from '@/features/chapters/story/yard'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PUBLIC = join(process.cwd(), 'public')
const SRC = join(process.cwd(), 'src/features/chapters/story/SupplyRun.tsx')
/** ⚠️ COMMENTS STRIPPED FIRST. This file's own recorded fault is a source check that matched the
 *  PROSE explaining a rule instead of the code obeying it — a `toContain('setSettled(false)')` that
 *  passed its mutation because it found the sentence describing the line. */
const code = readFileSync(SRC, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const TIERS = [1, 2, 3] as const
const draw = (n: number, fn: (q: DvRound, i: number) => void) => {
  for (const d of TIERS) for (let i = 0; i < n; i++) fn(makeRound(d, i % 16, []), i)
}

describe('the run order', () => {
  it('never shows the same site twice in a row', () => {
    for (let t = 0; t < 1500; t++) {
      const r = runOrder(16)
      for (let i = 1; i < r.length; i++) expect(r[i]).not.toBe(r[i - 1])
    }
  })

  it('uses every site inside the first four slots, so none is starved', () => {
    for (let t = 0; t < 1500; t++) expect(new Set(runOrder(16).slice(0, 4)).size).toBe(SITES.length)
  })
})

describe('the question', () => {
  it('always reconciles: steps × what a step costs, plus what will not go round, is the load', () => {
    draw(4000, q => expect(q.answer * stepCost(q) + q.rem).toBe(q.total))
  })

  it('never leaves a remainder big enough to go round again — that is what "remainder" means', () => {
    draw(4000, q => {
      expect(q.rem).toBeGreaterThanOrEqual(0)
      expect(q.rem).toBeLessThan(stepCost(q))
    })
  })

  it('is always exact at the first tier — a remainder is a second idea and comes after the act', () => {
    for (let i = 0; i < 3000; i++) expect(makeRound(1, i % 16, []).rem).toBe(0)
  })

  it('asks for at least two steps, so "deal it once" is never the whole answer', () => {
    draw(4000, q => expect(q.answer).toBeGreaterThanOrEqual(2))
  })

  it('keeps the pile countable — the old chapter drew forty nodes at twelve pixels', () => {
    draw(4000, q => {
      expect(q.answer * stepCost(q)).toBeLessThanOrEqual(MAX_LOAD)
      expect(q.total).toBeLessThanOrEqual(MAX_LOAD + 6)
    })
  })

  it('ALWAYS draws a spare slot on a group round, so nothing on screen says "that is enough"', () => {
    draw(6000, q => {
      if (q.qType !== 'group') return
      expect(q.slotsShown).toBeGreaterThan(q.answer)
    })
  })

  /** ⚠️ ONLY A GROUP ROUND. On a SHARE round the answer is how many EACH gets — a depth, not a
   *  count of slots — so `slotsShown >= answer` is not a claim about it and asserting it there
   *  fails on any round that shares deeply between few receivers (3 vans, 4 each). */
  it('draws EVERY slot a group round needs — a bench short of the answer cannot be completed', () => {
    draw(6000, q => { if (q.qType === 'group') expect(q.slotsShown).toBeGreaterThanOrEqual(q.answer) })
  })

  it('never draws more slots than the bench may hold', () => {
    draw(4000, q => expect(q.slotsShown).toBeLessThanOrEqual(MAX_SLOTS))
  })

  it('draws exactly the receivers on a share round — they ARE the divisor and are given', () => {
    draw(4000, q => { if (q.qType === 'share') expect(q.slotsShown).toBe(q.groups) })
  })

  it('costs a step the divisor, whichever way the division is read', () => {
    draw(3000, q => expect(stepCost(q)).toBe(q.qType === 'share' ? q.groups : q.per))
  })

  it('reaches the other reading of division above the first tier, and reaches it there', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 3000; i++) { seen.add(makeRound(2, i % 16, []).qType); seen.add(makeRound(3, i % 16, []).qType) }
    expect(seen).toEqual(new Set(['share', 'group']))
    for (let i = 0; i < 800; i++) expect(makeRound(1, i % 16, []).qType).toBe('share')
  })

  it('spends a scarce round on a type the child has NOT met yet', () => {
    for (let i = 0; i < 400; i++) expect(makeRound(3, i % 16, ['group']).qType).toBe('share')
    for (let i = 0; i < 400; i++) expect(makeRound(2, i % 16, ['share']).qType).toBe('group')
  })

  it('declares every type it can generate, or the coverage gate withholds mastery for ever', () => {
    const seen = new Set<string>()
    draw(3000, q => seen.add(q.qType))
    expect(seen).toEqual(new Set(Q_ALL))
  })

  it('leaves room in a slot for the over-deal that a share round allows', () => {
    draw(3000, q => {
      const max = Math.max(...slotCounts(q, q.total))
      expect(capacityOf(q)).toBeGreaterThanOrEqual(max)
    })
  })
})

describe('dealing', () => {
  it('conserves the load — what has left the crate is exactly what is in the slots', () => {
    draw(700, q => {
      for (let handed = 0; handed <= q.total; handed++) {
        expect(slotCounts(q, handed).reduce((a, b) => a + b, 0)).toBe(handed)
      }
    })
  })

  it('gives every receiver the same after a whole round, and only then', () => {
    draw(700, q => {
      if (q.qType !== 'share') return
      for (let k = 0; k <= q.answer; k++) {
        expect(new Set(slotCounts(q, k * q.groups))).toEqual(new Set([k]))
      }
    })
  })

  it('fills one receiver at a time when grouping, and leaves the rest untouched', () => {
    draw(700, q => {
      if (q.qType !== 'group') return
      for (let k = 0; k <= q.answer; k++) {
        const c = slotCounts(q, k * q.per)
        expect(c.filter(n => n === q.per)).toHaveLength(k)
        expect(c.filter(n => n === 0)).toHaveLength(q.slotsShown - k)
      }
    })
  })

  it('SHOWS a part-dealt round as unequal — that is the only thing telling the child it is wrong', () => {
    draw(900, q => {
      if (q.rem === 0) return
      const c = slotCounts(q, q.total)
      if (q.qType === 'share') expect(new Set(c).size).toBeGreaterThan(1)      // somebody has more
      else expect(c.some(n => n > 0 && n < q.per)).toBe(true)                  // one is part-filled
    })
  })

  it('never puts more in a receiver than it can hold', () => {
    draw(700, q => {
      for (let handed = 0; handed <= q.total; handed++) {
        for (const n of slotCounts(q, handed)) expect(n).toBeLessThanOrEqual(capacityOf(q))
      }
    })
  })
})

describe('the teaching', () => {
  /**
   * ⚠️ THIS FOUND THE CHAPTER'S OWN LESSON TEACHING THE OPPOSITE OF ITS RULE. The "what is left
   * over" beat dealt the WHOLE crate, so the demo showed the remainder sitting in a van while Milo
   * said it stayed behind. It was caught by reading a live trace, not by any check — the words were
   * correct and only the numbers disagreed.
   */
  it('NEVER deals the remainder — the crate must finish holding exactly what will not go round', () => {
    draw(900, q => {
      const bs = explainBeats(q)
      for (const b of bs) expect(b.handed).toBeLessThanOrEqual(q.answer * stepCost(q))
      expect(q.total - bs[bs.length - 1].handed).toBe(q.rem)
    })
  })

  it('deals one whole step per beat, and works up to the completed deal', () => {
    draw(900, q => {
      const bs = explainBeats(q)
      expect(bs[0].handed).toBe(0)
      for (const b of bs) expect(b.handed % stepCost(q)).toBe(0)
      expect(Math.max(...bs.map(b => b.handed))).toBe(q.answer * stepCost(q))
    })
  })

  /**
   * ⚠️ THE RE-TEACH IS THIS SAME LIST, AND `reteachAfter: 3` MEANS A CHILD WHO CANNOT MAKE THE
   * GESTURE READ GETS THREE WRONG ANSWERS AND THEN A LESSON ABOUT DIVISION — a motor failure
   * diagnosed and re-taught as a mathematical one. On the camera path the teaching names the sweep;
   * on the tap path it must not, or it addresses the wrong child.
   */
  it('teaches the SWEEP on the camera path and never mentions it on the tap path', () => {
    draw(400, q => {
      const tap = explainBeats(q).map(b => b.say).join(' ')
      const cam = explainBeats(q, true).map(b => b.say).join(' ')
      expect(tap).not.toMatch(/sweep/i)
      expect(cam).toMatch(/sweep/i)
    })
  })

  it('teaches the gesture without disturbing what the demo deals', () => {
    draw(400, q => {
      const tap = explainBeats(q), cam = explainBeats(q, true)
      const full = q.answer * stepCost(q)
      for (const b of cam) expect(b.handed).toBeLessThanOrEqual(full)
      expect(cam[cam.length - 1].handed).toBe(tap[tap.length - 1].handed)
      // every line still fits the self-paced dwell's own ceiling
      for (const b of cam) expect(b.say.length).toBeLessThanOrEqual(88)
    })
  })

  it('says out loud that something stays behind exactly when something does', () => {
    draw(900, q => {
      const said = explainBeats(q).map(b => b.say).join(' ').toLowerCase()
      expect(/stay(s)? (in the crate|behind)/.test(said)).toBe(q.rem > 0)
    })
  })
})

describe('grading', () => {
  it('accepts the completed deal and refuses one step either side of it', () => {
    draw(1200, q => {
      const full = q.answer * stepCost(q)
      expect(grade(q, full)).toBe(true)
      expect(grade(q, full - stepCost(q))).toBe(false)
      expect(grade(q, 0)).toBe(false)
    })
  })

  it('REFUSES a part-dealt round — a short crew is not a fair share', () => {
    draw(1200, q => {
      if (q.rem === 0) return
      expect(grade(q, q.total)).toBe(false)          // they emptied the crate, leaving someone short
      expect(grade(q, q.answer * stepCost(q))).toBe(true)
    })
  })

  it('never states the answer OR the remainder in the miss line — both are being asked for', () => {
    draw(1500, q => {
      const full = q.answer * stepCost(q)
      for (const handed of [0, stepCost(q), q.total]) {
        if (handed === full) continue
        const line = missFor(q, handed)
        const nums = (line.match(/\d+/g) ?? []).map(Number)
        expect(nums).not.toContain(q.answer)
        if (q.rem > 0) expect(nums).not.toContain(q.rem)
      }
    })
  })

  it('tells the child WHICH way they are wrong, so a miss is information', () => {
    draw(900, q => {
      const full = q.answer * stepCost(q)
      const under = missFor(q, full - stepCost(q))
      expect(under.toLowerCase()).toMatch(/still enough/)
      if (q.rem > 0) expect(missFor(q, q.total)).not.toBe(under)
    })
  })
})

describe('the retry loop', () => {
  /**
   * ⚠️ THE FAULT THIS PINS WAS LIVE ON PRODUCTION IN FITOUT AND NO GATE COULD SEE IT: the miss
   * branch cleared the board and never reset the flag every control is gated on, so one wrong
   * answer left the child looking at the question with nothing responding, for ever. The suite
   * drives pure functions; that was component state, and a wrong answer had never been played.
   */
  it('re-opens the board after a wrong answer — the miss reset must clear `settled`', () => {
    const miss = code.slice(code.indexOf('erred.current = true'))
    expect(miss).toMatch(/setSettled\(false\)/)
    expect(miss.indexOf('setSettled(false)')).toBeLessThan(miss.indexOf('function deal'))
  })

  it('gates the deal, the undo and the commit on that same flag, so one reset re-opens all three', () => {
    for (const fn of ['function deal()', 'function undo()', 'function send()']) {
      const body = code.slice(code.indexOf(fn), code.indexOf(fn) + 320)
      expect(body).toMatch(/if \(done\.current \|\| settled[^)]*\) return/)
    }
  })

  /**
   * ⚠️ THE DEAL BUTTON MUST NOT GO DEAD AT THE MOMENT THE ANSWER IS REACHED. If it disabled itself
   * once the crate could no longer cover a whole step, the button would be doing the division —
   * deciding when to stop is the entire skill. It may only go dead on an EMPTY crate, where it
   * genuinely has nothing to do and the empty crate on screen says why.
   */
  it('only disables the deal on an empty crate — never when a step no longer fits', () => {
    const btn = code.slice(code.indexOf('onClick={deal}'), code.indexOf('onClick={deal}') + 200)
    expect(btn).toMatch(/disabled=\{handed >= data\.total\}/)
    expect(btn).not.toMatch(/stepCost|cost\b/)
  })
})

describe('an empty receiver gives nothing away', () => {
  /**
   * ⚠️ THE LEAK THIS PINS WAS FOUND WHILE FIXING THE OPPOSITE PROBLEM. A receiver's BOX is
   * `slotRows × pitch` tall, and on a share round its capacity is `answer + 1` — so the box height
   * IS the answer. The ground tint under it was written `top: -pitch*0.15 … bottom: -pitch*0.34`,
   * which spans the whole box, so an empty receiver glowed visibly taller on a round with a bigger
   * answer, before the child had dealt anything. Every drawn part is anchored to the BASE and sized
   * from `pitch` alone now.
   */
  /** Only what is DRAWN — the tint, the base and the posts. The wrapper's own `top: L.foot - h` is
   *  the box's position and is the one legitimate use of the height. */
  const chrome = code.slice(code.indexOf("zIndex: 30 }}>"), code.indexOf('{Array.from({ length: n })'))

  it("never draws any part of the box to the box's own height — that height is the answer", () => {
    expect(chrome).not.toMatch(/\btop:/)               // anchoring to the top ties it to the box
    expect(chrome).not.toMatch(/height: h\b|\bh \*|\* h\b/)
    expect(chrome).not.toMatch(/rows|capacity/)
  })

  it('sizes the base and the posts from the pitch alone', () => {
    expect(code).toMatch(/postH = Math\.round\(L\.pitch \* [\d.]+\)/)
    expect(chrome).toMatch(/height: L\.pitch \* [\d.]+/)
  })

  /** ⚠️ AND IT MUST NOT FADE WHEN EMPTY. An empty receiver carries the whole question — where the
   *  units are going — so it reads at its clearest with nothing in it. A `dim` prop did the
   *  opposite and made two empty kits into faint scratches on a wooden bench. */
  it('never fades a receiver for being empty', () => {
    expect(code).not.toMatch(/dim=\{/)
  })
})

describe('the cast', () => {
  it('gives every site a backdrop, a unit sprite and a full set of words — all on disk', () => {
    for (const s of SITES) {
      /** ⚠️ A MISSING SPRITE DEGRADES TO A COLOURED BLOCK; A MISSING BACKDROP FALLS BACK TO
       *  NOTHING. FitOut's suite pinned the sprites and not the scenes for exactly one session. */
      expect(existsSync(join(PUBLIC, s.scene)), `${s.id} scene`).toBe(true)
      expect(existsSync(join(PUBLIC, s.sprite)), `${s.id} sprite`).toBe(true)
      for (const k of ['label', 'emoji', 'unit', 'units', 'slot', 'slots', 'job'] as const) {
        expect(String(s[k]).length, `${s.id}.${k}`).toBeGreaterThan(0)
      }
      expect(s.topY).toBeLessThan(s.groundY)
    }
  })

  it('gives each site its OWN unit and its OWN scene — four sites sharing one is one site', () => {
    expect(new Set(SITES.map(s => s.sprite)).size).toBe(SITES.length)
    expect(new Set(SITES.map(s => s.scene)).size).toBe(SITES.length)
    expect(new Set(SITES.map(s => s.units)).size).toBe(SITES.length)
  })

  /**
   * ⚠️ THE CHECK THAT MATTERS IS UNIT-AGAINST-ITS-OWN-SCENE, NOT UNIT-AGAINST-UNIT. Two units are
   * never on screen together — the site changes per round — so a shared hue between them costs
   * nothing, and asserting it flagged the teal-taped parcel (180°) against the steel cog (195°),
   * which differ in shape, in material and in what most of their pixels are. What a child cannot
   * recover from is a unit that vanishes into the picture it is standing in. Measured off the
   * generated files: parcel 150° · cell 120° · tin 120° · cog 165° clear of their own scenes.
   */
  it('separates every unit from THE SCENE IT STANDS IN, so the pile stays countable', () => {
    for (const s of SITES) {
      const d = Math.abs(s.hue - s.sceneHue)
      expect(Math.min(d, 360 - d), `${s.id}: unit ${s.hue}° vs scene ${s.sceneHue}°`).toBeGreaterThanOrEqual(45)
    }
  })

  /**
   * ⚠️ THE RULE THIS REPO HAS PAID FOR TWICE. `grocery_sweets` measured 0.892 and the founder saw
   * the cast turn into cut-outs on a blank page; FitOut's planting field measured 0.728 against
   * Milo's 0.705 — very slightly brighter than its own character — and was replaced for it.
   * Measured over each site's own bench band: 0.501 · 0.513 · 0.533 · 0.359.
   *
   * (A scene-against-scene HUE check was written here first and dropped: two backdrops are never on
   * screen together, and it flagged an amber dispatch hall against a brick-red workshop that share
   * nothing but a warm cast. Distinctness between scenes is what the eye check is for; this is the
   * number that decides whether a chapter is legible at all.)
   */
  it('never lets a backdrop be brighter than the character standing on it', () => {
    for (const s of SITES) {
      expect(s.sceneVal, `${s.id} scene value vs Milo ${MILO_VAL}`).toBeLessThan(MILO_VAL)
    }
  })
})

// ─── Layout ─────────────────────────────────────────────────────────────────────────────
const SIZES: Array<[number, number]> = [
  [1280, 720], [1024, 620], [1440, 900], [1800, 870], [2000, 970], [2560, 1080],
  [1920, 800], [900, 500], [740, 360], [667, 375], [640, 320],
]
/** One round of each shape at each extreme the generator can reach. */
const SHAPES: DvRound[] = [
  { ...makeRound(1, 0, []), qType: 'share', total: 6, groups: 3, per: 2, rem: 0, slotsShown: 3, answer: 2 },
  { ...makeRound(3, 1, []), qType: 'share', total: 29, groups: 6, per: 4, rem: 5, slotsShown: 6, answer: 4 },
  { ...makeRound(2, 2, []), qType: 'group', total: 8, groups: 4, per: 2, rem: 0, slotsShown: 6, answer: 4 },
  { ...makeRound(3, 3, []), qType: 'group', total: 23, groups: 7, per: 3, rem: 2, slotsShown: 7, answer: 7 },
]

describe('layout', () => {
  const each = (fn: (L: ReturnType<typeof runLayout>, q: DvRound, vw: number, vh: number) => void) => {
    for (const [vw, vh] of SIZES) for (const base of SHAPES) for (const site of SITES) {
      const q = { ...base, site }
      fn(runLayout(vw, vh, q), q, vw, vh)
    }
  }
  /** …and the same sweep with the camera on, where the bench has one more layer to clear. */
  const eachCam = (fn: (L: ReturnType<typeof runLayout>, q: DvRound, vw: number, vh: number) => void) => {
    for (const [vw, vh] of SIZES) for (const base of SHAPES) for (const site of SITES) {
      const q = { ...base, site }
      fn(runLayout(vw, vh, q, true), q, vw, vh)
    }
  }

  /**
   * ⚠️ A SHARE OF THE IMAGE IS NOT A SHARE OF THE VIEWPORT. RailLine drew `vh * groundY` over an
   * `object-fit: cover` backdrop and floated its train 44px above the painted rail on a 2000×970
   * window; every check it had was taken at the one aspect where the two agree. Asserted EXACTLY —
   * a `<=` "or clamped upward" version of this let the original bug straight through.
   */
  it("maps the ground line through the backdrop's own cover transform, at every aspect", () => {
    each((L, q, vw, vh) => {
      const fit = Math.max(vw / IMG_W, vh / IMG_H)
      const drawnH = IMG_H * fit
      expect(L.groundPx).toBe(Math.round((vh - drawnH) / 2 + q.site.groundY * drawnH))
    })
  })

  it('stands the bench ON that line, and yields to the controls only when it must', () => {
    each((L, q, vw, vh) => {
      expect(L.foot).toBe(Math.round(Math.min(L.groundPx, vh - CTRL_BAND(vh) - 10)))
    })
  })

  it('never lets the bench reach into the chrome above it', () => {
    each((L, q, vw, vh) => expect(L.benchTop).toBeGreaterThanOrEqual(bannerBottom(vh) + 8 - 1))
  })

  it('never lets the bench reach into the controls below it', () => {
    each((L, q, vw, vh) => expect(L.foot).toBeLessThanOrEqual(vh - CTRL_BAND(vh) - 10))
  })

  /** ⚠️ Freeing the band so a short job can be a decent size is what let FitOut grow a seven-rail
   *  job over open sky for one pass. The borrow is bounded in the SURFACE's own terms. */
  it('bounds how far the bench may borrow above the painted surface', () => {
    each((L, q, vw, vh) => {
      const fit = Math.max(vw / IMG_W, vh / IMG_H)
      const drawnH = IMG_H * fit
      const surfaceTop = (vh - drawnH) / 2 + q.site.topY * drawnH
      expect(L.benchTop).toBeGreaterThanOrEqual(Math.round(topCeiling(surfaceTop, L.groundPx)) - 1)
    })
  })

  it('never lays the bench behind Milo OR under his speech bubble', () => {
    each((L, q, vw) => {
      const bubbleRight = Math.max(8, L.miloX - L.miloH * 0.2) + bubbleW(vw)
      expect(L.crateX).toBeGreaterThanOrEqual(Math.min(bubbleRight, vw * 0.15) - 1)
    })
  })

  it("keeps Milo's bubble clear of the bottom control band", () => {
    each((L, q, vw, vh) => expect(L.bubbleBottom).toBeGreaterThanOrEqual(Math.min(CTRL_BAND(vh) + 16, vh - 46 - 88)))
  })

  it('never overlaps the crate with the first receiver', () => {
    each(L => expect(L.slotX0).toBeGreaterThan(L.crateX + L.crateW))
  })

  it('never overlaps two receivers, and keeps the last one on screen', () => {
    each((L, q, vw) => {
      expect(L.slotStep).toBeGreaterThan(L.slotW)
      expect(L.slotX0 + (q.slotsShown - 1) * L.slotStep + L.slotW).toBeLessThanOrEqual(vw)
    })
  })

  it('keeps a unit big enough to see and to count', () => {
    each((L, q, vw, vh) => {
      /**
       * ⚠️ THE SHORT-FRAME FLOOR IS 12px AND THAT IS A STATED COST, NOT A PASS. At 640×320 the
       * chrome takes 132px of 320 and the controls 84, leaving ~104px of world — so the largest
       * job (29 units, five rows deep) draws 12px units at the two low-bench sites. FitOut carries
       * the same limit as an open item (its rails are 16–19px there). The DESIGN sizes are what
       * this pins hard; the shortest frames are recorded rather than claimed to be fine.
       */
      expect(L.unitPx).toBeGreaterThanOrEqual(vh >= 600 ? 26 : 12)
    })
  })

  /**
   * ⚠️ THE CHECK THAT WOULD HAVE CAUGHT WHAT MY EYE CAUGHT. Before the column shape was searched,
   * the parts bench drew 30px cogs inside a bench using 36 of the 107px per column it had in
   * height — sized to the SHORT dimension with half the wall above it empty, which is FitOut's
   * doormat fault with the axes swapped. A unit-size floor alone does not see it, because 30px
   * passes; what does is asking whether the bench USES the room it was given.
   */
  it('never sizes the bench to the short dimension — the doormat fault, either axis', () => {
    for (const [vw, vh] of SIZES) {
      if (vh < 600) continue
      for (const base of SHAPES) for (const site of SITES) {
        const q = { ...base, site }
        const L = runLayout(vw, vh, q)
        const usedW = L.slotX0 + (q.slotsShown - 1) * L.slotStep + L.slotW - L.crateX
        const usedH = L.foot - L.benchTop
        expect(usedW / vw, `${site.id} ${q.qType} ${vw}x${vh} width share`).toBeGreaterThan(0.40)
        expect(usedH, `${site.id} ${q.qType} ${vw}x${vh} height used`).toBeGreaterThan(vh * 0.14)
      }
    }
  })

  it('never draws a unit taller than the character holding it', () => {
    each(L => expect(L.unitPx).toBeLessThan(L.miloH))
  })

  it('never overlaps two units in a pile, and keeps every one inside its box', () => {
    each((L, q) => {
      const cols = L.crateCols
      const rows = Math.ceil(q.total / cols)
      const seen = new Set<string>()
      for (let i = 0; i < q.total; i++) {
        const p = pileSpot(i, cols, rows, L)
        expect(seen.has(`${p.x}|${p.y}`)).toBe(false)
        seen.add(`${p.x}|${p.y}`)
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.x + L.unitPx).toBeLessThanOrEqual(L.crateW + 1)
        expect(p.y + L.unitPx).toBeLessThanOrEqual(L.crateH + 1)
      }
    })
  })

  it('stacks a pile from the BOTTOM up — a heap that grows downward is not a heap', () => {
    each((L, q) => {
      const rows = Math.ceil(q.total / L.crateCols)
      if (rows < 2) return
      expect(pileSpot(0, L.crateCols, rows, L).y).toBeGreaterThan(pileSpot(L.crateCols, L.crateCols, rows, L).y)
    })
  })
})


// ─────────────────────────────────────────────────────────────────────────────────────────
// THE SWEEP — the camera path. See `src/__tests__/sweepReader.test.ts` for the detector itself;
// everything here is about the CHAPTER: that the hand and the button are one instrument, that the
// one control still names which division is being done, and that the camera's own panel does not
// land on the thing the child is counting.
// ─────────────────────────────────────────────────────────────────────────────────────────

describe('the sweep, as an answer surface', () => {
  const TYPES: DvRound['qType'][] = ['share', 'group']
  const STATES: LaneState[] = ['ready', 'return', 'empty']
  const round = (qType: DvRound['qType'], site = SITES[0]) => ({ ...SHAPES[0], qType, site } as DvRound)

  /**
   * ⚠️ THE ONE CONTROL IS THE ONLY PLACE ON SCREEN THAT NAMES WHICH READING IS BEING ASKED — the
   * bubble carries the site's motto, not the question. A round-type-blind label on the camera path
   * would say "deal" over a bench where a step FILLS ONE receiver, which is the craft doc's
   * *adding an input means re-wording every line that names a gesture*, arriving through the other
   * door: the wording is not wrong, it addresses the wrong reading.
   */
  it('names a DIFFERENT act for the two readings, on BOTH input paths', () => {
    for (const site of SITES) {
      expect(dealAsk(round('share', site), false)).not.toBe(dealAsk(round('group', site), false))
      expect(dealAsk(round('share', site), true)).not.toBe(dealAsk(round('group', site), true))
    }
  })

  it('names what the site actually calls its receivers, so the words match the picture', () => {
    for (const site of SITES) {
      expect(dealAsk(round('group', site), false)).toContain(site.slot)
      expect(dealAsk(round('group', site), true)).toContain(site.slot)
      expect(dealAsk(round('share', site), true)).toContain(site.slot)
    }
  })

  /**
   * ⚠️ ASSERTED IN BOTH DIRECTIONS, because a renderer that ignores its input passes every
   * one-directional check. Factor Lab shipped every chip saying "hold up that many fingers" on a
   * path answered by tapping, and nothing failed — the wording was not wrong, it addressed the
   * wrong child.
   */
  it('never asks a tapping child to sweep, and never asks a sweeping child to tap the deal', () => {
    for (const qType of TYPES) for (const site of SITES) {
      expect(dealAsk(round(qType, site), false)).not.toMatch(/sweep|hand/i)
      expect(dealAsk(round(qType, site), true, 'ready')).not.toMatch(/\btap\b/i)
      expect(dealAsk(round(qType, site), true, 'ready')).toMatch(/sweep/i)
    }
  })

  /**
   * ⚠️ THE STATE A CHILD IS MOST LIKELY TO BE IN ON THEIR FIRST TRY. A right hand at rest sits
   * around x 0.63–0.67, i.e. already past the fire line, so pushing further right crosses nothing
   * and the surface does nothing. FitOut paid for exactly this with `handHint` — a guard that is
   * correct and silent is a dead button.
   */
  it('tells the child to bring the hand back when a crossing cannot fire', () => {
    for (const qType of TYPES) {
      const back = dealAsk(round(qType), true, 'return')
      expect(back).toMatch(/back|left/i)
      expect(back).not.toBe(dealAsk(round(qType), true, 'ready'))
    }
  })

  /**
   * ⚠️ AN EMPTY CRATE IS VISIBLE ON THE TAP PATH — the button dims and the empty crate on screen
   * says why. On the camera path a swallowed sweep is silent, so the label has to carry it, AND it
   * has to name the tap that finishes the round, because Send stays a tap.
   */
  it('says what to do when the crate is empty, and names the tap that commits', () => {
    for (const qType of TYPES) {
      const empty = dealAsk(round(qType), true, 'empty')
      expect(empty).toMatch(/empty/i)
      expect(empty).toMatch(/send it out/i)
    }
  })

  it('gives every state its own words — three states reading alike is one state', () => {
    for (const qType of TYPES) {
      const said = STATES.map(st => dealAsk(round(qType), true, st))
      expect(new Set(said).size).toBe(STATES.length)
    }
  })

  /**
   * ⚠️ THE ANSWER-SPACE SWEEP, the same check the ten-finger ceiling makes: a round whose answer
   * the surface cannot express is unanswerable, which is worse than a wrong one. Unlike a finger
   * count, a repetition count has no ceiling — but assert it rather than assume it, and assert the
   * ERGONOMIC bound too, because this is the most repeated gesture in the band.
   */
  it('can express every answer the generator draws, in a humane number of sweeps', () => {
    let most = 0
    draw(4000, q => {
      const needed = q.answer                       // one sweep per completed step
      expect(needed).toBeGreaterThanOrEqual(2)
      expect(needed).toBeLessThanOrEqual(MAX_SLOTS)
      most = Math.max(most, needed)
    })
    expect(most).toBeLessThanOrEqual(8)
  })

  /**
   * ⚠️ THE DIRECTION IS THE MATHS. A left→right sweep is only honest because the crate is drawn
   * LEFT of the receivers and the units already fly that way; reversed, the gesture would be a
   * hand-shaped button. True by construction (`slotX0 = crateX + crateW + gap`) and pinned anyway,
   * so a future layout rewrite fails loudly instead of silently inverting the teaching.
   */
  it('always draws the crate LEFT of the receivers, so a sweep travels the way the goods do', () => {
    for (const cam of [false, true]) {
      for (const [vw, vh] of SIZES) for (const base of SHAPES) for (const site of SITES) {
        const q = { ...base, site } as DvRound
        const L = runLayout(vw, vh, q, cam)
        expect(L.crateX + L.crateW, `${site.id} ${vw}x${vh} cam=${cam}`).toBeLessThan(L.slotX0)
      }
    }
  })
})

describe('the self-view is a layer, and it is crossed with every other', () => {
  const camBox = (vw: number, vh: number) => {
    const short = vh < 470
    const w = CAM_W(short), h = w * 0.75, b = CAM_BOTTOM(short)
    return { left: vw - 10 - w, right: vw - 10, top: vh - b - h, bottom: vh - b }
  }

  /**
   * ⚠️ MEASURED, NOT FEARED: at the 190px self-view the other AR chapters use, this bench ran under
   * the camera panel in **584 of 1440 sampled draws** — worst case a 173×70px opaque block over the
   * rightmost receivers at 740×480, in the chapter whose whole question is how many each got. The
   * panel is `zIndex: 36` and the bench `zIndex: 30`, so it wins. Two changes fixed it and both are
   * needed: a smaller panel, and a bottom reserve that knows about it.
   */
  it('never lets the camera panel cover the crate or a receiver', () => {
    for (const [vw, vh] of SIZES) for (const base of SHAPES) for (const site of SITES) {
      const q = { ...base, site } as DvRound
      const L = runLayout(vw, vh, q, true)
      const c = camBox(vw, vh)
      const benchRight = L.slotX0 + (q.slotsShown - 1) * L.slotStep + L.slotW
      const benchTop = L.foot - Math.max(L.crateH, L.slotH)
      const overX = Math.min(benchRight, c.right) - Math.max(L.crateX, c.left)
      const overY = Math.min(L.foot, c.bottom) - Math.max(benchTop, c.top)
      expect(overX > 0 && overY > 0, `${site.id} ${q.qType} ${vw}x${vh} → ${Math.round(overX)}x${Math.round(overY)}px`).toBe(false)
    }
  })

  it('reserves the panel out of the bottom band rather than hoping the bench misses it', () => {
    for (const [, vh] of SIZES) {
      expect(bottomBand(vh, true)).toBeGreaterThanOrEqual(bottomBand(vh, false))
      expect(bottomBand(vh, true)).toBeGreaterThanOrEqual(CAM_W(vh < 470) * 0.75 + CAM_BOTTOM(vh < 470))
    }
  })

  /** ⚠️ The tap path must be BYTE-IDENTICAL to what shipped — the camera costs nothing to a child
   *  who is not using it. */
  it('changes nothing at all for a child answering with taps', () => {
    for (const [, vh] of SIZES) expect(bottomBand(vh, false)).toBe(CTRL_BAND(vh) + 10)
    for (const [vw, vh] of SIZES) for (const base of SHAPES) for (const site of SITES) {
      const q = { ...base, site } as DvRound
      expect(runLayout(vw, vh, q, false)).toEqual(runLayout(vw, vh, q))
    }
  })

  /**
   * ⚠️ THE ROW DOES NOT WRAP, SO IT HAS TO FIT — and it nearly did not. The camera path widens the
   * deal into a lane AND gives the self-view its corner back, and at 640×320 the first draft came to
   * 641px of a 640px frame: an overflow on the chapter's only answer surface, at the smallest size,
   * which no unit-size or overlap check would have seen.
   */
  it('fits the whole control row inside the frame, with the camera corner reserved', () => {
    for (const [vw, vh] of SIZES) {
      const btnH = Math.round(CTRL_BAND(vh) * 0.5)
      const gap = Math.round(btnH * 0.28)
      const deal = laneMinW(vw, btnH)          // ⚠️ the SAME function the control is sized by
      // the two taps, measured generously from their own font and padding
      const tap = (chars: number) => chars * Math.round(btnH * 0.3) * 0.62 + Math.round(btnH * 0.5) * 2
      const row = tap('↩ Take it back'.length) + deal + tap('Send it out ✓'.length) + gap * 2
      const pad = 10 + CAM_W(vh < 470) + 18
      expect(row + pad, `${vw}x${vh}`).toBeLessThanOrEqual(vw)
    }
  })

  /** The camera may cost a pixel of unit size; it may not cost countability. */
  it('keeps a unit countable on the camera path too', () => {
    for (const [vw, vh] of SIZES) for (const base of SHAPES) for (const site of SITES) {
      const q = { ...base, site } as DvRound
      const L = runLayout(vw, vh, q, true)
      expect(L.unitPx, `${site.id} ${vw}x${vh}`).toBeGreaterThanOrEqual(vh >= 600 ? 24 : 12)
    }
  })
})

describe('the sweep is wired to the SAME deal the button fires', () => {
  it('reads a sweep, not a count or a tilt — the wrong one is a silent dead button', () => {
    expect(code).toMatch(/reads:\s*'sweep'/)
  })

  /**
   * ⚠️ THREE PROPERTIES OF THE EFFECT, ALL OF THEM A BUG IF MISSING, AND NONE REACHABLE BY PLAYING:
   *  • it loops the GAP, or two sweeps coalesced into one render deal once and one is lost;
   *  • it advances the baseline OUTSIDE the loop, or sweeps swallowed during the 2400ms miss window
   *    replay as a backlog onto a freshly reset crate;
   *  • it clamps BACKWARDS, because `useTaps` and a camera restart both reset the counter to 0 and
   *    a stranded baseline kills the gesture for the rest of the run.
   */
  it('loops the gap, advances the baseline unconditionally, and clamps a backwards counter', () => {
    const i = code.indexOf('seenSweeps')
    expect(i).toBeGreaterThan(-1)
    const block = code.slice(i, i + 700)
    expect(block).toMatch(/read\.sweeps\s*<\s*seenSweeps\.current/)          // the clamp
    expect(block).toMatch(/for\s*\(let i = seenSweeps\.current; i < read\.sweeps; i\+\+\) deal\(\)/)
    // the assignment is NOT inside the loop body
    expect(block).toMatch(/\}\s*\n\s*seenSweeps\.current = read\.sweeps/)
  })

  /** ⚠️ Reaching down to a tap and back is a rightward move, i.e. a fire, landing at the exact
   *  moment the child is committing. Both tap handlers arm the lock. */
  it('locks the sweep briefly around the two controls that stay taps', () => {
    for (const fn of ['function undo()', 'function send()']) {
      const b = code.slice(code.indexOf(fn), code.indexOf(fn) + 260)
      expect(b, fn).toMatch(/lockUntil\.current = Date\.now\(\)/)
    }
    expect(code).toMatch(/Date\.now\(\) >= lockUntil\.current/)
  })

  /**
   * ⚠️ THE DEAL STAYS ONE TAPPABLE CONTROL ON BOTH PATHS. Replacing it with a display-only lane
   * makes a round UNSUBMITTABLE the moment a working camera fails to read a gesture: send() and
   * undo() are both disabled at `handed === 0`, SkillBeat has no round timeout, and CamGate renders
   * only when the camera did not START. The only control left would be ‹ Menu.
   */
  it('keeps the deal a real button the child can still tap when the gesture will not read', () => {
    const i = code.indexOf('onClick={deal}')
    expect(i).toBeGreaterThan(-1)
    // it is a real <button>, not a display-only lane…
    expect(code.slice(i - 40, i)).toMatch(/<button/)
    // …it goes dead ONLY on an empty crate…
    expect(code.slice(i, i + 200)).toContain('disabled={handed >= data.total}')
    // …and it says the right thing for the round type AND the input.
    expect(code.slice(i, i + 1400)).toMatch(/dealAsk\(data, onCam, laneState\)/)
  })

  /** The arming bar is detector state. Nothing that could preview the answer may read it. */
  it('lets nothing but the lane fill react to how far through a sweep the hand is', () => {
    // ⚠️ `\\b` matters — `sweepArmed` (the lane's own state) contains `sweepArm` as a substring.
    expect(code.match(/read\.sweepArm\b/g) ?? []).toHaveLength(1)
  })
})
