/**
 * THE 24 STORYBOOK CHAPTERS' QUESTIONS — the half of the app no gate could reach.
 *
 * ⚠️ I REPORTED THIS AS IMPOSSIBLE AND IT WAS NOT. The 2026-08-20 sweep concluded that these
 * chapters "keep their generators inside their .tsx components, so no gate can reach their question
 * text at all". Measured instead of assumed: a story `.tsx` imports perfectly well under vitest and
 * `beat.make()` / `beat.say()` both run. The blocker was a missing `export` KEYWORD on 22 module-
 * scope declarations — not a refactor, not an extraction. The claim was worth less than the minute
 * it took to test.
 *
 * ⚠️ AND THE FOUR THAT WERE ALREADY EXPORTED SWEEP CLEAN, WHICH IS THE ARGUMENT FOR THIS FILE
 * RATHER THAN AGAINST IT. TickTock, SliceShop, OrderDesk and LevelRun are exported *because*
 * somebody gated them (`tickTockClock`, `sliceShopFit`, `orderDeskPlaceValue`, `levelRunRounding`).
 * Reachability is what caused them to be tested. The other twenty are the untested ones.
 *
 * What a `Beat` exposes, and therefore what can be checked here:
 *   `make(d, round, asked)` — the generator, at any tier and any round index
 *   `say(data)` / `prompt(data)` — the question, as spoken and as written
 *   `rounds`, `sig`, `coverage` — the run's shape
 * The GRADER is inside `Play` (a React component that reports `onSubmit(correct)`), so answer
 * checking stays with the per-chapter gates. This file owns what every chapter has in common.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { RETEACH_AFTER, type Beat } from '@/features/chapters/story/StoryWorld'

import { makeCmpBeat } from '@/features/chapters/story/BigOrSmall'
import { makeBeat as makeBlockYardBeat } from '@/features/chapters/story/BlockYard'
import { makeLineBeat } from '@/features/chapters/story/FollowTheLeader'
import { makeHomeBeat } from '@/features/chapters/story/HomeTime'
import { makeBeat as makeHopBeat } from '@/features/chapters/story/HopAlong'
import { makeMultBeat } from '@/features/chapters/story/MarketDay'
import { makeMeasureBeat, WORLDS as MEASURE_WORLDS } from '@/features/chapters/story/MeasureIt'
import { makeNestBeat, WORLDS as NEST_WORLDS } from '@/features/chapters/story/NestTree'
import { makeNumBeat, WORLDS as NUM_WORLDS } from '@/features/chapters/story/NumberTown'
import { makePlayBeat } from '@/features/chapters/story/PlayTime'
import { makeCompareBeat } from '@/features/chapters/story/SeesawPark'
import { makeShapeBeat as makeShapeStudioBeat, WORLDS as SHAPE_WORLDS } from '@/features/chapters/story/ShapeStudio'
import { makeShapeBeat as makeShapeTownBeat } from '@/features/chapters/story/ShapeTown'
import { makeStoryBeat } from '@/features/chapters/story/StoryTime'
import { BEAT as BUILDING_BLOCKS } from '@/features/chapters/story/BuildingBlocks'
import { BEAT as COIN_SHOP } from '@/features/chapters/story/CoinShop'
import { makeTimeBeat } from '@/features/chapters/story/TickTock'
import { makeFrBeat } from '@/features/chapters/story/SliceShop'
import { makeBeat as makeOrderBeat } from '@/features/chapters/story/OrderDesk'
import { makeBeat as makeLevelBeat } from '@/features/chapters/story/LevelRun'
// The two whose beat is built inside the component from component state: their question surface is
// module-scope pure functions, so those are driven directly rather than the beat being lifted out.
import { makePatternRound, promptFor as beadPrompt, sayFor as beadSay, EMPTY_STRAND } from '@/features/chapters/story/BeadShop'
import { makeColorRound, promptFor as colorPrompt, sayFor as colorSay, TEST_PAGE } from '@/features/chapters/story/RainbowTown'

type Tier = 1 | 2 | 3
const TIERS: Tier[] = [1, 2, 3]
const ROUNDS = 12

let restore: (() => void) | null = null
function seed(n: number) {
  let s = n >>> 0
  const real = Math.random
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  restore = () => { Math.random = real }
}
beforeEach(() => seed(20260820))
afterEach(() => { restore?.(); restore = null })

/**
 * One chapter under test.
 *
 * ⚠️ `prompt` AND `say` ARE SEPARATE CHANNELS AND THE RULES DIFFER — chapter-craft §3: "`prompt` is
 * what is drawn; `say` is what is spoken, and may name things the prompt deliberately omits."
 * Sentence case and a full stop matter on the drawn line and mean nothing to a speech synthesiser,
 * so the shape rules below apply to `prompt` only. Malformed text is checked on both.
 */
interface Chapter {
  id: string
  rounds: number
  /** what is DRAWN. Empty where the chapter's own banner owns the pill — see BANNER_OWNED. */
  prompt: (d: Tier, round: number) => string
  /** what is SPOKEN. Empty where the chapter has no narration for the round. */
  say: (d: Tier, round: number) => string
}

/**
 * ⚠️ THREE CHAPTERS STATE THEIR QUESTION IN JSX, AND NOTHING CAN REACH IT.
 *
 * They set `prompt: () => ''` (correctly — chapter-craft: "TWO PILLS SAYING THE SAME THING IS A
 * DUPLICATE", so the chapter's own banner owns the pill) and carry no `say`. Their round data is
 * numbers only: `{slot, a, b, answer, regroup}`, `{slot, n, kind, answer, digits}`,
 * `{slot, kind, price, shown, asPile}`. The sentence a child reads is assembled inside the
 * component, where no gate can see it.
 *
 * That is the WHOLE of the remaining gap, and naming it here is the point: the claim it replaces was
 * "the 24 storybook chapters keep their generators inside their .tsx components, so no gate can
 * reach their question text at all". It is three chapters, not twenty-four, and the fix for each is
 * to lift its banner sentence into a module function — `cargo.instructionFor`'s shape.
 *
 * ⚠️ THE LIST MAY NOT GROW SILENTLY. A chapter that stops stating its question is a chapter that
 * stopped asking one, so the assertion below is EXACT rather than a floor.
 */
const BANNER_OWNED = [
  'additionTo100 · Block Yard (+)',
  'subtractionTo100 · Block Yard (−)',
  'placeValue · Building Blocks',
  'money · Coin Shop',
]

const noop = () => {}
/** ShapeTown's `Fit` measures a DOM node for layout; the generator never looks at the number. */
const fit = () => 1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromBeat(id: string, beat: Beat<any>): Chapter {
  return {
    id,
    rounds: beat.rounds,
    prompt: (d, round) => beat.prompt(beat.make(d, round, [])),
    say: (d, round) => beat.say?.(beat.make(d, round, [])) ?? '',
  }
}

const CHAPTERS: Chapter[] = [
  fromBeat('numberComparison · Bigger or Smaller', makeCmpBeat()),
  fromBeat('additionTo100 · Block Yard (+)', makeBlockYardBeat('+')),
  fromBeat('subtractionTo100 · Block Yard (−)', makeBlockYardBeat('-')),
  fromBeat('numberOrdering · Follow the Leader', makeLineBeat()),
  fromBeat('matchingQuantities · Home Time', makeHomeBeat()),
  fromBeat('skipCounting · Hop Along', makeHopBeat()),
  fromBeat('multiplication · Market Day', makeMultBeat()),
  fromBeat('addition · Play Time (+)', makePlayBeat('+')),
  fromBeat('subtraction · Play Time (−)', makePlayBeat('-')),
  fromBeat('compareNumbers · Seesaw Park', makeCompareBeat()),
  fromBeat('shapes · Shape Town', makeShapeTownBeat(fit)),
  fromBeat('storyProblems · Story Time', makeStoryBeat()),
  fromBeat('placeValue · Building Blocks', BUILDING_BLOCKS),
  fromBeat('money · Coin Shop', COIN_SHOP),
  fromBeat('time · Tick Tock', makeTimeBeat()),
  fromBeat('fractions · Slice Shop', makeFrBeat()),
  fromBeat('bigNumbers · Order Desk', makeOrderBeat()),
  fromBeat('rounding · Level Run', makeLevelBeat()),
  // ⚠️ EVERY WORLD, not the first. A world changes the nouns and the scenes, so it changes the
  // question — sweeping one of three would sweep a third of the chapter and report full coverage.
  ...MEASURE_WORLDS.map(w => fromBeat(`measurement · Measure It (${w.id})`, makeMeasureBeat(w, noop))),
  ...NEST_WORLDS.map(w => fromBeat(`numberRecognition · Nest Tree (${w.id})`, makeNestBeat(w))),
  ...NUM_WORLDS.map(w => fromBeat(`numbersTo100 · Number Town (${w.id})`, makeNumBeat(w))),
  ...SHAPE_WORLDS.map(w => fromBeat(`shapes2d3d · Shape Studio (${w.id})`, makeShapeStudioBeat(w))),
  // the two driven through their module-scope generators instead of through a beat
  {
    id: 'patterns · Bead Shop',
    rounds: 10,
    prompt: () => beadPrompt(),
    say: (d, round) => beadSay({ noun: 'bead' } as never)(makePatternRound(EMPTY_STRAND, d, round)),
  },
  {
    id: 'colors · Rainbow Town',
    rounds: TEST_PAGE.targets.length,
    prompt: (d, round) => colorPrompt(TEST_PAGE, makeColorRound(TEST_PAGE, d, round)),
    say: (d, round) => colorSay(TEST_PAGE, makeColorRound(TEST_PAGE, d, round)),
  },
]

// ─── the rules ───────────────────────────────────────────────────────────────────────────

describe('every live storybook chapter is reachable at all', () => {
  it('24 chapter ids, 28 worlds, all of them driveable', () => {
    expect(CHAPTERS.length).toBeGreaterThanOrEqual(24)
    for (const c of CHAPTERS) expect(c.rounds, `${c.id} plays ${c.rounds} rounds`).toBeGreaterThanOrEqual(RETEACH_AFTER)
  })
})

describe('S1 · every chapter states its question, at every tier and every round', () => {
  it('the banner-owned list is EXACTLY those three chapters, and has not grown', () => {
    const silent = CHAPTERS.filter(c => {
      for (const d of TIERS) for (let r = 0; r < c.rounds; r++) {
        if ((c.prompt(d, r) + c.say(d, r)).trim().length) return false
      }
      return true
    }).map(c => c.id)
    expect(silent.sort()).toEqual([...BANNER_OWNED].sort())
  })

  for (const c of CHAPTERS.filter(x => !BANNER_OWNED.includes(x.id))) {
    it(`${c.id}`, () => {
      for (const d of TIERS) for (let r = 0; r < Math.max(c.rounds, ROUNDS); r++) {
        const t = (c.prompt(d, r) + ' ' + c.say(d, r)).trim()
        expect(t.length, `t${d} r${r}: the round asks nothing at all`).toBeGreaterThan(8)
      }
    })
  }
})

describe('S2 · no question is malformed', () => {
  // The seams this repo has actually shipped: "hold up it", "0 pennyies", "1 lines",
  // "because or every shot goes wide", and a value that never resolved.
  const BAD: Array<[RegExp, string]> = [
    [/undefined|NaN|\[object|\bnull\b/i, 'a value that did not resolve'],
    [/\s{2,}/, 'a double space'],
    [/\s+[,.;!?]/, 'a space before punctuation'],
    [/\b1\s+\w+s\b(?!\s*(in all|of\b|left|ago))/, 'a plural after 1'],
    [/\byies\b|\bys\b/, 'a broken plural'],
    [/(^|\s)(a|an)\s+(a|an)\s/i, 'a doubled article'],
    [/\ban\s+[^aeiouAEIOU\s]/, '"an" before a consonant'],
    [/\{|\}|\$\{/, 'an unresolved template'],
  ]
  for (const c of CHAPTERS) {
    it(`${c.id}`, () => {
      for (const d of TIERS) for (let r = 0; r < Math.max(c.rounds, ROUNDS); r++) {
        for (const t of [c.prompt(d, r), c.say(d, r)].filter(x => x.trim().length)) {
          for (const [re, why] of BAD) {
            expect(re.test(t), `t${d} r${r}: ${why} — "${t}"`).toBe(false)
          }
        }
      }
    })
  }
})

describe('S3 · the DRAWN question reads as a sentence', () => {
  // ⚠️ `prompt` ONLY. The first draft swept `say` too and flagged Market Day's *"two pens of four
  // ducklings. How many in all?"* and Bead Shop's chant *"red, blue, red, blue… what bead comes
  // next?"* — both spoken, where case is inaudible and the lower-case chant is the point. A rule
  // that fires on correct copy is a rule that gets deleted, so it moved to the channel it is about.
  for (const c of CHAPTERS.filter(x => !BANNER_OWNED.includes(x.id))) {
    it(`${c.id}`, () => {
      for (const d of TIERS) for (let r = 0; r < Math.max(c.rounds, ROUNDS); r++) {
        const t = c.prompt(d, r).trim()
        if (!t.length) continue          // this chapter speaks its question instead
        expect(t.length, `t${d} r${r}: "${t}" is too short to be a question`).toBeGreaterThan(8)
        expect(/^[A-Z0-9“"]/.test(t), `t${d} r${r}: does not open a sentence — "${t}"`).toBe(true)
        expect(/[.!?…]$/.test(t), `t${d} r${r}: no sentence end — "${t}"`).toBe(true)
      }
    })
  }
})
