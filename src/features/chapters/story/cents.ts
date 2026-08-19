/**
 * THE COIN TRAY (9–11, skill `decimals`) — the pure module.
 *
 * Everything the chapter renders and grades from lives here, outside React, because the answering
 * surface is a WEBCAM and a webcam cannot be driven by a gate. The scene is eyeball-only; this file
 * is where the math, the ladder and the grader are held to account
 * (see __tests__/coinTrayDecimals.test.ts).
 *
 * THE VERB IS "MAKE THE AMOUNT", AND THE TWO WELLS OF THE TRAY *ARE* THE TWO DECIMAL PLACES.
 * A dime is one tenth of a dollar; a penny is one hundredth. So laying 0.55 out is 5 dimes and 5
 * pennies, and 0.6 is 6 dimes and a fist — the child fills the tenths well, then the hundredths one,
 * left to right, exactly the order the number is written. Three readings of that one act:
 *
 *   make   "The tag reads 0.55 of a dollar."                            → 5 dimes, 5 pennies
 *   place  "Show me seven hundredths of a dollar."                      → 0 dimes, 7 pennies
 *   op     "It read 0.55. It went up by 0.05."                          → 6 dimes, 0 pennies
 *
 * ⚠️ WHAT THIS REPLACES, AND WHY IT LOOKED FINE. The old DecimalGrid shaded a 10×10 grid and offered
 * chips. Three faults, all live:
 *   · every COMPARE round offered exactly TWO chips — a 50% coin flip, on the one round type the
 *     chapter exists for (0.3 vs 0.25). `digit` was nominally three, but two of the three were the
 *     two digits already printed on screen, so it was a coin flip as well.
 *   · a `digit` round drew the 100-cell grid with `shaded: 0` for its whole duration — the
 *     manipulative present, and meaning nothing.
 *   · the demo's prompt card was hardcoded `tag="Read"`, so the compare demo was labelled Read.
 * Two of the three question types were guessable, which is the defect docs/story-9-11-rethink.md
 * measures across this band.
 *
 * ⚠️ WHY THE ANCHOR IS MONEY, AND THE COST OF IT, STATED RATHER THAN HIDDEN.
 * docs/story-9-11-ar-plan.md §7 names it and the argument is structural rather than flavour: **100
 * cents ARE the hundredths grid**, so tenths are dimes and hundredths are pennies and the anchor and
 * the manipulative are the same object — the recorded exception, exactly as dollar denominations ARE
 * base ten in The Fundraiser. Every alternative fails: a race time inverts "more is better", a
 * doorframe height is the `measurementUnits` chapter, a fuel price is a parent's world.
 * ⚠️ THE COST: this is the band's SECOND money world (The Fundraiser) and the app's THIRD (6–8's
 * CoinShop). Raised with the founder before any code, and he took it. So the separation has to be
 * STRUCTURAL rather than verbal, and it is the decimal point itself:
 *   · The Fundraiser is everything LEFT of the point — whole dollars, bundled into thousands.
 *   · CoinShop (6–8) is "count what is on the cloth and pay it", i.e. addition wearing coins.
 *   · This is everything RIGHT of the point, and nothing here is ever added up: the wells are places,
 *     and putting a coin in the wrong well is the whole misconception.
 * One whole vs two places is a property a gate can assert and a reader can see.
 *
 * ⚠️ THE PRICE TAG IS WRITTEN AS A DECIMAL, NOT AS MONEY, AND THAT IS THE ONE PLACE THE ANCHOR FIGHTS
 * THE MATHS. Money notation always pads to two places, so `$0.60` vs `$0.55` is obviously bigger and
 * the misconception this chapter exists for cannot even occur. `0.6` vs `0.55` is the trap. So every
 * ASK states the decimal (`dec`) and the money form (`money`) appears only in the REVEAL, where it is
 * the bridge — "$0.60, and that is 0.6 of a dollar" — rather than a hint.
 * ⚠️ For the same reason the spoken line says the DIGITS ("zero point six of a dollar") and never the
 * cents: "sixty cents" hands a child six dimes without their reading a decimal at all.
 *
 * ⚠️ ZERO IS A REAL ANSWER HERE, unlike The Pizza Counter where a fist means nothing. `0.60` is six
 * dimes and NO pennies; "seven hundredths" is NO dimes and seven pennies. So a fist has to be told
 * from a lowered hand — FactorLab's guard (`hands > 0`, count may be 0) — and the tap pad starts at 0.
 *
 * ⚠️ AND THE COMPARISON IS NOT ITS OWN ROUND TYPE, DELIBERATELY — the same call pizza.ts makes, for
 * the same reason. "Which is greater?" over two options is the coin flip this chapter is being
 * rebuilt to remove, and a build of the greater one is still a 50/50 DECISION however it is entered.
 * It is instead what the tray REVEALS: a dime is drawn as a strip of ten pips, so six strips against
 * five strips and five pips is a comparison the child looks at rather than one they are asked. The
 * explore beat is where ten pennies visibly fuse into one dime.
 */
import { rint, pick } from '@/core/rand'

/** A well holds at most nine: ten dimes is a whole dollar, ten pennies is a dime. */
export const MAX_PER_WELL = 9
/** The two wells, in the order the number is written. */
export type Well = 'dimes' | 'pennies'
export const WELLS: readonly Well[] = ['dimes', 'pennies']

export const dimesOf = (cents: number) => Math.floor(cents / 10)
export const penniesOf = (cents: number) => cents % 10
export const wantOf = (cents: number, w: Well) => (w === 'dimes' ? dimesOf(cents) : penniesOf(cents))

/**
 * Every answer the TAP path offers, per well — the same span a well can hold.
 *
 * ⚠️ Derived rather than typed out, because the two inputs must offer the SAME answers: a pad
 * narrower than the well makes rounds unanswerable by tap that are answerable by camera. It starts
 * at 0 because zero IS an answer here (see the header) — the mirror of The Pizza Counter, where a
 * zero button could never be right and was therefore left off.
 */
export const padChoices = (): number[] => Array.from({ length: MAX_PER_WELL + 1 }, (_, i) => i)

// ─── words ─────────────────────────────────────────────────────────────────────────────
/**
 * The decimal, trimmed — `0.6`, `0.55`, `0.06`. This is what every ASK states.
 *
 * ⚠️ An EMPTY tray is `0`, not `0.0`. The explore beat prints what the tray is worth as the child
 * piles coins on, and starting at `0.0` reads as a price rather than as nothing there.
 */
export function dec(cents: number): string {
  const c = Math.round(cents)
  if (c === 0) return '0'
  return c % 10 === 0 ? (c / 100).toFixed(1) : (c / 100).toFixed(2)
}
/** The money form, always padded — `$0.60`. Reveal only; see the header. */
export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/**
 * How a decimal is SAID — digit by digit after the point, never as cents.
 *
 * ⚠️ "sixty cents" states the answer (six dimes) without a decimal being read at all, and "six
 * cents" and "sixty cents" differ by one syllable a nine-year-old can mishear. Saying the digits
 * makes the child do the placing, which is the skill.
 */
export function spokenDec(cents: number): string {
  const s = dec(cents).slice(2)                    // "6" | "55" | "06"
  return `zero point ${[...s].map(d => ONES[+d]).join(' ')}`
}
/**
 * ⚠️ SPELT OUT, NOT SUFFIXED. Building the plural by appending gave "0 pennyies" on the very first
 * demo beat — the "Fox has a apple" family, in front of a child who is still learning to read.
 */
export const coins = (n: number, w: Well) =>
  `${n} ${w === 'dimes' ? (n === 1 ? 'dime' : 'dimes') : (n === 1 ? 'penny' : 'pennies')}`

// ─── rounds ────────────────────────────────────────────────────────────────────────────
export type QType = 'make' | 'place' | 'op'
export type Tier = 1 | 2 | 3
export type Place = 'tenths' | 'hundredths'

export interface CtRound {
  qType: QType
  /** The amount to lay out, in cents, 1..99. The wells are `dimesOf`/`penniesOf` of it. */
  target: number
  /** `op` only: what the tag read before, and what changed. 0 / null otherwise. */
  from: number
  step: number
  op: '+' | '−' | null
  /** `place` only. */
  place: Place | null
  tag: string
  /**
   * ⚠️ THREE ZONES, NOT ONE SENTENCE (docs/teen-12-14-math-audit.md §1 — the clarity spec).
   * `prompt` says what the numbers ARE and the rule that applies, in plain language with no UI
   * verbs; the TRAY is the math hero; the instruction is one verb-led action, in its own chip.
   */
  prompt: string
  /** Zone 3's stem. The gesture is appended per input AND per well by `instructionFor`. */
  work: string
  spoken: string
}

/** How an answer is given, per input. The ONE place either gesture is named. */
export type Answering = 'hand' | 'tap'
const HOW: Record<Answering, string> = { hand: 'hold up how many', tap: 'tap how many' }
const WELL_STEM: Record<Well, string> = { dimes: 'Dimes first', pennies: 'Now the pennies' }

/**
 * Zone 3 — the one verb-led action, in the wording of the surface on screen AND of the well being
 * filled. Baking a gesture into the round tells a tap-path child to do something they cannot;
 * baking the well into it tells them to fill one they have already filled.
 */
export const instructionFor = (input: Answering, well: Well): string =>
  `${WELL_STEM[well]} — ${HOW[input]}.`
/** What Milo says when the round opens — the context, then the first action. */
export const sayFor = (r: CtRound, input: Answering): string =>
  `${r.spoken} ${r.work} ${HOW[input]} go in the dimes well.`

const TRAY = 'A dime is one tenth of a dollar and a penny is one hundredth, so the two wells are the two places.'

export function mkMake(target: number): CtRound {
  return {
    qType: 'make', target, from: 0, step: 0, op: null, place: null,
    tag: 'Read the tag',
    prompt: `The tag reads ${dec(target)} of a dollar. ${TRAY}`,
    work: 'Work out how many of each, then',
    spoken: `The tag reads ${spokenDec(target)} of a dollar. ${TRAY}`,
  }
}

export function mkPlace(digit: number, place: Place): CtRound {
  const target = place === 'tenths' ? digit * 10 : digit
  const words = `${ONES[digit]} ${place}`
  return {
    qType: 'place', target, from: 0, step: 0, op: null, place,
    tag: 'Name the place',
    prompt: `Milo wants ${words} of a dollar — and nothing else. ${TRAY}`,
    work: 'Work out which well that is, then',
    spoken: `Milo wants ${words} of a dollar, and nothing else. ${TRAY}`,
  }
}

export function mkOp(from: number, step: number, op: '+' | '−'): CtRound {
  const target = op === '+' ? from + step : from - step
  const verb = op === '+' ? 'went UP by' : 'came DOWN by'
  const context = `The tag read ${dec(from)} of a dollar. It ${verb} ${dec(step)}.`
  return {
    qType: 'op', target, from, step, op, place: null,
    tag: op === '+' ? 'Price up' : 'Price down',
    prompt: `${context} ${TRAY}`,
    work: 'Work out the new tag, then',
    spoken: `${context} ${TRAY}`,
  }
}

// ─── the ladder ────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THE TIERS GROW THE MISCONCEPTION, NOT JUST THE NUMBERS.
 * L1 is tenths only, so the pennies well is always a fist and the child learns that the FIRST place
 * is dimes. L2 opens both wells. L3 adds the trap amounts — the pairs whose spoken decimals differ
 * by one word and whose trays are nothing alike (0.6 against 0.06, 0.5 against 0.05) — and the `op`
 * rounds that cross a ten, where five pennies plus five pennies has to become a dime.
 */
export const TRAP_CENTS: readonly number[] = [5, 50, 6, 60, 7, 70, 8, 80, 9, 90, 4, 40]

const POOL: Record<Tier, QType[]> = {
  // ⚠️ L1 IS `make` ONLY, and tenths only. Naming a place is a second vocabulary and an `op` is
  // arithmetic; both would be taught on top of a tray the child cannot yet read. Coverage (below)
  // is what guarantees they are met before the run can end early.
  1: ['make'],
  2: ['make', 'make', 'place', 'op'],
  3: ['make', 'place', 'place', 'op'],
}

/**
 * `asked` is the coverage bookkeeping SkillBeat feeds back — the readings already served this run.
 *
 * ⚠️ IGNORING IT IS NOT HARMLESS. The beat declares `coverage`, so the mastery exit is withheld until
 * all three readings have been asked; a generator that keeps rolling dice simply denies a strong
 * child the early finish. Deliberate while a gap exists, RANDOM once it closes — hardest-first for
 * ever would lock the chapter onto `place` and destroy the variety coverage exists to protect.
 *
 * ⚠️ AND `place`/`op` DO NOT EXIST AT L1, so a child who never leaves the easiest tier can never
 * complete coverage. Harmless in the same way FactorLab's prime is: mastery needs the TOP tier
 * anyway, so a child stuck at L1 was never going to exit early. The run still ends at ten rounds.
 */
export function makeRound(d: Tier, asked: readonly string[] = []): CtRound {
  const pool = POOL[d]
  const unmet = pool.filter(t => !asked.includes(t))
  const t = pick(unmet.length ? unmet : pool)

  if (t === 'place') {
    // L2 names tenths only — one new word at a time. L3 adds hundredths, which is where a child who
    // has learned "the first well" as a habit rather than as a place lays it in the wrong one.
    const place: Place = d === 2 ? 'tenths' : (rint(0, 1) ? 'tenths' : 'hundredths')
    return mkPlace(rint(1, MAX_PER_WELL), place)
  }

  if (t === 'op') {
    /**
     * ⚠️ L3 FORCES A CROSSING and L2 forbids one — the pennies making a whole dime is the single
     * arithmetic fact the two wells exist to show, and it is a second idea on top of reading the
     * tray. So the operands are drawn to GUARANTEE each case rather than clamped after the fact: a
     * `Math.max(1, …)` on a range that came out empty silently produces the case it was meant to
     * exclude, which is how a tier stops meaning anything.
     */
    const op: '+' | '−' = d === 2 ? '+' : (rint(0, 1) ? '+' : '−')
    if (op === '+') {
      if (d === 2) {
        const from = rint(1, 8) * 10 + rint(0, MAX_PER_WELL - 1)     // room for a step, no crossing
        return mkOp(from, rint(1, MAX_PER_WELL - penniesOf(from)), '+')
      }
      const from = rint(1, 7) * 10 + rint(1, MAX_PER_WELL)           // pennies ≥ 1, so a carry exists
      return mkOp(from, rint(MAX_PER_WELL + 1 - penniesOf(from), MAX_PER_WELL), '+')
    }
    if (d === 2) {
      const from = rint(2, 9) * 10 + rint(1, MAX_PER_WELL)           // pennies ≥ 1 to take from
      return mkOp(from, rint(1, penniesOf(from)), '−')
    }
    const from = rint(2, 9) * 10 + rint(0, MAX_PER_WELL - 1)         // step's pennies must exceed it
    return mkOp(from, rint(penniesOf(from) + 1, MAX_PER_WELL), '−')
  }

  if (d === 1) return mkMake(rint(1, MAX_PER_WELL) * 10)            // tenths only
  if (d === 3 && rint(0, 1)) return mkMake(pick(TRAP_CENTS as number[]))
  // Both wells non-empty, so the child has to place two digits rather than one.
  return mkMake(rint(1, MAX_PER_WELL) * 10 + rint(1, MAX_PER_WELL))
}

/**
 * The big figure on the board — HERE rather than in the scene, because it is the one place the
 * chapter can print its own answer.
 *
 * ⚠️⚠️ ONLY A `make` ROUND MAY SHOW THE AMOUNT, BECAUSE ONLY THERE IS THE AMOUNT THE QUESTION.
 * The board first printed `dec(target)` on every type, which looks harmless and is the printed-answer
 * fault twice over:
 *   · an `op` round asks *"it read 0.55, it went UP by 0.05"* — printing `0.6` above it **is the
 *     answer**, so the child never does the arithmetic at all;
 *   · a `place` round asks *"seven hundredths of a dollar"* in WORDS, and printing `0.07` does the
 *     words-to-digits step for them, which is half of what the round tests.
 * So `op` shows its SUM (the question, exactly as The Pizza Counter's board does) and `place` shows
 * nothing until the commit. Driving it is what would have caught this; reading the board is what did.
 */
export function headline(r: CtRound, revealed: boolean): string {
  if (r.qType === 'make' || revealed) return dec(r.target)
  if (r.qType === 'op') return `${dec(r.from)} ${r.op} ${dec(r.step)}`
  return '?'
}

// ─── grading ───────────────────────────────────────────────────────────────────────────
/** The tray as laid out. Each well is 0..MAX_PER_WELL — a count, not a running total. */
export interface Tray { dimes: number; pennies: number }
export const trayCents = (t: Tray) => t.dimes * 10 + t.pennies
export const graded = (r: CtRound, t: Tray) => trayCents(t) === r.target

/**
 * A tray that is not a real attempt — redirect instead of scoring it, the same call the colouring
 * chapter makes for a tap that lands on the ink.
 *
 * ⚠️ AN EMPTY TRAY IS NOT A WRONG ANSWER, IT IS NO ANSWER. No round's target is 0, so a child who
 * has put nothing out has not answered; grading it spends one of their ten rounds on nothing.
 * ⚠️ AND IT MUST NOT NAME THE ANSWER. Every other tray grades normally, so a genuinely wrong
 * placement still costs a mark — that is the point of the chapter.
 */
export function nudgeFor(r: CtRound, t: Tray, input: Answering = 'hand'): string | null {
  if (graded(r, t)) return null
  if (trayCents(t) === 0) return `The tray is empty — ${HOW[input]} of each coin the tag needs.`
  return null
}

/**
 * Never names the answer, and never differs between a tray that was nearly right and one that was
 * not — a miss line that narrowed with the child's attempt would be hot/cold across attempts.
 */
export function missFor(r: CtRound): string {
  if (r.qType === 'place') return 'Not that well. Tenths are the FIRST place after the point, hundredths the second.'
  if (r.qType === 'op') return 'Not quite. Change the well the amount actually names, and see whether the pennies make a whole dime.'
  return 'Not that much. Read the tag place by place — the first digit is dimes, the second is pennies.'
}

/**
 * What the tray prints once the child has committed — HERE rather than in the scene, so the gate can
 * drive the same words the screen shows. This is the fault the chapter it replaces shipped: its
 * verdict lived inside the component, where none of its green tests could reach a word the child
 * reads.
 *
 * ⚠️ ON A CORRECT ROUND IT PRINTS THE BRIDGE — the money form beside the decimal — because that is
 * the payload and by then the child has already given the answer. On a miss it names what they DID
 * lay, which is a true statement about the tray in front of them and never the answer.
 */
export function verdictFor(r: CtRound, t: Tray): { text: string; ok: boolean } {
  const c = trayCents(t)
  if (graded(r, t)) return { text: `${money(r.target)} — that is ${dec(r.target)} of a dollar`, ok: true }
  return { text: `That tray is ${dec(c)} of a dollar`, ok: false }
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
/** The worked example, as data, so the gate drives the same beats the screen plays. */
export interface DemoBeat { say: string; tray: Tray }

export function explainBeats(r: CtRound): DemoBeat[] {
  const d = dimesOf(r.target), p = penniesOf(r.target)
  const empty: Tray = { dimes: 0, pennies: 0 }
  if (r.qType === 'op') {
    return [
      { say: `The tag read ${spokenDec(r.from)}, so that is ${coins(dimesOf(r.from), 'dimes')} and ${coins(penniesOf(r.from), 'pennies')}.`, tray: { dimes: dimesOf(r.from), pennies: penniesOf(r.from) } },
      { say: `It ${r.op === '+' ? 'goes up' : 'comes down'} by ${spokenDec(r.step)}.`, tray: { dimes: dimesOf(r.from), pennies: penniesOf(r.from) } },
      { say: `${p === 0 && r.op === '+' ? 'The pennies fill a whole dime, so they become one. ' : ''}The new tag is ${spokenDec(r.target)} — ${coins(d, 'dimes')} and ${coins(p, 'pennies')}.`, tray: { dimes: d, pennies: p } },
    ]
  }
  if (r.qType === 'place') {
    const other: Well = r.place === 'tenths' ? 'pennies' : 'dimes'
    return [
      { say: `${r.place === 'tenths' ? 'Tenths' : 'Hundredths'} of a dollar. A dime is a tenth; a penny is a hundredth.`, tray: empty },
      { say: `So they all go in the ${r.place === 'tenths' ? 'dimes' : 'pennies'} well, and the ${other} well stays empty.`, tray: { dimes: d, pennies: p } },
      { say: `${spokenDec(r.target)} of a dollar. Written down, that is ${dec(r.target)}.`, tray: { dimes: d, pennies: p } },
    ]
  }
  return [
    { say: `The tag reads ${spokenDec(r.target)} of a dollar.`, tray: empty },
    { say: `The first place after the point is tenths, so that is ${coins(d, 'dimes')}.`, tray: { dimes: d, pennies: 0 } },
    { say: `The second place is hundredths, so ${coins(p, 'pennies')}.`, tray: { dimes: d, pennies: p } },
    { say: `${money(r.target)} on the tray, and ${dec(r.target)} on the tag — the same amount, written two ways.`, tray: { dimes: d, pennies: p } },
  ]
}

/**
 * The rounds Milo works through before the child tries one, and the guided round.
 *
 * ⚠️ THE FIRST DEMO IS A TRAP AMOUNT ON PURPOSE. `0.6` is the whole chapter: six DIMES, no pennies,
 * and a child reading it as "six" lays six pennies. Showing the easy 0.55 first and never showing
 * this one is the hand-picked-examples fault — the case the chapter exists for, avoided because it
 * reads less tidily.
 */
export const DEMO: CtRound[] = [mkMake(60), mkPlace(7, 'hundredths'), mkOp(55, 5, '+')]
export const GUIDED: CtRound = mkMake(30)

// ─── board layout ──────────────────────────────────────────────────────────────────────

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
