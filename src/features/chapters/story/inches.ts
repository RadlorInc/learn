/**
 * THE HEIGHT BAR (9–11, skill `measurementUnits`) — the pure module.
 *
 * Everything the chapter renders and grades from lives here, outside React, because the answering
 * surface is a WEBCAM and a webcam cannot be driven by a gate. The scene is eyeball-only; this file
 * is where the math, the ladder, the words and the grader are held to account
 * (see __tests__/heightBarUnits.test.ts).
 *
 * THE VERB IS "DOES IT FIT?", AND THE CONVERSION IS THE WORK RATHER THAN THE ANSWER.
 * The sign at the ride is in inches. The pencil mark on your door frame is in feet and inches. You
 * cannot tell whether you are tall enough until both are in the SAME unit — so the child converts,
 * enters the number, and then watches the gate open or not. Three readings of that one act:
 *
 *   fit    "The sign says 48 in. You measure 4 ft 3."          → 51, and you are on
 *   need   "The sign says 48 in. You measure 3 ft 9."          → 3 inches short
 *   swap   "The bear on the shelf weighs 4 lb."                → 64 oz
 *
 * ⚠️ WHAT THIS REPLACES, AND WHY IT LOOKED FINE. `UnitConverter` (the Unit Lab) drew a converter
 * panel — an input chip, an arrow, an output chip — and took the answer as one of three numbers.
 * Three faults, all live on production:
 *   · ⚠️⚠️ THE PANEL PRINTED THE METHOD. The gear chip between the two boxes rendered `× 1000` /
 *     `÷ 100` for the whole duration of the question (its `on` prop changed only the glow, never the
 *     text). Which unit is bigger, and by how much, and whether to multiply or divide IS the skill —
 *     so every `convert` round reduced to "multiply 3 by 1000".
 *   · ELEVEN OF THE TWELVE sensible-unit items were 50/50 coin flips wearing four chips: `door → m`
 *     offered `m/mm/km/cm` and `bathtub → L` offered `L/mL/g/km`, i.e. two of the four options were
 *     always from the wrong ATTRIBUTE and eliminated for free.
 *   · the demo's second beat is a UNIT question drawn under a card hardcoded `tag="Convert"` —
 *     byte-identical to the `tag="Read"` fault The Pizza Counter shipped.
 * And there was no anchor of any kind: the intro card said "Milo runs the metric converter".
 *
 * ⚠️ WHY THE UNITS ARE US CUSTOMARY, AND WHAT IT COSTS. docs/story-9-11-ar-plan.md §7.1 parked this
 * as an open founder call on 2026-08-12 and it is now decided: **customary**. The anchor is the one
 * measurement a child checks on themselves — the pencil mark on the door frame — and a US nine-year-
 * old knows it as "four foot three", never as 130 cm. Keeping metric would have meant an anchor
 * nobody has lived.
 * ⚠️ THE COST, STATED RATHER THAN HIDDEN: the factors stop being ×10/×100/×1000 and become 12, 16
 * and 4 — i.e. multiplication facts, whose own chapter was DELETED (2026-08-13) and which
 * `i.measureUnits` lists as a prereq. Two things make that survivable and neither is luck:
 *   · the `fit` rounds only ever need 12 × 1..6, which is the twelve-times table a RULER shows, so
 *     the instrument teaches the fact the round needs; and
 *   · L1 is whole feet only, so the first rounds are the table itself before any inches are added.
 *
 * ⚠️ "DOES IT FIT" IS NOT THE SCORED QUESTION, DELIBERATELY — the same call pizza.ts and cents.ts
 * make, for the same reason. Yes/no over two options is the 50% coin flip this band is being rebuilt
 * to remove, and docs/story-9-11-rethink.md §8's "fitting is the answer" would have reintroduced it.
 * The CONVERTED NUMBER is scored; fitting is the consequence the child then watches. Nothing on the
 * bar is scaled or ticked before the commit, or they could read the answer off it.
 *
 * ⚠️ ZERO IS A REAL ANSWER, on `need` and only there — a child who measures exactly the limit is
 * 0 inches short and is on the ride. That is the boundary case a picture cannot answer (chapter-craft
 * §0b), so it is TAUGHT in the demo rather than only graded, and it forces FactorLab's guard
 * (`hands > 0`, count may be 0) with a tap pad that starts at 0.
 *
 * ⚠️ AND THE ANCHOR'S OWN NOTATION WAS CHECKED FOR THE TRAP CENTS.TS PAID FOR (money padding to two
 * places erases the decimals misconception). Here it is the pair of units in the ASK: state the limit
 * and the measurement in the SAME unit and there is nothing to convert at all, so every round states
 * them in different ones — asserted in the gate. The `4'3"` prime notation is not used either; a
 * nine-year-old reads `4 ft 3 in`.
 */
import { rint, pick } from '@/core/rand'

/** The answer is built two places at a time, so each place holds a single digit. */
export const MAX_PER_PLACE = 9
export type Place = 'tens' | 'ones'
export const PLACES: readonly Place[] = ['tens', 'ones']

/**
 * Every answer the TAP path offers, per place.
 *
 * ⚠️ It starts at 0 because zero IS an answer here (a `need` of 0 — exactly tall enough), and
 * because the TENS place of every two-digit answer under ten is 0. A pad starting at 1 makes rounds
 * unanswerable by tap that the camera can answer — FitOut's dead Done button, one surface along.
 */
export const padChoices = (): number[] => Array.from({ length: MAX_PER_PLACE + 1 }, (_, i) => i)

export const tensOf = (n: number) => Math.floor(n / 10)
export const onesOf = (n: number) => n % 10

// ─── the units ─────────────────────────────────────────────────────────────────────────
/**
 * The customary pairs this chapter uses, biggest-first. ⚠️ MILES ARE DELIBERATELY ABSENT: 5280 ft
 * to the mile is not a fact anybody derives, it is one they look up, and the answer would not fit
 * the two-place surface anyway.
 */
export interface Pair { big: string; small: string; factor: number; attr: 'length' | 'mass' | 'volume' }
export const PAIRS: readonly Pair[] = [
  { big: 'ft', small: 'in', factor: 12, attr: 'length' },
  { big: 'yd', small: 'ft', factor: 3, attr: 'length' },
  { big: 'lb', small: 'oz', factor: 16, attr: 'mass' },
  { big: 'gal', small: 'qt', factor: 4, attr: 'volume' },
  { big: 'qt', small: 'cup', factor: 4, attr: 'volume' },
]
/** The pairs a `swap` round may draw, with the largest whole `big` value that keeps the answer ≤ 99. */
export const SWAP_POOL: readonly { pair: Pair; max: number }[] = PAIRS
  .filter(p => p.small !== 'in')                 // ft→in is the `fit` rounds' own conversion
  .map(p => ({ pair: p, max: Math.floor(99 / p.factor) }))

/** Long names, for what is SPOKEN — "four pounds", never "four el bee". */
const SPOKEN_UNIT: Record<string, [string, string]> = {
  in: ['inch', 'inches'], ft: ['foot', 'feet'], yd: ['yard', 'yards'],
  lb: ['pound', 'pounds'], oz: ['ounce', 'ounces'],
  gal: ['gallon', 'gallons'], qt: ['quart', 'quarts'], cup: ['cup', 'cups'],
}
/**
 * ⚠️ SPELT OUT FROM A TABLE, NOT SUFFIXED WITH AN "s". Building a plural by appending gave
 * "0 pennyies" on The Coin Tray's very first demo beat — the "Fox has a apple" family, in front of a
 * child who is still learning to read. `foot`/`feet` would break the same way and worse.
 */
export const units = (n: number, u: string): string => {
  const w = SPOKEN_UNIT[u]
  return w ? `${n} ${n === 1 ? w[0] : w[1]}` : `${n} ${u}`
}
/** How a height is written on the door frame — `4 ft 3 in`, or plain `4 ft` when it lands square. */
export const ftIn = (ft: number, inch: number) => (inch ? `${ft} ft ${inch} in` : `${ft} ft`)
export const spokenFtIn = (ft: number, inch: number) =>
  inch ? `${units(ft, 'ft')} ${units(inch, 'in')}` : units(ft, 'ft')

// ─── rounds ────────────────────────────────────────────────────────────────────────────
export type QType = 'fit' | 'need' | 'swap'
export type Tier = 1 | 2 | 3

export interface HbRound {
  qType: QType
  /** The number the child has to build, 0..99. */
  answer: number
  /** The unit that number is in — what the sign, or the question, is written in. */
  unit: string
  /** `fit`/`need`: the posted limit, in `unit`. */
  limit: number
  /** `fit`/`need`: the measurement as the door frame states it. */
  ft: number
  inch: number
  /** `swap` only: what is being converted. */
  from: number
  fromUnit: string
  tag: string
  /**
   * Zone 1 WITHOUT the rule — just the two facts the round gives.
   *
   * ⚠️ IT EXISTS BECAUSE A SHORT FRAME HAS TO DROP EVERYTHING THAT IS SAID SOMEWHERE ELSE, and this
   * was measured on screen rather than reasoned: at 640×320 the full prompt wraps the card to 97px,
   * `boardBand`'s wanted top (151) is past the 112 the clamp allows, and the instruction chip is then
   * drawn **29 × 16 px across the headline** — the door-frame mark, which IS the question. The rule
   * ("a foot is twelve inches") is stated in the demo AND in the re-teach, so it is the one part of
   * the card that can go; the two facts cannot.
   */
  context: string
  /**
   * ⚠️ THREE ZONES, NOT ONE SENTENCE (docs/teen-12-14-math-audit.md §1 — the clarity spec).
   * `prompt` says what the numbers ARE and the rule that applies, in plain language with no UI verbs;
   * the BAR is the math hero; the instruction is one verb-led action, in its own chip.
   */
  prompt: string
  /** Zone 3's stem. The gesture is appended per input AND per place by `instructionFor`. */
  work: string
  spoken: string
}

export type Answering = 'hand' | 'tap'
const HOW: Record<Answering, string> = { hand: 'hold up', tap: 'tap' }
/**
 * ⚠️ A SECOND PHRASING, BECAUSE ONE VERB CANNOT SERVE BOTH SENTENCES — AND GLUING A PRONOUN ON GAVE
 * "hold up it" ON SCREEN, on the guided round's own instruction chip. `sayFor` says "…hold up the
 * tens digit", where a bare verb is right; the chip has no object after it, so it needs the whole
 * phrase. Same family as the "0 pennyies" plural: English assembled by concatenation, in front of a
 * child who is still learning to read.
 */
const HOW_IT: Record<Answering, string> = { hand: 'hold up that many fingers', tap: 'tap it' }
const PLACE_STEM: Record<Place, string> = { tens: 'The tens digit first', ones: 'Now the ones digit' }

/**
 * Zone 3 — the one verb-led action, in the wording of the surface on screen AND of the place being
 * filled. Baking a gesture into the round tells a tap-path child to do something they cannot; baking
 * the place into it tells them to fill one they have already filled.
 */
export const instructionFor = (input: Answering, place: Place): string =>
  `${PLACE_STEM[place]} — ${HOW_IT[input]}.`
/** What Milo says when the round opens — the context, then the first action. */
export const sayFor = (r: HbRound, input: Answering): string =>
  `${r.spoken} ${r.work} ${HOW[input]} the tens digit.`

const RULE = 'A foot is twelve inches, so the sign and the door frame are the same measurement on two different rulers.'

export function mkFit(ft: number, inch: number, limit: number): HbRound {
  const answer = ft * 12 + inch
  const context = `The sign says you must be ${units(limit, 'in')} to ride. The mark on your door frame says ${ftIn(ft, inch)}.`
  return {
    qType: 'fit', answer, unit: 'in', limit, ft, inch, from: 0, fromUnit: '',
    tag: 'Tall enough?', context,
    prompt: `${context} ${RULE}`,
    work: 'Work out your height in inches, then',
    spoken: `The sign says you must be ${units(limit, 'in')} to ride. Your door frame says ${spokenFtIn(ft, inch)}. ${RULE}`,
  }
}

/**
 * How many inches short. ⚠️ ZERO IS A LEGITIMATE ANSWER — a child who measures exactly the limit is
 * nought inches short and rides. It is the case a picture cannot settle, so `explainBeats` says it.
 */
export function mkNeed(ft: number, inch: number, limit: number): HbRound {
  const answer = Math.max(0, limit - (ft * 12 + inch))
  const context = `The sign says ${units(limit, 'in')}. You measure ${ftIn(ft, inch)}.`
  return {
    qType: 'need', answer, unit: 'in', limit, ft, inch, from: 0, fromUnit: '',
    tag: 'How many short?', context,
    prompt: `${context} ${RULE}`,
    work: 'Work out how many inches short you are, then',
    spoken: `${context} ${RULE}`,
  }
}

/** The same day out, a different ruler — the prize counter's scale and the drinks stand's jugs. */
const SWAP_STORY: Record<string, string> = {
  ft: 'The banner over the ride is measured in yards, and the poles come in feet.',
  oz: 'The prize counter weighs everything in ounces, and the label is in pounds.',
  qt: 'The slush machine is filled by the quart, and the tub is marked in gallons.',
  cup: 'The drinks stand pours by the cup, and the jug is marked in quarts.',
}

export function mkSwap(pair: Pair, from: number): HbRound {
  const context = `${SWAP_STORY[pair.small]} There ${from === 1 ? 'is' : 'are'} ${units(from, pair.big)}.`
  return {
    qType: 'swap', answer: from * pair.factor, unit: pair.small, limit: 0, ft: 0, inch: 0,
    from, fromUnit: pair.big,
    tag: 'Same amount, other ruler',
    /**
     * ⚠️ A SWAP KEEPS ITS SECOND SENTENCE ON EVERY FRAME. It is not the rule — it states the FACTOR,
     * which this round type gives rather than expects the child to know, so dropping it makes the
     * round unanswerable rather than merely terser.
     */
    context: `${context} One ${SPOKEN_UNIT[pair.big][0]} is ${units(pair.factor, pair.small)}.`,
    prompt: `${context} One ${SPOKEN_UNIT[pair.big][0]} is ${units(pair.factor, pair.small)}.`,
    work: `Work out how many ${SPOKEN_UNIT[pair.small][1]} that is, then`,
    spoken: `${context} One ${SPOKEN_UNIT[pair.big][0]} is ${units(pair.factor, pair.small)}.`,
  }
}

// ─── the ladder ────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THE TIERS GROW THE SKILL, NOT JUST THE NUMBERS.
 * L1 is WHOLE FEET only, so the answer is 12 × something and the round is the twelve-times table the
 * ruler in front of the child is printed with. L2 adds the inches part (the two-step conversion that
 * is the real skill) and opens the other two readings. L3 adds the cases a child gets wrong:
 * a height BELOW the limit on a `fit` round (so "it fits" is not the answer every time), the exact
 * boundary on `need` (answer 0), and the two big factors on `swap` (12 and 16).
 */
const POOL: Record<Tier, QType[]> = {
  1: ['fit'],
  2: ['fit', 'fit', 'need', 'swap'],
  3: ['fit', 'need', 'swap', 'swap'],
}

/** Ride limits a fair actually posts, in inches. */
export const LIMITS: readonly number[] = [36, 42, 44, 48, 52, 54]
/**
 * The shortest height any round may state as the CHILD'S OWN — 3 ft.
 *
 * ⚠️ IT IS A GENERATOR CONSTRAINT, NOT A COSMETIC ONE. The first cut drew the shortfall from a flat
 * `rint(1, 11)` under a sign as low as 36 in, which produces `2 ft 1 in` and tells a nine-year-old
 * that is their height on the door frame. The math would have been perfect and the sentence absurd.
 */
export const MIN_HEIGHT = 36
/**
 * The limits a round may post when the child's height carries an inches remainder.
 *
 * ⚠️⚠️ NO MULTIPLE OF TWELVE, AND THIS WAS CAUGHT ON SCREEN RATHER THAN BY ARITHMETIC. On a round
 * asking `4 ft 3 in` against a **48 in** sign, the child's own first step — four lots of twelve — IS
 * 48, the number already printed on the sign beside it. The demo said it out loud: *"4 feet is 4 lots
 * of twelve, which is 48 inches"*, directly under `sign: 48 in`. Nothing prints the answer (51) and
 * nothing is wrong, and a child who stops at the number they can see gets it wrong for a reason the
 * CHAPTER created rather than one they hold. Two of the six limits are multiples of twelve and it hits
 * roughly a third of the L2 rounds.
 * ⚠️ L1 is exempt and must be: there the answer IS `ft × 12`, so the limit merely has to differ from
 * it — which `makeRound` already enforces, and which is the whole reason that filter is there.
 */
export const OFFSET_LIMITS: readonly number[] = LIMITS.filter(l => l % 12 !== 0)

/**
 * `asked` is the coverage bookkeeping SkillBeat feeds back — the readings already served this run.
 *
 * ⚠️ IGNORING IT IS NOT HARMLESS. The beat declares `coverage`, so the mastery exit is withheld until
 * all three readings have been asked; a generator that keeps rolling dice simply denies a strong
 * child the early finish. Deliberate while a gap exists, RANDOM once it closes — hardest-first for
 * ever would lock the chapter onto one reading and destroy the variety coverage exists to protect.
 */
export function makeRound(d: Tier, asked: readonly string[] = []): HbRound {
  const pool = POOL[d]
  const unmet = pool.filter(t => !asked.includes(t))
  const t = pick(unmet.length ? unmet : pool)

  if (t === 'swap') {
    // L2 keeps to the small factors (3 and 4); L3 adds 16, which is the one that needs real working.
    const opts = d === 3 ? SWAP_POOL : SWAP_POOL.filter(s => s.pair.factor <= 4)
    const s = pick(opts as { pair: Pair; max: number }[])
    return mkSwap(s.pair, rint(2, s.max))
  }

  if (t === 'need') {
    // ⚠️ THE LIMIT IS DRAWN SO THE SHORTFALL RANGE IS NEVER EMPTY. A child who is short of the sign
    // still has to be a plausible height (`MIN_HEIGHT` and up), so a 36 in sign has no room under it
    // at all — and clamping after the fact with a `Math.max` would silently hand back the boundary
    // case on every one of those, which is cents.ts's recorded way for a tier to stop meaning
    // anything while every round still looks fine.
    const limit = pick(OFFSET_LIMITS.filter(l => l - MIN_HEIGHT >= 1) as number[])
    /**
     * ⚠️ THE BOUNDARY IS DRAWN ON PURPOSE AT L3 RATHER THAN LEFT TO CHANCE — "exactly tall enough"
     * is the one case the bar cannot settle by eye, so the tier that teaches it must guarantee it.
     */
    const hi = Math.min(11, limit - MIN_HEIGHT)
    /**
     * ⚠️ AND A SHORTFALL THAT EQUALS EITHER HALF OF THE HEIGHT AS WRITTEN IS NOT DRAWN AT ALL,
     * BECAUSE THAT PRINTS THE ANSWER ON THE BOARD BY COINCIDENCE. `48 − 42` is 6 and `42 in` is
     * written `3 ft 6 in`; `44 − 41` is 3 and `41 in` is written `3 ft 5 in`. Either way the answer
     * is sitting in the headline as one of its own digits — chapter-craft's "a number in a verdict
     * can be the answer by coincidence" (Factor Lab's seven stranded units answering seven pairs),
     * arriving through a template rather than through wording. ⚠️ THE FEET HALF WAS FOUND ONLY AFTER
     * FIXING THE INCHES HALF: a rule stated for one component of a written form has to be checked
     * against every component of it.
     * It is a couple of cases per limit, so filtering costs nothing — and the gate then gets to
     * assert the strong rule for every type rather than carry an exception for this one.
     *
     * ⚠️ AND IT IS DRAWN FROM A FILTERED SET RATHER THAN RETRIED WITH A BAIL-OUT, which would be the
     * same silent-fallback shape one more time: a loop that gives up after N tries still emits the
     * case it exists to exclude, just rarely enough that nobody sees it.
     */
    const ok = Array.from({ length: hi }, (_, i) => i + 1)
      .filter(s => { const t = limit - s; return t % 12 !== s && Math.floor(t / 12) !== s })
    const short = d === 3 && rint(0, 2) === 0 ? 0 : pick(ok)
    const total = limit - short
    return mkNeed(Math.floor(total / 12), total % 12, limit)
  }

  if (d === 1) {
    // Whole feet only: the answer IS 12 × ft, and the limit sits between two of them so the
    // comparison still has to be made.
    const ft = rint(3, 6)
    return mkFit(ft, 0, pick(LIMITS.filter(l => l !== ft * 12) as number[]))
  }
  /**
   * ⚠️ L3 DRAWS A HEIGHT BELOW THE LIMIT HALF THE TIME. Left to a uniform range over a plausible
   * child's height, nearly every `fit` round clears a 36–48 in bar — so "yes" becomes the answer to
   * the consequence every time, and a child stops reading the number they just worked out.
   * ⚠️ AND THE LIMIT IS DRAWN TO SUIT, for `need`'s reason: the signs low enough that nothing
   * plausible fits under them are simply not drawn for an `under` round, rather than clamped into
   * one after the fact.
   */
  const under = d === 3 && rint(0, 1) === 1
  const limit = pick((under ? OFFSET_LIMITS.filter(l => l - MIN_HEIGHT >= 1) : OFFSET_LIMITS) as number[])
  const total = under ? limit - rint(1, Math.min(9, limit - MIN_HEIGHT)) : limit + rint(1, 14)
  return mkFit(Math.floor(total / 12), total % 12, limit)
}

/**
 * The big figure on the board — HERE rather than in the scene, because it is the one place the
 * chapter can print its own answer.
 *
 * ⚠️⚠️ EVERY TYPE SHOWS ONLY WHAT IT WAS GIVEN. The Coin Tray shipped a board that rendered its
 * round's target on all three types, which is right on the one whose question IS "read this" and
 * fatal on the others. Here: `fit` and `need` show the door-frame mark (`4 ft 3`), which is the
 * question; `swap` shows `4 lb`, which is the question. **None of them may show inches before the
 * commit**, because inches is what is being asked for — and a gate sweeps that on TOKENS rather than
 * substrings, since `12` inside `4 ft 12 in` would never be a leak.
 */
export function headline(r: HbRound, revealed: boolean): string {
  if (revealed) return `${r.answer} ${r.unit}`
  if (r.qType === 'swap') return `${r.from} ${r.fromUnit}`
  return ftIn(r.ft, r.inch)
}

/** What the SIGN reads — the limit, in the unit it is posted in. `swap` has no sign. */
export const signOf = (r: HbRound): string | null => (r.qType === 'swap' ? null : `${r.limit} ${r.unit}`)

// ─── grading ───────────────────────────────────────────────────────────────────────────
/** The number the child has built, as two places. `null` in a place means "not entered yet". */
export interface Entry { tens: number | null; ones: number | null }
export const EMPTY_ENTRY: Entry = { tens: null, ones: null }
export const entryValue = (e: Entry) => (e.tens ?? 0) * 10 + (e.ones ?? 0)
export const entryFull = (e: Entry) => e.tens !== null && e.ones !== null
export const graded = (r: HbRound, e: Entry) => entryFull(e) && entryValue(e) === r.answer

/** Whether the child gets on the ride — the CONSEQUENCE, never the question. */
export const fits = (r: HbRound): boolean => r.ft * 12 + r.inch >= r.limit

/**
 * An entry that is not a real attempt — redirect instead of scoring it, the same call the colouring
 * chapter makes for a tap that lands on the ink.
 *
 * ⚠️ EVERY REFUSAL THE GENERATOR MAKES NEEDS A MATCHING REFUSAL AT THE ANSWER, or a child is marked
 * wrong over a picture that says they are right (Factor Lab's `f === n`). The generator never draws a
 * `fit` or `swap` answer of 0 — nobody is nought inches tall and no jug holds nought cups — so a 00
 * there is "you have not answered" rather than a wrong answer, and grading it would spend one of the
 * child's ten rounds on nothing. On `need` a 0 is a real answer and must fall straight through.
 * ⚠️ AND IT MUST NOT NAME THE ANSWER, or a child who overshoots is handed it.
 */
export function nudgeFor(r: HbRound, e: Entry, input: Answering = 'hand'): string | null {
  if (!entryFull(e)) return null
  if (graded(r, e)) return null
  if (entryValue(e) === 0 && r.qType !== 'need') {
    return `That reads zero — ${HOW[input]} the two digits of your answer, tens first.`
  }
  return null
}

/**
 * Never names the answer, and never differs between an entry that was nearly right and one that was
 * not — a miss line that narrowed with the child's attempt would be hot/cold across attempts.
 */
export function missFor(r: HbRound): string {
  if (r.qType === 'need') return 'Not that many. Put your height in inches first, then take it away from the number on the sign.'
  if (r.qType === 'swap') return 'Not that many. One of the big unit is a whole group of the small one — count that group for every one you have.'
  return 'Not that tall. Every foot is twelve inches, so count the feet in twelves and then add the inches left over.'
}

/**
 * What the board prints once the child has committed — HERE rather than in the scene, so the gate can
 * drive the same words the screen shows. That is the fault the chapter this replaces shipped: its
 * verdict lived inside the component, where none of its green tests could reach a word the child
 * reads.
 *
 * ⚠️ ON A CORRECT ROUND IT PRINTS THE BRIDGE — the two ways of writing the one measurement, and then
 * the consequence. On a miss it names what they BUILT, which is a true statement about the number in
 * front of them and never the answer.
 */
export function verdictFor(r: HbRound, e: Entry): { text: string; ok: boolean } {
  const v = entryValue(e)
  if (!graded(r, e)) return { text: `That reads ${units(v, r.unit)}`, ok: false }
  if (r.qType === 'swap') return { text: `${units(r.from, r.fromUnit)} is ${units(r.answer, r.unit)} — the same amount`, ok: true }
  if (r.qType === 'need') {
    return {
      text: r.answer === 0
        ? `${ftIn(r.ft, r.inch)} is exactly ${units(r.limit, 'in')} — you are on`
        : `${ftIn(r.ft, r.inch)} is ${units(r.answer, 'in')} under the sign`,
      ok: true,
    }
  }
  return {
    text: `${ftIn(r.ft, r.inch)} is ${units(r.answer, 'in')} — ${fits(r) ? `the sign says ${r.limit}, so you are on` : `the sign says ${r.limit}, so not this time`}`,
    ok: true,
  }
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
/** The worked example, as data, so the gate drives the same beats the screen plays. */
export interface DemoBeat { say: string; entry: Entry; revealed: boolean }

const built = (n: number): Entry => ({ tens: tensOf(n), ones: onesOf(n) })

export function explainBeats(r: HbRound): DemoBeat[] {
  const blank = { entry: EMPTY_ENTRY, revealed: false }
  if (r.qType === 'swap') {
    const f = r.answer / r.from
    return [
      { say: `${units(r.from, r.fromUnit)}, and the other ruler counts in ${SPOKEN_UNIT[r.unit][1]}.`, ...blank },
      { say: `One ${SPOKEN_UNIT[r.fromUnit][0]} is ${units(f, r.unit)}. So count ${units(f, r.unit)} for every one of them.`, ...blank },
      { say: `${r.from} lots of ${f} is ${r.answer}. ${units(r.from, r.fromUnit)} is ${units(r.answer, r.unit)} — the same amount, other ruler.`, entry: built(r.answer), revealed: true },
    ]
  }
  const total = r.ft * 12 + r.inch
  const head = [
    { say: `The sign is in inches and the door frame is in feet, so they have to be made the same before anything can be compared.`, ...blank },
    { say: `${units(r.ft, 'ft')} is ${r.ft} lots of twelve, which is ${units(r.ft * 12, 'in')}.`, ...blank },
    ...(r.inch ? [{ say: `Then the ${units(r.inch, 'in')} left over on top — that makes ${units(total, 'in')}.`, ...blank }] : []),
  ]
  if (r.qType === 'need') {
    return [...head, {
      /**
       * ⚠️ THE BOUNDARY IS SAID OUT LOUD RATHER THAN ONLY GRADED. "Exactly tall enough" is the one
       * case looking at the bar cannot settle, and the generic wording ("you are 0 inches short") is
       * the sort of sentence that teaches a child the app is broken.
       */
      say: r.answer === 0
        ? `${units(total, 'in')} against a sign that says ${r.limit} — they are the same, and the same is tall enough. Nought inches short.`
        : `${units(total, 'in')} against ${units(r.limit, 'in')} on the sign. Take one from the other: ${units(r.answer, 'in')} short.`,
      entry: built(r.answer), revealed: true,
    }]
  }
  return [...head, {
    say: `${units(total, 'in')} against ${units(r.limit, 'in')} on the sign — ${fits(r) ? 'that is tall enough, so you are on' : 'that is not tall enough yet'}.`,
    entry: built(total), revealed: true,
  }]
}

/**
 * The rounds Milo works through before the child tries one, and the guided round.
 *
 * ⚠️ THE EXAMPLES ARE PICKED FROM THE HARD END, NOT THE TIDY ONE. Hand-picked demos drift toward the
 * case that READS well — BlockYard narrated "add the tens, then the ones" over four examples that all
 * quietly avoided a carry, on a chapter where half the rounds need one. So demo 1 carries an inches
 * remainder (the two-step conversion), demo 2 is the exact boundary (`need` = 0, the case nothing on
 * screen can settle), and demo 3 is the 16 factor.
 */
export const DEMO: HbRound[] = [mkFit(4, 3, 44), mkNeed(4, 0, 48), mkSwap(PAIRS[2], 4)]
export const GUIDED: HbRound = mkFit(4, 0, 44)

// ─── the hands-apart span — the explore beat's reading ─────────────────────────────────
/**
 * ⚠️⚠️ WHY THE SPAN IS THE EXPLORE BEAT AND NOT THE ANSWER, WITH THE ARITHMETIC THAT DECIDED IT.
 * docs/story-9-11-ar-plan.md §8 asks for "hold your hands apart to SHOW a length", and the founder
 * picked it. It cannot carry a scored answer here, and the numbers say so before any code:
 *
 *   · MediaPipe's palm wanders ~±0.02 of frame width, so a distance between TWO palms carries
 *     ~±0.028 — and mapped onto an answer scale through `reachSpan`'s 0.72 band that is ±3.9% of the
 *     range, i.e. **±2.3 inches** on a 0–60 in scale. Answers one inch apart (51 against 50) are
 *     inside the noise, so a child who knows the answer could not enter it. That is a dead button,
 *     which chapter-craft calls the worst outcome there is.
 *   · Both hands must also be IN FRAME: at a normal seating distance a webcam sees roughly nine hand
 *     widths across, so anything past about 22 inches simply cannot be shown at all.
 *
 * So this is The Angle Shop's `job: 'degrees'` precedent applied verbatim — a gesture does not ship
 * on a round that gives it nothing to aim at, and the hand answers the question it CAN answer
 * instead. Estimating "about how long is a foot" needs no precision at all; it is the benchmark sense
 * that tells a child which unit is sensible, which is exactly the half of the skill the twelve
 * coin-flip chips used to pretend to test. Nothing here is scored.
 *
 * ⚠️ AND IT IS NORMALISED BY THE CHILD'S OWN HAND, WHICH IS WHAT MAKES IT CALIBRATION-FREE. A span
 * in frame fractions means nothing — lean back and your foot gets shorter. The hand width is measured
 * in the SAME frame and scales identically with distance, so `span ÷ handWidth` is invariant to how
 * far away the child sits, and one nominal number converts it to inches.
 */
/** A 9–11-year-old's palm width across the knuckles, in inches. ⚠️ THE CALIBRATION KNOB — the only
 *  assumed number in the reading, and the thing to tune first if a real child's foot reads long. */
export const HAND_IN = 2.9
/** Anything below this is not two hands held apart, it is two hands together. */
export const SPAN_MIN_HANDS = 0.6

export function spanInches(spanInHands: number | null): number | null {
  if (spanInHands === null || spanInHands < SPAN_MIN_HANDS) return null
  return Math.round(spanInHands * HAND_IN)
}

/**
 * What the explore beat says back. ⚠️ IT REPORTS WHAT WAS READ AND NEVER WHETHER IT IS RIGHT — the
 * hot/cold rule. It names the nearest thing a child can check against instead, so the feedback is a
 * comparison they can make themselves rather than a verdict handed down.
 */
export function spanNote(inches: number | null): string {
  if (inches === null) return 'Hold both hands up, palms facing, and move them apart.'
  if (inches < 6) return `About ${units(inches, 'in')} — that is around a soda can.`
  if (inches < 11) return `About ${units(inches, 'in')} — that is around a sheet of paper.`
  if (inches < 16) return `About ${units(inches, 'in')} — a ruler is twelve, so you are close to a foot.`
  return `About ${units(inches, 'in')} — more than a foot. A foot is twelve.`
}

/**
 * The explore beat's copy, per input and per frame.
 *
 * ⚠️ THE SHORT-FRAME VERSIONS CARRY A CHARACTER BUDGET, BECAUSE NOTHING CAN SEE A WRAP. Measured at
 * 640×320: at 118 characters the body wraps to two lines, the card comes out 79px tall, and
 * `boardBand`'s wanted top (133) is past the 112 the clamp allows — so the board is drawn over the
 * bottom of the INSTRUCTION CHIP, which is the one action rather than text already read. At 70 it is
 * one line, the card is 62px and the chip clears by 12. Same shape as the chalkboard's `PLAN_BUDGET`:
 * a layout fault that no assertion about the layout can reach, pinned as a budget on the words.
 */
export const EXPLORE_BUDGET = 84
export const exploreText = (input: Answering, short: boolean): string =>
  input === 'tap'
    ? (short
      ? 'Tap to stack up inches — 0 clears it. Every twelfth one becomes a foot.'
      : 'Tap to stack up that many inches — 0 clears it. Watch every twelfth inch turn into one foot; that is all a foot is.')
    : (short
      ? 'Move your hands apart. The gap in inches is on the left; every twelve is a foot.'
      : 'Hold both hands up, palms facing, and move them apart. That gap in inches is on the left — and every twelve of them is one foot.')

// ─── layout ──────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THERE IS NONE ANY MORE, AND THAT IS THE PAYOFF OF THE PORT. This module used to carry its own
 * `TOP_BAND`/`BOT_BAND`/`ACTION_ROW` and a `boardBand` clamp — arithmetic that existed BYTE-IDENTICAL
 * in four chapters, was extracted to `preteen/band.ts` on the fourth copy, and then had to be swept
 * at ten viewport sizes in four separate gates. GameShell owns the bands now and `FitSlot` scales the
 * instrument into whatever is left, so all of it went with the bespoke scene (2026-08-14).
 *
 * What did NOT go is everything above: the ladder, the grader and the words. That split — math and
 * words in the module, layout in the shell — is the whole reason ten chapters can share one engine.
 */
export {}
