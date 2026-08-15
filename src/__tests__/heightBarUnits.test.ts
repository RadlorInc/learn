/**
 * THE HEIGHT BAR (9–11, `measurementUnits`) — the gate.
 *
 * The chapter is answered with a WEBCAM, which no test can feed, so everything that can be held to
 * account lives in story/inches.ts and is driven here. What the gate cannot see (the camera, the
 * layout on screen, the overlay) is verified by driving the running app, and the source checks below
 * are what stop the scene quietly re-implementing a rule this file proves.
 *
 * ⚠️ EVERY REGRESSION IN THE LIST AT THE FOOT OF THIS FILE WAS PLANTED IN THE **SOURCE**, never in an
 * assertion — mutating a test only proves the test can fail, not that it is wired to the thing it
 * guards.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { HEIGHT_BAR_CONFIG, enterDigit, EMPTY } from '@/features/chapters/teen/games/HeightBarGame'
import { NO_HAND } from '@/infra/ar/HandInput'
import {
  makeRound, mkFit, mkNeed, mkSwap, headline, signOf, fits, graded, entryValue, entryFull,
  missFor, nudgeFor, verdictFor, explainBeats, padChoices, instructionFor, sayFor, units, ftIn,
  spanInches, spanNote, tensOf, onesOf, PAIRS, SWAP_POOL, LIMITS, MIN_HEIGHT, MAX_PER_PLACE,
  HAND_IN, SPAN_MIN_HANDS, EMPTY_ENTRY, DEMO, GUIDED, exploreText, EXPLORE_BUDGET,
  type HbRound, type Tier, type Entry,
} from '@/features/chapters/story/inches'
import { palmSpan, spanRatio, handWidth, quantSpan, SPAN_STEPS } from '@/infra/ar/fingerCount'

const SRC = readFileSync(join(process.cwd(), 'src/features/chapters/teen/games/HeightBarGame.tsx'), 'utf8')
const DETECT = readFileSync(join(process.cwd(), 'src/infra/ar/useFingerCounter.ts'), 'utf8')
const TIERS: Tier[] = [1, 2, 3]

/** A big sample of every tier — the generator is random, so a claim about it is a claim about draws. */
function draw(d: Tier, n = 800): HbRound[] {
  return Array.from({ length: n }, () => makeRound(d))
}
const ALL: HbRound[] = TIERS.flatMap(d => draw(d))

/** The answer built correctly, as the two places the surface offers. */
const built = (n: number): Entry => ({ tens: tensOf(n), ones: onesOf(n) })

/**
 * ⚠️ TOKENS, NOT SUBSTRINGS. `4 ft 12 in` contains "12" while meaning nothing of the kind, and a
 * substring sweep for the answer would fire on it — a flaky gate is worse than no gate.
 */
const numbers = (s: string): number[] => (s.match(/\d+/g) ?? []).map(Number)

describe('the answer surface can express every answer', () => {
  it('every answer the generator draws fits the two places, 0..99', () => {
    for (const r of ALL) {
      expect(r.answer, `${r.qType} ${r.prompt}`).toBeGreaterThanOrEqual(0)
      expect(r.answer, `${r.qType} ${r.prompt}`).toBeLessThanOrEqual(99)
      expect(Number.isInteger(r.answer)).toBe(true)
    }
  })

  it('the tap pad offers exactly what a place can hold, and starts at 0', () => {
    // ⚠️ Zero is the tens digit of every answer under ten AND the whole answer of a `need` round at
    // the boundary. A pad starting at 1 makes rounds unanswerable by tap that the camera can answer.
    expect(padChoices()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(padChoices()[0]).toBe(0)
    expect(Math.max(...padChoices())).toBe(MAX_PER_PLACE)
  })

  it('and the camera guard matches it — `hands > 0`, never `count > 0`', () => {
    // The pair the ar craft doc says a gate can assert. A `count > 0` guard here would make every
    // answer under ten (tens digit 0) and every boundary `need` unanswerable by hand.
    expect(HEIGHT_BAR_CONFIG.hand!.ready!({ ...NO_HAND, hands: 1, count: 0 }), 'a fist').toBe(true)
    expect(HEIGHT_BAR_CONFIG.hand!.ready!({ ...NO_HAND, hands: 0, count: 0 }), 'no hand').toBe(false)
    expect(SRC).not.toMatch(/ready:\s*read\.count\s*>\s*0/)
  })

  it('every answer is reachable as two single digits', () => {
    for (const r of ALL) {
      const e = built(r.answer)
      expect(e.tens).toBeLessThanOrEqual(MAX_PER_PLACE)
      expect(e.ones).toBeLessThanOrEqual(MAX_PER_PLACE)
      expect(entryValue(e)).toBe(r.answer)
      expect(graded(r, e)).toBe(true)
    }
  })
})

describe('nothing prints the answer before the commit', () => {
  it('no headline contains the answer as a token, on any type or tier', () => {
    for (const r of ALL) {
      expect(numbers(headline(r, false)), `${r.qType}: ${headline(r, false)}`).not.toContain(r.answer)
    }
  })

  it('and the reveal DOES show it — or the bridge never happens', () => {
    for (const r of ALL) expect(numbers(headline(r, true))).toContain(r.answer)
  })

  it('no prompt or spoken line contains the answer as a token', () => {
    for (const r of ALL) {
      expect(numbers(r.prompt), `${r.qType}: ${r.prompt}`).not.toContain(r.answer)
      expect(numbers(r.spoken), `${r.qType}: ${r.spoken}`).not.toContain(r.answer)
    }
  })

  it('the sign shows the posted limit and never the child\'s height in inches', () => {
    for (const r of ALL) {
      const s = signOf(r)
      if (r.qType === 'swap') { expect(s).toBeNull(); continue }
      expect(numbers(s!)).toEqual([r.limit])
      expect(numbers(s!)).not.toContain(r.answer)
    }
  })

  it('the bar draws the limit only — no ruled scale a child could count', () => {
    // ⚠️ A ruled bar is the printed answer drawn instead of written; an area chapter was deleted for
    // exactly this. The bar may not repeat, tile or map an array of ticks.
    const bar = SRC.slice(SRC.indexOf('function Bar('), SRC.indexOf('function Window('))
    expect(bar).not.toMatch(/repeat\(|Array\.from|\.map\(/)
  })
})

describe('the ask always needs a conversion', () => {
  it('the limit and the measurement are never stated in the same unit', () => {
    // ⚠️ State both in inches and there is nothing to convert — the round still looks perfectly
    // reasonable and teaches nothing. This is cents.ts's "$0.60 vs $0.55" trap, one anchor along.
    for (const r of ALL) {
      if (r.qType === 'swap') { expect(r.unit).not.toBe(r.fromUnit); continue }
      expect(r.unit).toBe('in')
      expect(r.prompt).toMatch(/\bft\b/)      // the door frame is in feet
      expect(r.prompt).toMatch(/\bin\b|inch/) // the sign is in inches
    }
  })

  it('a swap round never converts a unit into itself', () => {
    for (const r of ALL.filter(r => r.qType === 'swap')) {
      expect(r.from).toBeGreaterThan(1)
      expect(r.answer).not.toBe(r.from)
    }
  })
})

describe('the ladder grows the skill', () => {
  it('L1 is whole feet only — the twelve-times table the ruler is printed with', () => {
    for (const r of draw(1)) {
      expect(r.qType).toBe('fit')
      expect(r.inch).toBe(0)
      expect(r.answer % 12).toBe(0)
    }
  })

  it('L2 and L3 ask an inches remainder, or the two-step conversion is never met', () => {
    for (const d of [2, 3] as Tier[]) {
      const fit = draw(d).filter(r => r.qType === 'fit')
      expect(fit.some(r => r.inch > 0), `tier ${d}`).toBe(true)
    }
  })

  it('L3 draws heights BELOW the sign, so "yes" is not the answer every time', () => {
    const fit3 = draw(3).filter(r => r.qType === 'fit')
    expect(fit3.some(r => !fits(r))).toBe(true)
    expect(fit3.some(r => fits(r))).toBe(true)
  })

  it('L3 guarantees the exact boundary on `need`, and no other tier fakes it', () => {
    // ⚠️ "Exactly tall enough" is the case the bar cannot settle by eye, so the tier that teaches it
    // must GUARANTEE it rather than roll for it.
    expect(draw(3).filter(r => r.qType === 'need').some(r => r.answer === 0)).toBe(true)
    expect(draw(2).filter(r => r.qType === 'need').every(r => r.answer > 0)).toBe(true)
  })

  it('L2 swaps use the small factors; L3 brings in 16', () => {
    const f = (d: Tier) => new Set(draw(d).filter(r => r.qType === 'swap').map(r => r.answer / r.from))
    expect([...f(2)].every(x => x <= 4)).toBe(true)
    expect(f(3).has(16)).toBe(true)
  })

  it('no round states a height below a plausible child\'s', () => {
    // ⚠️ THE LITERAL 36, NOT `MIN_HEIGHT`. Written in terms of the constant it guards, this check
    // MOVES WITH the mutation — dropping MIN_HEIGHT to 12 left it perfectly green while the chapter
    // told a nine-year-old they were 2 ft 1. The only thing a re-derivation cannot move is a number
    // written down, which is the same fix `boardsTop` needed.
    expect(MIN_HEIGHT, '3 ft — the shortest height a round may call the child\'s own').toBe(36)
    for (const r of ALL.filter(r => r.qType !== 'swap')) {
      expect(r.ft * 12 + r.inch, `${r.qType}: ${ftIn(r.ft, r.inch)}`).toBeGreaterThanOrEqual(36)
      expect(r.ft).toBeGreaterThanOrEqual(3)
      expect(r.inch).toBeLessThan(12)
    }
  })

  it('the child\'s own working never lands on the number printed on the sign', () => {
    // ⚠️ CAUGHT ON SCREEN, NOT BY ARITHMETIC. `4 ft 3 in` against a 48 in sign makes the first step
    // (4 × 12) equal to the sign itself, and the demo said so out loud right under it. Nothing prints
    // the answer; a child who stops at the number they can see is simply wrong for a reason the
    // chapter created. L1 is exempt — there `ft × 12` IS the answer, and the limit is filtered off it.
    for (const r of ALL.filter(r => r.qType !== 'swap' && r.inch > 0)) {
      expect(r.ft * 12, `${ftIn(r.ft, r.inch)} vs sign ${r.limit}`).not.toBe(r.limit)
    }
    for (const r of draw(1)) expect(r.answer).not.toBe(r.limit)
    for (const r of DEMO.filter(r => r.qType !== 'swap' && r.inch > 0)) expect(r.ft * 12).not.toBe(r.limit)
  })

  it('a `need` answer is never negative and never more than a foot', () => {
    for (const r of ALL.filter(r => r.qType === 'need')) {
      expect(r.answer).toBeGreaterThanOrEqual(0)
      expect(r.answer).toBeLessThanOrEqual(11)
    }
  })
})

describe('the source pools are what they claim', () => {
  // ⚠️ A round-level sweep structurally cannot see a bad pool — slipping a wrong entry in still
  // produces perfectly valid rounds while a tier silently stops covering what it names.
  it('every swap pair keeps its largest draw inside the two-place surface', () => {
    for (const { pair, max } of SWAP_POOL) {
      expect(max * pair.factor).toBeLessThanOrEqual(99)
      expect((max + 1) * pair.factor).toBeGreaterThan(99)
      expect(max).toBeGreaterThanOrEqual(2)   // or `rint(2, max)` is an empty range
    }
  })
  it('ft→in is not in the swap pool — it is the fit rounds\' own conversion', () => {
    expect(SWAP_POOL.some(s => s.pair.small === 'in')).toBe(false)
    expect(PAIRS.some(p => p.small === 'in' && p.factor === 12)).toBe(true)
  })
  it('every posted limit is a height a fair really posts, and one leaves room underneath', () => {
    for (const l of LIMITS) expect(l).toBeGreaterThanOrEqual(MIN_HEIGHT)
    expect(LIMITS.filter(l => l - MIN_HEIGHT >= 1).length).toBeGreaterThan(0)
  })
})

describe('the words', () => {
  it('plurals come from the table, never from an appended s', () => {
    // ⚠️ "0 pennyies" shipped on The Coin Tray's first demo beat. `foot`/`feet` breaks worse.
    expect(units(1, 'ft')).toBe('1 foot')
    expect(units(2, 'ft')).toBe('2 feet')
    expect(units(1, 'in')).toBe('1 inch')
    expect(units(7, 'in')).toBe('7 inches')
    for (const r of ALL) {
      for (const s of [r.prompt, r.spoken, missFor(r), verdictFor(r, built(r.answer)).text]) {
        expect(s, s).not.toMatch(/\bfoots|\bfeets|\binchs|\bfeet\b(?=\s*\bs)|\bcups s/)
      }
    }
  })

  it('a height that lands square is written without an inches part', () => {
    expect(ftIn(4, 0)).toBe('4 ft')
    expect(ftIn(4, 3)).toBe('4 ft 3 in')
  })

  it('the miss line never names the answer, on any round', () => {
    for (const r of ALL) expect(numbers(missFor(r)), missFor(r)).not.toContain(r.answer)
  })

  it('and it does not narrow with the attempt — two rounds of a type say the same words', () => {
    // ⚠️ The real property, one level up from a loop over guesses: `missFor` does not take the
    // guess, so sweeping guesses would compare one string with itself (the tautology this repo's
    // lint caught once already). What must hold is that the WORDING does not drift to this round's
    // own figures.
    for (const t of ['fit', 'need', 'swap'] as const) {
      const of = ALL.filter(r => r.qType === t)
      const first = missFor(of[0])
      for (const r of of) expect(missFor(r)).toBe(first)
    }
  })

  it('the nudge fires only where the generator refuses an answer, and never names it', () => {
    // ⚠️ Every refusal the generator makes needs a matching refusal at the ANSWER, or a child is
    // marked wrong over a picture that says they are right (Factor Lab's `f === n`).
    for (const r of ALL) {
      const zero: Entry = { tens: 0, ones: 0 }
      const n = nudgeFor(r, zero)
      if (r.qType === 'need' && r.answer === 0) {
        expect(n, 'a boundary `need` answered 0 is a real answer').toBeNull()
        expect(graded(r, zero)).toBe(true)
      } else if (r.qType === 'need') {
        // ⚠️ 0 is a real answer on this type, so a 00 here is a WRONG answer and must cost a mark —
        // nudging it would be the mirror fault: refusing to grade something the child really meant.
        expect(n, 'a `need` round must grade a 0, not redirect it').toBeNull()
      } else {
        expect(n, `${r.qType} answered 00`).not.toBeNull()
        expect(numbers(n!)).not.toContain(r.answer)
      }
      // a half-filled entry is not an attempt at all
      expect(nudgeFor(r, { tens: 4, ones: null })).toBeNull()
      // and a genuinely wrong answer still costs a mark — that is the point of the chapter
      const wrong = built(r.answer === 99 ? 98 : r.answer + 1)
      expect(nudgeFor(r, wrong)).toBeNull()
    }
  })

  it('the verdict names what was BUILT on a miss, and the answer only once it is given', () => {
    for (const r of ALL) {
      const wrong = built(r.answer === 99 ? 98 : r.answer + 1)
      const m = verdictFor(r, wrong)
      expect(m.ok).toBe(false)
      expect(numbers(m.text), m.text).toContain(entryValue(wrong))
      expect(numbers(m.text), m.text).not.toContain(r.answer)

      const hit = verdictFor(r, built(r.answer))
      expect(hit.ok).toBe(true)
      // ⚠️ ONE PRINCIPLED EXCEPTION: the boundary `need` says "exactly" rather than printing a 0,
      // because "you are 0 inches short" is the sort of sentence that teaches a child the app is
      // broken. It still states the answer — in words.
      if (r.answer === 0) expect(hit.text).toMatch(/exactly/)
      else expect(numbers(hit.text)).toContain(r.answer)
    }
  })

  it('a `fit` verdict agrees with whether the child actually gets on', () => {
    // ⚠️ Two channels stating one fact is where a chapter says the opposite of its own picture.
    for (const r of ALL.filter(r => r.qType === 'fit')) {
      const t = verdictFor(r, built(r.answer)).text
      expect(/you are on/.test(t), t).toBe(fits(r))
      expect(/not this time/.test(t), t).toBe(!fits(r))
    }
  })

  it('the boundary `need` is worded as tall enough, never as "0 inches short"', () => {
    const r = mkNeed(4, 0, 48)
    expect(r.answer).toBe(0)
    const t = verdictFor(r, built(0)).text
    expect(t).toMatch(/exactly/)
    expect(t).not.toMatch(/0 inches short|nought inches short/i)
  })

  it('zone 3 names the surface the child actually has, in both directions', () => {
    // ⚠️ Assert positively in EACH direction: without this pair a renderer that ignores its input
    // passes every other check.
    for (const p of ['tens', 'ones'] as const) {
      expect(instructionFor('hand', p)).toMatch(/hold up/)
      expect(instructionFor('hand', p)).not.toMatch(/tap/)
      expect(instructionFor('tap', p)).toMatch(/tap/)
      expect(instructionFor('tap', p)).not.toMatch(/hold up|fingers/)
    }
    // ⚠️ AND IT HAS TO READ AS ENGLISH. Gluing the verb to a pronoun gave "hold up it" on the guided
    // round's own chip — caught on screen, not by any check. Same family as "0 pennyies".
    for (const i of ['hand', 'tap'] as const) {
      for (const p of ['tens', 'ones'] as const) {
        expect(instructionFor(i, p), `${i}/${p}`).not.toMatch(/\bup it\b|\bhold it up it\b/)
      }
      for (const r of ALL.slice(0, 20)) expect(sayFor(r, i)).not.toMatch(/\bup the\b(?!\s)/)
    }
    // and the two places differ, or the child is told to fill one they have filled
    expect(instructionFor('tap', 'tens')).not.toBe(instructionFor('tap', 'ones'))
    for (const r of ALL.slice(0, 50)) {
      expect(sayFor(r, 'hand')).toMatch(/hold up/)
      expect(sayFor(r, 'tap')).toMatch(/tap/)
    }
  })

  it('the two round types that share a picture do not share a chip', () => {
    // `fit` and `need` draw the same bar and the same sign; the tag is what distinguishes them.
    expect(mkFit(4, 3, 48).tag).not.toBe(mkNeed(4, 3, 48).tag)
  })
})

describe('the demo teaches what the rounds ask', () => {
  it('every worked example ends on its own answer', () => {
    for (const r of [...DEMO, GUIDED, ...ALL.slice(0, 120)]) {
      const beats = explainBeats(r)
      const last = beats[beats.length - 1]
      expect(entryFull(last.entry), r.qType).toBe(true)
      expect(entryValue(last.entry), `${r.qType} ${r.prompt}`).toBe(r.answer)
      expect(last.revealed).toBe(true)
    }
  })

  it('and the words agree with the numbers on the board', () => {
    // ⚠️ The Supply Run's demo said "it stays behind" while the counts put it in a van. The only
    // disagreement was between the words and the figures, and nothing could see it.
    for (const r of ALL.slice(0, 200)) {
      const beats = explainBeats(r)
      for (const b of beats.slice(0, -1)) {
        expect(entryFull(b.entry), 'no beat may show the answer before the last').toBe(false)
        expect(b.revealed).toBe(false)
      }
      expect(numbers(beats[beats.length - 1].say)).toContain(r.answer)
    }
  })

  it('the demos are picked from the hard end, not the tidy one', () => {
    // ⚠️ Hand-picked examples drift toward the case that READS well — BlockYard narrated a method
    // over four examples that all avoided the case the chapter existed for.
    expect(DEMO.some(r => r.qType === 'fit' && r.inch > 0), 'a two-step conversion').toBe(true)
    expect(DEMO.some(r => r.qType === 'need' && r.answer === 0), 'the exact boundary').toBe(true)
    expect(DEMO.some(r => r.qType === 'swap' && r.answer / r.from === 16), 'the big factor').toBe(true)
    expect(new Set(DEMO.map(r => r.qType)).size).toBe(3)
  })

  it('the boundary case is TAUGHT, not only graded', () => {
    const beats = explainBeats(mkNeed(4, 0, 48))
    expect(beats[beats.length - 1].say).toMatch(/the same, and the same is tall enough/)
  })

  it('the tag appears once on the screen, on the question card', () => {
    // ⚠️ Caught by driving it: copied from The Coin Tray the board's chrome strip also printed
    // `data.tag`, so "TALL ENOUGH?" rendered twice an inch apart. The tag belongs to the question.
    const board = SRC.slice(SRC.indexOf('function Board('), SRC.indexOf('function Stage('))
    expect(board).not.toMatch(/\{data\.tag\}/)
  })

  it('the demo card is labelled with the round\'s own tag, never a literal', () => {
    // ⚠️ The chapter this replaces hardcoded `tag="Convert"` over a UNIT demo; The Pizza Counter
    // shipped the same fault as `tag="Read"`.
    // The shell draws the card from the TASK now, so the rule is that the task's title is the
    // round's own tag and never a literal — which a config can be asked directly.
    // ⚠️ SLICED TO `toTask`, not swept over the file — the chapter's own title and the briefing
    // ticket are legitimately literals, and a whole-file regex flagged both. A source check has to
    // be anchored on the thing it is about.
    const task = SRC.slice(SRC.indexOf('function toTask'), SRC.indexOf('// ─── the bar'))
    expect(task, "the card's chip is the round's own tag").toMatch(/title: r\.tag/)
    expect(task, 'never a hardcoded label').not.toMatch(/title: '/)
  })
})

describe('the hands-apart span', () => {
  it('is distance-invariant — the same gesture twice as far away reads the same', () => {
    // ⚠️ THE WHOLE REASON THE READING IS IN HAND WIDTHS. A frame fraction is not a length: lean back
    // and every measurement shrinks together, so "show me a foot" would mean a different gesture at
    // every seating distance.
    const near = [[{ x: .30, y: .5 }], [{ x: .70, y: .5 }]].map(h => Array(21).fill(h[0]))
    const far = [[{ x: .40, y: .5 }], [{ x: .60, y: .5 }]].map(h => Array(21).fill(h[0]))
    // hands drawn with a knuckle span; the ruler shrinks with the gap
    const hand = (cx: number, w: number) => {
      const lm = Array.from({ length: 21 }, () => ({ x: cx, y: 0.5 }))
      lm[5] = { x: cx - w / 2, y: 0.5 }; lm[17] = { x: cx + w / 2, y: 0.5 }; lm[9] = { x: cx, y: 0.5 }
      return lm
    }
    // ⚠️ DRIVEN THROUGH `spanRatio`, THE FUNCTION THE DETECTOR ACTUALLY CALLS. Computing the
    // division here instead proves the test's own arithmetic: mutation-tested, dropping `/ hw` from
    // the detect loop left that version green.
    const ratio = (a: number, b: number, w: number) => spanRatio([hand(a, w), hand(b, w)])!
    expect(ratio(0.30, 0.70, 0.10)).toBeCloseTo(4, 6)
    // same child, sitting twice as far away: every distance halves, the ratio does not
    expect(ratio(0.40, 0.60, 0.05)).toBeCloseTo(4, 6)
    expect(near.length && far.length).toBeTruthy()
  })

  it('the ruler is on the rigid palm, so curling the fingers cannot change it', () => {
    const lm = Array.from({ length: 21 }, (_, i) => ({ x: 0.5 + i * 0.001, y: 0.5 }))
    lm[5] = { x: 0.45, y: 0.5 }; lm[17] = { x: 0.55, y: 0.5 }
    const before = handWidth(lm)
    for (const tip of [4, 8, 12, 16, 20]) lm[tip] = { x: 0.5, y: 0.9 }   // fingers curl
    expect(handWidth(lm)).toBe(before)
  })

  it('reports nothing at all with fewer than two hands', () => {
    expect(palmSpan(undefined)).toBeNull()
    expect(spanRatio(undefined)).toBeNull()
    expect(spanRatio([Array(21).fill({ x: .5, y: .5 })])).toBeNull()
    expect(spanInches(null)).toBeNull()
  })

  it('and the detector reads it through that one function', () => {
    expect(DETECT).toMatch(/rawSpan\s*=\s*reads === 'span' \? spanRatio\(all\)/)
  })

  it('two hands together is not a length', () => {
    expect(spanInches(SPAN_MIN_HANDS - 0.01)).toBeNull()
    expect(spanInches(SPAN_MIN_HANDS)).not.toBeNull()
  })

  it('converts through the one assumed number, and nothing else', () => {
    expect(spanInches(4)).toBe(Math.round(4 * HAND_IN))
    expect(spanInches(12 / HAND_IN)).toBe(12)
  })

  it('says what was read and never whether it is right', () => {
    for (const v of [null, 2, 5, 9, 12, 14, 20, 40]) {
      const n = spanNote(v === null ? null : v)
      expect(n).not.toMatch(/correct|right|wrong|well done|good|nearly|almost/i)
    }
    // and it names something checkable rather than handing over a verdict
    expect(spanNote(12)).toMatch(/ruler is twelve/)
  })

  it('is quantized for the change test, or the chapter re-renders at frame rate', () => {
    expect(quantSpan(null)).toBe('-')
    expect(quantSpan(1)).toBe(String(SPAN_STEPS))
    expect(quantSpan(1.0001)).toBe(quantSpan(1))      // a still hand is still
    expect(quantSpan(1 + 1 / SPAN_STEPS)).not.toBe(quantSpan(1))
  })

  it('and BOTH readings are in the detector\'s change key', () => {
    // ⚠️ Leaving either out is a silent dead button: the count alone means moving the hands apart
    // changes nothing the explore beat can see; the span alone means a held-up 4 reports nothing.
    const at = DETECT.indexOf("reads === 'span' ? `")
    expect(at, 'no span branch in the change key').toBeGreaterThan(0)
    const key = DETECT.slice(at, DETECT.indexOf('`', DETECT.indexOf('`', at) + 1) + 1)
    expect(key).toMatch(/s\.count/)
    expect(key).toMatch(/s\.hands/)
    expect(key).toMatch(/quantSpan\(span\)/)
  })

  it('⚠️ the span never reaches a scored round — the arithmetic forbids it', () => {
    // Two palms carry ~±0.028 of frame width between them, which stretched onto the answer scale is
    // ±2.3 INCHES — so answers one inch apart sit inside the noise and a child who KNEW the answer
    // could not enter it. The chapter therefore reads a COUNT for everything it scores.
    expect(HEIGHT_BAR_CONFIG.hand!.reads).toBe('count')
  })
})

describe('the explore beat', () => {
  it('the short-frame copy stays inside the budget the layout needs', () => {
    // ⚠️ MEASURED, NOT CHOSEN. At 118 chars the body wraps to two lines at 640×320, the card is 79px,
    // and the board is clamped on top of the instruction chip. At 70 it is one line and the chip
    // clears by 12px. Nothing can SEE a wrap, so the rule is pinned to the words — the chalkboard's
    // `PLAN_BUDGET` shape.
    for (const i of ['hand', 'tap'] as const) {
      expect(exploreText(i, true).length, `${i} short: "${exploreText(i, true)}"`).toBeLessThanOrEqual(EXPLORE_BUDGET)
      expect(exploreText(i, true)).not.toBe(exploreText(i, false))
      expect(exploreText(i, true)).toMatch(/twelve|twelfth/)   // the payload survives the trim
    }
  })

  it('writes a height through the module rather than a second copy of the form', () => {
    expect(SRC).toMatch(/headline\(r, false\)/)
    expect(SRC, 'no hand-built feet-and-inches string').not.toMatch(/\$\{[a-z]+\} ft \$\{/)
  })
})

describe('the pieces the chapter is entered with', () => {
  it('an empty entry is not an attempt', () => {
    expect(entryFull(EMPTY_ENTRY)).toBe(false)
    expect(graded(mkFit(4, 3, 48), EMPTY_ENTRY)).toBe(false)
  })
  it('the guided round is answerable at the tier the chapter opens on', () => {
    expect(GUIDED.qType).toBe('fit')
    expect(GUIDED.inch).toBe(0)
    expect(GUIDED.answer).toBeLessThanOrEqual(99)
  })
})

/**
 * ⚠️ THE SCENE-SOURCE BLOCKS THAT USED TO LIVE HERE ARE GONE, AND NOT BECAUSE THEY WERE FAILING.
 * They guarded rules a bespoke component owned — both doors, the dwell key, the one-grader path, the
 * band arithmetic, the lane. GameShell owns every one of those now, so they are gated ONCE for all
 * ten 9–11 chapters in `bandOnGameShell.test.ts` instead of once per chapter, which is the entire
 * point of the port. What is left is what is still THIS chapter's to get wrong, driven from the
 * CONFIG rather than grepped out of JSX.
 */
describe('the chapter on the shell', () => {
  it('declares the band', () => { expect(HEIGHT_BAR_CONFIG.band).toBe('9-11') })

  it('⚠️ ONE function is the only way a digit enters, so camera and taps cannot drift', () => {
    expect(enterDigit(EMPTY, 5)).toEqual({ tens: 5, ones: null, slot: 1 })
    expect(enterDigit(enterDigit(EMPTY, 5), 1)).toEqual({ tens: 5, ones: 1, slot: 2 })
    expect(HEIGHT_BAR_CONFIG.hand!.enter, 'the camera goes through it').toBeTruthy()
    expect(HEIGHT_BAR_CONFIG.hand!.commits!(null as never, enterDigit(EMPTY, 5))).toBe(false)
    expect(HEIGHT_BAR_CONFIG.hand!.commits!(null as never, enterDigit(enterDigit(EMPTY, 5), 1))).toBe(true)
  })

  it('⚠️ reads the COUNT, never the span — the span cannot carry a scored answer', () => {
    // measured: two palms carry ~±0.028 of frame width between them, which on the answer scale is
    // ±2.3 INCHES, so 51 and 50 sit inside the noise and a child who KNEW it could not enter it.
    expect(HEIGHT_BAR_CONFIG.hand!.reads).toBe('count')
  })

  it('withholds mastery until all three readings have been asked', () => {
    expect(HEIGHT_BAR_CONFIG.coverage!.all).toEqual(['fit', 'need', 'swap'])
  })
})

/**
 * ⚠️ THE BAND SUITE IS GONE, DELIBERATELY, AND NOT BECAUSE IT WAS FAILING. `boardBand`/`benchBand`,
 * the band constants and the lane all tested arithmetic this chapter no longer owns: GameShell owns
 * the bands and `FitSlot` scales the instrument into whatever is left. Keeping them would have been
 * a gate driving dead code, which is worse than no gate because it reads as coverage. The rules that
 * still matter live ONCE in `bandOnGameShell.test.ts`, for all ten chapters.
 */
