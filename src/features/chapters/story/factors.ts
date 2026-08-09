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
import { rint, shuffle } from '@/core/rand'

/** The answer surface is two hands. Nothing may require more than this. */
export const MAX_FINGERS = 10

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

const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]

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
  instruction: string
  say: string
  /** EVERY finger count graded correct. A fist is 0. */
  accepts: number[]
}

/**
 * The split wording, shared by `factor` and `prime` so the type cannot leak the answer.
 * ⚠️ "Some numbers will not split at all" is said on EVERY split round — it teaches that the fist
 * is a real possibility without telling the child anything about the round in front of them.
 */
const splitContext = (n: number) =>
  `You have ${n} parts. They go out in equal rows — every row the same length, nothing left over. Some numbers will not split at all.`
const SPLIT_DO = 'Work out how many rows fit, then hold up that many fingers. Make a fist if none fit.'

/** n ≤ 2·MAX_FINGERS + 1, so the pair count is always showable on two hands. */
export function mkEvenOdd(n: number): FlRound {
  return {
    qType: 'evenOdd', n, base: 2, tag: 'Pair test',
    prompt: `You have ${n} parts. They leave the bench in pairs — two parts together.`,
    instruction: 'Work out how many pairs you can make, then hold up that many fingers.',
    say: `You have ${n} parts, and they leave in pairs. Work out how many pairs you can make, then hold up that many fingers.`,
    accepts: [Math.floor(n / 2)],
  }
}
export function mkMultiple(base: number, k: number): FlRound {
  return {
    qType: 'multiple', n: base * k, base, tag: `Counting in ${base}s`,
    prompt: `You have ${base * k} parts. A crate holds ${base}, and every crate is filled right to the top.`,
    instruction: 'Work out how many crates it takes, then hold up that many fingers.',
    say: `You have ${base * k} parts and a crate holds ${base}. Work out how many crates it takes, then hold up that many fingers.`,
    accepts: [k],
  }
}
export function mkSplit(n: number): FlRound {
  const rows = showableRows(n)
  return {
    qType: rows.length ? 'factor' : 'prime', n, base: 0,
    tag: `Splitting ${n}`,
    prompt: splitContext(n),
    instruction: SPLIT_DO,
    say: `${splitContext(n)} ${SPLIT_DO}`,
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
export function nudgeFor(r: FlRound, fingers: number): string | null {
  if (graded(r, fingers)) return null
  if ((r.qType === 'factor' || r.qType === 'prime') && fingers === 1) {
    return 'One row is the whole thing — that is not a split. Try more rows.'
  }
  if (r.qType === 'multiple' && fingers === 0) return `Count up in ${r.base}s and hold up how many you need.`
  return null
}

/** Never names the answer, and never differs between a factor round and a prime one. */
export function missFor(r: FlRound): string {
  if (r.qType === 'evenOdd') return 'Not the right number of pairs. Take them two at a time and count the pairs.'
  if (r.qType === 'multiple') return `Not yet — keep counting up in ${r.base}s.`
  return 'That leaves a gap. Try a different number of rows, or a fist if nothing fits.'
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
      { say: `${r.base}, and again, and again — each row holds ${r.base}.`, rows: k, leftover: false },
      { say: `It took ${k} rows to reach ${r.n}. So ${k} ${r.base}s make ${r.n}.`, rows: k, leftover: false },
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

export { shuffle }
