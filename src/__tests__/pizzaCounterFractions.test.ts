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
import { readFileSync, existsSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import {
  MAX_FINGERS, makeRound, mkMatch, graded, missFor, nudgeFor, verdictFor,
  explainBeats, padChoices, instructionFor, sayFor, openingTake, exactly, fewestBeating,
  numeratorsFor, boardBand, TOP_BAND, BOT_BAND, ACTION_ROW, ANCHOR, DEMO, GUIDED,
  MATCH_PAIRS, MORE_PAIRS, type PzRound, type Tier,
} from '@/features/chapters/story/pizza'

/** The scene, comments stripped — a source check that matches the paragraph explaining a rule
 *  instead of the code obeying it is a check this repo has already shipped once. */
const strip = (f: string) => readFileSync(f, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SCENE = strip('src/features/chapters/story/PizzaCounter.tsx')

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
    expect(SCENE).toMatch(/taken=\{reveal\?\.take \?\? openingTake\(data\)\}/)
  })
  it('the EXPLORE beat is the one place the board follows the input live', () => {
    expect(SCENE).toMatch(/taken=\{take\}/)          // ExploreBoard, driven straight off the reading
    expect(SCENE).toMatch(/function ExploreBoard/)
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
    expect(SCENE).toMatch(/make:\s*\(d,\s*_round,\s*asked\)\s*=>\s*makeRound\(.*asked\s*\?\?\s*\[\]\)/)
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

describe('layout', () => {
  const SIZES = [[640, 320], [740, 360], [812, 375], [1024, 620], [1280, 720], [1440, 900], [1920, 800], [2560, 1080]]
  it('⚠️ the board never reaches into the controls, at any size or prompt height', () => {
    for (const [, vh] of SIZES) for (const short of [true, false]) for (const pb of [0, 60, 100, 142, 200, 265]) {
      for (const extra of [0, ACTION_ROW(short)]) {
        const { top, band, bot } = boardBand(vh, short, pb, extra)
        expect(top).toBeGreaterThanOrEqual(0)
        // An exact equality, because the clamp is on `top`: a floor on the BAND would let it
        // overflow downward while `bot` still claimed the reserve was intact, which is how the
        // sibling chapter drew its bench 32px into the note pill.
        expect(top + band).toBe(vh - bot)
      }
    }
  })
  it('the clamp is on `top`, so the board slides UP under the question card', () => {
    // A huge promptBottom must not push the board down; it must push it up under the card.
    const a = boardBand(320, true, 0)
    const b = boardBand(320, true, 265)
    expect(b.top).toBeLessThanOrEqual(Math.max(a.top, TOP_BAND(true)) + 265)
    expect(b.top + b.band).toBe(320 - BOT_BAND(true))
  })
  it('the explore beat is told about its extra button row', () => {
    const plain = boardBand(720, false, 0, 0)
    const withBtn = boardBand(720, false, 0, ACTION_ROW(false))
    expect(withBtn.band).toBe(plain.band - ACTION_ROW(false))
  })
})

describe('the chapter is wired to the shared AR layer, both doors, one grader', () => {
  it('reads a finger COUNT', () => {
    expect(SCENE).toMatch(/useHandInput\(\{\s*reads:\s*'count'/)
  })
  it('the camera is the backdrop, with the fingertip markers on', () => {
    expect(SCENE).toMatch(/<CamView[^>]*\bfull\b[^>]*\bmarkers\b/)
  })
  it('both doors are on the intro card, every time', () => {
    expect(SCENE).toMatch(/alt=\{onCam/)
    expect(SCENE).toMatch(/useTaps\(\)/)
    expect(SCENE).toMatch(/useCamera\(\)/)
  })
  it('⚠️ the tap path never starts the camera — no permission prompt, no 6 MB of WASM', () => {
    expect(SCENE).toMatch(/if \(onCam\) start\(\)/)
  })
  it('`useDwell` is called unconditionally, so the hook count cannot change with the input', () => {
    // Branching above a hook tears the chapter into the error boundary; this repo shipped that once.
    expect(SCENE).toMatch(/const progress = useDwell\(/)
    expect(SCENE).not.toMatch(/if \([^)]*input[^)]*\)\s*(\{[^}]*)?return[\s\S]{0,400}useDwell/)
  })
  it('the dwell will not arm on a fist, because no round accepts one', () => {
    expect(SCENE).toMatch(/ready:\s*read\.hands > 0 && read\.count > 0/)
  })
  it('BOTH inputs land in the one grading sink', () => {
    expect(SCENE).toMatch(/onPick=\{commit\}/)        // tap
    expect(SCENE).toMatch(/useDwell\([\s\S]{0,200}?commit,/) // hand
  })
  it('the verdict comes from the pure module, not a string built in the scene', () => {
    expect(SCENE).toMatch(/const \{ text: verdict, ok \} = verdictFor\(data, fingers\)/)
  })
  it('the chapter suppresses SkillBeat\'s own prompt pill and draws its richer card', () => {
    expect(SCENE).toMatch(/prompt:\s*\(\)\s*=>\s*''/)
    expect(SCENE).toMatch(/<PromptCard[^>]*instruction=/)
  })
})

describe('the world, and the verb 6–8 already owns', () => {
  it('⚠️ a comparison round draws TWO pizzas — the thing SliceShop structurally cannot show', () => {
    // 6–8 owns pizza AND owns FIT IT (one whole, one piece size). Same world plus same verb is the
    // same chapter a band later; two wholes is the whole separation.
    expect(SCENE).toMatch(/label="theirs"/)
    expect(SCENE).toMatch(/const two = data\.qType !== 'op'/)
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
    // ⚠️ COUNTED, not matched. The card has two bodies — one per input — and `toMatch` is satisfied
    // by two occurrences in one body and none in the other, which is a card that drops the anchor
    // for whichever child picked the other door.
    expect(SCENE.split('${ANCHOR}').length - 1).toBe(2)
  })
})
