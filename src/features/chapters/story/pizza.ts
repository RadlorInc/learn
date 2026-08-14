/**
 * THE PIZZA COUNTER (9–11, skill `fractionsCompare`) — the pure module.
 *
 * Everything the chapter renders and grades from lives here, outside React, because the answering
 * surface is a WEBCAM and a webcam cannot be driven by a gate. The scene is eyeball-only; this file
 * is where the maths, the ladder and the grader are held to account
 * (see __tests__/pizzaCounterFractions.test.ts).
 *
 * THE VERB IS "MATCH IT", AND THE CHILD'S FINGERS ARE A NUMBER OF SLICES. Two pizzas the same size,
 * cut differently; some of theirs is gone; the child takes slices off MINE until it is the same
 * amount. Three readings of one physical act:
 *
 *   match  "Yours is cut in 4 and one is gone. Mine is in 8 — how many of mine?"  → 2   (2/8 = 1/4)
 *   more   "You took 1/2. Mine is in thirds, which never lands exactly on it."    → 2   (2/3 > 1/2)
 *   op     "3 of the 8 are gone, then 2 more go."                                 → 5   (3/8 + 2/8)
 *
 * ⚠️ WHAT THIS REPLACES, AND WHY IT LOOKED FINE. The old FractionForge drew a bar pre-shaded and
 * offered three chips. Two faults, both fatal and both live:
 *   · a NAME round initialised its stage with `revealState`, which carries the verdict — so the pill
 *     under the bar read **3/4** while the card asked "what fraction is shaded?". The answer, printed.
 *   · every COMPARE round drew ONE denominator (`mkCompare(den)` picked a single `den` and two
 *     numerators), so "which is greater, 4/5 or 2/5" is comparing 4 with 2. **The chapter named for
 *     comparing fractions never once asked a child to compare two different-sized parts.**
 * Delete every bar from the screen and all thirty questions still answered — the delete-the-art test,
 * failed by a chapter whose whole subject is the picture.
 *
 * ⚠️ WHY THE VERB IS NOT SHARING, EVEN THOUGH THE WORLD IS A PIZZA. 6–8's SliceShop already owns
 * pizza and owns FIT IT — one whole, one piece size, lay copies until it is full (slice.ts). Same
 * world plus same verb is the same chapter a band later, which is the no-repeat rule that governs
 * backdrops applied to the gesture. What 9–11 genuinely adds is EQUIVALENCE, and equivalence needs
 * what SliceShop structurally cannot show: TWO wholes, cut differently. That is the whole separation
 * — one whole vs two — and every constant below falls out of it.
 *
 * ⚠️ COMPARISON IS NOT ITS OWN ROUND TYPE, DELIBERATELY. "Which is greater?" over two chips is a
 * 50% coin flip, which is the defect docs/story-9-11-rethink.md measures across this band, and a
 * finger count cannot express it anyway. It is instead what every `match` round REVEALS: it takes
 * two of my eighths to make one of your quarters, so an eighth is smaller — seen, not asked. `more`
 * then asks the comparison as a NUMBER, on pairs where no exact match exists at all.
 *
 * ⚠️ NOTHING IS TAKEN OFF MY PIZZA UNTIL THE CHILD COMMITS. A board that removed slices live as the
 * fingers changed would let a child sweep 1, 2, 3 … and stop when the two gaps looked equal — the
 * repeatable-commit oracle that got an area chapter deleted and a division chapter deleted after it,
 * and here it would be worse, because eyeballing two gaps IS the answer. The explore beat reflows
 * live; nothing is asked there.
 *
 * ⚠️ NO ANSWER IS EVER ZERO, and that is worth one line of arithmetic to keep true. FactorLab has to
 * distinguish a fist (an answer: "nothing fits, it is prime") from a lowered hand; here a fist means
 * nothing, so `hands === 0` blocking is the only guard needed and the tap pad starts at 1.
 *
 * ⚠️ BOTH PIZZAS ARE THE SAME SIZE, always, and it is said out loud in the copy. Two different-sized
 * pizzas make their fractions incomparable, which would make every round of this chapter a lie.
 */
import { rint, pick } from '@/core/rand'
import { fitBand } from './preteen/band'

/** The answer surface is two hands. Nothing may require more than this. */
export const MAX_FINGERS = 10

/**
 * THE DAILY ANCHOR (docs/story-9-11-ar-plan.md §6) — a pizza shared with friends, which is the one
 * fraction context every child in this band has actually argued about.
 *
 * ⚠️ UNLIKE THE OTHER 9–11 CHAPTERS, THE WORLD *IS* THE ANCHOR HERE RATHER THAN A SIMILE IN THE
 * BRIEFING, and that is the recorded exception rather than a drift. The band's rule is *anchor the
 * explanation, keep the world* because a re-theme is usually a skin over a manipulative (a desk over
 * a unit). A pizza is not a skin over a fraction — cutting one IS partitioning a whole, so the
 * anchor and the manipulative are the same object, exactly as dollar denominations ARE base ten in
 * The Fundraiser. So every per-round string may name slices, because slices are what is drawn.
 */
export const ANCHOR = 'Three friends share a pizza and the slices are big; four friends and they are smaller.'

/**
 * Every answer the TAP path offers — the same span two hands can hold.
 *
 * ⚠️ Derived rather than typed out, because the two inputs must offer the SAME answers: a pad
 * narrower than the hand makes rounds unanswerable by tap that are answerable by camera, a defect
 * only one of the two children would ever meet. It starts at 1 because no round accepts 0 (see the
 * header) — a permanently-wrong button is a distractor the camera path does not have.
 */
export const padChoices = (): number[] => Array.from({ length: MAX_FINGERS }, (_, i) => i + 1)

// ─── words ─────────────────────────────────────────────────────────────────────────────
export const frac = (n: number, d: number) => `${n}/${d}`
export const slices = (n: number) => `${n} slice${n === 1 ? '' : 's'}`

// ─── rounds ────────────────────────────────────────────────────────────────────────────
export type QType = 'match' | 'more' | 'op'
export type Tier = 1 | 2 | 3

export interface PzRound {
  qType: QType
  /** MY pizza — the one the child takes slices from. */
  den: number
  /** MY pizza's slices already gone when the round opens. `op` only; 0 otherwise. */
  gone: number
  /** `op` only: how many more go ('+') or come back ('−'). */
  step: number
  op: '+' | '−' | null
  /** THEIR order, already served. `match`/`more` only; 0 on `op`. */
  refDen: number
  refNum: number
  tag: string
  /**
   * ⚠️ THREE ZONES, NOT ONE SENTENCE (docs/teen-12-14-math-audit.md §1 — the clarity spec).
   * `prompt` says what the numbers ARE and the rule that applies, in plain language with no UI
   * verbs; the BOARD is the math hero; `instruction` is the one verb-led action, in its own chip.
   */
  prompt: string
  /**
   * ⚠️ ZONE 3 IS THE ONLY ZONE THAT KNOWS HOW THE CHILD ANSWERS, so the round stores the stem and
   * the gesture is appended per input by `instructionFor` / `sayFor`. Baking "hold up that many
   * fingers" into the round tells a tap-path child to do something they cannot.
   */
  work: string
  spoken: string
  /** EVERY finger count graded correct. Never contains 0. */
  accepts: number[]
}

/** How an answer is given, per input. The ONE place either gesture is named. */
export type Answering = 'hand' | 'tap'
const HOW: Record<Answering, string> = {
  hand: 'hold up that many fingers',
  tap: 'tap that many',
}

/** Zone 3 — the one verb-led action, in the wording of the surface actually on screen. */
export const instructionFor = (r: PzRound, input: Answering): string => `${r.work} ${HOW[input]}.`
/** What Milo says — the same action clause, behind this round's spoken context. */
export const sayFor = (r: PzRound, input: Answering): string => `${r.spoken} ${HOW[input]}.`

/** True when `den` can express `refNum/refDen` exactly — i.e. when a `match` round is possible. */
export const exactly = (refNum: number, refDen: number, den: number) => (den * refNum) % refDen === 0

/** The fewest of MY slices that comes to strictly more than theirs. */
export const fewestBeating = (refNum: number, refDen: number, den: number) =>
  Math.floor((den * refNum) / refDen) + 1

export function mkMatch(refDen: number, refNum: number, den: number): PzRound {
  const k = (refNum * den) / refDen
  const context =
    `Yours is cut into ${refDen} — ${slices(refNum)} gone. Mine is the same size, cut into ${den}.`
  const work = 'Work out how many of MINE make the same amount, then'
  return {
    qType: 'match', den, gone: 0, step: 0, op: null, refDen, refNum,
    tag: `Same amount`,
    prompt: context, work, spoken: `${context} ${work}`,
    accepts: [k],
  }
}

export function mkMore(refDen: number, refNum: number, den: number): PzRound {
  const context =
    `You took ${frac(refNum, refDen)}. Mine is the same size, cut into ${den} — and no number of my slices lands exactly on yours.`
  const work = 'Work out the FEWEST of mine that beats yours, then'
  return {
    qType: 'more', den, gone: 0, step: 0, op: null, refDen, refNum,
    tag: 'Beat it',
    prompt: context, work, spoken: `${context} ${work}`,
    accepts: [fewestBeating(refNum, refDen, den)],
  }
}

export function mkOp(den: number, gone: number, step: number, op: '+' | '−'): PzRound {
  const context = op === '+'
    ? `One pizza cut into ${den}. ${slices(gone)} went, and then ${slices(step)} more.`
    : `One pizza cut into ${den}. ${slices(gone)} went, and then ${slices(step)} came back.`
  const work = 'Work out how many slices are gone now, then'
  return {
    qType: 'op', den, gone, step, op, refDen: 0, refNum: 0,
    tag: op === '+' ? 'More gone' : 'Some back',
    prompt: context, work, spoken: `${context} ${work}`,
    accepts: [op === '+' ? gone + step : gone - step],
  }
}

// ─── the ladder ────────────────────────────────────────────────────────────────────────
/**
 * `match` pairs — [their cut, my cut], where mine is a MULTIPLE of theirs so an exact answer exists.
 *
 * ⚠️ THE TIERS GROW THE MULTIPLIER, NOT JUST THE NUMBERS. L1 is doubling only, which is the one
 * relationship a child can see without arithmetic (twice the cuts, half the size, so twice as many);
 * L2 adds ×3 and ×4; L3 adds the twelfths, where the doubling reflex stops working.
 */
export const MATCH_PAIRS: Record<Tier, ReadonlyArray<readonly [number, number]>> = {
  1: [[2, 4], [3, 6], [4, 8]],
  2: [[2, 4], [2, 6], [3, 6], [4, 8], [2, 8]],
  3: [[2, 6], [2, 8], [3, 6], [4, 8], [3, 9], [5, 10], [3, 12], [4, 12], [6, 12]],
}
/**
 * `more` pairs — [their cut, my cut], where SOME numerator lands between two of my slices.
 *
 * ⚠️ NOT EVERY NUMERATOR ON THESE PAIRS IS INEXACT, so the numerator is filtered at generation
 * rather than assumed. [4,6] looks like a safe non-multiple and 2/4 IS exactly 3/6 — a `more` round
 * on it would claim in its own prompt that nothing lands exactly, which is false.
 */
export const MORE_PAIRS: Record<Tier, ReadonlyArray<readonly [number, number]>> = {
  1: [],
  2: [[2, 3], [3, 4], [4, 3], [2, 5]],
  3: [[2, 3], [3, 4], [4, 3], [2, 5], [5, 2], [3, 8], [8, 3], [4, 6], [6, 4], [3, 5], [5, 3]],
}
/** `op` — the pizza's cut, per tier. Both operands and the answer stay inside two hands. */
const OP_DENS: Record<Tier, readonly number[]> = { 1: [], 2: [4, 6, 8], 3: [6, 8, 10] }

const POOL: Record<Tier, QType[]> = {
  // ⚠️ L1 IS MATCH ONLY. Equivalence is the payload, `more` needs a comparison a child cannot yet
  // make, and `op` on this board is arithmetic rather than fractions. Coverage (below) is what
  // guarantees the other two are met before the run can end early.
  1: ['match'],
  2: ['match', 'match', 'more', 'op'],
  3: ['match', 'more', 'more', 'op'],
}

/**
 * `asked` is the coverage bookkeeping SkillBeat feeds back — the readings already served this run.
 *
 * ⚠️ IGNORING IT IS NOT HARMLESS. The beat declares `coverage`, so the mastery exit is withheld
 * until all three readings have been asked; a generator that keeps rolling dice simply denies a
 * strong child the early finish. Deliberate while a gap exists, RANDOM once it closes — hardest-first
 * for ever would lock the chapter onto `more` and destroy the variety coverage exists to protect.
 *
 * ⚠️ AND `more`/`op` DO NOT EXIST AT L1, so a child who never leaves the easiest tier can never
 * complete coverage. That is the same shape FactorLab's prime has and it is harmless in the same
 * way: mastery needs the TOP tier anyway, so a child at L1 was never going to exit early. The run
 * still ends at ten rounds.
 */
export function makeRound(d: Tier, asked: readonly string[] = []): PzRound {
  const pool = POOL[d]
  const unmet = pool.filter(t => !asked.includes(t))
  const t = pick(unmet.length ? unmet : pool)

  if (t === 'op') {
    const den = pick(OP_DENS[d] as number[])
    const op: '+' | '−' = d === 2 ? '+' : (Math.random() < 0.5 ? '+' : '−')
    if (op === '+') {
      /**
       * gone ≥ 1, step ≥ 1, and the total stays on the pizza — and inside two hands.
       *
       * ⚠️ THIS CLAMP IS WHAT HOLDS THE TEN-FINGER CEILING FOR `op`, NOT THE POOL. Measured by
       * mutation: widening OP_DENS to a 12-cut is INERT while this line stands, and dropping this
       * line is caught. So do not read a narrow pool as the guard — a wider one is safe and an
       * unclamped `rint` is not.
       */
      const total = rint(2, Math.min(den, MAX_FINGERS))
      const gone = rint(1, total - 1)
      return mkOp(den, gone, total - gone, '+')
    }
    // A subtraction has to leave at least one slice gone, or the answer is 0.
    const gone = rint(2, Math.min(den, MAX_FINGERS))
    return mkOp(den, gone, rint(1, gone - 1), '−')
  }

  if (t === 'more') {
    const [refDen, den] = pick(MORE_PAIRS[d] as Array<readonly [number, number]>)
    const nums = numeratorsFor(refDen, den, false)
    return mkMore(refDen, pick(nums), den)
  }

  const [refDen, den] = pick(MATCH_PAIRS[d] as Array<readonly [number, number]>)
  return mkMatch(refDen, pick(numeratorsFor(refDen, den, true)), den)
}

/**
 * The numerators a pair can legally use.
 *
 * ⚠️ IT IS FILTERED, NOT ASSUMED, AND BOTH FILTERS ARE LOAD-BEARING. `exact` picks whether this is
 * a `match` (their amount IS expressible in my slices) or a `more` (it is not) — get it wrong and a
 * `more` round's own prompt tells the child a lie. The finger ceiling then drops anything two hands
 * could not show, which is what keeps every round answerable.
 */
export function numeratorsFor(refDen: number, den: number, exact: boolean): number[] {
  const out: number[] = []
  for (let n = 1; n < refDen; n++) {
    if (exactly(n, refDen, den) !== exact) continue
    const ans = exact ? (n * den) / refDen : fewestBeating(n, refDen, den)
    /**
     * ⚠️ A `more` ROUND MAY NOT ANSWER "ALL OF IT", AND THE GATE FOUND THIS RATHER THAN A DRIVE.
     * Beating 3/4 with halves takes 2 of 2 — the whole pizza — which on screen is not a comparison
     * at all, it is an empty plate; and with only two counts on offer it is a coin flip besides.
     * `match` cannot hit this (its answer is `refNum × k` with k ≥ 2, so it is always short of the
     * whole), and an `op` round genuinely may end with the whole pizza gone, which is a true and
     * countable thing to show. So the ceiling is one slice lower for `more` alone.
     */
    const roof = exact ? Math.min(den, MAX_FINGERS) : Math.min(den - 1, MAX_FINGERS)
    if (ans >= 1 && ans <= roof) out.push(n)
  }
  return out
}

/**
 * What MY pizza shows while the question is still open.
 *
 * ⚠️ THIS IS THE ANTI-ORACLE RULE, AND IT LIVES HERE SO A GATE CAN DRIVE IT RATHER THAN GREP FOR
 * IT. On a `match` or `more` round it MUST be 0 — my pizza whole, its cuts visible — because two
 * gaps side by side can be compared by eye, so a board that showed a gap before the commit would let
 * a child sweep counts until the two matched, having judged nothing. An `op` round is different in
 * kind: its opening slices are GIVEN in the question, not guessed, so hiding them would hide half
 * the sum.
 */
export const openingTake = (r: PzRound) => (r.qType === 'op' ? r.gone : 0)

// ─── grading ───────────────────────────────────────────────────────────────────────────
export const graded = (r: PzRound, fingers: number) => r.accepts.includes(fingers)

/**
 * A count that is neither right nor a real attempt — redirect instead of scoring it, the same call
 * the colouring chapter makes for a tap that lands on the ink.
 *
 * ⚠️ A COUNT BIGGER THAN THE PIZZA IS NOT A WRONG ANSWER, IT IS AN IMPOSSIBLE ONE. Ten fingers held
 * up at a pizza cut into six is a child who has not yet noticed how many slices there are; grading it
 * spends one of their ten rounds on a fact the board is showing them. It returns null — i.e. grades
 * normally — for everything that IS expressible, so a genuinely wrong count still costs a mark.
 */
export function nudgeFor(r: PzRound, fingers: number, input: Answering = 'hand'): string | null {
  if (graded(r, fingers)) return null
  if (fingers <= 0) return `Show me at least one slice — ${HOW[input]}.`
  /**
   * ⚠️ IT MUST NOT SAY HOW MANY SLICES THERE ARE. An `op` round can legitimately end with the whole
   * pizza gone, so `den` IS the answer on some rounds — and this is shown exactly when the child has
   * overshot, i.e. to the child least able to ignore it. The board is already showing them the
   * slices; the redirect only has to point.
   */
  if (fingers > r.den) return 'That is more slices than the pizza has. Count them and try again.'
  return null
}

/**
 * Never names the answer, and never differs between a round the child got nearly right and one they
 * did not — a miss line that narrowed with the child's guess would be hot/cold across attempts.
 */
export function missFor(r: PzRound): string {
  if (r.qType === 'match') return 'Not the same amount. Look at how many of my slices it takes to cover just ONE of theirs.'
  if (r.qType === 'more') return 'Not yet — it has to BEAT theirs, and it has to be the fewest slices that does.'
  return 'Not quite. Count the slices that have gone, then count the change.'
}

/**
 * What the board prints once the child has committed — HERE rather than in the scene, so the gate
 * can drive the same words the screen shows. This is the fault the chapter it replaces shipped: its
 * verdict lived inside the component, where none of forty green tests could reach a word the child
 * reads, and it printed the answer before the question was asked.
 *
 * ⚠️ IT MUST NEVER ASSERT SOMETHING THE BOARD CONTRADICTS, and it may never name the answer on a
 * miss. On a correct `match` it prints the equivalence itself — that IS the payload, and by then the
 * child has already given it.
 */
export function verdictFor(r: PzRound, fingers: number): { text: string; ok: boolean } {
  const ok = graded(r, fingers)
  if (r.qType === 'op') {
    const mine = frac(r.gone, r.den), theirs = frac(r.step, r.den)
    return ok
      ? { text: `${mine} ${r.op} ${theirs} = ${frac(fingers, r.den)}`, ok }
      : { text: `${frac(fingers, r.den)} is not what is gone`, ok }
  }
  const theirs = frac(r.refNum, r.refDen), mine = frac(fingers, r.den)
  if (ok) return { text: r.qType === 'match' ? `${mine} = ${theirs}` : `${mine} beats ${theirs}`, ok }
  // Direction is the physical truth of the two gaps on screen, and it is stated AFTER the commit —
  // a preview of it would be the hot/cold rule broken.
  const lhs = fingers * r.refDen, rhs = r.refNum * r.den
  if (lhs === rhs) return { text: `${mine} does equal ${theirs} — but I asked for more`, ok }
  return { text: lhs < rhs ? `${mine} is LESS than ${theirs}` : `${mine} is MORE than ${theirs}`, ok }
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
/**
 * The worked example, as data, so the gate drives the same beats the screen plays.
 * `take` is how many of MY slices the board has taken at that beat.
 */
export interface Beat { say: string; take: number }

export function explainBeats(r: PzRound): Beat[] {
  if (r.qType === 'op') {
    const end = r.accepts[0]
    return [
      { say: `${slices(r.gone)} of the ${r.den} are already gone.`, take: r.gone },
      { say: r.op === '+' ? `Now ${slices(r.step)} more go.` : `Now ${slices(r.step)} come back.`, take: end },
      { say: `${frac(r.gone, r.den)} ${r.op} ${frac(r.step, r.den)} makes ${frac(end, r.den)}. The slices are all the same size, so only the top number moves.`, take: end },
    ]
  }
  const k = r.accepts[0]
  const theirs = frac(r.refNum, r.refDen)
  if (r.qType === 'match') {
    return [
      { say: `Their pizza is cut into ${r.refDen}, and ${theirs} of it is gone.`, take: 0 },
      { say: `Mine is the same size, cut into ${r.den}. More cuts, so each slice is smaller.`, take: 0 },
      { say: `One of mine is not enough.`, take: 1 },
      { say: `${slices(k)} of mine come to exactly the same amount. ${frac(k, r.den)} is the same as ${theirs}.`, take: k },
    ]
  }
  return [
    { say: `They took ${theirs}. Mine is cut into ${r.den}.`, take: 0 },
    { say: `${frac(k - 1, r.den)} is still less than theirs.`, take: k - 1 },
    { say: `${frac(k, r.den)} beats it — and it is the fewest that does.`, take: k },
  ]
}

/** The rounds Milo works through before the child tries one, and the guided round. */
export const DEMO: PzRound[] = [mkMatch(4, 1, 8), mkMore(2, 1, 3), mkOp(8, 3, 2, '+')]
export const GUIDED: PzRound = mkMatch(2, 1, 4)

// ─── board layout ──────────────────────────────────────────────────────────────────────
/**
 * The band the board gets, in pixels — HERE rather than in the scene so a sweep can drive the same
 * arithmetic the layout uses. A placement lives in CSS and a gate cannot see it; a band is a number
 * and it can. Mirrors `benchBand` in factors.ts, including the reason its clamp is on `top`:
 *
 * ⚠️ A FLOOR ON THE BAND BREAKS THE RESERVE IT LIVES INSIDE. `Math.max(90, …)` hands back 90 when
 * the question card has wrapped far enough down, and the board is then drawn straight into the
 * controls — over the note pill and the answer row. Clamping `top` instead slides the board UP under
 * the question card, which is text the child has already read, rather than DOWN onto targets they
 * have to hit.
 */
export const TOP_BAND = (short: boolean) => (short ? 104 : 146)
export const BOT_BAND = (short: boolean) => (short ? 112 : 152)
/** The explore beat stacks its "I've got it" button on its own line above the readout. */
export const ACTION_ROW = (short: boolean) => (short ? 47 : 56)

export function boardBand(vh: number, short: boolean, promptBottom = 0, extraBot = 0) {
  return fitBand(vh, Math.max(TOP_BAND(short), promptBottom + (short ? 8 : 12)), BOT_BAND(short) + extraBot)
}
