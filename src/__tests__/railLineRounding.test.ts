/**
 * Gate for THE RAIL LINE (9–11 `rounding`).
 *
 * It drives the SAME exported functions the scene renders and grades from — `makeRound`,
 * `stationsFor`, `gradePicks`, `missFor`, `railLayout` — rather than re-implementing any of them.
 * A check that keeps its own copy of a rule agrees with itself while the screen it is meant to
 * protect falls apart; this repo has shipped that twice.
 */
import { describe, it, expect } from 'vitest'
import {
  makeRound, stationsFor, gradePicks, missFor, railLayout, roundTo,
  STATIONS, Q_ALL, LINE, stopAt, TRAIN_ASPECT, CHROME_PX, IMG_H, IMG_W,
  type RlRound, type QType,
} from '@/features/chapters/story/RailLine'

const TIERS = [1, 2, 3] as const
/** Every round the generator can produce, at every tier, over enough draws to hit the tails. */
function everyRound(n = 400): RlRound[] {
  const out: RlRound[] = []
  for (const d of TIERS) for (let r = 0; r < 10; r++) for (let i = 0; i < n / 10; i++) out.push(makeRound(d, r, [...Q_ALL]))
  return out
}

describe('rounding — the arithmetic', () => {
  it('rounds half UP, which is the rule the chapter states out loud', () => {
    expect(roundTo(15, 10)).toBe(20)
    expect(roundTo(75, 10)).toBe(80)
    expect(roundTo(250, 100)).toBe(300)
    expect(roundTo(14, 10)).toBe(10)
    expect(roundTo(249, 100)).toBe(200)
  })
})

describe('the question', () => {
  const rounds = everyRound()

  it('never asks a number that is already ON a station — that would be answerable by matching the board', () => {
    for (const r of rounds) for (const leg of r.legs) expect(leg % r.m).not.toBe(0)
  })

  it('always puts the answer among the stations shown', () => {
    for (const r of rounds) {
      for (let i = 0; i < r.legs.length; i++) {
        expect(stationsFor(r.legs[i], r.m)).toContain(r.rounded[i])
      }
    }
  })

  it('shows BOTH bracketing stations, so the question is always answerable', () => {
    for (const r of rounds) for (const leg of r.legs) {
      const low = Math.floor(leg / r.m) * r.m
      const s = stationsFor(leg, r.m)
      expect(s).toContain(low)
      expect(s).toContain(low + r.m)
    }
  })

  it('draws exactly STATIONS posts, ascending, none negative', () => {
    for (const r of rounds) for (const leg of r.legs) {
      const s = stationsFor(leg, r.m)
      expect(s).toHaveLength(STATIONS)
      expect(s.every(v => v >= 0)).toBe(true)
      expect([...s].sort((a, b) => a - b)).toEqual(s)
    }
  })

  /**
   * ⚠️ THE COIN-FLIP CHECK, and it is the reason this chapter was rebuilt. Pin the answer to one
   * index and a child taps that post every time without rounding anything.
   */
  it('moves the answer around the line rather than parking it at one post', () => {
    const idx = new Set<number>()
    for (const r of rounds) for (let i = 0; i < r.legs.length; i++) {
      idx.add(stationsFor(r.legs[i], r.m).indexOf(r.rounded[i]))
    }
    expect(idx.size).toBeGreaterThanOrEqual(3)
  })

  it('answers an estimate with the sum of the ROUNDED legs, and keeps the exact total apart', () => {
    const est = rounds.filter(r => r.qType === 'estimate')
    expect(est.length).toBeGreaterThan(0)
    for (const r of est) {
      expect(r.legs).toHaveLength(2)
      expect(r.answer).toBe(r.rounded[0] + r.rounded[1])
      expect(r.exact).toBe(r.legs[0] + r.legs[1])
    }
  })

  it('keeps the hard types off the gentlest tier and reaches all three by L3', () => {
    // `asked` full, so the generator is past its deliberate unmet-first branch and drawing from the
    // tier's own pool — which is what "what can this tier ask" actually means.
    const at = (d: 1 | 2 | 3) => new Set(Array.from({ length: 300 }, (_, i) => makeRound(d, i % 10, [...Q_ALL]).qType))
    expect([...at(1)]).toEqual(['round10'])
    expect(at(3).size).toBeGreaterThan(1)
  })

  it('covers every declared question type across a run, or mastery could exit before one is asked', () => {
    const asked: QType[] = []
    for (let r = 0; r < 10; r++) asked.push(makeRound(3, r, asked).qType)
    for (const q of Q_ALL) expect(asked).toContain(q)
  })
})

describe('the grader', () => {
  const est: RlRound = makeRound(3, 0, ['round10', 'round100'])

  it('accepts only the exact roundings', () => {
    const r = makeRound(1, 0, [])
    expect(gradePicks(r, r.rounded).ok).toBe(true)
    expect(gradePicks(r, [r.rounded[0] + r.m]).ok).toBe(false)
  })

  it('reports WHICH leg was wrong, so the miss line can be specific', () => {
    if (est.qType !== 'estimate') return
    expect(gradePicks(est, [est.rounded[0], est.rounded[1] + 10]).badLeg).toBe(1)
    expect(gradePicks(est, [est.rounded[0] - 10, est.rounded[1]]).badLeg).toBe(0)
  })

  /**
   * ⚠️ THE HOLE THAT ONLY MUTATION TESTING FOUND IN SliceShop, planted here on purpose: two legs
   * rounded the WRONG way can still add up to the right total. Grade the sum and this passes.
   */
  it('refuses two wrong roundings that happen to sum to the right answer', () => {
    const fake: RlRound = { ...est, qType: 'estimate', legs: [47, 62], m: 10, rounded: [50, 60], answer: 110, exact: 109 }
    expect(gradePicks(fake, [40, 70]).ok).toBe(false)   // also 110, and completely wrong
    expect(gradePicks(fake, [50, 60]).ok).toBe(true)
  })

  it('treats a leg that has not been picked yet as not-yet-right', () => {
    const r = makeRound(1, 0, [])
    expect(gradePicks(r, [null]).ok).toBe(false)
  })
})

describe('the miss line', () => {
  it('never hands over the station the child is being asked for', () => {
    for (const r of everyRound(200)) {
      for (let i = 0; i < r.legs.length; i++) {
        const wrong = stationsFor(r.legs[i], r.m).filter(v => v !== r.rounded[i])
        for (const w of wrong) {
          const line = missFor(r, i, w)
          // The answer may appear only as part of the halfway RULE, never as a named stop.
          expect(line.includes(`the ${r.rounded[i]} `)).toBe(false)
        }
      }
    }
  })

  it('has its own wording for a number sitting exactly on the halfway post', () => {
    const r: RlRound = { ...makeRound(1, 0, []), legs: [75], m: 10, rounded: [80], answer: 80, exact: 75 }
    expect(missFor(r, 0, 70)).toMatch(/exactly ON the halfway post/)
    // and it must not claim a dead heat is "past" anything, which is simply false
    expect(missFor(r, 0, 70)).not.toMatch(/is PAST/)
  })

  it('points at the bracket when the pick is not even one of the two neighbours', () => {
    const r: RlRound = { ...makeRound(1, 0, []), legs: [47], m: 10, rounded: [50], answer: 50, exact: 47 }
    expect(missFor(r, 0, 10)).toMatch(/between 40 and 50/)
  })
})

describe('the layout', () => {
  /**
   * ⚠️ THE WIDE ONES ARE THE POINT. The backdrop is cover-fitted, so a frame whose aspect differs
   * from the art's 1.79 crops the picture and MOVES the painted rail. 1280×720 is 1.78 and hid the
   * bug completely; 2000×970 is 2.06 and floated the train 44px above the track.
   */
  const SIZES: Array<[number, number]> = [
    [1280, 720], [1440, 900], [1024, 620], [1600, 950], [820, 420], [740, 360], [640, 320],
    [2000, 970], [2560, 1080], [1920, 800],
  ]

  it('puts the rail where the PAINTING puts it, through the same cover-fit the backdrop uses', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      const fit = Math.max(vw / IMG_W, vh / IMG_H)
      const drawnH = IMG_H * fit
      const painted = (vh - drawnH) / 2 + s.trackY * drawnH
      // EXACT: the painted rail, or the marker clamp — and nothing else. A "<= painted" assertion
      // reads as reasonable and lets the original bug straight through, which is what mutation
      // testing this check showed: reverting to `vh * trackY` (776 against a painted 820) passed it.
      const clamped = Math.min(painted, vh - Math.round(L.boardFont * 2.65) - 8)
      expect(L.trackPx).toBe(Math.round(clamped))
    }
  })

  it('keeps the km marker inside the frame — it hangs BELOW the rail', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      expect(L.trackPx + L.boardFont * 2.65).toBeLessThanOrEqual(vh)
    }
  })

  /** ⚠️ Founder's catch: the parked engine covered the halfway post, which is the ONLY help a
   *  wrong answer gives. Boards and the hint both have to out-reach the train's roof. */
  it('never lets the train hide a name board or the halfway post', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      const trainTop = L.trackPx - L.trainH
      expect(L.trackPx - L.halfStalkH).toBeLessThanOrEqual(trainTop)      // hint above the roof
      expect(L.trackPx - L.postH).toBeLessThan(L.trackPx - L.halfStalkH)  // boards above the hint
    }
  })

  it('draws the locomotive bigger than the pony standing beside it', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      expect(L.trainH).toBeGreaterThan(L.miloH)
    }
  })

  it('keeps the waiting train fully on screen at every size and scene', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      const halfW = L.trainH * TRAIN_ASPECT / 2
      expect(L.homeX - halfW).toBeGreaterThanOrEqual(-1)
    }
  })

  it('never lets a station post reach up into the chrome', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      // the post assembly hangs from the track upward: board + post
      expect(L.trackPx - L.postH - L.boardH).toBeGreaterThan(CHROME_PX)
    }
  })

  it('keeps six boards from touching each other', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      // the widest label the chapter can draw is five characters — a round100 line reaches "1,400"
      const boardW = L.boardFont * (5 * 0.62 + 1.1)
      expect(L.postGap).toBeGreaterThan(boardW)
    }
  })

  /**
   * ⚠️ THE ONE THE SCREEN CAUGHT. At 640×320 Milo's bubble ran straight across two of the six name
   * boards — measured, bubble 355–624 over boards at 463–510 — so two answer targets were covered.
   */
  it('lifts the name boards clear of the band Milo\'s bubble can occupy', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      const boardBottom = L.trackPx - L.postH
      expect(boardBottom).toBeLessThanOrEqual(L.bubbleTop)
    }
  })

  it('keeps every board inside the frame, not flush against either edge', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      const half = L.boardFont * (5 * 0.62 + 1.1) / 2
      expect(L.stationX(0) - half).toBeGreaterThan(0)
      expect(L.stationX(STATIONS - 1) + half).toBeLessThan(vw)
    }
  })

  it('leaves every station a finger-sized tap target', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      expect(Math.min(L.postGap, 44)).toBeGreaterThanOrEqual(44 - 1e-9)
    }
  })

  it('keeps the stations clear of Milo and his bubble on the right', () => {
    for (const [vw, vh] of SIZES) for (const s of LINE) {
      const L = railLayout(vw, vh, s.trackY)
      expect(L.stationX(STATIONS - 1)).toBeLessThan(vw * 0.80)
    }
  })

  it('places a value on the line consistently with the post drawn for it', () => {
    const L = railLayout(1280, 720, 0.785)
    const s = stationsFor(47, 10)
    for (let i = 0; i < STATIONS; i++) expect(L.xOf(s[i], s[0], 10)).toBeCloseTo(L.stationX(i), 6)
  })
})

describe('the run', () => {
  it('changes scene between consecutive rounds, so the place moves as well as the numbers', () => {
    for (let i = 1; i < LINE.length; i++) expect(stopAt(i).scene).not.toBe(stopAt(i - 1).scene)
  })

  it('reads its slots straight and never wraps back onto the scene it opened with', () => {
    expect(stopAt(9)).toBe(LINE[9])
    expect(stopAt(20)).toBe(LINE[LINE.length - 1])
  })

  it('gives every scene its own measured track line rather than a shared constant', () => {
    const byScene = new Map(LINE.map(s => [s.scene, s.trackY]))
    expect(byScene.size).toBe(3)
    for (const s of LINE) expect(byScene.get(s.scene)).toBe(s.trackY)
  })
})
