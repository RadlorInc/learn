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
import { readFileSync } from 'node:fs'
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
import { BEAT as BUILDING_BLOCKS, askFor as blocksAsk } from '@/features/chapters/story/BuildingBlocks'
import { BEAT as COIN_SHOP, askFor as coinAsk, openerFor, stallAt } from '@/features/chapters/story/CoinShop'
import { askFor as yardAsk } from '@/features/chapters/story/BlockYard'
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
  /** true where the drawn line is a standing BANNER rather than a question pill — see S3. */
  banner?: true
}

/**
 * ⚠️ FOUR IDS DRAW THEIR QUESTION THEMSELVES RATHER THAN THROUGH `beat.prompt`, AND THAT IS
 * CORRECT — "two pills saying the same thing is a duplicate", so a chapter that owns its own banner
 * leaves SkillBeat's pill empty. It used to make their sentence unreachable: their round data is
 * numbers only (`{slot, a, b, answer, regroup}`), so the words lived in JSX where no gate could see
 * them, and this file said so as a standing gap.
 *
 * ⚠️ CLOSED 2026-08-20 by exporting the sentence rather than by changing what renders. Each of the
 * three modules now has an `askFor(...)`, the component calls it, and the probes below drive it —
 * so the beat stays silent (no duplicate pill) AND the words are checkable. Exporting one function
 * beat writing a source check, which is all a JSX sentence would ever have allowed.
 *
 * ⚠️ BLOCK YARD HAS NO PER-ROUND QUESTION AT ALL, and that is its design: the quantities are stated
 * ONLY as objects, because "a printed question makes the picture beside it decoration". Its banner
 * carries a standing instruction, which is what `askFor(op)` returns.
 *
 * The list below is now a claim about the BEAT — these four ids leave `beat.prompt` empty — and the
 * gate asserts it EXACTLY rather than as a floor, so a chapter that quietly stops stating its
 * question through the beat still has to be a deliberate edit here.
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
  // ── the four ids whose beat is silent: driven through the module function their banner calls ──
  {
    id: 'additionTo100 · Block Yard (+) · banner',
    banner: true,
    rounds: makeBlockYardBeat('+').rounds,
    prompt: () => yardAsk('+'),
    say: () => '',
  },
  {
    id: 'subtractionTo100 · Block Yard (−) · banner',
    banner: true,
    rounds: makeBlockYardBeat('-').rounds,
    prompt: () => yardAsk('-'),
    say: () => '',
  },
  {
    id: 'placeValue · Building Blocks · banner',
    banner: true,
    rounds: BUILDING_BLOCKS.rounds,
    prompt: (d, round) => blocksAsk(BUILDING_BLOCKS.make(d, round, [])),
    say: () => '',
  },
  {
    id: 'money · Coin Shop · banner',
    banner: true,
    rounds: COIN_SHOP.rounds,
    // ⚠️ BOTH HALVES. `openerFor` is what the keeper SAYS and `askFor` is what the bubble WRITES;
    // the module composes the first from the second on purpose, so checking only one would miss a
    // drift between them — which is exactly the fault Building Blocks had.
    prompt: (d, round) => coinAsk(COIN_SHOP.make(d, round, [])),
    say: (d, round) => { const r = COIN_SHOP.make(d, round, []); return openerFor(stallAt(r.slot), r) },
  },
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
  it('the silent-BEAT list is EXACTLY those four ids, and has not grown', () => {
    // A claim about `beat.prompt`, not about the child: all four DO state their question, through
    // the banner probes above. What this pins is that nothing else quietly joins them.
    const silent = CHAPTERS.filter(c => !c.id.endsWith('· banner')).filter(c => {
      for (const d of TIERS) for (let r = 0; r < c.rounds; r++) {
        if ((c.prompt(d, r) + c.say(d, r)).trim().length) return false
      }
      return true
    }).map(c => c.id)
    expect(silent.sort()).toEqual([...BANNER_OWNED].sort())
  })

  it('⚠️ NO chapter is unreachable — every id has a question a gate can read', () => {
    const ids = new Set(CHAPTERS.map(c => c.id.replace(/ · banner$/, '').replace(/ \(\w+\)$/, '')))
    for (const owned of BANNER_OWNED) {
      const bare = owned.replace(/ \(\w+\)$/, '')
      expect([...ids].some(i => i.startsWith(bare.split(' · ')[0])), `${owned} has no reachable question`).toBe(true)
    }
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

describe('S4 · a chapter with a beat prompt does not ALSO draw its own pill in practice', () => {
  it('Shape Studio — found on a production screenshot, 2026-08-20', () => {
    /**
     * ⚠️ SkillBeat draws a pill from `beat.prompt`, so a chapter whose Play surface ALSO draws one
     * ships two pills saying the same thing (chapter-craft §3). Measured live on
     * adaptivelearn.radlor.com: both rendered, 21px apart, the lower one `text-transform:
     * capitalize` so it read "Tap The Triangle!" under "Tap the triangle!". SkillBeat's is the one
     * to keep — a tap on it replays Milo's voice; the chapter's is `pointerEvents: none`.
     *
     * ⚠️ THIS IS A SOURCE CHECK AND IT ONLY GUARDS THE ONE CHAPTER THAT HAD THE FAULT. The general
     * case — "no chapter renders a second pill" — is a property of the rendered DOM and needs a
     * live drive. The other four chapters that draw their own pill (BigOrSmall, HomeTime, PlayTime,
     * SeesawPark) guard it on `phase === 'demo' | 'guided'`, i.e. the phases SkillBeat does not
     * wrap, and were verified clean.
     */
    const src = readFileSync('src/features/chapters/story/ShapeStudio.tsx', 'utf8')
    const calls = [...src.matchAll(/\{mode !== 'practice' && Prompt\(/g)]
    expect(calls.length, 'both Prompt call sites are guarded out of practice').toBe(2)
    expect(src, 'and the sentence is written ONCE').not.toMatch(/Prompt\(`Tap the \$\{/)
    expect(src).toMatch(/prompt: promptFor,/)
  })
})

describe('S5 · a chapter speaks and writes the SAME sentence, from one place', () => {
  /**
   * ⚠️ FOUND BY DRIVING THE SCREEN AFTER THIS FILE WAS ALREADY GREEN. Building Blocks' banner reads
   * "Make twenty-three. Tens on the left, ones on the right." — built inline in the round's effect —
   * while `ASK.make` said "Make the number on the order", which the note overrides 400 ms in and no
   * child ever sees. So the string a gate could reach was NOT the string on screen, and this file
   * claimed the chapter was covered.
   *
   * CoinShop had already written the rule down: `openerFor` composes `askFor` because the line is
   * "both spoken and written, and those two drifting apart is how a chapter narrates one thing while
   * the screen says another". The shape check below is what stops the inline form coming back — the
   * drift itself is invisible to every other rule here, because both strings are well-formed.
   */
  it('Building Blocks builds its ask in askFor, never at the call site', () => {
    const src = readFileSync('src/features/chapters/story/BuildingBlocks.tsx', 'utf8')
    expect(src, 'the make line is not inlined into a say()').not.toMatch(/say\(`Make \$\{/)
    expect(src, 'both branches speak what the banner writes').toMatch(/say\(askFor\(data\)\)/)
    expect(src, 'and the banner writes it too').toMatch(/text=\{note \|\| askFor\(data\)\}/)
  })

  it('Coin Shop composes its spoken opener from the written ask', () => {
    const src = readFileSync('src/features/chapters/story/CoinShop.tsx', 'utf8')
    expect(src).toMatch(/\$\{askFor\(r\)\}/)
    expect(src).toMatch(/text=\{note \|\| askFor\(data\)\}/)
  })
})

describe('S3 · the drawn question PILL reads as a sentence', () => {
  /**
   * ⚠️ PILLS ONLY — NOT THE FOUR STANDING BANNERS, and that exemption is measured rather than
   * assumed. All 21 pill prompts end their sentence (20 always did; Shape Studio was the one that
   * did not, and is fixed). All FOUR banners do not:
   *
   *     "Ten ones make one rod"                    "Make the number on the order"
   *     "Send the order, then count what is left"  "Count that out for me"
   *
   * A rule that fires on an entire coherent group is a rule that is wrong about that group — the
   * same call made earlier when sweeping `say` flagged Market Day's spoken line and Bead Shop's
   * chant. A pill is a question and closes it; a banner is a standing instruction strip and reads
   * as UI copy. Shape Studio's fault was different in kind: it punctuated the SAME pill two ways.
   *
   * ⚠️ Coin Shop's would also have been wrong to "fix": its `ASK` strings are composed into a spoken
   * sentence that appends its own full stop — `${goods}. This is what it costs. ${askFor(r)}.` — so
   * punctuating the map would have produced "Count that out for me..".
   */
  // ⚠️ `prompt` ONLY. The first draft swept `say` too and flagged Market Day's *"two pens of four
  // ducklings. How many in all?"* and Bead Shop's chant *"red, blue, red, blue… what bead comes
  // next?"* — both spoken, where case is inaudible and the lower-case chant is the point. A rule
  // that fires on correct copy is a rule that gets deleted, so it moved to the channel it is about.
  for (const c of CHAPTERS.filter(x => !BANNER_OWNED.includes(x.id) && !x.banner)) {
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
