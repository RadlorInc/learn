/**
 * FACTORS & MULTIPLES (9–11, skill `factorsMultiples`) — the pure module.
 *
 * Everything the AR chapter renders and grades from lives here, outside React, because the
 * chapter's answering surface is a WEBCAM and a webcam cannot be driven by a gate. The scene is
 * eyeball-only; this file is where the maths, the question ladder and the grader are held to
 * account (see __tests__/factorLabAr.test.ts).
 *
 * THE GESTURE: the child's FINGERS ARE THE DIVISOR. Milo puts n units on the bench, the child
 * holds up a number of rows, and the bench deals them. One physical act, four readings:
 *
 *   evenOdd   "How many pairs can you make from 15?"       → 7, and one is stranded
 *   multiple  "How many 5s make 35?"                       → 7
 *   factor    "Split 12 into equal rows — how many rows?"  → ANY of 2·3·4·6
 *   prime     same prompt, and nothing fits                → a FIST
 *
 * ⚠️ THE PAIR TEST ASKS FOR THE PAIRS, NOT FOR "EVEN OR ODD", and that is the point of it.
 * "How many are left over?" is 0 or 1 — a coin flip, i.e. the very defect this rebuild exists to
 * remove (the old chapter's even/odd and prime rounds were both 50%). Asking for the pair COUNT
 * makes the child halve the number, and even-or-odd then falls out of the stranded unit the bench
 * shows on commit — a consequence they watch rather than a label they recall. The floor across
 * every type is now 1-in-11.
 *
 * ⚠️ `factor` and `prime` share ONE prompt on purpose. If a prime round announced itself the
 * fist would be free, so the child has to find out whether a split exists — which is what
 * primeness IS. `qType` still distinguishes them so `coverage` can guarantee a prime is asked.
 *
 * ⚠️ THE TEN-FINGER CEILING IS AN INVARIANT, NOT A HOPE. Every round must have at least one
 * accepted answer in 0..10 or it is unanswerable. It holds for every n ≤ 100 because the
 * smallest factor of a composite is ≤ √n — so this RAISES the old chapter's range (40) rather
 * than narrowing it. The gate sweeps it; do not widen a tier without re-running that sweep.
 *
 * ⚠️ 1 IS NOT A SPLIT. One row always "works", so accepting it would make every factor round
 * winnable without looking at the number. It is a NUDGE, not a miss (`nudgeFor`) — the same
 * call the colouring chapter makes for a tap that lands on ink.
 */
import { rint, pick } from '@/core/rand'
import { fitBand } from './preteen/band'

/** The answer surface is two hands. Nothing may require more than this. */
export const MAX_FINGERS = 10

/**
 * THE DAILY ANCHOR (docs/story-9-11-ar-plan.md §5) — arranging desks in equal rows for an exam.
 * Every child in this band has been moved into rows for one, and has watched the last few desks
 * not fit.
 *
 * ⚠️ IT LIVES IN THE EXPLANATION AND NOWHERE ELSE, which is the band-wide rule and not a hedge.
 * Every per-round string names what is actually DRAWN — parts on a bench — because writing "desks"
 * over a picture of neon units is this repo's oldest copy fault. The gate pins both halves.
 *
 * ⚠️ AND THE WORLD ITSELF IS NOT RE-THEMED, deliberately. The plan's own §5 says *anchor the
 * explanation, keep the world*; The Fundraiser is the one recorded exception and it earned it
 * because dollar denominations ARE base ten — the anchor and the manipulative were the same
 * object. A desk is a skin over a unit, and three things break if it is more than a simile: the
 * pair test has no desk story, `multiple`'s crate would collapse into `factor`'s row (35 desks,
 * "5" right on one and wrong on the other, and `coverage` guarantees the child meets both), and a
 * split round reaching 63 with `multiple` reaching 100 makes any named room a lie on some rounds.
 */
export const ANCHOR = 'A hall set out for an exam: the desks go in equal rows, none left over.'

/**
 * Every answer the TAP path offers — the same span two hands can hold, `0` being the fist.
 *
 * ⚠️ It is derived rather than typed out because the two input paths must offer the SAME answers:
 * a pad narrower than the hand would make rounds unanswerable by tap that are answerable by camera,
 * which is a defect only one of the two children would ever meet. The gate sweeps every round the
 * generator can draw against this list.
 */
export const padChoices = (): number[] => Array.from({ length: MAX_FINGERS + 1 }, (_, i) => i)

// ─── maths (moved here from the deleted FactorsLesson, its only consumer) ───────────────
export function isPrime(n: number): boolean {
  if (n < 2) return false
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false
  return true
}
export function factorsOf(n: number): number[] {
  const out: number[] = []
  for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i)
  return out
}
/** Row counts a child could actually show: a real split, more than one row, within two hands. */
export function showableRows(n: number): number[] {
  return factorsOf(n).filter(f => f >= 2 && f <= MAX_FINGERS && f < n)
}


// ─── rounds ────────────────────────────────────────────────────────────────────────────
export type QType = 'evenOdd' | 'multiple' | 'factor' | 'prime'
export type Tier = 1 | 2 | 3

export interface FlRound {
  qType: QType
  /** the units on the bench */
  n: number
  /** `multiple` only: the step being counted in. 0 otherwise. */
  base: number
  tag: string
  /**
   * ⚠️ THREE ZONES, NOT ONE SENTENCE (docs/teen-12-14-math-audit.md §1 — the clarity spec).
   * `context` says what the numbers ARE and the rule that applies, in plain language with no UI
   * verbs; the BENCH is the math hero; `instruction` is the one verb-led action, in its own chip.
   * The old single `prompt` fused all three ("Split 13 into equal rows. How many rows? Make a
   * fist if nothing fits.") and that run-on is precisely what a struggling child cannot parse.
   */
  prompt: string
  /**
   * ⚠️ ZONE 3 IS THE ONLY ZONE THAT KNOWS HOW THE CHILD ANSWERS, so the round stores the stem and
   * the gesture is appended per input by `instructionFor` / `sayFor`. Baking "hold up that many
   * fingers" into the round told a tap-path child to do something they cannot — the same fault the
   * 12–14 audit found in nine chapters at once ("crank the gear" with no crank on screen).
   * The stems end mid-sentence on purpose ("…, then"); nothing else in the round names a gesture.
   */
  work: string
  spoken: string
  /** Whether this round's answer can be "none fit" — i.e. whether the fist clause applies. */
  fist: boolean
  /** EVERY finger count graded correct. A fist is 0. */
  accepts: number[]
}

/** How an answer is given, per input. The ONE place either gesture is named. */
export type Answering = 'hand' | 'tap'
const HOW: Record<Answering, string> = {
  hand: 'hold up that many fingers',
  tap: 'tap that many',
}
const NONE_FIT: Record<Answering, string> = {
  hand: 'Make a fist if none fit.',
  tap: 'Tap the fist if none fit.',
}

/** Zone 3 — the one verb-led action, in the wording of the surface actually on screen. */
export const instructionFor = (r: FlRound, input: Answering): string =>
  `${r.work} ${HOW[input]}.${r.fist ? ` ${NONE_FIT[input]}` : ''}`

/** What Milo says — the same action clause, behind this round's spoken context. */
export const sayFor = (r: FlRound, input: Answering): string =>
  `${r.spoken} ${HOW[input]}.${r.fist ? ` ${NONE_FIT[input]}` : ''}`

/**
 * The split wording, shared by `factor` and `prime` so the type cannot leak the answer.
 * ⚠️ "Some numbers will not split at all" is said on EVERY split round — it teaches that the fist
 * is a real possibility without telling the child anything about the round in front of them.
 */
const splitContext = (n: number) =>
  `You have ${n} parts. They go out in equal rows — every row the same length, nothing left over. Some numbers will not split at all.`
const SPLIT_WORK = 'Work out how many rows fit, then'

/** n ≤ 2·MAX_FINGERS + 1, so the pair count is always showable on two hands. */
export function mkEvenOdd(n: number): FlRound {
  return {
    qType: 'evenOdd', n, base: 2, tag: 'Pair test',
    prompt: `You have ${n} parts. They leave the bench in pairs — two parts together.`,
    work: 'Work out how many pairs you can make, then',
    spoken: `You have ${n} parts, and they leave in pairs. Work out how many pairs you can make, then`,
    fist: false,
    accepts: [Math.floor(n / 2)],
  }
}
export function mkMultiple(base: number, k: number): FlRound {
  return {
    qType: 'multiple', n: base * k, base, tag: `Counting in ${base}s`,
    prompt: `You have ${base * k} parts. A crate holds ${base}, and every crate is filled right to the top.`,
    work: 'Work out how many crates it takes, then',
    spoken: `You have ${base * k} parts and a crate holds ${base}. Work out how many crates it takes, then`,
    fist: false,
    accepts: [k],
  }
}
export function mkSplit(n: number): FlRound {
  const rows = showableRows(n)
  return {
    qType: rows.length ? 'factor' : 'prime', n, base: 0,
    tag: `Splitting ${n}`,
    prompt: splitContext(n),
    work: SPLIT_WORK,
    spoken: `${splitContext(n)} ${SPLIT_WORK}`,
    fist: true,
    accepts: rows.length ? rows : [0],
  }
}

/** n values whose split round is worth asking: a clean composite, or a prime for the fist. */
export const COMPOSITES: Record<Tier, number[]> = {
  1: [6, 8, 9, 10, 12],
  2: [12, 14, 15, 16, 18, 20, 21, 24],
  3: [24, 27, 28, 30, 32, 35, 36, 42, 45, 48, 56, 63],
}
export const PRIMES: Record<Tier, number[]> = {
  1: [5, 7],
  2: [7, 11, 13, 17, 19],
  3: [13, 17, 19, 23, 29, 31, 37, 41, 43],
}

const POOL: Record<Tier, QType[]> = {
  1: ['evenOdd', 'multiple', 'factor'],
  2: ['multiple', 'factor', 'factor', 'prime'],
  // ⚠️ NOT half primes. L3 grows the NUMBERS (splitting 63 needs tables 12 does not), it does not
  // grow the share of one reading — a run that is mostly fists is as repetitive as one that was
  // mostly pair tests, just at the other end.
  3: ['multiple', 'factor', 'factor', 'prime'],
}

/**
 * `asked` is the coverage bookkeeping SkillBeat feeds back — the readings already served this run.
 *
 * ⚠️ IGNORING IT IS NOT HARMLESS. The beat declares `coverage`, so the mastery exit is withheld
 * until all four readings have been asked; if the generator keeps rolling dice, a strong child is
 * simply denied the early finish and marched through all ten rounds instead. Deliberate while a
 * gap exists, RANDOM once it closes — hardest-first for ever would lock the chapter onto primes
 * and destroy the variety coverage exists to protect.
 */
export function makeRound(d: Tier, asked: readonly string[] = []): FlRound {
  const pool = POOL[d]
  const unmet = pool.filter(t => !asked.includes(t))
  const t = pick(unmet.length ? unmet : pool)
  // 21 is the hard ceiling: 10 pairs plus a stranded one. Tiers move the floor, not the roof.
  // Only L1/L2 draw a pair test — it is the easiest reading, and L3 is splits and multiples.
  if (t === 'evenOdd') return mkEvenOdd(d === 1 ? rint(4, 11) : rint(8, 21))
  if (t === 'multiple') {
    const base = pick(d === 1 ? [2, 5] : d === 2 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10])
    return mkMultiple(base, rint(2, d === 1 ? 6 : MAX_FINGERS))
  }
  return mkSplit(pick(t === 'prime' ? PRIMES[d] : COMPOSITES[d]))
}

// ─── grading ───────────────────────────────────────────────────────────────────────────
export const graded = (r: FlRound, fingers: number) => r.accepts.includes(fingers)

/**
 * A count that is neither right nor a real attempt — redirect instead of scoring it.
 * Returns null when `fingers` is a genuine answer (right or wrong) and must be graded.
 */
export function nudgeFor(r: FlRound, fingers: number, input: Answering = 'hand'): string | null {
  if (graded(r, fingers)) return null
  if ((r.qType === 'factor' || r.qType === 'prime') && fingers === 1) {
    return 'One row is the whole thing — that is not a split. Try more rows.'
  }
  /**
   * ⚠️ THE MIRROR OF THE RULE ABOVE, AND IT WAS MISSING — this shipped. `showableRows` refuses
   * `f === n` in the GENERATOR (n rows of one is every part on its own, not a split), and nothing
   * refused it at the ANSWER. So a child holding up 6 on a round about 6 was graded wrong while
   * the bench drew six clean rows with NO GAP and the miss line said "that leaves a gap" — the
   * picture contradicting the words, which is worse than a wrong answer. Four of the five tier-1
   * split values are ≤ MAX_FINGERS, so it is met in the first minutes of the chapter.
   */
  if ((r.qType === 'factor' || r.qType === 'prime') && fingers === r.n) {
    return 'One in each row is every part on its own — that is not a split either. Try fewer rows.'
  }
  if (r.qType === 'multiple' && fingers === 0) return `Count up in ${r.base}s and ${HOW[input]} to say how many you need.`
  return null
}

/** Never names the answer, and never differs between a factor round and a prime one. */
export function missFor(r: FlRound): string {
  if (r.qType === 'evenOdd') return 'Not the right number of pairs. Take them two at a time and count the pairs.'
  if (r.qType === 'multiple') return `Not yet — keep counting up in ${r.base}s.`
  return 'That leaves a gap. Try a different number of rows, or a fist if nothing fits.'
}

/**
 * What the bench prints once the child has committed — HERE rather than in the scene, so the gate
 * can drive the same string the screen shows. Nothing else in this chapter could see it.
 *
 * ⚠️ IT MUST NEVER ASSERT SOMETHING THE BENCH CONTRADICTS. Every wrong answer used to print
 * `${stranded} left over`, and a deal into as many rows as there are parts strands NOTHING — so
 * the child read "0 left over" over an arrangement with no gap in it. The split case is caught by
 * `nudgeFor` above and never reaches here; the other two readings can still land on an equal
 * arrangement that is simply not the one asked for, and that is what this last branch says.
 *
 * ⚠️ AND IT MAY NOT NAME WHAT THE ROWS DO HOLD. On a `multiple` round "each row holds 7" IS the
 * answer, handed over — so it names only the thing that is wrong.
 */
export function verdictFor(r: FlRound, fingers: number): { text: string; ok: boolean } {
  const ok = graded(r, fingers)
  if (fingers === 0) return { text: ok ? `${r.n} is PRIME` : 'Something does fit', ok }
  if (ok) {
    return {
      text: r.qType === 'evenOdd'
        ? `${fingers} pairs — ${r.n} is ${r.n % 2 ? 'ODD' : 'EVEN'}`
        : `${r.n} = ${fingers} × ${r.n / fingers}`,
      ok,
    }
  }
  const { stranded } = deal(r.n, fingers)
  if (stranded === 0) return { text: 'No gaps — but not what I asked for', ok }
  /**
   * ⚠️ AND THE LEFTOVER COUNT CAN BE THE ANSWER BY COINCIDENCE. Eight rows out of a pair test of
   * 15 strands SEVEN, and seven pairs is what was asked for — so the count of what did not fit
   * prints the answer. The same rule the miss line already holds to; it just reaches the verdict
   * through arithmetic instead of through wording.
   */
  return { text: r.accepts.includes(stranded) ? 'Some are left over' : `${stranded} left over`, ok }
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
/**
 * The worked example, as data, so the gate drives the same beats the screen plays.
 * `rows` is what the bench shows; `leftover` marks the stranded unit (evenOdd only).
 */
export interface Beat { say: string; rows: number; leftover: boolean }

export function explainBeats(r: FlRound): Beat[] {
  if (r.qType === 'evenOdd') {
    const odd = r.n % 2 === 1
    const pairs = r.accepts[0]
    return [
      { say: `Here are ${r.n} units.`, rows: 0, leftover: false },
      { say: `Take them two at a time and count the pairs.`, rows: pairs, leftover: false },
      odd
        ? { say: `${pairs} pairs, and one stranded with no partner. A leftover means ${r.n} is odd.`, rows: pairs, leftover: true }
        : { say: `${pairs} pairs, and every one has a partner. No leftover means ${r.n} is even.`, rows: pairs, leftover: false },
    ]
  }
  if (r.qType === 'multiple') {
    const k = r.accepts[0]
    return [
      { say: `We are counting in ${r.base}s.`, rows: 0, leftover: false },
      // ⚠️ CRATES, NOT ROWS. The prompt for this reading says crates and the demo said rows, so the
      // teaching and the round named two different things — and once `factor` is also about rows,
      // the two readings sound like one question with two different graders.
      { say: `${r.base}, and again, and again — each crate holds ${r.base}.`, rows: k, leftover: false },
      { say: `It took ${k} crates to reach ${r.n}. So ${k} ${r.base}s make ${r.n}.`, rows: k, leftover: false },
    ]
  }
  const rows = r.accepts[0]
  if (r.qType === 'prime') {
    return [
      { say: `Here are ${r.n} units. Can we split them into equal rows?`, rows: 0, leftover: false },
      { say: `Two rows leaves a gap.`, rows: 2, leftover: false },
      { say: `Three rows leaves a gap too. Every split we try leaves a gap.`, rows: 3, leftover: false },
      { say: `Nothing fits, so we make a fist. ${r.n} is prime.`, rows: 0, leftover: false },
    ]
  }
  return [
    { say: `Here are ${r.n} units. Can we split them into equal rows?`, rows: 0, leftover: false },
    { say: `Let's try ${rows} rows.`, rows, leftover: false },
    { say: `They fill up with no gaps. ${rows} is a factor of ${r.n} — ${r.n} is ${rows} times ${r.n / rows}.`, rows, leftover: false },
  ]
}

/** The two rounds Milo works through before the child tries one, and the guided round. */
export const DEMO: FlRound[] = [mkEvenOdd(7), mkSplit(12), mkSplit(13)]
export const GUIDED: FlRound = mkSplit(15)

// ─── bench layout ──────────────────────────────────────────────────────────────────────
/**
 * How the n units sit once dealt into `rows` rows. `stranded` is the count that could not be
 * placed — the gap that says "this is not a factor", and the whole visual argument of the
 * chapter. With rows = 0 nothing is dealt yet.
 */
export function deal(n: number, rows: number): { perRow: number; placed: number; stranded: number } {
  if (rows < 1) return { perRow: 0, placed: 0, stranded: n }
  const perRow = Math.floor(n / rows)
  const placed = perRow * rows
  return { perRow, placed, stranded: n - placed }
}

/**
 * The band the bench gets, in pixels — HERE rather than in the scene so a sweep can drive the same
 * arithmetic the layout uses. A placement lives in CSS and a gate cannot see it; a band is a number
 * and it can.
 *
 * TOP    the chrome (the Menu chip) + the prompt card
 * BOTTOM the hand readout: the dwell ring or the tap pad, plus the note lane, which is RESERVED
 *        whether or not a note is showing — otherwise the bench jumps the moment a child gets one
 *        wrong.
 *
 * ⚠️ THE CONSTANTS RESERVE THE WORST CASE, not the case in front of you. The prompt card is text
 * and it WRAPS — measured, the same card is 36px tall on a one-line pair test and 66px on the
 * two-line split prompt — so a band tuned to whichever question happened to be on screen puts the
 * bench inside the card on the other one. `promptBottom` is the card's own MEASURED edge and wins
 * once it has reported; the constant is only a first-paint floor.
 *
 * ⚠️ AND NOTHING IS RESERVED FOR A SELF-VIEW ANY MORE. The camera path is full screen, so there is
 * no corner panel to clear — the old `max(base, CAM_W · 0.75 + …)` reserved 184.5px on a roomy
 * frame for a thing that is now `inset: 0`, i.e. it cost the bench 32px of height for nothing.
 */
/**
 * What the bench calls one of its groups, per reading — the ONE place the noun is chosen, so the
 * header, the prompt and the worked example cannot name three different things.
 *
 * ⚠️ THE MULTIPLE ROUND IS CRATES EVERYWHERE OR NOWHERE. Its prompt has always said crates; the
 * demo said rows until this pass, and fixing only the demo left the re-teach narrating "it took 7
 * crates" over a header reading **7 rows**. Two channels agreeing and a third one not is the same
 * fault as before, moved.
 */
export const benchLabel = (r: FlRound): { word: string; per: number } =>
  r.qType === 'evenOdd' ? { word: 'pair', per: 2 }
    : r.qType === 'multiple' ? { word: 'crate', per: r.base }
      : { word: 'row', per: 0 }

export const TOP_BAND = (short: boolean) => (short ? 104 : 146)
export const BOT_BAND = (short: boolean) => (short ? 112 : 152)
/**
 * ⚠️ THE EXPLORE BEAT STACKS ONE MORE ROW INTO THE BOTTOM — its "I've got it" button sits on its
 * own line above the readout, and the base band does not know about it. Measured at 640×320 the
 * bench ran 15px INTO that button. The band has to be told, which is why this is a parameter the
 * explore beat passes rather than a constant nobody reads.
 */
export const ACTION_ROW = (short: boolean) => (short ? 47 : 56)

/**
 * ⚠️ THE FLOOR USED TO BREAK THE RESERVE IT WAS WRITTEN INSIDE, and only measuring the running app
 * found it. On the guided round at 640×320 the question card wraps to `promptBottom = 142`, which
 * leaves 58px between the two bands — so `Math.max(90, …)` handed back 90 and the bench was drawn
 * **32px INTO the controls**, overlapping the note pill (which is drawn above it) across the bottom
 * row of units, i.e. across the things being counted. `Stage` could not know: the floor floated the
 * band downward and the returned `bot` still claimed the reserve was intact.
 *
 * So the CLAMP GOES ON `top` INSTEAD. The bench slides up UNDER the question card, which is text
 * the child has already read, rather than down onto the controls, which are targets they have to
 * hit — the same call this band makes everywhere else: the world yields to the tap targets.
 */
export function benchBand(vh: number, short: boolean, promptBottom = 0, extraBot = 0) {
  return fitBand(vh, Math.max(TOP_BAND(short), promptBottom + (short ? 8 : 12)), BOT_BAND(short) + extraBot)
}
