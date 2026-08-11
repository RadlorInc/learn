/**
 * THE FUNDRAISER (9–11 · `bigNumbers`) — the chapter's FIRST gate.
 *
 * Until now the only test touching this file was `chapterCastDistinct`, and only for `RUN`. Nothing
 * drove the generator, the grader or the layout — which is how the two faults below survived: the
 * grader and the miss line lived inside `OrderPlay`'s closure, where a test could not reach them at
 * all. They are exported now, and this drives the SAME functions the commit button calls; a check
 * that re-implemented the rule would agree with its own copy while the screen it protects rotted.
 */
import { describe, it, expect } from 'vitest'
import {
  makeRound, grade, missFor, loadAsk, orderLayout, columnAt,
  PLACES, Q_ALL, MAX_DIGIT, RUN, yardAt, type OdRound,
} from '@/features/chapters/story/OrderDesk'

const TIERS = [1, 2, 3] as const
const draw = (n: number, fn: (q: OdRound, d: number, slot: number) => void) => {
  for (let k = 0; k < n; k++) {
    const d = TIERS[k % 3]
    const slot = k % 13
    fn(makeRound(d, slot, []), d, slot)
  }
}

describe('the generator', () => {
  it('never draws a digit the pieces cannot honestly show', () => {
    // ⚠️ MAX_DIGIT IS A GEOMETRY FACT, NOT A DIFFICULTY KNOB — nine honest hundred-bundles force the
    // unit to ~9px and the ones column stops being countable, which is a wrong answer the chapter
    // caused. Widening it to "improve coverage" is the change this pins.
    // ⚠️ PINNED TO 5, NOT TO `MAX_DIGIT`. Written against the constant this check MOVES WITH the
    // mutation — widening it to 9 keeps the assertion true while the ones column becomes uncountable.
    // A gate that re-derives the rule it guards cannot see the rule change.
    expect(MAX_DIGIT).toBe(5)
    draw(3000, q => {
      for (const p of PLACES) expect(Math.floor(q.n / p) % 10).toBeLessThanOrEqual(5)
    })
  })

  it('never opens on a leading zero, and never asks for an amount of nothing', () => {
    draw(3000, q => {
      expect(q.n).toBeGreaterThan(0)
      if (q.focus >= 0) expect(q.target[q.focus]).toBeGreaterThan(0)
    })
  })

  /**
   * ⚠️ FOUND BY PLAYING A FULL RUN, and pinned here so it cannot silently re-open: a `value` round on
   * the ONES asked *"the tin holds two — that is $2. How many coins is that?"*, where the answer is
   * the number in the question. The whole point of the type is converting a value into a count of a
   * BIGGER unit, so a place worth 1 has nothing to convert. The guard has a `pool2.length ? … : live`
   * fallback that could re-admit it, so this is asserted over the draw rather than read off the code.
   */
  it('a value round never lands on the ones', () => {
    draw(4000, q => {
      if (q.qType === 'value') expect(PLACES[q.focus]).toBeGreaterThan(1)
    })
  })

  it('every round is answerable — the target is reachable and states a real number', () => {
    draw(2000, q => {
      const built = q.focus >= 0
        ? q.target[q.focus] * PLACES[q.focus]
        : q.target.reduce((s, c, i) => s + c * PLACES[i], 0)
      expect(built).toBeGreaterThan(0)
      if (q.focus < 0) expect(built).toBe(q.n)
    })
  })

  it('the tier ladder widens rather than repeating itself', () => {
    const at = (d: 1 | 2 | 3) => new Set(Array.from({ length: 400 }, (_, k) => makeRound(d, k % 13, []).qType))
    // value is a top-tier reading and cannot be drawn at L1 — a documented, bounded cost
    expect(at(1).has('value')).toBe(false)
    expect(at(3).size).toBeGreaterThan(at(1).size)
  })

  it('asks for a type it has not asked yet while a gap exists — the coverage feed', () => {
    // ⚠️ Driving `asked` is how a gate sees the WIRING rather than the generator: dropping the third
    // argument at the call site would relocate the coverage bug and make it permanent.
    const q = makeRound(3, 0, ['build', 'place'])
    expect(q.qType).toBe('value')
  })
})

describe('the grader', () => {
  const round = (over: Partial<OdRound> = {}): OdRound => ({
    qType: 'build', yard: yardAt(0), n: 352, target: [0, 3, 5, 2], focus: -1,
    ask: '', docket: '', missPrefix: 'no —', ...over,
  })

  it('accepts the number built out of any honest arrangement of its own places', () => {
    expect(grade(round(), [0, 3, 5, 2])).toBe(true)
  })

  it('refuses a total that is short or over', () => {
    expect(grade(round(), [0, 3, 5, 1])).toBe(false)
    expect(grade(round(), [0, 3, 5, 3])).toBe(false)
  })

  /**
   * ⚠️ THE REAL HOLE, AND IT IS THE ONE THE BUNDLE CREATES. On a single-column round a child who
   * loads ten coins gets them fused into one ten-strip in the TENS column — so the focus count can be
   * right while a stray sits next door. Both directions are pinned: a stray must be REFUSED, and it
   * must be NAMED, or the child sees a count they can tell is correct and is told only "no".
   */
  it('a single-column round refuses a correct count with a stray next door, and names it', () => {
    const q = round({ qType: 'place', n: 50, target: [0, 0, 5, 0], focus: 2, missPrefix: 'Not the tens I asked for —' })
    expect(grade(q, [0, 0, 5, 0])).toBe(true)
    expect(grade(q, [0, 1, 5, 0])).toBe(false)
    expect(missFor(q, [0, 1, 5, 0])).toMatch(/hundred-bundle/)
    expect(missFor(q, [0, 1, 5, 0])).toMatch(/take it back/i)
  })

  it('the miss line never states the answer', () => {
    draw(600, q => {
      const wrong = [0, 0, 0, 0]
      const line = missFor(q, wrong)
      const want = q.focus >= 0 ? String(q.target[q.focus]) : String(q.n)
      // it may say what the child HAS; it may never hand over what they need
      if (q.focus >= 0) expect(line.includes(` ${want}`)).toBe(false)
    })
  })
})

describe('the instruction chip', () => {
  const q = makeRound(2, 0, [], 'place')

  /**
   * ⚠️ ASSERTED IN BOTH DIRECTIONS. Without the negative in each mode a renderer that ignores its
   * input passes every other check — the fault The Supply Run records, where a round-type-blind chip
   * said "deal" over a bench where a step FILLS one.
   */
  it('names the gesture the child actually has, in both modes', () => {
    const tap = loadAsk(q, 'tap', { carrying: false, over: -1, full: false })
    const hand = loadAsk(q, 'hand', { carrying: false, over: -1, full: false })
    expect(tap).toMatch(/tap/i)
    expect(tap).not.toMatch(/pinch|open your hand/i)
    expect(hand).toMatch(/pinch/i)
    expect(hand).not.toMatch(/tap the/i)
  })

  it('every state a grab can be in has words — not just "ready"', () => {
    const states = [
      { carrying: false, over: -1, full: false },
      { carrying: true, over: -1, full: false },
      { carrying: true, over: 2, full: false },
      { carrying: false, over: -1, full: true },
    ]
    const said = states.map(st => loadAsk(q, 'hand', st))
    expect(new Set(said).size, 'two states share one line').toBe(states.length)
    for (const s of said) expect(s.length).toBeGreaterThan(8)
  })

  /**
   * ⚠️ FOUND BY DRIVING IT, NOT BY A GATE. The round changed while the child was still pinching, and
   * the chip opened on "open your hand to drop it in the hundreds" — instructing an action the
   * held-over guard then silently refuses. A dead button wearing a helpful sentence.
   */
  it('a held-over grab is told to reset, never to drop', () => {
    const held = loadAsk(q, 'hand', { carrying: true, over: 1, full: false, armed: false })
    expect(held).not.toMatch(/drop it in/i)
    expect(held).toMatch(/pinch again/i)
    // …and a grab that DID start this round is still told to drop
    expect(loadAsk(q, 'hand', { carrying: true, over: 1, full: false, armed: true })).toMatch(/drop it in/i)
  })

  it('a full order sends the child to the commit, on either input', () => {
    for (const i of ['hand', 'tap'] as const) {
      expect(loadAsk(q, i, { carrying: false, over: -1, full: true })).toMatch(/send it/i)
    }
  })
})

describe('the drop target', () => {
  const SIZES: [number, number][] = [
    [1280, 720], [1440, 900], [1800, 870], [2000, 970], [2560, 1080], [1920, 800],
    [1024, 620], [900, 500], [740, 360], [667, 375], [640, 320],
  ]

  it('every column is reachable, and they never overlap', () => {
    for (const [vw, vh] of SIZES) {
      const L = orderLayout(vw, vh, 0.87)
      const hit = new Set<number>()
      for (let x = 0; x <= 1; x += 0.002) {
        const c = columnAt(x, vw, L)
        if (c >= 0) hit.add(c)
      }
      expect(hit.size, `${vw}x${vh}: only ${hit.size} columns reachable`).toBe(PLACES.length)
      for (let i = 0; i < PLACES.length - 1; i++) {
        expect(L.bayLeft(i) + L.bayWidth(i), `${vw}x${vh}: columns ${i}/${i + 1} overlap`)
          .toBeLessThanOrEqual(L.bayLeft(i + 1))
      }
    }
  })

  /**
   * ⚠️ NO NEAREST-COLUMN SNAP. Letting a drop between two columns fall into the closer one is the
   * grader quietly correcting a child, on the chapter where the column IS the answer.
   */
  it('a drop between two columns places nothing', () => {
    const L = orderLayout(1280, 720, 0.87)
    const gap = (L.bayLeft(0) + L.bayWidth(0) + L.bayLeft(1)) / 2 / 1280
    expect(columnAt(gap, 1280, L)).toBe(-1)
  })

  it('a drop outside the columns entirely places nothing', () => {
    const L = orderLayout(1280, 720, 0.87)
    expect(columnAt(0.001, 1280, L)).toBe(-1)
    expect(columnAt(0.999, 1280, L)).toBe(-1)
  })
})

describe('the run', () => {
  it('covers every slot the chapter plays — 2 demo + 1 guided + 10 scored', () => {
    expect(RUN.length).toBeGreaterThanOrEqual(13)
    expect(yardAt(12)).toBeDefined()
    // and clamps rather than running off the end
    expect(yardAt(99)).toBe(RUN[RUN.length - 1])
  })

  it('every scene is a fundraiser scene on disk, and consecutive slots differ', () => {
    for (let i = 0; i < 13; i++) {
      expect(yardAt(i).scene).toMatch(/fund_(hall|yard|gym)\.png$/)
      if (i > 0) expect(yardAt(i).scene === yardAt(i - 1).scene && yardAt(i).customer === yardAt(i - 1).customer).toBe(false)
    }
  })

  it('declares every question type for the coverage gate', () => {
    expect([...Q_ALL].sort()).toEqual(['build', 'place', 'value'])
  })
})
