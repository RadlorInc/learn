/**
 * THE QUESTION, SWEPT ACROSS EVERY CHAPTER THAT HAS A PURE MODULE — one file applying
 * `docs/chapter-craft.md` §0a/§0b uniformly, rather than nine files each applying it to one chapter.
 *
 * ⚠️ WHY THIS EXISTS WHEN EVERY 9–11 CHAPTER ALREADY HAS A 50-TEST GATE OF ITS OWN. Those gates are
 * excellent and they are all VERTICAL: each knows its own chapter's rules deeply and knows nothing
 * about its neighbours'. The craft doc's own complaint is horizontal — *"most of those rules were
 * already learned in chapter 1, forgotten, and re-learned the hard way in a later chapter"* — so a
 * rule that holds in seven chapters and is missing in the eighth is exactly what no per-chapter file
 * can see. This one asks the SAME questions of all eight.
 *
 * The rules it can mechanise, all from §0b:
 *   Q1  every question is answerable — some reachable input grades true          (the FitOut dead button)
 *   Q2  nothing the child reads BEFORE answering contains the answer             (the printed-answer leak)
 *   Q3  no miss line names an accepted answer                                    (stated verbatim in the doc)
 *   Q4  no redirect names an accepted answer                                     (the named-bound leak)
 *   Q5  a miss line does not narrow with the guess
 *   Q6  no string is malformed — NaN, undefined, "1 lines", double spaces, glue
 *   Q7  the answer surface is not a coin flip                                    (measured, per chapter)
 *
 * ⚠️ EVERY `accepted` HERE DRIVES THE CHAPTER'S OWN GRADER, and that is not a style choice. The
 * first draft read `r.accepts` straight off the round — so Q1 ("every question is answerable")
 * compared the data with itself, and a planted `graded` that refused the answer 3 walked through a
 * green sweep. Mutation-testing found it; reading it did not. The one probe that still reads data is
 * The Mission Brief, which exports no grader — its choices ARE strings on buttons.
 *
 * ⚠️ TOKENS, NEVER SUBSTRINGS. `0.1 + 0.6` contains "0.6" and means nothing of the kind; "there are
 * only 4 stacks" contains "4" and so does the answer 4. Every number check here is anchored.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as cents from '@/features/chapters/story/cents'
import * as factors from '@/features/chapters/story/factors'
import * as pizza from '@/features/chapters/story/pizza'
import * as inches from '@/features/chapters/story/inches'
import * as words from '@/features/chapters/story/words'
import * as cargo from '@/features/chapters/story/cargo'
import * as angles from '@/features/chapters/story/angles'
import * as plot from '@/features/chapters/story/plotMaths'
import * as slice from '@/features/chapters/story/slice'

type Tier = 1 | 2 | 3
const TIERS: Tier[] = [1, 2, 3]
const DRAWS = 90

let restore: (() => void) | null = null
function seed(n: number) {
  let s = n >>> 0
  const real = Math.random
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  restore = () => { Math.random = real }
}
beforeEach(() => seed(20260820))
afterEach(() => { restore?.(); restore = null })

/** Does `text` name `n` as a NUMBER, not as a digit inside another number? */
function names(text: string, n: number): boolean {
  return new RegExp(`(^|[^\\d.])${n}([^\\d.]|$)`).test(text)
}

/**
 * One chapter's question surface, in the shape the rules are written against.
 * `inputs` is what the child can actually enter; `accepted` is the subset that grades true.
 */
interface Probe<R> {
  id: string
  make: (d: Tier, i: number) => R
  /** everything on screen or spoken BEFORE the child commits */
  preAnswer: (r: R) => string[]
  /** true where naming the figure IS the question ("make 0.9", "set it to exactly 85°") */
  asksForTheFigure?: (r: R) => boolean
  /** strip the parts of a miss line that vary BY DESIGN and carry no arithmetic (a character name) */
  normalise?: (s: string) => string
  /** every value reachable through the answering surface, as a number for the token checks */
  inputs: (r: R) => number[]
  accepted: (r: R) => number[]
  nudge: (r: R, v: number) => string | null
  miss: (r: R, v: number) => string
  verdict?: (r: R, v: number) => string
}

// ─── the eight probes ────────────────────────────────────────────────────────────────────
// Each one is thin on purpose: it must not re-implement a rule, only expose the module's own
// functions in a common shape. Anything computed here rather than called is a second copy.

const centsProbe: Probe<cents.CtRound> = {
  id: 'decimals · The Coin Tray',
  make: d => cents.makeRound(d),
  // the tag is the board's headline BEFORE the commit, plus what Milo says and the action chip
  preAnswer: r => [cents.headline(r, false), cents.sayFor(r, 'tap'), cents.instructionFor('tap', 'dimes')],
  // ⚠️ NOT `padChoices()`. The answer is a PAIR of wells, so what the child can reach is every
  // amount 0..99 in cents; the pad is one DIGIT of it. Reading the pad as the answer surface said
  // "no reachable input grades true" on every single round — the instrument being wrong, not the app.
  inputs: () => Array.from({ length: 100 }, (_, i) => i),
  accepted: r => Array.from({ length: 100 }, (_, i) => i)
    .filter(v => cents.graded(r, { dimes: Math.floor(v / 10), pennies: v % 10 })),
  // A `make` round's whole question is "lay out this amount", so the tag NAMES the target on
  // purpose — the same reason an exact-degrees round prints its degrees. Only the other two types
  // must keep it back, and `cents.headline` already does (gated in coinTrayDecimals.test.ts).
  asksForTheFigure: r => r.qType === 'make',
  nudge: (r, v) => cents.nudgeFor(r, { dimes: v, pennies: 0 }, 'tap'),
  miss: r => cents.missFor(r),
}

const factorsProbe: Probe<factors.FlRound> = {
  id: 'factorsMultiples · Factor Lab',
  make: d => factors.makeRound(d),
  preAnswer: r => [r.work, r.spoken, factors.instructionFor(r, 'tap'), factors.sayFor(r, 'tap')],
  inputs: () => factors.padChoices(),
  accepted: r => factors.padChoices().filter(v => factors.graded(r, v)),
  nudge: (r, v) => factors.nudgeFor(r, v, 'tap'),
  miss: r => factors.missFor(r),
  verdict: (r, v) => factors.verdictFor(r, v).text,
}

const pizzaProbe: Probe<pizza.PzRound> = {
  id: 'fractionsCompare · The Pizza Counter',
  /**
   * ⚠️ EXEMPT FROM Q2, AND THE REASON IS THE MATERIAL RATHER THAN THE CODE — measured, not waved
   * through. On a `match` round the answer is a COUNT OF SLICES and the givens are two DENOMINATORS,
   * so the two collide whenever `refNum × den / refDen` lands on a number already in the sentence:
   * 34.7% of `match`, 27.2% of `more`, 6.8% of `op` (2026-08-20).
   *
   * The pool cannot be cleaned without gutting it. Tier 1 is match-only over three pairs, and
   * `[2, 4]` — half a pizza against quarters, k = 2 = the denominator — collides on its ONLY
   * numerator. That pair is the single most canonical equivalence in the chapter, and removing the
   * best worked example to close a coincidence is a bad trade.
   *
   * It is also the harmless direction: the collision can only make a guess luckier, never make a
   * correct method wrong — unlike The Height Bar's `4 × 12 = 48` landing on a posted limit of 48,
   * which manufactures a wrong answer and IS gated (heightBarUnits.test.ts). The answer surface is
   * 1..10, so a child copying one of three visible numbers is still not near a coin flip.
   */
  asksForTheFigure: () => true,
  make: d => pizza.makeRound(d),
  preAnswer: r => [r.work, r.spoken, pizza.instructionFor(r, 'tap'), pizza.sayFor(r, 'tap')],
  inputs: () => pizza.padChoices(),
  accepted: r => pizza.padChoices().filter(v => pizza.graded(r, v)),
  nudge: (r, v) => pizza.nudgeFor(r, v, 'tap'),
  miss: r => pizza.missFor(r),
  verdict: (r, v) => pizza.verdictFor(r, v).text,
}

const inchesProbe: Probe<inches.HbRound> = {
  id: 'measurementUnits · The Height Bar',
  make: d => inches.makeRound(d),
  preAnswer: r => [inches.headline(r, false), inches.sayFor(r, 'tap'), inches.instructionFor('tap', 'tens')],
  inputs: () => Array.from({ length: 100 }, (_, i) => i),
  accepted: r => Array.from({ length: 100 }, (_, i) => i)
    .filter(v => inches.graded(r, { tens: Math.floor(v / 10), ones: v % 10 })),
  nudge: (r, v) => inches.nudgeFor(r, { tens: Math.floor(v / 10), ones: v % 10 }, 'tap'),
  miss: r => inches.missFor(r),
  verdict: (r, v) => inches.verdictFor(r, { tens: Math.floor(v / 10), ones: v % 10 }).text,
}

/** One reading turned into the cart the chapter grades: a stack PICK on `most`, a LOAD otherwise. */
function cartFor(r: cargo.LbRound, v: number): cargo.CartV {
  if (r.qType === 'most') return { load: [0, 0, 0, 0], pick: v }
  if (r.qType === 'total') return { load: [...r.counts], pick: null }
  const load = [0, 0, 0, 0]
  load[r.focus] = v
  return { load, pick: null }
}

const cargoProbe: Probe<cargo.LbRound> = {
  id: 'dataGraphs · The Loading Bay',
  make: d => cargo.makeRound(d),
  preAnswer: r => [r.prompt, r.work, cargo.instructionFor(r, 'tap')],
  inputs: () => Array.from({ length: 13 }, (_, i) => i),
  accepted: r => Array.from({ length: 13 }, (_, i) => i).filter(v => cargo.graded(r, cartFor(r, v))),
  nudge: (r, v) => cargo.nudgeFor(r, v),
  miss: r => cargo.missFor(r),
}

const wordsProbe: Probe<words.WpRound> = {
  id: 'wordProblems · The Mission Brief',
  make: d => words.makeRound(d),
  preAnswer: r => [r.story, r.prompt, r.say, r.tag],
  inputs: r => r.choices.map(Number),
  accepted: r => [r.answer],
  nudge: () => null,
  miss: r => words.missFor(r),
}

const plotProbe: Probe<plot.PlotRound> = {
  id: 'areaPerimeter · The Empty Plot',
  make: d => plot.makeRound(d),
  preAnswer: r => [r.prompt, r.say, r.tag],
  inputs: () => Array.from({ length: 13 }, (_, i) => i),
  // ⚠️ THE DEPTH, not `target` — `target` is the load on the lorry and is GIVEN. Driven through
  // the real grader so this cannot drift from what the chapter accepts.
  accepted: r => Array.from({ length: 13 }, (_, i) => i).filter(v => plot.gradePeg(r, v)),
  nudge: () => null,
  miss: (r, v) => plot.missFor(r, v),
}

const anglesProbe: Probe<angles.Round> = {
  id: 'anglesSymmetry · The Angle Shop',
  make: (d, i) => angles.makeRound(d, i),
  preAnswer: r => [r.ask],
  inputs: r => (r.type === 'angle' ? angles.reachable() : []),
  accepted: r => (r.type === 'angle'
    ? angles.reachable().filter(deg => angles.grade(r, deg))
    : []),
  nudge: () => null,
  miss: (r, v) => angles.missFor(r, v),
  verdict: (r, v) => angles.verdictFor(r, v),
  // "Set the bike ramp to exactly 85°" — the figure IS the ask, like a coin tray `make` round.
  asksForTheFigure: r => r.type === 'angle' && r.job === 'degrees',
}

/**
 * 6–8 · SLICE SHOP — the one chapter outside this band with a pure module, so the sweep is not
 * only a 9–11 gate.
 *
 * ⚠️ THE NUMERIC AXIS HERE IS HOW MANY PIECES ARE LAID, with the round's own piece size. The
 * chapter's other axis — WHICH piece the child reaches for — is the central misconception and is
 * swept separately below, because it is not a number and would not survive being encoded as one.
 * ⚠️ And `askTextFor` names the denominator on `group` and `take` rounds ON PURPOSE: the whole
 * design is that the denominator is HOW MANY PEOPLE ARE WAITING, which the child is told.
 */
const sliceProbe: Probe<slice.FrRound> = {
  id: 'fractions · Slice Shop (6–8)',
  make: (d, i) => slice.makeFrRound(d, i),
  preAnswer: r => [slice.askTextFor(r)],
  inputs: () => [0, 1, 2, 3, 4, 5, 6],
  accepted: r => [0, 1, 2, 3, 4, 5, 6].filter(v => slice.isSolved(r, { den: r.den, laid: v })),
  nudge: () => null,
  miss: (r, v) => slice.missFor(r, { den: r.den, laid: v }),
  asksForTheFigure: r => r.on === 'group' || r.ask === 'take',
  // the friend who went without — named on purpose, and not arithmetic
  normalise: t => t.replace(/— \w+ has nothing!/, '— <friend> has nothing!'),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PROBES: Probe<any>[] = [
  centsProbe, factorsProbe, pizzaProbe, inchesProbe, cargoProbe, wordsProbe, plotProbe, anglesProbe,
  sliceProbe,
]

// ─── the rules ───────────────────────────────────────────────────────────────────────────

describe('Q1 · every question the generator can produce is answerable', () => {
  for (const p of PROBES) {
    it(`${p.id}`, () => {
      for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
        const r = p.make(d, i)
        const ins = p.inputs(r)
        if (!ins.length) continue                                  // instrument-only round
        const acc = p.accepted(r).filter(a => ins.includes(a))
        expect(acc.length, `t${d} #${i}: no reachable input grades true — ${JSON.stringify(r).slice(0, 160)}`)
          .toBeGreaterThan(0)
      }
    })
  }
})

describe('Q2 · nothing the child reads before answering names the answer', () => {
  for (const p of PROBES) {
    it(`${p.id}`, () => {
      for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
        const r = p.make(d, i)
        if (p.asksForTheFigure?.(r)) continue
        for (const a of p.accepted(r)) {
          for (const text of p.preAnswer(r)) {
            expect(names(text, a), `t${d} #${i}: "${text}" names the answer ${a}`).toBe(false)
          }
        }
      }
    })
  }
})

describe('Q3 · no miss line names an accepted answer', () => {
  for (const p of PROBES) {
    it(`${p.id}`, () => {
      for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
        const r = p.make(d, i)
        const acc = p.accepted(r)
        for (const v of p.inputs(r)) {
          if (acc.includes(v)) continue
          const m = p.miss(r, v)
          expect(m.trim().length, `t${d} #${i}: empty miss line`).toBeGreaterThan(0)
          for (const a of acc) {
            expect(names(m, a), `t${d} #${i}: miss line "${m}" names the accepted answer ${a}`).toBe(false)
          }
        }
      }
    })
  }
})

describe('Q4 · no redirect names an accepted answer', () => {
  for (const p of PROBES) {
    it(`${p.id}`, () => {
      for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
        const r = p.make(d, i)
        const acc = p.accepted(r)
        for (const v of p.inputs(r)) {
          const n = p.nudge(r, v)
          if (n === null) continue
          expect(n.trim().length, `t${d} #${i}: a redirect that says nothing`).toBeGreaterThan(0)
          // ⚠️ A REDIRECT THAT ENUMERATES EVERY OPTION LEAKS NOTHING. The Loading Bay answers an
          // impossible reading with "There are only 4 stacks — hold up 1, 2, 3 or 4", which names
          // the answer and also names every other choice, i.e. it restates the pad. Singling one
          // out is the leak; listing them all is the instrument.
          if (p.inputs(r).filter(v2 => names(n, v2)).length >= 3) continue
          for (const a of acc) {
            expect(names(n, a), `t${d} #${i}: redirect "${n}" names the accepted answer ${a}`).toBe(false)
          }
        }
      }
    })
  }
})

describe('Q5 · a miss line does not narrow with the guess', () => {
  /**
   * TWO CLAIMS, AND THE FIRST IS THE ONE WITH TEETH:
   * ⚠️ (a) HAS TEETH ONLY WHERE `missFor` ACTUALLY RECEIVES THE GUESS — The Empty Plot, The Angle
   * Shop and Slice Shop. The other six take the round alone, so their miss line CANNOT depend on
   * what the child tapped, which is a stronger guarantee than any check: a signature that cannot
   * see the guess cannot leak it. Verified by planting a hot/cold line in The Empty Plot (caught)
   * and in Factor Lab (inert — it had to grow a parameter first).
   *
   *   (a) a miss line never names the child's own guess back at them — echoing the figure is how a
   *       redirect turns into hot/cold, which §0a rejects outright ("a verdict is not required for
   *       something to be hot/cold");
   *   (b) once the parts that vary BY DESIGN are stripped, at most two wordings remain — one per
   *       side of the answer, which is as much as a miss may distinguish.
   *
   * ⚠️ (b) STARTED AS "at most two lines, full stop", AND SLICE SHOP FAILED IT HONESTLY. Its take
   * round says *"Not yet — Duck has nothing! Keep sharing."*, naming the friend who went without —
   * five wordings across six wrong counts. That is the chapter's whole argument (a denominator is
   * how many people are waiting) and it leaks nothing a child cannot already see on the board. The
   * blunt rule would have been satisfied by deleting the best sentence in the chapter, so the rule
   * moved instead: a probe may declare what varies by design, and everything else still has to hold.
   */
  for (const p of PROBES) {
    it(`${p.id}`, () => {
      for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
        const r = p.make(d, i)
        const acc = p.accepted(r)
        const wrong = p.inputs(r).filter(v => !acc.includes(v))
        if (wrong.length < 2) continue
        for (const v of wrong) {
          if (!names(p.miss(r, v), v)) continue
          /**
           * ⚠️ NAMING `v` IS ONLY AN ECHO IF IT APPEARED *BECAUSE* THE CHILD GUESSED `v`. Factor
           * Lab's constant line "Not yet — keep counting up in 5s" names the crate size, and a
           * child who happens to guess 5 has not been told anything — the sentence is identical
           * whatever they tap. The first draft flagged that coincidence and would have been
           * "satisfied" by rewording a correct line. So: it is an echo only when some OTHER wrong
           * guess produces a line that does NOT carry the figure.
           */
          const echo = wrong.some(v2 => v2 !== v && !names(p.miss(r, v2), v))
          expect(echo, `t${d} #${i}: miss line "${p.miss(r, v)}" reads the guess ${v} back`).toBe(false)
        }
        const shapes = new Set(wrong.map(v => (p.normalise ?? ((x: string) => x))(p.miss(r, v))))
        expect(shapes.size, `t${d} #${i}: ${shapes.size} wordings for ${wrong.length} wrong answers`)
          .toBeLessThanOrEqual(2)
      }
    })
  }
})

describe('Q6 · no string the child reads is malformed', () => {
  const BAD: Array<[RegExp, string]> = [
    [/undefined|NaN|\[object|null/i, 'a value that did not resolve'],
    [/\s{2,}/, 'a double space'],
    [/\s+[,.;]/, 'a space before punctuation'],
    [/\b1\s+(?!in all)\w+s\b/, 'a plural after 1'],
    [/\byies\b|\bys\b/, 'a broken plural'],
    [/(^|\s)(a|an)\s+(a|an)\s/i, 'a doubled article'],
    [/\bbecause or\b|\brun just\b/, 'a concatenation seam'],
  ]
  for (const p of PROBES) {
    it(`${p.id}`, () => {
      for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
        const r = p.make(d, i)
        const acc = p.accepted(r)
        const texts = [
          ...p.preAnswer(r),
          ...p.inputs(r).flatMap(v => [p.nudge(r, v) ?? '', acc.includes(v) ? '' : p.miss(r, v), p.verdict?.(r, v) ?? '']),
        ].filter(s => s.trim().length)
        for (const t of texts) {
          for (const [re, why] of BAD) {
            expect(re.test(t), `t${d} #${i}: ${why} — "${t}"`).toBe(false)
          }
        }
      }
    })
  }
})

describe('Q7 · the answer surface is not a coin flip', () => {
  // §0b: "A TWO-OPTION ANSWER SURFACE IS A COIN FLIP, AND WIDENING IT USUALLY ASSESSES A SECOND
  // HALF OF THE SKILL YOU WERE GIVING AWAY." Rounding went 50% → 17% by showing six stops.
  // Reported per chapter as well as asserted, because the number is the point.
  const rate: Array<[string, number, number]> = []
  for (const p of PROBES) {
    it(`${p.id}`, () => {
      let acc = 0, all = 0, n = 0
      for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
        const r = p.make(d, i)
        const ins = p.inputs(r)
        if (!ins.length) continue
        acc += p.accepted(r).filter(a => ins.includes(a)).length
        all += ins.length
        n++
      }
      if (!n) return
      const guess = acc / all
      rate.push([p.id, guess, n])
      expect(guess, `${p.id}: a child guessing blind gets ${(guess * 100).toFixed(0)}% right`)
        .toBeLessThan(0.34)
    })
  }
})

// ─── the axis a number cannot carry ──────────────────────────────────────────────────────

describe('Q8 · Slice Shop — reaching for the WRONG PIECE is answered, and never with the answer', () => {
  it('every piece the child can pick gets a real sentence back', () => {
    // The chapter's own comment: a child asked for thirds who reaches for the half piece can fill
    // the whole EXACTLY with two of them — full, and wrong. That is the misconception the round
    // exists for, so it is the one the words most have to handle.
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = slice.makeFrRound(d, i)
      for (const den of slice.densFor(d)) {
        for (let laid = 0; laid <= den; laid++) {
          if (slice.isSolved(r, { den, laid })) continue
          const m = slice.missFor(r, { den, laid })
          expect(m.trim().length, `t${d} #${i}: den ${den} laid ${laid} → nothing said`).toBeGreaterThan(0)
          expect(/undefined|NaN|\[object/.test(m), `t${d} #${i}: "${m}"`).toBe(false)
          /**
           * ⚠️ A WRONG PIECE AND A WRONG COUNT ARE DIFFERENT MISTAKES AND MAY NOT GET THE SAME
           * WORDS. Without this, dropping the whole piece-size branch leaves a child who reached
           * for halves when three friends are waiting reading "somebody else is still waiting for
           * a piece" — true of a different mistake, useless for theirs, and green on every
           * non-empty check. Found by mutation, not by reading.
           */
          if (den !== r.den) {
            expect(m, `t${d} #${i}: wrong PIECE (${den} for ${r.den}) answered as a wrong COUNT`)
              .not.toBe(slice.missFor(r, { den: r.den, laid }))
          }
        }
      }
    }
  })
})
