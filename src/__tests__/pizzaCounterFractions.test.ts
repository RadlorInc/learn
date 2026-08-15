/**
 * THE PIZZA COUNTER (9–11, AR) — the chapter's gate.
 *
 * The answering surface is a WEBCAM, so almost nothing about this chapter can be driven headlessly.
 * That makes the pure module carry more weight than usual: everything below drives the SAME exported
 * functions the scene renders and grades from (`makeRound`, `graded`, `missFor`, `verdictFor`,
 * `explainBeats`, `boardBand`) rather than a second copy of the rules.
 *
 * Two invariants are load-bearing and everything else hangs off them:
 *   · THE TEN-FINGER CEILING — a round with no accepted answer in 1..10 is unanswerable, and unlike
 *     a wrong answer it strands the child with nothing to do.
 *   · MY PIZZA IS WHOLE UNTIL THE COMMIT — two gaps side by side can be compared BY EYE, so a board
 *     that showed the child's gap while the question was open would answer it for them.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { PIZZA_COUNTER_CONFIG } from '@/features/chapters/teen/games/PizzaCounterGame'
import { NO_HAND } from '@/infra/ar/HandInput'
import {
  MAX_FINGERS, makeRound, mkMatch, graded, missFor, nudgeFor, verdictFor, explainBeats,
  padChoices, instructionFor, sayFor, openingTake, exactly, fewestBeating, numeratorsFor,
  ANCHOR, DEMO, GUIDED, MATCH_PAIRS, MORE_PAIRS, type PzRound, type Tier,
} from '@/features/chapters/story/pizza'

/** The scene, comments stripped — a source check that matches the paragraph explaining a rule
 *  instead of the code obeying it is a check this repo has already shipped once. */
const strip = (f: string) => readFileSync(f, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SCENE = strip('src/features/chapters/teen/games/PizzaCounterGame.tsx')

const TIERS: Tier[] = [1, 2, 3]
/** Both answer surfaces. Every wording rule has to hold on each — a chip naming a gesture the
 *  child's surface does not have is the 12–14 audit's headline fault, invisible to a single-mode
 *  check. */
const INPUTS = ['hand', 'tap'] as const
/** Enough draws that every branch of every tier's pool is hit many times over. */
const sweep = (fn: (r: PzRound, d: Tier) => void) => {
  for (const d of TIERS) for (let i = 0; i < 900; i++) fn(makeRound(d), d)
}
const ALL = [...DEMO, GUIDED]
/** A standalone number, so "2" does not match inside "12". */
const names = (s: string, n: number) => new RegExp(`(^|[^\\d/])${n}([^\\d/]|$)`).test(s)

describe('the fraction maths', () => {
  it('`exactly` agrees with there being a whole number of my slices in theirs', () => {
    for (let rd = 2; rd <= 12; rd++) for (let d = 2; d <= 12; d++) for (let n = 1; n < rd; n++) {
      const k = (n * d) / rd
      expect(exactly(n, rd, d)).toBe(Number.isInteger(k))
    }
  })
  it('`fewestBeating` really is the fewest that beats — and the one below it does not', () => {
    for (let rd = 2; rd <= 12; rd++) for (let d = 2; d <= 12; d++) for (let n = 1; n < rd; n++) {
      const k = fewestBeating(n, rd, d)
      expect(k * rd).toBeGreaterThan(n * d)          // k/d  >  n/rd
      expect((k - 1) * rd).toBeLessThanOrEqual(n * d) // (k-1)/d ≤ n/rd
    }
  })
  it('`numeratorsFor` filters on exactness, so a `more` round can never claim a lie', () => {
    for (const t of TIERS) {
      for (const [rd, d] of MATCH_PAIRS[t]) for (const n of numeratorsFor(rd, d, true)) expect(exactly(n, rd, d)).toBe(true)
      for (const [rd, d] of MORE_PAIRS[t]) for (const n of numeratorsFor(rd, d, false)) expect(exactly(n, rd, d)).toBe(false)
    }
  })
  it('every pair in every pool yields at least one legal numerator', () => {
    for (const t of TIERS) {
      for (const [rd, d] of MATCH_PAIRS[t]) expect(numeratorsFor(rd, d, true).length).toBeGreaterThan(0)
      for (const [rd, d] of MORE_PAIRS[t]) expect(numeratorsFor(rd, d, false).length).toBeGreaterThan(0)
    }
  })
  it('⚠️ [4,6] is the trap: a non-multiple pair that still has an exact numerator', () => {
    // 2/4 IS exactly 3/6, so a `more` round drawn on it would tell the child in its own prompt that
    // nothing lands exactly. The filter is what stops that, so the trap is pinned.
    expect(exactly(2, 4, 6)).toBe(true)
    expect(numeratorsFor(4, 6, false)).not.toContain(2)
  })
})

describe('the ten-finger ceiling', () => {
  it('every round has exactly one accepted answer, in reach of two hands', () => {
    sweep(r => {
      expect(r.accepts).toHaveLength(1)
      expect(r.accepts[0]).toBeGreaterThanOrEqual(1)
      expect(r.accepts[0]).toBeLessThanOrEqual(MAX_FINGERS)
    })
  })
  it('and never asks for more slices than the pizza has', () => {
    sweep(r => expect(r.accepts[0]).toBeLessThanOrEqual(r.den))
  })
  it('holds for the demo and guided rounds too', () => {
    for (const r of ALL) {
      expect(r.accepts[0]).toBeGreaterThanOrEqual(1)
      expect(r.accepts[0]).toBeLessThanOrEqual(Math.min(r.den, MAX_FINGERS))
    }
  })
  it('NO round accepts 0 — which is why a fist means nothing and the pad starts at 1', () => {
    sweep(r => expect(r.accepts).not.toContain(0))
    expect(padChoices()[0]).toBe(1)
    expect(padChoices()).toHaveLength(MAX_FINGERS)
  })
})

describe('the tap path offers the same answers as the hand', () => {
  it('every round the generator can draw is answerable ON THE PAD', () => {
    sweep(r => expect(padChoices()).toContain(r.accepts[0]))
  })
  it('and so are the demo and guided rounds', () => {
    for (const r of ALL) expect(padChoices()).toContain(r.accepts[0])
  })
  it('the pad grades through the SAME grader — no second copy of the rule', () => {
    sweep(r => {
      for (const n of padChoices()) expect(graded(r, n)).toBe(r.accepts.includes(n))
    })
  })
})

describe('the grader', () => {
  it('a `match` answer really is the same amount of pizza', () => {
    sweep(r => {
      if (r.qType !== 'match') return
      // k/den === refNum/refDen, cross-multiplied so there is no float in the assertion
      expect(r.accepts[0] * r.refDen).toBe(r.refNum * r.den)
    })
  })
  it('a `more` answer really beats theirs, and the count below it really does not', () => {
    sweep(r => {
      if (r.qType !== 'more') return
      const k = r.accepts[0]
      expect(k * r.refDen).toBeGreaterThan(r.refNum * r.den)
      expect((k - 1) * r.refDen).toBeLessThanOrEqual(r.refNum * r.den)
    })
  })
  it('⚠️ a `more` round is drawn ONLY where no exact match exists — its prompt says so', () => {
    sweep(r => {
      if (r.qType !== 'more') return
      expect(exactly(r.refNum, r.refDen, r.den)).toBe(false)
      expect(r.prompt).toMatch(/no number of my slices lands exactly/)
    })
  })
  it('an `op` round is arithmetic on ONE pizza and never overflows it', () => {
    sweep(r => {
      if (r.qType !== 'op') return
      expect(r.accepts[0]).toBe(r.op === '+' ? r.gone + r.step : r.gone - r.step)
      expect(r.gone).toBeGreaterThanOrEqual(1)
      expect(r.step).toBeGreaterThanOrEqual(1)
      expect(Math.max(r.gone, r.accepts[0])).toBeLessThanOrEqual(r.den)
      expect(r.refDen).toBe(0)
    })
  })
})

describe('nothing is a coin flip, and the comparison is a real one', () => {
  it('the surface offers ten answers, not two', () => {
    expect(padChoices().length).toBeGreaterThanOrEqual(10)
  })
  it('⚠️ NO round is same-denominator against itself — the fault this chapter replaces', () => {
    // The old FractionForge drew ONE denominator and two numerators, so "which is greater, 4/5 or
    // 2/5" was comparing 4 with 2. Every comparison here crosses two different cuts.
    sweep(r => { if (r.qType !== 'op') expect(r.den).not.toBe(r.refDen) })
  })
  it('a `match` is never answerable by echoing their numerator back', () => {
    // Its answer is refNum × k with k ≥ 2, so it is always strictly more. (A `more` round CAN land
    // on 1 when my slices are the coarser cut — "one half already beats a fifth" — and that is a
    // real reading of the inverse relationship rather than an echo, so it is not asserted away.)
    sweep(r => { if (r.qType === 'match') expect(r.accepts[0]).toBeGreaterThan(r.refNum) })
  })
  it('⚠️ a `more` round never answers "all of it" — that is an empty plate, not a comparison', () => {
    sweep(r => { if (r.qType === 'more') expect(r.accepts[0]).toBeLessThan(r.den) })
  })
})

describe('the board must not answer for the child', () => {
  it('⚠️ MY pizza is WHOLE while a match or more question is open', () => {
    sweep(r => { if (r.qType !== 'op') expect(openingTake(r)).toBe(0) })
    for (const r of ALL) if (r.qType !== 'op') expect(openingTake(r)).toBe(0)
  })
  it('an `op` round DOES open with its given slices gone — they are stated, not guessed', () => {
    sweep(r => { if (r.qType === 'op') expect(openingTake(r)).toBe(r.gone) })
  })
  it('the scene draws the board from `openingTake` until a reveal exists', () => {
    // Anchored on the real expression, not on the identifier appearing somewhere in the file: a
    // check that only proves a function is MENTIONED passes with the bug restored behind it.
    // ⚠️ MY PIZZA STAYS WHOLE UNTIL THE COMMIT — the anti-oracle. Two gaps side by side can be
    // compared BY EYE, so a board that took slices live would let a child sweep 1,2,3… and stop
    // when the gaps matched, having judged nothing.
    expect(SCENE).toMatch(/openingTake\(r\)/)
  })
  it('⚠️ NOTHING follows the input live before the commit — there is no explore beat any more', () => {
    // The bespoke chapter had an `ExploreBoard` where the pizzas reflowed as you dragged, which was
    // safe because nothing was scored there. The shell has no explore phase wired for this chapter
    // yet (`TeenChapterCfg.explore` + a Sim would give it one), so the anti-oracle rule now has to
    // hold everywhere: the board may never move before the commit.
    expect(SCENE, 'no live-follow surface').not.toMatch(/function ExploreBoard/)
    // ⚠️ AND THE BOARD MAY ONLY MOVE ON THE REVEAL. Grepping for `openingTake` is not enough — a
    // board written `value ?? openingTake(r)` still calls it and still follows the child live, which
    // is the eye-oracle: two gaps side by side can be compared BY EYE, so a child could sweep
    // 1,2,3… and stop when they matched, having judged nothing. Assert the GUARD, not the call.
    expect(SCENE).toMatch(/reveal && value != null \? value : openingTake\(r\)/)
    expect(SCENE, 'never the bare value').not.toMatch(/taken = value \?\? openingTake/)
  })
})

describe('the round must not leak the answer', () => {
  it('no miss line ever names the accepted answer', () => {
    sweep(r => expect(names(missFor(r), r.accepts[0])).toBe(false))
  })
  it('a miss line is per TYPE, not per round — so it can never narrow toward the numbers', () => {
    // ⚠️ Written first as `expect(missFor(r)).toBe(missFor(r))` across every guess, which is a
    // tautology: `missFor` does not take the guess at all, so it was comparing a value with itself.
    // The property that is actually worth holding is that two different rounds of one type say the
    // same words, which is what stops the wording drifting toward this round's own figures.
    const byType = new Map<string, string>()
    sweep(r => {
      const seen = byType.get(r.qType)
      if (seen === undefined) byType.set(r.qType, missFor(r))
      else expect(missFor(r)).toBe(seen)
    })
    expect([...byType.keys()].sort()).toEqual(['match', 'more', 'op'])
  })
  it('⚠️ no WRONG verdict names the right answer either', () => {
    sweep(r => {
      for (const n of padChoices()) {
        if (n === r.accepts[0] || nudgeFor(r, n)) continue
        const v = verdictFor(r, n)
        expect(v.ok).toBe(false)
        expect(names(v.text, r.accepts[0])).toBe(false)
      }
    })
  })
  it('a correct verdict states the equivalence — that IS the payload, and by then it is given', () => {
    sweep(r => {
      const v = verdictFor(r, r.accepts[0])
      expect(v.ok).toBe(true)
      if (r.qType === 'match') expect(v.text).toContain(`${r.refNum}/${r.refDen}`)
    })
  })
})

describe('nudges redirect rather than score', () => {
  it('more slices than the pizza has is a nudge, not a mark', () => {
    sweep(r => {
      if (r.den >= MAX_FINGERS) return
      expect(nudgeFor(r, r.den + 1)).toBeTruthy()
    })
  })
  it('and a genuinely wrong count that IS expressible still costs a mark', () => {
    sweep(r => {
      const wrong = r.accepts[0] === 1 ? 2 : 1
      if (wrong > r.den) return
      expect(nudgeFor(r, wrong)).toBeNull()
      expect(graded(r, wrong)).toBe(false)
    })
  })
  it('a nudge never names the answer either', () => {
    sweep(r => {
      for (const n of padChoices()) {
        const g = nudgeFor(r, n)
        if (g) expect(names(g, r.accepts[0])).toBe(false)
      }
    })
  })
})

describe('the wording knows which surface the child has', () => {
  /** Positive AND negative in each direction — without the last pair a renderer that ignored its
   *  input would pass every other check here. */
  const OTHER = { hand: /\btap\b/i, tap: /hold up|finger/i } as const
  const MINE = { hand: /hold up/, tap: /\btap\b/i } as const
  it('the instruction names the gesture that is actually on screen, and only that one', () => {
    sweep(r => {
      for (const i of INPUTS) {
        expect(instructionFor(r, i)).toMatch(MINE[i])
        expect(instructionFor(r, i)).not.toMatch(OTHER[i])
      }
    })
  })
  it('so does what Milo says', () => {
    sweep(r => {
      for (const i of INPUTS) {
        expect(sayFor(r, i)).toMatch(MINE[i])
        expect(sayFor(r, i)).not.toMatch(OTHER[i])
      }
    })
  })
  it('the CONTEXT never names a gesture — that is zone 3\'s job alone', () => {
    sweep(r => {
      expect(r.prompt).not.toMatch(/hold up|\btap\b|finger/i)
    })
  })
  it('every round states that both pizzas are the same size, or is about only one pizza', () => {
    // Two different-sized pizzas make their fractions incomparable, i.e. every comparison round
    // would be a lie. It is said in the copy because the picture cannot say it.
    sweep(r => { if (r.qType !== 'op') expect(r.prompt).toMatch(/same size/) })
  })
})

describe('the ladder and coverage', () => {
  it('L1 is `match` only — equivalence is the payload and the other two need it first', () => {
    for (let i = 0; i < 600; i++) expect(makeRound(1).qType).toBe('match')
  })
  it('all three readings are reachable at L2 and L3', () => {
    for (const d of [2, 3] as Tier[]) {
      const seen = new Set<string>()
      for (let i = 0; i < 900; i++) seen.add(makeRound(d).qType)
      expect([...seen].sort()).toEqual(['match', 'more', 'op'])
    }
  })
  it('the generator SPENDS a scarce round on a reading not yet asked', () => {
    // The beat declares coverage, so ignoring `asked` denies a strong child the early finish.
    for (let i = 0; i < 300; i++) expect(makeRound(3, ['match', 'op']).qType).toBe('more')
    for (let i = 0; i < 300; i++) expect(makeRound(2, ['match', 'more']).qType).toBe('op')
  })
  it('and goes back to rolling dice once nothing is unmet', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 900; i++) seen.add(makeRound(3, ['match', 'more', 'op']).qType)
    expect(seen.size).toBeGreaterThan(1)
  })
  it('the beat declares coverage over all three, and feeds `asked` back to the generator', () => {
    expect(SCENE).toMatch(/coverage:\s*\{\s*of:[\s\S]*?all:\s*\['match',\s*'more',\s*'op'\]/)
    expect(SCENE, 'the generator is fed the asked list').toMatch(/makeTask: \(d, asked\)/)
    expect(PIZZA_COUNTER_CONFIG.coverage!.all).toEqual(['match', 'more', 'op'])
  })
  it('L3 grows the cuts past the doubling reflex', () => {
    expect(MATCH_PAIRS[3].some(([, d]) => d === 12)).toBe(true)
    expect(MATCH_PAIRS[1].every(([rd, d]) => d === rd * 2)).toBe(true)
  })
})

describe('the worked example teaches the round it is narrating', () => {
  it('every demo ends on the accepted answer', () => {
    sweep(r => {
      const bs = explainBeats(r)
      expect(bs.length).toBeGreaterThanOrEqual(3)
      expect(bs[bs.length - 1].take).toBe(r.accepts[0])
    })
    for (const r of ALL) expect(explainBeats(r).at(-1)!.take).toBe(r.accepts[0])
  })
  it('and never takes more slices than the pizza has, at any beat', () => {
    sweep(r => { for (const b of explainBeats(r)) expect(b.take).toBeLessThanOrEqual(r.den) })
  })
  it('a match example shows one of mine falling SHORT before it shows the answer', () => {
    // The argument of the chapter is that a smaller slice does not reach — if the demo jumps
    // straight to the answer the child watches a fact appear rather than a comparison happen.
    const bs = explainBeats(mkMatch(4, 1, 8))
    expect(bs.some(b => b.take > 0 && b.take < 2)).toBe(true)
  })
  it('the three demos cover all three readings', () => {
    expect(DEMO.map(d => d.qType).sort()).toEqual(['match', 'more', 'op'])
  })
  it('the guided round is the easiest match, not a `more` or an `op`', () => {
    expect(GUIDED.qType).toBe('match')
    expect(GUIDED.accepts[0]).toBeLessThanOrEqual(4)
  })
})

describe('the world, and the verb 6–8 already owns', () => {
  it('⚠️ a comparison round draws TWO pizzas — the thing SliceShop structurally cannot show', () => {
    // 6–8 owns pizza AND owns FIT IT (one whole, one piece size). Same world plus same verb is the
    // same chapter a band later; two wholes is the whole separation.
    expect(SCENE).toMatch(/label="theirs"/)
    expect(SCENE, 'a comparison round draws THEIRS as well as MINE').toMatch(/const two = r\.qType !== 'op'/)
    expect(SCENE).toMatch(/two && <Card label="theirs"/)
  })
  it('the chapter does not reach into 6–8\'s fraction module', () => {
    expect(SCENE).not.toMatch(/from '\.\/slice'/)
  })
  it('the pizza is a real sprite clipped by the exact wedge, never a flat pie slice', () => {
    expect(SCENE).toMatch(/clipPath=\{`url\(#\$\{uid\}-w\$\{i\}\)`\}/)
    expect(SCENE).toMatch(/<image href=\{PIZZA_ART\}/)
  })
  it('and that sprite is on disk — a missing one falls back to nothing', () => {
    expect(existsSync('public/assets/objects/pizza_base.png')).toBe(true)
  })
  it('the daily anchor rides BOTH bodies of the briefing card', () => {
    expect(ANCHOR).toMatch(/pizza/i)
    // ⚠️ ONE body now, not two: the shell's IntroCard shows a single blurb and offers the other
    // door beside it, so the anchor cannot be dropped for whichever child picked the other input —
    // the fault the two-body count was written to catch is no longer expressible.
    expect(String(PIZZA_COUNTER_CONFIG.start.blurb)).toContain(ANCHOR)
  })
})

/**
 * ⚠️ THE SCENE-SOURCE BLOCKS THAT USED TO LIVE HERE ARE GONE, AND NOT BECAUSE THEY WERE FAILING.
 * They guarded rules a bespoke component owned — both doors, the dwell key, the one-grader path, the
 * band arithmetic, the lane. GameShell owns every one of those now, so they are gated ONCE for all
 * ten 9–11 chapters in `bandOnGameShell.test.ts` instead of once per chapter, which is the entire
 * point of the port. What is left below is what is still THIS chapter's to get wrong, and it is
 * driven from the CONFIG rather than grepped out of JSX.
 */
describe('the chapter on the shell', () => {
  it('declares the band', () => { expect(PIZZA_COUNTER_CONFIG.band).toBe('9-11') })

  it('⚠️ NO answer is ever 0 here, so a fist means nothing — the mirror of The Coin Tray', () => {
    const ready = PIZZA_COUNTER_CONFIG.hand!.ready!
    expect(ready({ ...NO_HAND, hands: 1, count: 0 }), 'a fist is NOT an answer here').toBe(false)
    expect(ready({ ...NO_HAND, hands: 1, count: 3 })).toBe(true)
  })

  it('withholds mastery until all three readings have been asked', () => {
    expect(PIZZA_COUNTER_CONFIG.coverage!.all).toEqual(['match', 'more', 'op'])
  })

  it('carries the anchor into the briefing', () => {
    expect(String(PIZZA_COUNTER_CONFIG.start.blurb)).toContain(ANCHOR)
  })
})

/**
 * ⚠️ THE BAND SUITE IS GONE, DELIBERATELY, AND NOT BECAUSE IT WAS FAILING. `boardBand`/`benchBand`,
 * the band constants and the lane all tested arithmetic this chapter no longer owns: GameShell owns
 * the bands and `FitSlot` scales the instrument into whatever is left. Keeping them would have been
 * a gate driving dead code, which is worse than no gate because it reads as coverage. The rules that
 * still matter live ONCE in `bandOnGameShell.test.ts`, for all ten chapters.
 */
