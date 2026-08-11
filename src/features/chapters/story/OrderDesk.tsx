'use client'
/**
 * Chapter (9–11) — BIG NUMBERS & PLACE VALUE to 10,000 (skill `bigNumbers`) — THE ORDER DESK.
 *
 * Replaces NumberVault, which was the pre-teen "Number Lab" HUD. See docs/story-9-11-rethink.md §1
 * for the band-wide audit; the two faults this file exists to fix were both live:
 *
 *  ① THE QUESTION WAS PRINTED AND THE ANSWER WAS THREE CHIPS. `prompt` read
 *    "How many hundreds in 3,482?" — the numeral, in words, above `nearDigits()` chips. Delete the
 *    entire block chart and all thirty questions still work, so the chart was scenery. Here the
 *    answer is the goods the child actually loaded — delete them and there is no question left.
 *    ⚠️ The order is given in WORDS **and** figures together (founder's call): "three hundred and
 *    twelve — that is 312". That does not hand the answer over, because the answer is a quantity
 *    rather than a digit, and reading 312 as three hundreds, one ten and two ones IS the skill.
 *    What it adds is the numeral↔words mapping the curriculum asks for at this level.
 *  ② ⚠️ AND THE BLOCKS LIED ABOUT THEIR OWN PROPORTIONS. `Block` drew a hundred at `u * 4.4`
 *    square — 19 units of area, not 100 — and a thousand at the SAME size as a hundred. That is the
 *    0.55 fault BlockYard paid for, shipped: a child laying a hundred against the tens reads the
 *    wrong number off it. Every piece here is honest (see PIECE_U), derived from ONE unit.
 *
 * THE STORY — §0a's second half, *who wants this and why*. Milo is the clerk at a goods yard. A
 * customer walks in with an order and waits at the desk. The yard holds four bays — thousands,
 * hundreds, tens, ones, LEFT TO RIGHT the way a number is written — and nobody counts 3,482 things
 * one at a time: you load the biggest unit that fits and work down, which IS place value. When the
 * order is right the customer takes it and walks off with it; when it is short they stay and say
 * what is missing.
 *
 * THE GESTURE — one verb, three questions. Tap a unit in the supply row and it travels to its bay;
 * tap a loaded bay to send one back. All four bays are always on screen, so the place-value chart
 * stays intact and a single-place round shows which column is being filled.
 *   • `build` — the order is spoken in WORDS ("three thousand four hundred and eighty-two"); load
 *      every bay. Graded on the TOTAL, which is what makes the bundle below honest.
 *   • `place` — the docket shows a numeral; the customer wants only one place ("just the tens").
 *   • `value` — "four hundred units" → how many hundred-pallets is that? The digit-value question
 *      asked from the end that can be BUILT rather than picked off three chips.
 *
 * ⚠️ THE BUNDLE IS THE PAYLOAD AND IT IS WATCHABLE. A bay cannot hold ten: load the tenth and the
 * ten pieces slide together into ONE piece of the next size up, which travels one bay LEFT. That is
 * the constraint that makes the next column mean anything, and it is why `build` grades on the total
 * — load 12 ones for a target of 2 and they bundle to 1 ten + 2 ones, which really is 12. A wrong
 * answer stays wrong; an over-load self-corrects exactly the way regrouping does.
 *
 * ⚠️ DELIBERATE NARROWING, stated rather than hidden: every digit is 0..MAX_DIGIT (5), not 0–9.
 * Nine HONEST pieces per bay (a hundred is 10×10 units, a thousand is ten of those) forces the unit
 * down to ~9px, at which point the ones bay is not countable — and a manipulative a child cannot
 * count is a wrong answer the chapter caused. Real base-ten kits do not ship nine thousand-cubes
 * either. Zero IS in range for the inner places: an empty bay is the placeholder, and 3,042 is the
 * number that teaches it.
 *
 * ⚠️ MILO DOES NOT WALK HERE, and that was measured rather than chosen — see MiloClerk. The
 * journeys belong to the customer and to every piece that flies to its bay.
 *
 * ⚠️ Materials are teal/indigo/plum/slate, never clay. All three scenes measure a dominant hue of
 * 30°, which is clay's hue AND Milo's; the gate asserts ≥45° of separation.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { Arrive, SheetCell, CRITTER_CSS, inFlowJourney, CARRY_SPEED } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { blockSet, shadesOf, Shadow, Cube, Rod, YARD_CSS, type Material, type Shades } from './yard'
import { useHandInput, HandProvider, useHand, CamView, CamGate, type HandSkin } from '@/infra/ar/HandInput'
import { rint } from '@/core/rand'

// ─── Numbers in words ───────────────────────────────────────────────────────────────────
const ONES_W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS_W = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
function under100(n: number): string {
  if (n < 20) return ONES_W[n]
  const t = Math.floor(n / 10), o = n % 10
  return TENS_W[t] + (o ? '-' + ONES_W[o] : '')
}
export function numWords(n: number): string {
  if (n < 100) return under100(n)
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return ONES_W[h] + ' hundred' + (r ? ' and ' + under100(r) : '') }
  const th = Math.floor(n / 1000), r = n % 1000
  return ONES_W[th] + ' thousand' + (r ? (r < 100 ? ' and ' + under100(r) : ' ' + numWords(r)) : '')
}
const fmt = (n: number) => n.toLocaleString('en-US')

// ─── Places ─────────────────────────────────────────────────────────────────────────────
export const PLACES = [1000, 100, 10, 1] as const
export type Place = typeof PLACES[number]
/**
 * ⚠️ EVERY PIECE IS A BUNDLE, AND THAT IS WHAT KEEPS THE MANIPULATIVE HONEST AS MONEY. A hundred-
 * dollar NOTE does not show its own ten — it is one object with a number printed on it, which is a
 * piece ASSERTING its value, the exact fault this chapter was rebuilt to remove. A banded bundle of
 * ten ten-strips does show it, and it is what money actually looks like in bulk. So the geometry
 * `blockSet` already draws survives the re-theme untouched: only the names change.
 */
const PLACE_NAME: Record<Place, { one: string; many: string; goods: string }> = {
  1000: { one: 'thousand-bundle', many: 'thousand-bundles', goods: 'thousands' },
  100: { one: 'hundred-bundle', many: 'hundred-bundles', goods: 'hundreds' },
  10: { one: 'ten-strip', many: 'ten-strips', goods: 'tens' },
  1: { one: 'coin', many: 'coins', goods: 'ones' },
}

/**
 * ⚠️ ONE MONEY FORMAT FOR THE WHOLE CHAPTER. `fmt` is a bare `toLocaleString` with ~10 call sites,
 * and a "$" written into some strings and not others would be two formats for one chapter — which is
 * why the warehouse version banned the symbol outright. Now that the world IS a fundraiser board the
 * symbol has to be there, so it goes in ONE helper rather than into the strings.
 */
const money = (n: number) => `$${fmt(n)}`
/** digits of `n`, most significant first, for the four places */
const digitsOf = (n: number): number[] => PLACES.map(p => Math.floor(n / p) % 10)
const valueOf = (counts: number[]) => counts.reduce((s, c, i) => s + c * PLACES[i], 0)

// ─── Materials ──────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ NO CLAY. Re-measured over the band the bays occupy after the fundraiser re-theme, the three
 * scenes carry a dominant hue of **26.9° · 35.4° · 35.1°** — the same warm band the depot scenes
 * did (34–47°), so these four survive the world change unchanged and are still 150–255° away.
 * That is clay's hue and Milo's own (30°/sat .53), so a clay set on these grounds is
 * BlockYard's hay-bale fault. These four are 155–255° away, and they share ONE saturation and ONE
 * brightness (yard.tsx's MAT_SAT/MAT_VAL) so every one of them sits in the painted sprites' band by
 * construction and only the hue moves.
 */
export const MATERIALS: Material[] = [
  { name: 'teal', hue: 185, grain: true },
  { name: 'indigo', hue: 240, grain: false },
  { name: 'plum', hue: 285, grain: true },
  { name: 'slate', hue: 210, grain: false },
]

// ─── The pieces ─────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ **EVERY PIECE IS DERIVED FROM ONE UNIT AND SHOWS ITS OWN TEN.** A rod is ten cubes long with
 * ten seams (yard.tsx owns that, and `blockSet` is the only place in the app that derives it). A
 * pallet is ten rods — a 10×10 face, so it is visibly a hundred AND visibly ten tens. A crate is ten
 * pallets, drawn with the same face plus stacked depth. Nothing here asserts a ratio; each piece
 * carries the marks that prove it.
 */
export const PIECE_U: Record<Place, number> = { 1000: 10, 100: 10, 10: 1, 1: 1 }   // width, in units

/**
 * ⚠️ `shadesOf` returns `rgb(...)` STRINGS, so the hex-alpha trick (`${m.seam}88`) is INVALID CSS
 * and every gradient using it silently does not paint. That is how the first cut of this file drew
 * a hundred-pallet as a FLAT PURPLE SLAB with none of its subdivisions — i.e. a piece asserting its
 * value instead of showing it, which is the exact fault the chapter exists to fix, reintroduced by a
 * string bug. Alpha goes through here.
 */
const fade = (rgb: string, a: number) => rgb.replace('rgb(', 'rgba(').replace(')', `,${a})`)

/** HUNDRED — a flat 10×10 face. Ten rods laid side by side, which is what it is. */
function Flat({ u, m }: { u: number; m: Shades }) {
  const s = u * 10, top = Math.round(u * 0.22)
  return (
    <span style={{ display: 'block', position: 'relative', width: s, height: s + top }}>
      <Shadow w={Math.round(s * 1.02)} h={Math.round(u * 1.1)} />
      <span style={{ position: 'relative', zIndex: 1, display: 'block', width: s, height: s + top }}>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top + 1, background: m.top,
          borderRadius: `${u * 0.3}px ${u * 0.3}px 0 0`, boxShadow: `inset 0 1px 0 ${m.rim}` }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top, bottom: 0, overflow: 'hidden',
          borderRadius: `0 0 ${u * 0.25}px ${u * 0.25}px`,
          // the ten rods, and the ten units along each — the piece PROVES it is a hundred
          backgroundImage: `repeating-linear-gradient(0deg, ${fade(m.seam, .55)} 0 1px, transparent 1px ${u}px),`
            + `repeating-linear-gradient(90deg, ${fade(m.seam, .3)} 0 1px, transparent 1px ${u}px),`
            + `linear-gradient(150deg, ${m.face} 0%, ${m.deep} 100%)` }} />
      </span>
    </span>
  )
}

/** THOUSAND — the same face, with ten hundred-bundles' worth of stacked depth behind it. */
function Crate({ u, m }: { u: number; m: Shades }) {
  const s = u * 10, d = Math.round(u * 1.6)
  return (
    <span style={{ display: 'block', position: 'relative', width: s + d, height: s + d }}>
      <Shadow w={Math.round(s * 1.06)} h={Math.round(u * 1.3)} />
      <span style={{ position: 'relative', zIndex: 1, display: 'block', width: s + d, height: s + d }}>
        {/* the stack behind — it is ten hundred-bundles deep and says so */}
        <span style={{ position: 'absolute', left: d, top: 0, width: s, height: s,
          borderRadius: u * 0.25, opacity: 0.92,
          backgroundImage: `repeating-linear-gradient(0deg, ${fade(m.seam, .4)} 0 1px, transparent 1px ${u}px),`
            + `linear-gradient(180deg, ${m.deep} 0%, ${m.deep} 100%)` }} />
        <span style={{ position: 'absolute', left: 0, top: d, width: s, height: s, overflow: 'hidden',
          borderRadius: u * 0.25, boxShadow: `inset 0 1px 0 ${m.rim}`,
          backgroundImage: `repeating-linear-gradient(0deg, ${fade(m.seam, .55)} 0 1px, transparent 1px ${u}px),`
            + `repeating-linear-gradient(90deg, ${fade(m.seam, .3)} 0 1px, transparent 1px ${u}px),`
            + `linear-gradient(150deg, ${m.top} 0%, ${m.face} 55%, ${m.deep} 100%)` }} />
      </span>
    </span>
  )
}

function Piece({ place, u, m }: { place: Place; u: number; m: Shades }) {
  const set = blockSet(u)
  if (place === 1) return <Cube s={u} m={m} />
  if (place === 10) return <Rod w={set.rodW} h={set.rodH} m={m} />
  if (place === 100) return <Flat u={u} m={m} />
  return <Crate u={u} m={m} />
}

// ─── Worlds ─────────────────────────────────────────────────────────────────────────────
/**
 * A world per round, not one backdrop per chapter. ⚠️ Indexed STRAIGHT and never modulo — the 6–8
 * band shipped `PLAN[round % len]` three times and the last rounds wrapped back onto the creature
 * the chapter opened with.
 */
/**
 * ⚠️ `Yard` AND `yardAt` ARE HISTORICAL NAMES — this world is a school fundraiser, not a goods yard.
 * They are internal identifiers a child never sees, and renaming ~30 call sites buys nothing but
 * churn and a chance to typo something the type system would not catch. Read "yard" as "the place
 * this round happens in".
 */
export interface Yard { scene: string; groundY: number; customer: string; who: string; material: Material }
/**
 * ⚠️ The fox merchant was generated with these two and CUT (founder's call). Its `_side`/`_walk`
 * PNGs stay on disk and are deliberately NOT registered in sheets.ts — an unregistered sheet is
 * invisible to the idle-art gate, which is the honest state for art that exists and has no home.
 * Same call `market.ts` records for its four unused stalls: recorded, not hidden.
 */
/**
 * ⚠️ THE CAST IS KEPT, THE WORLD IS NOT. Both of these are drawn WALK CYCLES (12 cells each, in
 * canvas/sheets.ts), so re-casting means the whole image→video→frames pipeline plus its chroma key,
 * facing and cut-window traps — real money and real risk for a gain the roles deliver for free. A
 * bear in overalls with a clipboard reads as a caretaker at a school fair; a badger reads as a
 * parent helper. Only `who` changed.
 */
const CUSTOMERS = [
  { src: '/assets/objects/foreman_bear_side.png', who: 'the caretaker' },
  { src: '/assets/objects/driver_badger_side.png', who: 'the parent helper' },
]
/**
 * ⚠️ MEASURED BEFORE BEING WIRED, because a generated scene brings its own numbers.
 *   value over the band the cast stands in — hall 0.524 · playground 0.575 · gym 0.562 (graded)
 *   against a cast of 0.62–0.81 and Milo at 0.705, so no scene is brighter than what stands on it
 *   (the `grocery_sweets` fault). The gym came back at 0.864 and was GRADED down rather than
 *   re-rolled, which keeps an approved composition and costs nothing.
 *   ground-line roughness at the wired groundY: 2.8–3.8, under the open-ground threshold of 4.
 *   Every board in all three is BLANK — a painted total would be the answer, printed on the wall.
 */
const SCENES = [
  { scene: '/assets/backgrounds/fund_hall.png', groundY: 0.87 },
  { scene: '/assets/backgrounds/fund_yard.png', groundY: 0.88 },
  { scene: '/assets/backgrounds/fund_gym.png', groundY: 0.87 },
]
/** 13 slots: 2 demo + 1 guided + 10 scored. Scene and customer advance on DIFFERENT cycles, so the
 *  pairing keeps changing instead of repeating every third round. */
export const RUN: Yard[] = Array.from({ length: 13 }, (_, i) => ({
  ...SCENES[i % SCENES.length],
  customer: CUSTOMERS[i % CUSTOMERS.length].src,
  who: CUSTOMERS[i % CUSTOMERS.length].who,
  material: MATERIALS[i % MATERIALS.length],
}))
export const yardAt = (slot: number) => RUN[Math.min(slot, RUN.length - 1)]

// ─── The order ──────────────────────────────────────────────────────────────────────────
const pick = <T,>(a: readonly T[]) => a[rint(0, a.length - 1)]

export type QType = 'build' | 'place' | 'value'
export const Q_ALL: readonly QType[] = ['build', 'place', 'value']

export interface OdRound {
  qType: QType
  yard: Yard
  /** the whole number the docket is about */
  n: number
  /** target count per place, index-aligned to PLACES */
  target: number[]
  /** which single place this round is about, or -1 for a full build */
  focus: number
  /** spoken ask, at the customer's mouth */
  ask: string
  /** what the docket shows while the child works — never the answer */
  docket: string
  /** the written miss line; this chapter owns its own feedback */
  missPrefix: string
}

/**
 * ⚠️ Every digit is 0..MAX_DIGIT and the leading one is never 0 — see MAX_DIGIT: the ceiling is what
 * the honest pieces physically fit, not a difficulty choice. Zero is deliberately IN range for the
 * inner places: an empty bay is the placeholder, and 3,042 is the number that teaches it.
 */
function buildNumber(d: 1 | 2 | 3): number {
  const hi = MAX_DIGIT
  if (d === 1) return rint(1, hi) * 100 + rint(0, hi) * 10 + rint(0, hi)
  return rint(1, hi) * 1000 + rint(0, hi) * 100 + rint(0, hi) * 10 + rint(0, hi)
}
function singleNumber(d: 1 | 2 | 3): number {
  const hi = MAX_DIGIT
  if (d === 1) return rint(1, hi) * 100 + rint(0, hi) * 10 + rint(1, hi)
  return rint(1, hi) * 1000 + rint(0, hi) * 100 + rint(1, hi) * 10 + rint(1, hi)
}

/**
 * THE GRADER. ⚠️ EXPORTED AND PURE so a gate drives the SAME function the commit button calls — this
 * lived inside `OrderPlay`'s closure until now, which is why the chapter has never had a gate: a
 * test could not reach it, and a test that re-implemented it would agree with its own copy of the
 * rule while the screen it protects rotted.
 *
 * ⚠️ A SINGLE-COLUMN ROUND DEMANDS EVERY OTHER COLUMN BE EMPTY, and that clause interacts with the
 * BUNDLE: load ten coins on a tens round and they correctly fuse into one ten-strip in the tens
 * column, so the focus count can be right while a stray sits next door. That is refused on purpose —
 * and `missFor` has to name the stray, or the child sees a number they can tell is right and is told
 * only "no".
 */
export function grade(q: OdRound, counts: number[]): boolean {
  if (q.focus < 0) return valueOf(counts) === q.n
  return counts[q.focus] === q.target[q.focus] && counts.every((c, i) => i === q.focus || c === 0)
}

/** The written miss line. ⚠️ It never states the answer — only what the child HAS, and why it is not it. */
export function missFor(q: OdRound, counts: number[]): string {
  const single = q.focus >= 0
  const stray = single ? PLACES.findIndex((_, i) => i !== q.focus && counts[i] > 0) : -1
  if (stray >= 0) {
    return `${q.missPrefix} there is a ${PLACE_NAME[PLACES[stray]].one} in the ${PLACE_NAME[PLACES[stray]].goods} column. Take it back first.`
  }
  const have = single ? counts[q.focus] : valueOf(counts)
  /**
   * ⚠️ A SINGLE-COLUMN ROUND MUST NOT NAME ITS TARGET, AND THIS USED TO. The line read "that is 0,
   * and I asked for 5" — where 5 IS the answer, handed over after one wrong attempt, on the two
   * round types whose whole task is reading a digit out of the tally. Caught by this chapter's first
   * gate, which is also the first thing ever to drive this function: it lived inside `OrderPlay`'s
   * closure until the AR pass pulled it out.
   *
   * A `build` round is different and may still state its target — the whole number is printed on the
   * tally for the entire round, so repeating it gives away nothing the child is not already looking
   * at. What it must never do is state a digit they were asked to extract.
   */
  if (single) return `${q.missPrefix} that is ${have}. Read the tally again — ${q.docket}.`
  return `${q.missPrefix} that is ${fmt(have)}, and I asked for ${fmt(q.n)}.`
}

export function makeRound(d: 1 | 2 | 3, slot: number, asked: readonly string[], force?: QType): OdRound {
  const yard = yardAt(slot)
  const pool: QType[] = d === 1 ? ['build', 'place'] : ['build', 'place', 'value']
  // deliberate while a gap exists, RANDOM once it closes — hardest-first for ever locks the
  // generator onto one kind and destroys the variety coverage was supposed to protect
  const unmet = pool.filter(q => !asked.includes(q))
  // ⚠️ `force` exists because the DEMO must be deterministic and my first cut only pretended it
  // was: passing `asked: ['build']` to slot 1 does nothing if slot 0's random pick was `place`,
  // so both demos could open on the same question type and the child would never be shown the
  // whole-order build the chapter is built around. A gate can drive a named type with it too.
  const qType = force ?? (unmet.length ? pick(unmet) : pick(pool))

  if (qType === 'build') {
    const n = buildNumber(d)
    return {
      qType, yard, n, target: digitsOf(n), focus: -1,
      ask: `We raised ${numWords(n)} today — that is ${money(n)}. Stack it up so it can go on the board.`,
      docket: money(n),
      missPrefix: 'That is not the total yet —',
    }
  }
  const n = singleNumber(d)
  // pick a place this number actually has something in, so the ask is never for zero
  const digs = digitsOf(n)
  const live = digs.map((v, i) => ({ v, i })).filter(x => x.v > 0 && (d > 1 || PLACES[x.i] < 1000))
  /**
   * ⚠️ **A `value` ROUND MAY NEVER LAND ON THE ONES.** Caught by playing a full run: it produced
   * *"I need two — that is 2 — units of stock. How many singles?"* — where the answer is the number
   * in the question, because a single IS one unit. The whole point of the question is converting a
   * VALUE into a count of a bigger unit, so a place worth 1 has nothing to convert.
   */
  const pool2 = qType === 'value' ? live.filter(x => PLACES[x.i] > 1) : live
  const { i: focus } = pick(pool2.length ? pool2 : live)
  const place = PLACES[focus]
  const target = [0, 0, 0, 0]; target[focus] = digs[focus]

  if (qType === 'place') return {
    qType, yard, n, target, focus,
    ask: `Off the tally — just the ${PLACE_NAME[place].goods} for now. How many ${PLACE_NAME[place].many}?`,
    docket: money(n),
    missPrefix: `Not the ${PLACE_NAME[place].goods} I asked for —`,
  }
  return {
    qType, yard, n, target, focus,
    ask: `The tin holds ${numWords(digs[focus] * place)} — that is ${money(digs[focus] * place)}. How many ${PLACE_NAME[place].many} is that?`,
    docket: money(digs[focus] * place),
    missPrefix: 'That is not the right amount —',
  }
}

// ─── Layout ─────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ EXPORTED, and the scene renders from THIS — a sweep that re-implements the chain can agree with
 * its own copy of the constants while the screen falls apart (chapter-craft.md).
 *
 * The unit is derived, never picked: it is bound by the width the four bays need side by side, by
 * the height the tallest bay needs, and it is what makes every piece honest at once.
 */
export const SUPPLY_BAND = (vh: number) => Math.round(Math.max(74, Math.min(vh * 0.17, 120)))
/**
 * ⚠️ **THE DIGIT CEILING IS A GEOMETRY FACT, NOT A DIFFICULTY CHOICE.** Nine HONEST hundred-pallets
 * is nine hundred units of area on screen, and two such bays plus a thousands bay plus a character
 * do not fit 1280×720 at any unit a child can count — measured, it forces u down to ~9px, at which
 * the ones bay is unreadable. Real base-ten kits do not ship nine thousand-cubes either. Five is
 * what fits while every piece stays truthful, and a manipulative that lies is worse than a number
 * this chapter does not ask for.
 */
export const MAX_DIGIT = 5
/**
 * Milo at one end and the customer at the other — the bay row may not have the whole width.
 *
 * ⚠️ **DERIVED FROM THE PERSON'S OWN WIDTH, never a flat share.** A flat `vw * 0.11` put the
 * customer at l575–r619 on a 640×320 frame with the "ones" bay label at l580–r603 — standing
 * squarely on the one bay whose pieces are smallest and hardest to count. Every percent the reserve
 * keeps is a percent the bays lose, so it is measured rather than padded: the widest sprite in the
 * cast is the fox at aspect 0.809.
 */
/**
 * ⚠️ **NO FLAT PIXEL CAP.** SliceShop shipped `min(vh * 0.26, 200)` and the founder's words were
 * "characters chhote chhote hai" — above a 770px-tall window the cap froze the whole cast while the
 * scene kept growing. The share is what scales; the cap here is far enough out to be a sanity bound
 * rather than a ceiling anyone meets.
 */
export const PEOPLE_H = (vh: number) => Math.round(Math.max(84, Math.min(vh * 0.30, 340)))
export const SIDE_RESERVE = (vw: number, vh: number) =>
  Math.round(Math.min(vw * 0.22, Math.max(PEOPLE_H(vh) * 0.82 + 14, vw * 0.10)))

/**
 * ⚠️ **ONE SCALE FOR EVERY ROUND TYPE, and all four bays always drawn.** The first cut sized a
 * single-bay round off that one bay, which handed it u=22 — a 220px pallet filling the frame — and,
 * worse, meant the unit CHANGED between rounds. A ruler whose marks resize is not a ruler. So the
 * unit is derived from the full four-bay worst case always, and a `place` round simply leaves three
 * bays empty: the place-value chart stays intact and the child can see which column they are filling.
 *
 * EXPORTED, and the scene renders from THIS — a sweep that re-implements the chain can agree with
 * its own copy of the constants while the screen falls apart (chapter-craft.md).
 */
export function orderLayout(vw: number, vh: number, groundY: number) {
  const most = MAX_DIGIT
  // fanned for the big pieces (see Bay), a plain row for rods and cubes
  const wUnits = (p: Place) =>
    p >= 100 ? PIECE_U[p] + (most - 1) * 2.6 : most * (PIECE_U[p] + 0.35)
  // ⚠️ a crate's DEPTH (1.6u, see Crate) is part of its height — leaving it out made the budget 4%
  // optimistic, which puts the top of the fan into the bubble band rather than under it
  const hUnits = (p: Place) =>
    p === 1000 ? PIECE_U[p] + 1.6 + (most - 1) * 0.5
      : p === 100 ? PIECE_U[p] + 0.3 + (most - 1) * 0.5
        : p === 10 ? 10.4 : 1.4

  const gapU = 1.8
  const totalW = PLACES.reduce((s, p) => s + wUnits(p), 0) + (PLACES.length - 1) * gapU
  const maxH = Math.max(...PLACES.map(hUnits))

  const supply = SUPPLY_BAND(vh)
  const side = SIDE_RESERVE(vw, vh)
  const groundPx = Math.round(vh * groundY)
  // the bays stand on a shelf ABOVE the foreground line the people walk on, so a character can
  // never cover a piece the child has to count
  const shelfPx = groundPx - Math.round(vh * 0.13)
  const availW = vw - side * 2
  const availH = Math.max(110, shelfPx - 100)                       // 100 = the bubble band above
  /**
   * ⚠️ **NO FLOOR ON THE UNIT.** A `Math.max(7, …)` here reads as a readability guarantee and is
   * really an overflow: at 640×320 the two budgets give 5.9, and forcing 7 makes the bay row 579px
   * wide inside a 488px band — the craft doc's own "a size derived from a MAXIMUM can exceed that
   * maximum". A small frame gets small pieces, which is honest; a row running off the edge is not.
   */
  const u = Math.max(4, Math.min(26, Math.floor(Math.min(availW / totalW, availH / maxH))))

  const set = blockSet(u)
  // bay left edges, laid LEFT→RIGHT thousands→ones: a number is written that way and the eye sweeps
  // it that way. BlockYard has its ones on the left, which is backwards — nothing there is ever read
  // as a numeral so it never showed.
  const widths = PLACES.map(p => wUnits(p) * u)
  const gap = gapU * u
  const rowW = widths.reduce((s, w) => s + w, 0) + gap * (widths.length - 1)
  const x0 = (vw - rowW) / 2
  const lefts: number[] = []
  let x = x0
  for (const w of widths) { lefts.push(x); x += w + gap }

  return {
    u, set, groundPx, shelfPx, supply,
    bayLeft: (i: number) => lefts[i] ?? x0,
    bayWidth: (i: number) => widths[i] ?? 0,
    bayHeight: (i: number) => hUnits(PLACES[i]) * u,
    rowLeft: x0, rowWidth: rowW,
    // the people stand on the foreground line, CENTRED in their reserved band so their whole width
    // stays out of the bay row — not merely their anchor point
    peopleH: PEOPLE_H(vh),
    miloX: Math.round(side / 2),
    custX: Math.round(vw - side / 2),
    side,
    supplyY: vh - supply,
  }
}

// ─── Bay ────────────────────────────────────────────────────────────────────────────────
/**
 * One place's bay: a label, the pieces that are in it, and the ground tint that marks it out.
 * ⚠️ NOT a filled panel — a solid block over a painted scene reads as UI furniture however well its
 * palette is matched (three passes of BlockYard paid for that). A tint that fades to nothing at its
 * own edges, with posts, is what trodden ground looks like.
 */
function Bay({ place, n, u, m, w, hPx, label, active, bundling, onTake }: {
  place: Place; n: number; u: number; m: Shades; w: number; hPx: number
  label: string; active: boolean; bundling: boolean
  onTake?: () => void
}) {
  const fan = place >= 100
  return (
    <div style={{ position: 'relative', width: w, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end', pointerEvents: onTake ? 'auto' : 'none' }}>
      {/* the pieces */}
      <div onClick={onTake} style={{ position: 'relative', width: w, height: hPx,
        cursor: onTake && n > 0 ? 'pointer' : 'default',
        animation: bundling ? 'od_fuse .45s ease forwards' : undefined }}>
        {Array.from({ length: n }).map((_, i) => (
          /**
           * ⚠️ THE BIG PIECES ARE FANNED, NOT GRIDDED, AND THAT IS A SIZE DECISION AS MUCH AS A
           * LOOK ONE. Five honest 10×10 pallets in a 3-wide grid is 32 units across, and the two
           * big bays alone then eat 78% of the row — which is what forced the unit down to 12px.
           * Overlapped the way goods really stack they span 20 units and ONE row, which buys back
           * both the width and the height. Each piece still shows ~7.5 units of its own face, so
           * five are still five things a child can count.
           */
          <span key={i} style={{ position: 'absolute', zIndex: i,
            left: fan ? i * u * 2.6 : (i % 9) * u * (PIECE_U[place] + 0.35),
            bottom: fan ? i * u * 0.5 : 0,
            animation: `by_settle .4s ease ${i * 40}ms both` }}>
            <Piece place={place} u={u} m={m} />
          </span>
        ))}
      </div>
      {/* the marked-out ground — fades out at its own edges, never a bordered slab */}
      {/* ⚠️ AN EMPTY BAY MUST STILL READ AS A PLACE GOODS GO. At .16 alpha on a pale gravel yard
          the marking was invisible and the four labels floated in open ground. Still NOT a filled
          panel — three passes of BlockYard paid for that — so it is a trodden patch that fades to
          nothing at its own edges, with a post at each end marking the bay out. */}
      <div aria-hidden style={{ position: 'relative', width: '100%', height: Math.round(u * 1.5), marginTop: 2 }}>
        <div style={{ position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 52% 100% at 50% 0%, rgba(52,40,26,${active ? .42 : .26}) 0%, rgba(52,40,26,0) 76%)` }} />
        {[0, 1].map(k => (
          <span key={k} aria-hidden style={{ position: 'absolute', bottom: '38%', left: k ? undefined : 0,
            right: k ? 0 : undefined, width: Math.max(3, Math.round(u * 0.26)), height: Math.round(u * 1.5),
            borderRadius: 2, background: `linear-gradient(180deg, ${m.top} 0%, ${m.deep} 100%)`,
            opacity: active ? .95 : .6, boxShadow: '0 1px 2px rgba(40,30,18,.35)' }} />
        ))}
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: Math.max(13, Math.min(24, Math.round(u * 1.35))),
        color: active ? 'var(--milo-orange, #f26b2c)' : 'rgba(61,37,22,.72)', letterSpacing: .4 }}>{label}</span>
    </div>
  )
}

// ─── Supply row ─────────────────────────────────────────────────────────────────────────
/** The four sizes, always available. ⚠️ Nothing here says when to stop — deciding that is the skill. */
function Supply({ u, m, band, live, only, onTap }: {
  u: number; m: Shades; band: number; live: boolean; only: number
  onTap: (placeIdx: number) => void
}) {
  const set = blockSet(u)
  // ⚠️ The tray shows a TEN lying flat, not shrunk. Ten cubes will not stand up in a control band,
  // and the first BlockYard tray drew a "ten" at 2.4 units beside a one-cube — the 0.55 lie again.
  // ⚠️ The tray was drawn at (band-44)/11 → SIX pixels per unit beside a fifteen-pixel bay unit,
  // and the two big pieces were then scaled to 0.34 of that: specks. The tray's job is to show
  // WHICH size you are about to send, so it is sized off the band it actually has.
  const trayU = Math.max(7, Math.min(u, Math.floor((band - 30) / 7)))
  const trayset = blockSet(trayU)
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: band, zIndex: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px,2.4vw,30px)',
      background: 'linear-gradient(180deg, rgba(253,246,232,0) 0%, rgba(253,246,232,.90) 34%)',
      pointerEvents: live ? 'auto' : 'none', opacity: live ? 1 : .35, transition: 'opacity .3s ease' }}>
      {PLACES.map((p, i) => {
        const hidden = only >= 0 && only !== i
        return (
          // ⚠️ A FLOOR ON THE TAP TARGET. Sized to its contents the "singles" button measured
          // 25×47 — a one-cube is one unit wide, so the smallest piece gave the smallest button,
          // which is backwards. 48px minimum, whatever it holds.
          <button key={p} onClick={() => onTap(i)} disabled={hidden} data-supply={i}
            aria-label={`add one ${PLACE_NAME[p].one}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minWidth: 48, minHeight: 48,
              background: 'transparent', border: 'none', cursor: hidden ? 'default' : 'pointer',
              opacity: hidden ? .22 : 1, transition: 'opacity .3s ease', padding: 0 }}>
            <span style={{ display: 'flex', alignItems: 'flex-end', height: trayU * 10 * 0.52 + 8 }}>
              {p === 1 ? <Cube s={trayU * 2} m={m} />
                : p === 10 ? <Rod w={trayset.rodW} h={trayset.rodH} m={m} axis="h" />
                  : p === 100 ? <span style={{ transform: 'scale(.52)', transformOrigin: 'bottom center' }}><Flat u={trayU} m={m} /></span>
                    : <span style={{ transform: 'scale(.52)', transformOrigin: 'bottom center' }}><Crate u={trayU} m={m} /></span>}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(12px,1.25vw,17px)',
              color: 'var(--ink, #3d2516)' }}>{PLACE_NAME[p].goods}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── The people ─────────────────────────────────────────────────────────────────────────
/** The customer: walks in on their own legs, waits while the order is filled, walks off with it. */
function Customer({ src, h, x, vw, groundPx, leaving, resetKey, line, onArrive }: {
  src: string; h: number; x: number; vw: number; groundPx: number
  leaving: boolean; resetKey: string; line: string
  /** fires once the walk-in has actually finished — the round's question waits for it */
  onArrive?: () => void
}) {
  /**
   * ⚠️ **THEY COME FROM OFF-FRAME, AND THEY COME FROM THE RIGHT.** The first cut travelled
   * `-vw * 0.42`, which for a customer standing at x=1187 starts them at 649 — the MIDDLE of the
   * yard. That is the craft doc's token step: a move too short to leave the picture is not an
   * arrival, it is a pop with a twitch. They stand at the right-hand desk, so off-frame is a short
   * walk in from the right edge — and because the bays are to their LEFT, walking left is also the
   * direction they should end up facing.
   */
  const inDist = Math.round(Math.max(140, vw - x + h * 0.9))
  const jIn = inFlowJourney(src, h, inDist)
  const jOut = inFlowJourney(src, h, inDist)

  /**
   * ⚠️ **THE BUBBLE WAITS FOR THE WALK-IN.** It renders OUTSIDE the travelling element (so it does
   * not slide in, which would read as a floating banner), which means it sits at the DESTINATION
   * while the customer is still on their way — a speech bubble with its tail on empty ground, for
   * the whole journey. The craft doc's rule is that the speaker must be on screen whenever the
   * bubble is; this is the same rule one step along — they must have ARRIVED.
   */
  const [here, setHere] = useState(false)
  const arrivedRef = useRef(onArrive); arrivedRef.current = onArrive
  useEffect(() => {
    setHere(false)
    const t = window.setTimeout(() => { setHere(true); arrivedRef.current?.() }, jIn.ms)
    return () => window.clearTimeout(t)
  }, [resetKey, jIn.ms])
  /**
   * ⚠️ THE BUBBLE IS CLAMPED INTO THE FRAME AND THE TAIL STAYS ON THE MOUTH. Centred on a customer
   * standing at x=1187 it measured **l963 → r1423 on a 1280px frame** — 143px of the question cut
   * off the right edge, which is the one thing a chapter may never do. So the box shifts back
   * inside and the tail is moved the opposite way, which is what keeps it the customer's line
   * rather than a floating banner.
   */
  const bubW = Math.min(vw * 0.52, 460)
  const half = bubW / 2 + 12
  const centre = Math.max(half, Math.min(x, vw - half))
  const shift = centre - x
  return (
    <div style={{ position: 'fixed', left: x, top: groundPx, transform: 'translate(-50%,-100%)', zIndex: 35 }}>
      {/* the bubble rides OUTSIDE the travelling element — it is anchored to the mouth, not carried */}
      {here && !leaving && line && (
        <div style={{ position: 'absolute', bottom: h * 0.86, left: shift, transform: 'translateX(-50%)',
          width: 'max-content', maxWidth: bubW, zIndex: 3,
          background: 'rgba(255,252,244,.96)', border: '3px solid var(--outline, #3d2516)', borderRadius: 16,
          padding: '8px 14px', fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(13px,1.8vw,22px)', color: 'var(--ink, #3d2516)', lineHeight: 1.35,
          boxShadow: '0 4px 0 rgba(61,37,22,.18)' }}>
          {line}
          <span aria-hidden style={{ position: 'absolute', bottom: -10, left: `calc(50% - ${shift}px)`, marginLeft: -7,
            width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
            borderTop: '10px solid var(--outline, #3d2516)' }} />
        </div>
      )}
      <Arrive dist={inDist} ms={leaving ? jOut.ms : jIn.ms} leave={leaving} resetKey={resetKey}>
        {moving => (
          <span style={{ display: 'block', position: 'relative' }}>
            <Shadow w={Math.round(h * 0.62)} h={Math.round(h * 0.14)} />
            {/* ⚠️ FACING FOLLOWS TRAVEL, NOT THE ART. Every sprite was checked LARGE and faces
                RIGHT, so walking IN from the right edge means walking left — flipped — and then
                standing flipped, which is correct because the bays they are watching are to their
                left. Leaving, they turn round and go back out to the right, unflipped. */}
            <SheetCell src={src} h={h} facesLeft={!leaving} moving={moving}
              cycleScale={leaving ? jOut.cycleScale : jIn.cycleScale} />
          </span>
        )}
      </Arrive>
    </div>
  )
}

/**
 * Milo the clerk, at the desk end of the bay row.
 *
 * ⚠️ HE DOES NOT WALK ALONG THE BAYS, AND THAT WAS MEASURED RATHER THAN CHosen. The first cut had
 * him walk to whichever bay was being loaded, which put him at l590–r690 standing exactly on the
 * hundreds bay's label at l605–r675 — and there is no vertical room to give him a lane, because a
 * 3-row pallet bay is already 417 of the 440px band. So the JOURNEY in this chapter belongs to the
 * customer (who arrives, waits and leaves with the order) and to every piece that flies to its bay;
 * Milo's job is dispatching them from the desk. A stationary character PAUSES its cycle — a cycle
 * looping on someone standing still is skating on the spot.
 */
function MiloClerk({ h, x, groundPx, busy }: { h: number; x: number; groundPx: number; busy: boolean }) {
  const src = '/assets/characters/milo_side.png'
  return (
    <div style={{ position: 'fixed', left: x, top: groundPx, transform: 'translate(-50%,-100%)',
      zIndex: 36, pointerEvents: 'none' }} data-milo>
      <span style={{ display: 'block', position: 'relative',
        animation: busy ? 'od_hand .42s ease' : undefined }}>
        <Shadow w={Math.round(h * 0.6)} h={Math.round(h * 0.14)} />
        <SheetCell src={src} h={h} moving={false} facesLeft={false} />
      </span>
    </div>
  )
}

/** A piece in flight from the supply row to its bay. ⚠️ It TRAVELS — it does not materialise. */
function Flyer({ place, u, m, from, to, onLand, id }: {
  place: Place; u: number; m: Shades; from: { x: number; y: number }; to: { x: number; y: number }
  onLand: () => void; id: string
}) {
  const dx = to.x - from.x, dy = to.y - from.y
  const dist = Math.hypot(dx, dy)
  const ms = Math.max(280, Math.round((dist / CARRY_SPEED) * 1000))
  const landed = useRef(false)
  useEffect(() => {
    const t = window.setTimeout(() => { if (!landed.current) { landed.current = true; onLand() } }, ms)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  return (
    <div style={{ position: 'fixed', left: from.x, top: from.y, transform: 'translate(-50%,-100%)',
      zIndex: 46, pointerEvents: 'none', animation: `od_fly ${ms}ms cubic-bezier(.32,.72,.5,1) forwards` }}>
      <div style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px` }}>
        <Piece place={place} u={u} m={m} />
      </div>
    </div>
  )
}

// ─── Play ───────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

interface Flight { id: string; place: Place; idx: number; from: { x: number; y: number }; to: { x: number; y: number } }

export const OrderPlay: React.FC<{ data: OdRound; mode: Mode; onComplete: (correct: boolean) => void }> =
  ({ data, mode, onComplete }) => {
    const { w: vw, h: vh } = useViewport()
    const single = data.focus >= 0
    const L = orderLayout(vw, vh, data.yard.groundY)
    const m = shadesOf(data.yard.material)

    const [counts, setCounts] = useState<number[]>([0, 0, 0, 0])
    const [flights, setFlights] = useState<Flight[]>([])
    const [bundling, setBundling] = useState(-1)
    const [sent, setSent] = useState(false)
    const [miss, setMiss] = useState<string | null>(null)
    const [active, setActive] = useState(single ? data.focus : PLACES.length - 1)
    const erred = useRef(false), done = useRef(false), seq = useRef(0)
    // ⚠️ A mirror ref, because a handler must never read state it also sets: four taps inside ONE
    // React batch all saw the same stale array and only one registered. This repo has met that
    // shape four times (placeValue's undo, CoinShop's lay, TickTock's lesson dial).
    const countsRef = useRef(counts)

    /**
     * ⚠️ THE CAMERA IS OPENED ONCE FOR THE WHOLE CHAPTER, at the orchestrator, and read here through
     * context. Opening it per round would re-prompt and re-initialise MediaPipe every question.
     */
    const { read, input } = useHand()
    /**
     * Grabs already closed when this round opened — the held-over guard's baseline.
     *
     * ⚠️ SEEDED FROM THE CURRENT READING, NOT FROM ZERO, and the difference is the whole guard. The
     * round-reset block below only runs when `SkillBeat` REUSES this component; on a fresh mount it
     * never fires, so a `useRef(0)` baseline leaves any grab already in progress reading as
     * `grabs > 0` — i.e. valid — and the piece the child was holding from the previous round drops
     * into whatever column they happen to be over. `useRef`'s initial value is evaluated on the mount
     * render, which is exactly the moment wanted. Caught by driving it: the chip opened on "open your
     * hand to drop it", which is only reachable when the guard has already let the grab through.
     */
    const armed = useRef(read.grabs)
    const wasGrab = useRef(false)
    const [over, setOver] = useState(-1)

    // the round resets during RENDER, not in an effect — an effect runs after paint and the
    // previous round's load is painted for one frame under the new order
    const sig = `${data.qType}|${data.n}|${data.focus}`
    const [seen, setSeen] = useState(sig)
    if (seen !== sig) {
      setSeen(sig)
      setCounts([0, 0, 0, 0]); countsRef.current = [0, 0, 0, 0]
      setFlights([]); setSent(false); setMiss(null); setBundling(-1)
      setActive(single ? data.focus : PLACES.length - 1)
      erred.current = false; done.current = false
      /**
       * ⚠️ A HAND STILL PINCHING WHEN THE NEXT ROUND OPENS IS NOT AN ANSWER. A tap is consumed; a
       * pose is not, so without this a child who has not opened their fingers deposits a piece into
       * whatever column they happen to be over the instant the question changes. Only a grab that
       * CLOSED after the round opened counts.
       */
      armed.current = read.grabs
      wasGrab.current = read.grabbing
      setOver(-1)
    }

    // ⚠️ Spoken on ARRIVAL, not on mount — the customer asking before they have walked in is the
    // same fault as the bubble showing early, in the other channel.

    const bayCentre = useCallback((i: number) =>
      ({ x: L.bayLeft(i) + L.bayWidth(i) / 2, y: L.shelfPx - L.u * 1.6 }), [L])

    /**
     * ⚠️ THE DROP. `grabs` is monotone only WITHIN a detector session — `useTaps()` and a camera
     * restart both reset the reading — so a backwards jump is clamped, or one "Try the camera again"
     * strands the baseline above the counter and the gesture is dead for the rest of the run.
     */
    useEffect(() => {
      if (input !== 'hand' || done.current || sent) return
      if (read.grabs < armed.current) armed.current = read.grabs
      const col = read.palm ? columnAt(read.palm.x, vw, L) : -1
      setOver(read.grabbing ? col : -1)
      const started = read.grabs > armed.current
      // released, having really picked up during THIS round, over a column
      if (wasGrab.current && !read.grabbing && started && col >= 0) add(col)
      wasGrab.current = read.grabbing
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [read, input, sent])

    /**
     * The one entry point for "the child adds one piece of place i" — a tap and the hand both come
     * through here, so the grader never learns which input moved it.
     *
     * ⚠️ THE SINGLE-COLUMN RESTRICTION IS ENFORCED HERE, NOT ONLY IN THE VIEW. It used to live purely
     * in `Supply`, which computes `hidden` and sets `disabled` — fine while a tap was the only way
     * in, and wrong the moment a hand can drop a piece anywhere in frame: an AR path could load a
     * column the round forbids and produce a state the tap path cannot reach. The gate is on the
     * ACTION now, so both inputs obey it by construction.
     */
    function add(i: number) {
      if (done.current || sent) return
      if (single && i !== data.focus) return
      const place = PLACES[i]
      const id = `f${seq.current++}`
      // read the button's REAL position rather than re-deriving the supply row's layout: two
      // independent guesses at one gap is how the cart ended up inside Milo's bubble in LoadingBay
      const btn = document.querySelector<HTMLElement>(`[data-supply="${i}"]`)
      const r = btn?.getBoundingClientRect()
      const from = r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.6 }
        : { x: vw / 2, y: L.supplyY + 30 }
      setFlights(f => [...f, { id, place, idx: i, from, to: bayCentre(i) }])
      setActive(i)
      setMiss(null)
    }

    function land(fl: Flight) {
      setFlights(f => f.filter(x => x.id !== fl.id))
      const next = countsRef.current.slice()
      next[fl.idx] += 1
      // ⚠️ THE BUNDLE. A bay cannot hold ten: the ten fuse into ONE of the next size up and it
      // travels one bay LEFT. That is the whole reason the next column exists.
      if (next[fl.idx] >= 10 && fl.idx > 0) {
        next[fl.idx] -= 10
        next[fl.idx - 1] += 1
        setBundling(fl.idx)
        window.setTimeout(() => setBundling(-1), 460)
        speak(`Ten ${PLACE_NAME[PLACES[fl.idx]].many} make one ${PLACE_NAME[PLACES[fl.idx - 1]].one}.`)
      }
      countsRef.current = next
      setCounts(next)
    }

    function take(i: number) {
      if (done.current || sent) return
      if (countsRef.current[i] === 0) return
      const next = countsRef.current.slice()
      next[i] -= 1
      countsRef.current = next
      setCounts(next)
      setActive(i)
      setMiss(null)
    }

    const right = grade(data, counts)

    /**
     * ⚠️ THIS USED TO BE A SILENT NO-OP MID-FLIGHT. Its only `disabled` condition was `sent`, while
     * the `flights.length` guard sat inside the handler — so pressing Send while a piece was still
     * travelling did nothing, said nothing, and looked like a dead button, which chapter-craft calls
     * the worst outcome there is. A gesture inherits this far more often than a tap does, because a
     * hand can commit the instant after it drops. The button is now visibly unavailable for those
     * ~280 ms instead of silently ignoring the press.
     */
    function send() {
      if (done.current || sent || flights.length) return
      if (right) {
        done.current = true; setSent(true)
        speak('That is the total. Up it goes!')
        window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 2100)
        return
      }
      erred.current = true
      const line = missFor(data, counts)
      setMiss(line)
      speak(line)
    }

    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
          <img src={data.yard.scene} alt="" draggable={false} decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* the docket — what the customer is holding. It never shows the answer. */}
        <div style={{ position: 'fixed', left: 12, top: 52, zIndex: 45, background: 'rgba(255,252,244,.94)',
          border: '3px solid var(--outline, #3d2516)', borderRadius: 12, padding: '5px 12px',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(13px,1.7vw,21px)',
          color: 'var(--ink, #3d2516)' }}>
          Tally · {data.docket}
        </div>

        {/* the bays — all four, always. A `place` round leaves three empty, which keeps the
            place-value chart intact and shows the child which column they are filling. */}
        {PLACES.map((p, i) => (
          <div key={p} style={{ position: 'fixed', left: L.bayLeft(i), top: L.shelfPx,
            width: L.bayWidth(i), transform: 'translateY(-100%)', zIndex: 30 }}>
            <Bay place={p} n={counts[i]} u={L.u} m={m}
              w={L.bayWidth(i)} hPx={L.bayHeight(i)} label={PLACE_NAME[p].goods}
              active={active === i} bundling={bundling === i}
              onTake={sent ? undefined : () => take(i)} />
          </div>
        ))}

        {flights.map(fl => (
          <Flyer key={fl.id} id={fl.id} place={fl.place} u={L.u} m={m} from={fl.from} to={fl.to}
            onLand={() => land(fl)} />
        ))}

        <MiloClerk h={L.peopleH} x={L.miloX} groundPx={L.groundPx} busy={flights.length > 0} />
        <Customer src={data.yard.customer} h={L.peopleH} x={L.custX} vw={vw} groundPx={L.groundPx}
          leaving={sent} resetKey={sig} line={miss ?? data.ask}
          onArrive={() => { if (mode === 'guided') speak(data.ask) }} />

        {/* ⚠️ THE INSTRUCTION NAMES THE GESTURE THE CHILD ACTUALLY HAS, and changes with what the
            hand is doing. Input-blind it would tell a tap child to pinch; state-blind it would leave
            a child holding a piece with nothing saying to open their fingers. */}
        {!sent && (
          <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)',
            bottom: L.supply + 8, zIndex: 47, background: 'rgba(253,246,232,.94)',
            border: '3px solid var(--outline, #3d2516)', borderRadius: 999, padding: '4px 14px',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(11px,1.4vw,15px)',
            color: 'var(--ink, #3d2516)', whiteSpace: 'nowrap' }}>
            {loadAsk(data, input, { carrying: read.grabbing, over, full: right, armed: read.grabs > armed.current })}
          </div>
        )}
        <Supply u={L.u} m={m} band={L.supply} live={!sent} only={single ? data.focus : -1} onTap={add} />

        {/* ⚠️ IDENTICAL AT EVERY STATE. Nothing may say the order is right before the commit —
            chapter 4's green Ready button turned this whole class of chapter into hot/cold. */}
        <button onClick={send} disabled={sent || flights.length > 0}
          /* ⚠️ CLEARS THE CUSTOMER'S BAND. At right:16 it sat squarely on the bear who is standing
             at the right-hand desk — measured on the founder's screenshot. The people's reserve is
             already derived, so the commit button simply starts where that ends. */
          style={{ position: 'fixed', right: L.side + 12, bottom: L.supply + 10, zIndex: 47,
            padding: '14px 30px', borderRadius: 999, border: 'none',
            background: 'linear-gradient(135deg,var(--milo-orange,#f26b2c),var(--milo-orange-deep,#d9541c))',
            color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(15px,2vw,25px)', cursor: sent ? 'default' : 'pointer',
            opacity: sent ? .5 : 1, boxShadow: '0 4px 0 rgba(180,70,20,.45)' }}>
          Send it ✓
        </button>

        {/* the numeral appears only AFTER the commit — it is the summary of work already done */}
        {sent && (
          <div style={{ position: 'fixed', left: 0, right: 0, top: '13%', zIndex: 48, display: 'flex',
            justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'var(--garden-green, #4f9d4f)', color: '#fff', borderRadius: 16,
              padding: '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: 'clamp(20px,3.2vw,42px)', animation: 'by_pop .4s ease both',
              boxShadow: '0 5px 0 rgba(20,60,20,.35)' }}>
              {single
                // ⚠️ SINGULAR WHEN IT IS ONE — this read "1 coins = 1", the same family as the
                // "Fox has a apple" this repo already records. And the value is money now, or the
                // reveal is the one place in the chapter still counting in bare units.
                ? `${counts[data.focus]} ${counts[data.focus] === 1 ? PLACE_NAME[PLACES[data.focus]].one : PLACE_NAME[PLACES[data.focus]].many} = ${money(counts[data.focus] * PLACES[data.focus])}`
                : fmt(data.n)}
            </div>
          </div>
        )}
      </>
    )
  }

// ─── Answering with the hand ────────────────────────────────────────────────────────────
/**
 * READING **E** — pinch to pick a pledge up, open your hand over a column to put it in.
 *
 * ⚠️ THE DROP CHOOSES THE COLUMN, AND THAT IS THE WHOLE JUSTIFICATION FOR USING A CAMERA HERE.
 * chapter-craft §5: *a pinch used as a cursor is a mouse with extra steps and a permission prompt.*
 * This passes only because the place-value decision — which column does a hundred go in — is made
 * with the body rather than by pressing the button that already says "hundreds". If the pinch were
 * merely how you press a supply button, it would not ship.
 *
 * ⚠️ AND IT DOES NOT REPLACE THE SUPPLY ROW. That is The Supply Run's headline finding and the most
 * expensive thing on this list: a working camera that cannot read a particular child's pinch — small
 * hands, low light, a hand held end-on, a seat too far back — must not leave them with nothing to
 * press. `CamGate` renders only when the camera failed to START, so a camera that runs and cannot
 * read shows nothing at all; with the row gone there would be no add, no undo at zero, no commit at
 * zero, no wrong answer, no re-teach and no round timeout. Both inputs call `add()`, which stays a
 * single greppable call site.
 */
const SKIN: HandSkin = {
  accent: '#f26b2c', accentSoft: 'rgba(242,107,44,.4)', ink: '#3d2516', muted: '#8a7461',
  panel: 'rgba(253,246,232,.96)', line: '#3d2516', onAccent: '#fff',
  font: 'var(--font-display)', mono: 'var(--font-numeric)',
}

/**
 * Which column the hand is over, or -1 when it is over none of them.
 *
 * ⚠️ NO NEAREST-COLUMN SNAP, DELIBERATELY. Snapping a drop to whichever column is closest would
 * quietly correct a child who let go between two of them — and on this chapter the column IS the
 * answer, so a snap is the grader helping. Over a gap, nothing is placed and the piece stays in
 * hand, which is also what would happen with a real handful of coins.
 */
export function columnAt(px: number, vw: number, L: ReturnType<typeof orderLayout>): number {
  const x = px * vw
  for (let i = 0; i < PLACES.length; i++) {
    if (x >= L.bayLeft(i) && x <= L.bayLeft(i) + L.bayWidth(i)) return i
  }
  return -1
}

/**
 * The instruction, as a pure function of the round, the input and what the hand is doing.
 *
 * ⚠️ IT CANNOT GO INPUT-BLIND, and it cannot go STATE-blind either. The Supply Run's finding: the
 * control that names which question is being asked must name the gesture the child actually has, and
 * every state a gesture can be in needs words — not just "ready". A child holding a piece with
 * nothing telling them to open their hand gets silence, which is The Fitting Crew's `handHint`
 * lesson.
 */
export function loadAsk(q: OdRound, input: 'hand' | 'tap', st: { carrying: boolean; over: number; full: boolean; armed?: boolean }): string {
  const single = q.focus >= 0
  const what = single ? PLACE_NAME[PLACES[q.focus]].many : 'bundles'
  if (st.full) return 'That is everything — tap Send it ✓'
  if (input === 'tap') return single ? `Tap the ${what} to add one` : 'Tap a bundle to add one'
  if (!st.carrying) return single ? `Pinch to pick up a ${PLACE_NAME[PLACES[q.focus]].one}` : 'Pinch your fingers to pick one up'
  /**
   * ⚠️ A HELD-OVER GRAB MUST NOT BE TOLD TO DROP. Found by driving it: the round changed while the
   * child was still pinching, and the chip opened on "open your hand to drop it in the hundreds" —
   * an instruction for an action the guard then silently refuses, which is a dead button wearing a
   * helpful sentence. The hand has to be opened and closed again before it counts, so SAY that, at
   * the moment it applies. The Fitting Crew's `handHint` lesson, one gesture along.
   */
  if (st.armed === false) return 'Open your hand first, then pinch again'
  if (st.over < 0) return 'Hold it over a column'
  return `Open your hand to drop it in the ${PLACE_NAME[PLACES[st.over]].goods}`
}

// ─── THE PLAN ───────────────────────────────────────────────────────────────────────────
/**
 * The 12–14 band's read-along opener, brought over: the chapter states its problem and its rule on
 * one short board before anything is worked, and Milo reads it while each word lights up.
 *
 * ⚠️ SELF-PACED, AND DELIBERATELY NOT `speakWithHighlight`. That helper resolves a pre-rendered clip
 * first and paces the highlight off the clip's real duration — but the 3–11 band has **zero**
 * recorded clips, so every use here takes its browser-TTS or blocked-audio branch, and Chrome very
 * often ships no usable voice at all. A read-along driven by speech events on a silent device is a
 * chapter that hangs on its own opening screen; that exact hang shipped once already in TickTock and
 * cost a session to find, precisely because the preview pane is mute and always took the working
 * path. So the sweep is a deterministic timer with `speak()` riding alongside: the words land
 * whether the voice works, half-works or never starts, and `onDone` fires either way.
 */
const PLAN_PROBLEM = 'The board says $3,241 — so how do you count that out without counting three thousand coins one at a time?'
const PLAN_POINTS = [
  'Where a digit sits is what it is worth.',
  'Start with the biggest bundle that fits, then work down.',
  'An empty column is a zero — and the zero still counts.',
]

function ThePlan({ onDone }: { onDone: () => void }) {
  const { w: vw } = useViewport()
  const words = useMemo(() => [PLAN_PROBLEM, ...PLAN_POINTS].join(' ').split(' ').filter(Boolean), [])
  const [lit, setLit] = useState(-1)
  const doneRef = useRef(onDone); doneRef.current = onDone

  useEffect(() => {
    let alive = true
    const timers: number[] = []
    speak([PLAN_PROBLEM, ...PLAN_POINTS].join(' '))
    let i = 0
    const run = () => {
      if (!alive) return
      setLit(i)
      // ⚠️ Per-word dwell from the word's own length, floored and capped — a two-letter word still
      // needs long enough to be seen, and the total has to land near a spoken line rather than race
      // it. The same shape as `dwellFor`, one grain finer.
      const w = words[i] ?? ''
      const t = window.setTimeout(() => {
        i++
        if (i < words.length) run()
        else window.setTimeout(() => alive && doneRef.current(), 1200)
      }, Math.max(190, Math.min(520, 70 + w.length * 42)))
      timers.push(t)
    }
    run()
    return () => { alive = false; timers.forEach(window.clearTimeout) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  let n = -1
  const render = (text: string, bold: boolean) => (
    <span>{text.split(' ').filter(Boolean).map((w, k) => {
      n++
      const me = n
      return (
        <span key={k} style={{
          background: me === lit ? 'var(--milo-orange, #F26B2C)' : 'transparent',
          color: me === lit ? '#fff' : undefined,
          borderRadius: 6, padding: '0 3px', fontWeight: bold ? 800 : 600,
          opacity: me <= lit ? 1 : 0.3, transition: 'opacity .18s',
        }}>{w} </span>
      )
    })}</span>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center',
      background: 'rgba(30,24,18,.55)', padding: 16 }}>
      <div style={{ width: Math.min(vw * 0.86, 720), background: 'rgba(255,252,244,.98)',
        border: '4px solid var(--outline, #3d2516)', borderRadius: 18, padding: '18px 22px',
        fontFamily: 'var(--font-display)', color: 'var(--ink, #3d2516)',
        boxShadow: '0 10px 26px rgba(30,42,60,.3)' }}>
        <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 900, opacity: .55, marginBottom: 8 }}>THE PLAN</div>
        <div style={{ fontSize: 'clamp(15px,2.1vw,21px)', lineHeight: 1.5, marginBottom: 12 }}>
          {render(PLAN_PROBLEM, true)}
        </div>
        {PLAN_POINTS.map((pt, i) => (
          <div key={i} style={{ fontSize: 'clamp(13px,1.8vw,18px)', lineHeight: 1.45, marginBottom: 6,
            display: 'flex', gap: 8 }}>
            <span style={{ opacity: .5 }}>&bull;</span><span>{render(pt, false)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── The written working ────────────────────────────────────────────────────────────────
/**
 * THE TALLY SHEET — where the working gets written, one line at a time, as it is spoken.
 *
 * This is the 12–14 band's chalkboard, brought into a painted world rather than adopted from it.
 * The teen `Blackboard` is a slate-on-dark rounded rectangle, and dropping one of those onto a
 * painted scene is the SLAB fault this repo has now shipped three times (BlockYard passes 1–3): a
 * filled rect over a painting reads as UI furniture however carefully its palette is matched,
 * because paintings contain no filled rectangles.
 *
 * ⚠️ SO THE SURFACE IS A THING THE WORLD ALREADY HAS. Paper, on a fundraiser stall, in the same
 * corner and the same idiom as the tally pill that was already there — the customer is drawn holding
 * one. It is tilted a little and casts a soft shadow, so it reads as an object lying on something
 * rather than a panel floating above it.
 *
 * ⚠️ AND IT NEEDS NO CHALK FONT, WHICH SIDESTEPS A REAL BLOCKER. `--font-chalk` is declared only
 * inside `[data-band="12-14"|"15-16"|"17-18"]`, and a 3–11 chapter asking for it silently inherits
 * the body font — the board stops looking like one, with nothing erroring and no gate able to see it.
 * Paper wants the story band's own display face, so the variable never comes into it.
 */
const SHEET_WINDOW = 4
/** The Menu button's own bottom edge (12 top + 41 tall), so the sheet clears it by measurement
 *  rather than by a guess — this chapter's chrome has bitten a bubble here before. */
const CHROME_BOTTOM = 51

/**
 * ⚠️ TOP-LEFT AND GROWING DOWN, WHICH IS A MEASURED CHOICE RATHER THAN A CORNER. Sat at the bottom
 * left it covered Milo AND the thousands label — measured on screen at 1280×720, the sheet's box
 * crossed both. The chapter's fixed layers are: chrome top-left (Menu 12,10,79×41 and the tally pill
 * below it), the four columns across the middle (y 279–532), Milo bottom-left and the customer
 * right. The only region free of all of them is the strip under the chrome, so the working grows
 * down from where the tally already lives — which is also where a stall's paperwork would be.
 */
function TallySheet({ lines, w, top }: { lines: string[]; w: number; top: number }) {
  // ⚠️ WINDOWED, like the teen board. A 10-step walkthrough accumulates more working than a
  // nine-year-old can hold, and an unbounded list grows the sheet off the top of the frame.
  const shown = lines.slice(Math.max(0, lines.length - SHEET_WINDOW))
  const newest = shown.length - 1
  return (
    <div style={{
      position: 'fixed', left: 12, top, zIndex: 46, width: w,
      background: 'rgba(255,252,244,.97)', border: '3px solid var(--outline, #3d2516)',
      borderRadius: 6, padding: '10px 12px', transform: 'rotate(-1.1deg)',
      boxShadow: '0 6px 14px rgba(30,42,60,.26)',
      fontFamily: 'var(--font-display)', color: 'var(--ink, #3d2516)',
    }}>
      {shown.map((l, i) => (
        <div key={`${lines.length}-${i}`} style={{
          fontWeight: i === newest ? 800 : 600,
          opacity: i === newest ? 1 : 0.45,
          fontSize: 'clamp(12px,1.5vw,18px)', lineHeight: 1.5, whiteSpace: 'nowrap',
          overflow: 'hidden',
          // the newest line writes itself on, left to right — the teen board's own idiom
          animation: i === newest ? `od_write ${Math.min(900, 40 + l.length * 26)}ms steps(${Math.max(4, l.length)}) both` : undefined,
        }}>{l}</div>
      ))}
    </div>
  )
}

// ─── Demo / re-teach ────────────────────────────────────────────────────────────────────
/**
 * ⚠️ SELF-PACED, with `speak()` alongside — never `speakSteps`. It reveals each visual from the
 * utterance's `onstart`, and Chrome and Safari both start the first line then silently drop the
 * rest, freezing the teaching for ever on a device that HAS a voice. The preview pane is mute,
 * which is exactly what hid that in TickTock for a whole session.
 */
function dwellFor(line: string) { return Math.max(2300, Math.min(6400, line.length * 72)) }

export const OrderExplain: React.FC<{ data: OdRound; onDone: () => void }> = ({ data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const single = data.focus >= 0
  const L = orderLayout(vw, vh, data.yard.groundY)
  const m = shadesOf(data.yard.material)
  const [step, setStep] = useState(0)
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0])
  const [board, setBoard] = useState<string[]>([])
  const doneRef = useRef(onDone); doneRef.current = onDone

  /**
   * ⚠️ BABY STEPS — ONE IDEA, ONE SPOKEN LINE, ONE BOARD LINE, ONE CHANGE ON SCREEN. The 12–14 shape,
   * and the reason it exists: this walkthrough used to be FOUR lines, of which one silently jumped
   * the scene from empty to the whole finished number. A child watching that sees the answer appear,
   * not the method — the craft doc's "the demo must TEACH, not restate".
   *
   * ⚠️ EACH STEP CARRIES ITS OWN `counts`, so the scene is a pure function of the step index and the
   * two can never drift. A demo beat that narrates one arrangement while the scene shows another is
   * a fault this repo has shipped (The Supply Run's remainder went into a van while Milo said it
   * stayed behind), and it is invisible because the WORDS are right and only the numbers disagree.
   */
  const beats = useMemo(() => {
    const out: { say: string; board?: string; counts: number[] }[] = []
    if (single) {
      const p = PLACES[data.focus]
      const want = data.target[data.focus]
      out.push({ say: data.ask, board: data.docket, counts: [0, 0, 0, 0] })
      out.push({ say: `Nobody counts that out coin by coin — you count it in ${PLACE_NAME[p].many}.`, counts: [0, 0, 0, 0] })
      // ⚠️ COUNTED IN ONE AT A TIME rather than appearing at the answer. The count is the thing being
      // taught, so it has to be BUILT on screen — the same reason the played round makes the child
      // load them one by one instead of typing a digit.
      for (let k = 1; k <= want; k++) {
        const c = [0, 0, 0, 0]; c[data.focus] = k
        out.push({ say: k === 1 ? `One. That is ${money(p)}.` : `${k}. ${money(k * p)}.`, board: `${k} × ${money(p)} = ${money(k * p)}`, counts: c })
      }
      out.push({ say: `${want} ${want === 1 ? PLACE_NAME[p].one : PLACE_NAME[p].many}. That goes on the board.`, counts: data.target.slice() })
      return out
    }
    const d = digitsOf(data.n)
    const first = d.findIndex(v => v > 0)
    out.push({ say: `The board says ${numWords(data.n)} — that is ${money(data.n)}.`, board: money(data.n), counts: [0, 0, 0, 0] })
    out.push({ say: 'Start with the biggest bundle that fits and work down.', counts: [0, 0, 0, 0] })
    const c = [0, 0, 0, 0]
    let running = 0
    for (let i = first; i < PLACES.length; i++) {
      const v = d[i], place = PLACES[i], nm = PLACE_NAME[place]
      // ⚠️ A LEADING ZERO IS NOT A FACT ABOUT THE NUMBER, but an EMPTY INNER place is the whole point
      // of a placeholder — so holes are said out loud exactly where they happen and never before.
      if (v === 0) {
        out.push({ say: `Nothing in the ${nm.goods} — that column stays empty, and that is what the zero means.`, board: `${nm.goods}: 0`, counts: c.slice() })
        continue
      }
      c[i] = v
      running += v * place
      out.push({ say: `${numWords(v * place)} — ${v} ${v === 1 ? nm.one : nm.many}.`, board: `${v} × ${money(place)} = ${money(v * place)}`, counts: c.slice() })
      if (i > first) out.push({ say: `That is ${money(running)} so far.`, board: `so far  ${money(running)}`, counts: c.slice() })
    }
    out.push({ say: `Which is ${money(data.n)}. Put it up.`, board: `= ${money(data.n)}`, counts: digitsOf(data.n) })
    return out
  }, [data, single])

  const lines = useMemo(() => beats.map(b => b.say), [beats])

  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!ready) return
    let alive = true
    const timers: number[] = []
    let i = 0
    const run = () => {
      if (!alive) return
      setStep(i)
      speak(lines[i])
      // the scene is a function of the step, never of a separate schedule
      setCounts(beats[i].counts)
      setBoard(beats.slice(0, i + 1).map(b => b.board).filter(Boolean) as string[])
      const t = window.setTimeout(() => {
        i++
        if (i < lines.length) run()
        else window.setTimeout(() => alive && doneRef.current(), 1300)
      }, dwellFor(lines[i]))
      timers.push(t)
    }
    run()
    return () => { alive = false; timers.forEach(window.clearTimeout) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const key = `demo|${data.n}|${data.qType}`
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
        <img src={data.yard.scene} alt="" draggable={false} decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {PLACES.map((p, i) => (
        <div key={p} style={{ position: 'fixed', left: L.bayLeft(i), top: L.shelfPx,
          width: L.bayWidth(i), transform: 'translateY(-100%)', zIndex: 30 }}>
          {/* ⚠️ `active` IS DERIVED FROM THE SCENE, NOT FROM A STEP INDEX. It read `step >= 2`, the
              third of FOUR lines under the old script — meaningless now the walkthrough is nine to
              thirteen steps. A constant tuned to a script that no longer exists. */}
          <Bay place={p} n={counts[i]} u={L.u} m={m}
            w={L.bayWidth(i)} hPx={L.bayHeight(i)} label={PLACE_NAME[p].goods}
            active={counts[i] > 0 && (!single || i === data.focus)} bundling={false} />
        </div>
      ))}
      {board.length > 0 && (
        <TallySheet lines={board} w={Math.round(Math.min(vw * 0.30, 340))} top={CHROME_BOTTOM + 7} />
      )}
      <MiloClerk h={L.peopleH} x={L.miloX} groundPx={L.groundPx} busy={counts.some(c => c > 0)} />
      <Customer src={data.yard.customer} h={L.peopleH} x={L.custX} vw={vw} groundPx={L.groundPx}
        leaving={false} resetKey={key} line={ready ? lines[step] : ''}
        onArrive={() => setReady(true)} />
    </>
  )
}

// ─── Beat ───────────────────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<OdRound> {
  return {
    skillId: 'bigNumbers', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d, round, asked) => makeRound((d || 1) as 1 | 2 | 3, (round ?? 0) + 3, asked ?? []),
    // MATH ONLY. Include the yard and the same question comes back the moment the scene rotates.
    sig: d => `${d.qType}|${d.n}|${d.focus}`,
    // Every question type must be asked before mastery may end the run: a strong child is otherwise
    // asked ~3 at L1, ONE at L2 and TWO at L3, so `value` would simply never come up.
    coverage: { of: d => d.qType, all: Q_ALL },
    // The customer says what is wrong, at their own mouth. The shared centred pill would land on
    // the bays and contradict it.
    ownsFeedback: true,
    prompt: () => '',
    say: d => d.ask,
    Play: ({ data, onSubmit }) => <OrderPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <OrderExplain data={data} onDone={onDone} />,
  }
}

// ─── The chapter ────────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'plan' | 'demo' | 'guided' | 'practice'

export const OD_CSS = `
@keyframes od_write { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }

@keyframes od_fly { 0%{transform:translate(-50%,-100%)} 100%{transform:translate(calc(-50% + var(--dx)), calc(-100% + var(--dy)))} }
@keyframes od_fuse { 0%{transform:scale(1);opacity:1} 60%{transform:scale(.82);opacity:.7} 100%{transform:scale(.7);opacity:0} }
@keyframes od_hand { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-6px)} }
`

export default function OrderDesk({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const [shipped, setShipped] = useState<number[]>([])
  const pending = useRef<number | null>(null)      // the cumulative arc — OUTSIDE SkillBeat
  const needsRotate = useNeedsRotate()
  const { w: vw } = useViewport()
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)

  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return
    finished.current = true; stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 700)), [])
  const beat = useMemo(() => makeBeat(), [])

  // ⚠️ FORCED, not nudged. The demo must OPEN on the whole-order build — that is the gesture the
  // chapter is about — and then show the single-place variant. Leaving it to `asked` meant both
  // demos could come out as the same type.
  const DEMO = useMemo(() => [makeRound(1, 0, [], 'build'), makeRound(1, 1, [], 'place')], [])
  const GUIDED = useMemo(() => makeRound(1, 2, [], 'place'), [])

  // ⚠️ Below every hook. An early return above one changes the hook count when the phone turns and
  // React tears the chapter into the error boundary.
  if (needsRotate) return <RotateGate line="The fundraiser board needs a wide screen to lay the columns out! 💰" />

  const marker = useMemo(() => ({ fill: '#f26b2c', ink: '#3d2516' }), [])
  const hand = useHandInput({ reads: 'pinch', marker })
  const onCam = hand.input === 'hand'
  /**
   * ⚠️ ONLY WHERE THE CHILD ANSWERS, not merely past the intro. `CamGate` is a full-screen panel, so
   * gating it on "not intro" puts a camera prompt over THE PLAN and over both walkthroughs — the
   * teaching covered by a permission dialog for a gesture that is not wanted yet. The Supply Run
   * gates on being in the lab for the same reason.
   */
  const inWorld = phase === 'guided' || phase === 'practice'

  return (
    <HandProvider value={{ read: hand.read, input: hand.input }}>
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#a99a86' }}>
      <style>{CRITTER_CSS + YARD_CSS + OD_CSS}</style>

      {/* ⚠️ MOUNTED FROM THE MOMENT THE CHAPTER STARTS, and merely HIDDEN until the camera is ready —
          the detect loop reads the video element's own box, and an unmounted one measures 0×0. */}
      {inWorld && onCam && (
        <CamView videoRef={hand.videoRef} canvasRef={hand.canvasRef} w={Math.round(Math.min(vw * 0.17, 190))}
          skin={SKIN} hidden={!hand.camReady} />
      )}
      {inWorld && onCam && !hand.camReady && (
        <CamGate status={hand.status} error={hand.error} skin={SKIN}
          onTaps={hand.useTaps} onRetry={hand.useCamera} onExit={exit}
          denied="Milo can watch you pick the money up, or you can tap the buttons — both put it in the same column." />
      )}

      <button onClick={exit}
        style={{ position: 'fixed', left: 12, top: 10, zIndex: 60, padding: '7px 14px', borderRadius: 999,
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--milo-orange, #f26b2c)',
          color: 'var(--milo-orange, #f26b2c)', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 13, cursor: 'pointer' }}>← Menu</button>

      {/* ⚠️ LEFT, never the right corner — SkillBeat draws its own round counter at right:16/top:14
          and LoadingBay's manifest overlapped it by 34 of 40px, reading as one garbled number. */}
      {phase === 'practice' && shipped.length > 0 && (
        <div style={{ position: 'fixed', left: 12, bottom: 8, zIndex: 60, display: 'flex', gap: 6,
          background: 'rgba(253,246,232,.86)', border: '3px solid var(--outline, #3d2516)',
          borderRadius: 999, padding: '5px 12px', maxWidth: '40vw', flexWrap: 'wrap' }}>
          {shipped.map((n, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15,
              color: 'var(--ink, #3d2516)' }}>{fmt(n)}</span>
          ))}
        </div>
      )}

      {phase === 'intro' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(20,14,8,.55)', padding: 20 }}>
          {/* ⚠️ NO maxHeight/overflow HERE, AND THAT IS MEASURED RATHER THAN AN OVERSIGHT. A guard
              was added with the anchor and then removed: A/B'd in the live DOM, the uncapped card
              fits unaided down to a 268px-tall frame, while capping it moved the first clip EARLIER
              (vh < ~290) and moved it off the decorative top corner and onto the Start button —
              i.e. onto the only forward control, behind an undiscoverable scroll. A guard that
              causes the failure it was written to prevent is worse than no guard. */}
          <div style={{ maxWidth: 520,
            background: 'var(--paper, #fdf6e8)', borderRadius: 22,
            border: '4px solid var(--outline, #3d2516)', padding: '22px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26,
              color: 'var(--ink, #3d2516)', marginBottom: 8 }}>The Fundraiser</div>
            {/**
              * ⚠️ THE ANCHOR IS NO LONGER CONFINED TO THIS CARD, AND THAT IS THE WHOLE POINT OF THE
              * RE-THEME. In the depot version the fundraiser was a simile said once here and then
              * dropped, because every played round had to stay true to a picture of crates — so a
              * founder looking at the screen saw a warehouse and asked why big numbers were still
              * being taught with one. He was right: the anchor was a sentence the child tapped past.
              * Now the world IS the fundraiser, so the ask, the tally and the spoken explanation can
              * all say board and bundle without naming anything that is not on screen.
              *
              * ⚠️ 3,241 IS GENERATABLE AND $3,482 IS NOT. Every digit is capped at MAX_DIGIT (5), so
              * "8 tens" cannot occur and a worked example using one would contradict every round the
              * child then plays. 3-2-4-1 is a number `buildNumber` really draws. (The plan's own
              * worked example used 3,482 — check a written example against the real generator.)
              *
              * ⚠️ THE "$" LIVES IN `money()`, NOT IN THESE STRINGS. `fmt` has ~10 call sites, so a
              * symbol written into some of them and not others is two formats for one chapter.
              */}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
              color: 'var(--ink, #3d2516)', lineHeight: 1.45, marginBottom: 18 }}>
              The board shows what the whole school has raised. $3,241 is 3 thousand-bundles,
              2 hundred-bundles, 4 ten-strips and 1 coin — where a digit sits is what it is worth.
              Nobody counts three thousand coins one at a time, so you stack the biggest bundle that
              fits and work down.
            </div>
            <button onClick={() => { unlockSpeech(); setPhase('plan') }}
              style={{ padding: '14px 34px', borderRadius: 999, border: '4px solid var(--outline, #3d2516)',
                background: 'var(--milo-orange, #f26b2c)', color: '#fff', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 19 }}>
              Open the stall ▶
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ AUTO-ROLLS, WITH NO "NEXT". A button on a first run is a skip button wearing a different
          label, and the whole reason a chapter teaches before it scores is that a nine-year-old
          presses whatever big control is offered and then meets a test nothing prepared them for. */}
      {phase === 'plan' && <ThePlan onDone={() => setPhase('demo')} />}

      {phase === 'demo' && (
        <OrderExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <OrderPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      )}

      {phase === 'practice' && (
        <SkillBeat beat={beat} onInterlude={interlude}
          /**
           * ⚠️ HELD BACK ONE ROUND. `SkillBeat` fires `onRound` when a round LOADS, so appending here
           * prints the answer to the question still on screen — measured live: the strip read
           * "200 · 552" while the $552 round was open and unanswered, and on a `place` round it
           * states the focus value outright. RailLine shipped this exact fault and records it. The
           * strip is the run SO FAR, which is what it claims to be; the last round simply never
           * joins it.
           */
          onRound={(d: OdRound) => setShipped(s => {
            const v = pending.current
            pending.current = d.focus >= 0 ? d.target[d.focus] * PLACES[d.focus] : d.n
            return v === null ? s : [...s, v]
          })}
          onComplete={(c, w, mastered) => {
            result.current.correct += c; result.current.wrong += w
            finishChapter(result.current.correct, result.current.wrong, mastered)
          }} />
      )}
    </div>
    </HandProvider>
  )
}
