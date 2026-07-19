'use client'
/**
 * PowerUps — the Exponents & Polynomials chapter (15–16) as a PLAYABLE GAME.
 * World: game POWER-UPS ⚡ — a stat that gets MULTIPLIED by the base once per level.
 *
 * ⚠️ WHY THE WORLD WAS REBUILT. The crank was always excellent for ONE operation:
 * cranking 4 levels of ×2 PERFORMS 2⁴ — you watch it, you do not recall it. The
 * chapter then abandoned that world for every harder case. The exponent laws ran on
 * a LETTER base (`x^m · x^n`), and no crank can turn an `x`, so the child computed
 * `m + n` in their head and dialled it — the "compute then dial" failure named in
 * docs/lessons.md. Negative exponents were phrased as "a power-up at level −3",
 * which meant nothing in a world where levels only went up.
 *
 * The fix is to make every operation happen ON THE CRANK, with a NUMERIC base:
 *   • LAWS      — `2³ · 2²` is cranked: three turns, then two more. The LEVEL counter
 *                 climbs 0→3→5, so `3 + 2 = 5` is watched, not recalled. `2⁷ ÷ 2³` is
 *                 cranked BACKWARD three turns (the crank already divides), so
 *                 subtracting exponents is undoing levels. `(2³)²` is the batch of
 *                 three, cranked twice.
 *   • NEGATIVES — the crank goes BELOW level zero. A DEBUFF divides the stat once per
 *                 level, so 2⁻³ is three back-turns from 1: 1 → ½ → ¼ → ⅛. The
 *                 reciprocal is a direction you travel, not a rule you quote.
 *   • SCIENTIFIC NOTATION — kept, because base 10 IS this world's crank: `4.2 × 10³`
 *                 starts the stat at 4.2 and cranks ×10 three times. The exponent
 *                 literally counts the ×10 jumps. (Only notation → plain number; the
 *                 reverse would be a hot/cold hunt for a number already on screen.)
 *
 * TAP-ANSWERING (AnswerPad), gated PER QUESTION — never per chapter:
 *   • PAD   → the two questions the crank cannot honestly perform: the ZERO level
 *             (the answer is "don't crank", which is a non-gesture) and the SCORE
 *             FORMULA `a x² + b x + c` (a polynomial the crank has no gear for).
 *             Distractors are real misconceptions: `b⁰ = 0`, and above all
 *             "squared means times two" (`a x²` → `2 a x`).
 *   • CRANK → everything else, because there the instrument IS the solving.
 *
 * ⚠️ `work` NEVER says "multiplied N times" — that is the misconception itself (it
 * yields base × exp) and `work` is SPOKEN after three wrong in a row, when the child
 * is most suggestible. Everywhere it says "used as a factor N times — start at 1 and
 * multiply by the base once per level".
 *
 * No guided round: the walkthrough works all THREE crank gestures (crank up, stack
 * levels, crank back below zero), so every graded gesture has been shown.
 * Scene is code-drawn (no assets).
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, CrankGear, SlideValue, numChoices } from './parts/gameKit'
import { pow } from '@/features/chapters/lessons/ExponentsRootsTeenLesson'

const P: Palette = {
  nightTop: '#241238', nightBot: '#140a24',
  cream: '#f2ecfb', creamSoft: 'rgba(242,236,251,0.82)',
  inkOnPaper: '#241238', mutedOnPaper: '#7b6a95',
  gold: '#c48bff', goldDeep: '#7c3fe0',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(40,22,66,0.6)', glassBorder: 'rgba(242,236,251,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const sup = (n: number) => pow('', n)   // superscript-only string, e.g. "²"

/** Which level a stat value sits on: how many ×base steps from the level-0 value.
 *  Signed — a debuffed stat sits BELOW zero, which is the whole point of 2⁻³. */
const levelOf = (v: number, base: number, ref = 1) =>
  v > 0 ? Math.round(Math.log(v / ref) / Math.log(base)) : 0

/** Below level zero the stat is a fraction; show it as one (⅛, not 0.125) — the
 *  reciprocal is the idea being taught, and a decimal buries it. */
const fracLabel = (v: number) => (v > 0 && v < 1 ? `1/${Math.round(1 / v)}` : String(v))

/** Spoken form — superscripts read as "two three", so speech gets words. */
const spokenPow = (b: number | string, e: number) =>
  e < 0 ? `${b} to the negative ${Math.abs(e)}` : `${b} to the ${e}`

// The answer is always a single NUMBER — a stat value built on the crank ('pow'),
// or a tapped choice ('num'). Tagged union → padValue is REQUIRED (see CONFIG).
type V = { k: 'pow'; n: number } | { k: 'num'; n: number }

interface Task extends BaseTask {
  kind: 'crank' | 'pad'
  n: number                 // the numeric answer
  base?: number             // crank: ×base per level
  ref?: number              // crank: the LEVEL-0 stat (1 normally; the coefficient in sci notation)
  floor?: number            // crank: hard stop turning back (default = ref)
  from?: number             // crank: the stat you start holding (default = ref)
  read?: (lvl: number) => string   // the level readout line above the crank
  pad?: number[]            // set → answered by TAPPING; these are the misconception values
  hi?: number               // pad fallback slider max (the pad is always shown; see Instrument)
}

// ── L1 — BUILD a power: crank the stat up from 1, ×base each level ──────────
// The crank performs this exactly: `exp` turns from 1 IS base used as a factor
// `exp` times. Bases/exponents kept small so every level lands on a readable stat.
function buildTask(base = pick([2, 3, 4, 5]), exp = base === 2 ? rint(3, 5) : rint(2, 3)): Task {
  const val = Math.round(Math.pow(base, exp))
  return {
    // badges carry the EXPRESSION only — the board supplies the "= ?" line, and a
    // badge ending in "= ?" would render the double-equals chain the E2E gate fails on.
    kind: 'crank', title: 'Charge the power-up', badge: `${pow(base, exp)}`, tone: 'a',
    context: 'A fresh power-up is on the bench.',
    prompt: `Crank the stat up ${exp} levels — ×${base} each level.`,
    instruction: `Crank the stat up ${exp} levels — ×${base} each level.`,
    say: `Build the power-up ${spokenPow(base, exp)}. Crank it up ${exp} levels — each turn multiplies your stat by ${base}.`,
    work: [`${pow(base, exp)} means ${base} used as a factor ${exp} times — start at 1 and multiply by ${base} once per level: ${Array.from({ length: exp }, () => base).join(' × ')} = ${val}.`],
    n: val, base, ref: 1,
  }
}

// ── L2 — THE LAWS, cranked on a NUMERIC base ────────────────────────────────
// This is the rebuild. The level counter on the crank is where each law is READ:
// stacking climbs the counter (add), spending walks it back (subtract), repeating
// a batch runs the same climb over again (multiply).

/** product rule: b^m · b^n — crank m levels, then n MORE. Counter goes 0 → m → m+n. */
function productTask(): Task {
  const b = pick([2, 3])
  const cap = b === 2 ? 7 : 4                     // keeps the top stat readable (2⁷=128, 3⁴=81)
  const m = rint(1, cap - 1), n = rint(1, cap - m)
  const val = Math.round(Math.pow(b, m + n))
  return {
    kind: 'crank', title: 'Stack two power-ups', badge: `${pow(b, m)} · ${pow(b, n)}`, tone: 'a',
    context: 'Two power-ups, same base, fitted one on top of the other.',
    prompt: `Crank ${m} levels, then ${n} more — read the stat.`,
    instruction: `Crank ${m} levels, then ${n} more — read the stat.`,
    say: `Stack ${spokenPow(b, m)} and ${spokenPow(b, n)}. Crank ${m} levels, then ${n} more levels on top, and read the stat off the meter.`,
    work: [`Cranking ${m} levels then ${n} more leaves you ${m} plus ${n} = ${m + n} levels up. So it is ${pow(b, m + n)}, and the stat reads ${val}.`],
    n: val, base: b, ref: 1,
  }
}

/** quotient rule: b^m ÷ b^n — you HOLD b^m and crank BACK n levels (÷base each). */
function quotientTask(): Task {
  const b = pick([2, 3])
  const cap = b === 2 ? 7 : 4
  const m = rint(2, cap), n = rint(1, m - 1)
  const val = Math.round(Math.pow(b, m - n))
  return {
    kind: 'crank', title: 'Spend a power-up', badge: `${pow(b, m)} ÷ ${pow(b, n)}`, tone: 'a',
    context: `You already hold ${pow(b, m)}. Spending divides it back down.`,
    prompt: `Turn the crank BACK ${n} ${n === 1 ? 'level' : 'levels'} — read the stat.`,
    instruction: `Turn the crank BACK ${n} ${n === 1 ? 'level' : 'levels'} — read the stat.`,
    say: `You hold ${spokenPow(b, m)} and you spend ${spokenPow(b, n)}. Turn the crank backwards ${n} ${n === 1 ? 'level' : 'levels'} — each back-turn divides by ${b} — and read the stat.`,
    work: [`Spending walks the level counter back: ${m} minus ${n} = ${m - n} levels. So it is ${pow(b, m - n)}, and the stat reads ${val}.`],
    n: val, base: b, ref: 1, from: Math.round(Math.pow(b, m)), floor: 1,
  }
}

/** power of a power: (b^m)^n — run the SAME batch of m cranks, n times over. */
function powerOfPowerTask(): Task {
  const b = 2
  const [m, n] = pick([[2, 2], [2, 3], [3, 2]])   // m·n ≤ 6 → top stat 64
  const val = Math.round(Math.pow(b, m * n))
  return {
    kind: 'crank', title: 'Power of a power-up', badge: `(${pow(b, m)})${sup(n)}`, tone: 'b',
    context: `A batch of ${m} levels, applied ${n} times over.`,
    prompt: `Crank ${m} levels, ${n} times over — read the stat.`,
    instruction: `Crank ${m} levels, ${n} times over — read the stat.`,
    say: `${spokenPow(b, m)}, all raised to the ${n}. That is a batch of ${m} levels, run ${n} times over. Crank it out and read the stat.`,
    work: [`Each batch is ${m} levels, and there are ${n} batches: ${m} × ${n} = ${m * n} levels in all. So it is ${pow(b, m * n)}, and the stat reads ${val}.`],
    n: val, base: b, ref: 1,
  }
}

/** L2 — the ZERO level. PADDED: the honest crank answer is "don't crank", which is
 *  not a gesture. The misconception worth catching is `b⁰ = 0` (and `b⁰ = b`). */
function zeroTask(): Task {
  const b = pick([3, 4, 5, 6, 7, 9])   // 2 excluded: it would collide with a filler choice
  return {
    kind: 'pad', title: 'The level-zero stat', badge: `${pow(b, 0)}`, tone: 'a',
    context: 'A power-up still sitting at level zero — nobody has cranked it yet.',
    prompt: 'Tap the stat it reads.',
    padInstruction: 'Tap the stat it reads.',
    say: `A power-up still at level zero. What does the stat read for ${spokenPow(b, 0)}?`,
    work: [`Every stat starts at 1 before any power-up, and level 0 means no levels have been cranked. So ${pow(b, 0)} = 1.`],
    n: 1, pad: [0, b], hi: 10,
  }
}

// ── L3 — BELOW level zero, base-10 levels, and the formula the crank can't run ──

/** negative exponents: a DEBUFF divides the stat once per level, so the crank walks
 *  BELOW zero. Bases 2 and 10 only — those are the ones whose back-steps land on
 *  exact values the crank can hold (½ ¼ ⅛ · 0.1 0.01 0.001). The numbers are bound
 *  by the instrument, not the other way round. */
function negativeTask(): Task {
  const b = pick([2, 10])
  const k = rint(1, 3)
  const val = Math.pow(b, -k)
  return {
    kind: 'crank', title: 'Debuffed below zero', badge: `${pow(b, -k)}`, tone: 'b',
    context: `A debuff divides your stat by ${b} for every level it drags you down.`,
    prompt: `Turn the crank BACK ${k} ${k === 1 ? 'level' : 'levels'} past zero.`,
    instruction: `Turn the crank BACK ${k} ${k === 1 ? 'level' : 'levels'} past zero.`,
    say: `${spokenPow(b, k * -1)}. A debuff divides by ${b} each level, so turn the crank backwards ${k} ${k === 1 ? 'level' : 'levels'} past zero and read the stat.`,
    work: [`Start at 1, at level zero, and divide by ${b} once per level down: ${[1, ...Array.from({ length: k }, (_, i) => fracLabel(Math.pow(b, -(i + 1))))].join(' → ')}. Level negative ${k} is 1 over ${pow(b, k)}, which is ${fracLabel(val)}.`],
    n: val, base: b, ref: 1, floor: Math.pow(b, -3),
  }
}

/** scientific notation: base 10 IS this world's crank. The stat starts at the
 *  coefficient and the exponent counts the ×10 jumps. Notation → plain number only:
 *  the reverse direction would put the target on screen and turn it into hot/cold.
 *  The coefficient is built from an integer (c10/10) so every crank step is exact. */
function sciTask(): Task {
  let c10 = rint(11, 99)
  while (c10 % 10 === 0) c10 = rint(11, 99)
  const coef = c10 / 10
  const e = rint(2, 4)
  const val = c10 * Math.round(Math.pow(10, e - 1))    // integer arithmetic — no float drift
  return {
    kind: 'crank', title: 'Read the shorthand', badge: `${coef} × 10${sup(e)}`, tone: 'b',
    context: 'Big stats get written in shorthand on the bench.',
    prompt: `Start at ${coef} and crank ×10, ${e} times.`,
    instruction: `Start at ${coef} and crank ×10, ${e} times.`,
    say: `Your stat is written as ${coef} times ten to the ${e}. The ten to the ${e} means ${e} jumps of times ten. Crank them out and read the full stat.`,
    work: [`Ten to the ${e} means ${e} jumps of ×10. Start the stat at ${coef} and take them one at a time: ${Array.from({ length: e }, (_, i) => c10 * Math.round(Math.pow(10, i))).join(' → ')}. The full stat is ${val}.`],
    n: val, base: 10, ref: coef, from: coef, floor: coef,
    read: (lvl) => `${coef} × 10${sup(Math.max(0, lvl))}  ·  ${Math.max(0, lvl)} of ${e} jumps`,
  }
}

/** L3 — the SCORE FORMULA `a x² + b x + c`. PADDED, and deliberately so: the crank
 *  has one gear (×base per level) and a polynomial is not that. Rather than dress a
 *  dial up as a manipulative, the child evaluates and taps.
 *
 *  ⚠️ RANGES ARE LOAD-BEARING, not taste. The headline distractor is "squared means
 *  times two" (a·x² → 2·a·x) — and 2x EQUALS x² at x = 2, so at x = 2 that distractor
 *  silently collapses into the answer and numChoices drops the one misconception
 *  worth catching. Hence x ≥ 3. The same trap for the "squared the whole term"
 *  distractor ((ax)² = a²x²) collapses at a = 1, hence a ≥ 2. See the parameter
 *  sweep in this chapter's build notes. */
function formulaTask(): Task {
  const a = rint(2, 3), b = rint(1, 4), c = rint(0, 6), x = rint(3, 5)
  const val = a * x * x + b * x + c
  const expr = `${a}x${sup(2)} + ${b}x${c ? ` + ${c}` : ''}`
  return {
    kind: 'pad', title: 'Score formula', badge: `${expr},  x = ${x}`, tone: 'b',
    context: `Your run scores by a formula, and this run you played ${x} rounds.`,
    prompt: 'Tap the score it gives.',
    padInstruction: 'Tap the score it gives.',
    answerLabel: 'score',
    say: `Your score formula is ${a} x squared, plus ${b} x${c ? `, plus ${c}` : ''}. Work out the score when x is ${x}.`,
    work: [`Square first: ${x} squared is ${x * x}. Then ${a} × ${x * x} = ${a * x * x}, and ${b} × ${x} = ${b * x}. Add them up${c ? ` with the ${c}` : ''}: ${a * x * x} + ${b * x}${c ? ` + ${c}` : ''} = ${val}.`],
    n: val, hi: val * 2,
    // squared→×2 · squared the whole term · forgot to multiply b by x
    pad: [a * 2 * x + b * x + c, a * x * a * x + b * x + c, a * x * x + b + c],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  // L1 — build a power: the exponent counts the ×base jumps.
  if (d === 1) return buildTask()
  // L2 — level ARITHMETIC: stack, spend, repeat a batch; plus the level-zero stat.
  if (d === 2) {
    const r = Math.random()
    if (r < 0.22) return zeroTask()
    if (r < 0.5) return productTask()
    if (r < 0.78) return quotientTask()
    return powerOfPowerTask()
  }
  // L3 — new territory: below zero, base-10 shorthand, and a formula off the crank.
  const r = Math.random()
  if (r < 0.36) return negativeTask()
  if (r < 0.68) return sciTask()
  return formulaTask()
}

// ── the CRANK, with the LEVEL COUNTER that carries the laws ─────────────────
// The shared CrankGear shows the stat VALUE only. The exponent laws are read off the
// LEVEL, so the level has to be on screen: stacking climbs it (3 → 5), spending walks
// it back, and a debuff pushes it below zero. Thin wrapper — no gameKit changes.
function PowerCrank({ P: p, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: V; setValue: (v: V) => void
  disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const base = task.base ?? 2
  const ref = task.ref ?? 1
  const n = value.k === 'pow' ? value.n : ref
  const lvl = levelOf(n, base, ref)
  const line = task.read ? task.read(lvl) : `LEVEL ${lvl}  ·  ${pow(base, lvl)}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px,1vh,12px)', width: '100%' }}>
      <div style={{
        padding: '5px 16px', borderRadius: 999, background: p.glass, border: `1px solid ${reveal ? p.mint : p.glassBorder}`,
        fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800,
        fontSize: 'clamp(13px,1.5vw,18px)', letterSpacing: '0.06em', color: reveal ? p.mint : p.cream,
      }}>{line}</div>
      <CrankGear P={p} value={n} setValue={(x) => setValue({ k: 'pow', n: x })} base={base}
        disabled={disabled} reveal={reveal} floor={task.floor ?? ref}
        onCommit={(x) => onCommit({ k: 'pow', n: x })} commitLabel="LOCK THE STAT ⚡" />
    </div>
  )
}

// ── the three worked examples ───────────────────────────────────────────────
// Every gesture scored play grades is worked here, so there is NO guided round:
//   1. crank UP from 1            → L1 builds, and the product/power-of-power laws
//   2. STACK levels on a held stat → the level counter adding (the product rule)
//   3. crank BACK past zero        → the quotient rule and negative exponents
// (The two PADDED questions need no gesture rehearsal — tapping a choice is the
//  shell's own mechanic — but their reasoning appears here too: example 1 step 3
//  names the level-zero stat, and example 3 walks through it.)

const DEMO_BUILD: Task = buildTask(2, 4)   // 2⁴ = 16
const BUILD_STEPS: DemoStep<V>[] = [
  { say: "Here's a power-up: two to the fourth. Let's charge it up together, nice and slow.", value: { k: 'pow', n: 1 }, board: '2⁴ = ?', hand: 'crank' },
  { say: 'That little four is the exponent. It says two is used as a factor four times.', value: { k: 'pow', n: 1 }, board: 'the 4 = four ×2 levels', hand: 'crank' },
  { say: 'Every stat starts at one, at level zero — before any power-up. That is why anything to the power zero is one.', value: { k: 'pow', n: 1 }, board: 'level 0:  stat = 1', hand: 'crank' },
  { say: 'Crank up one level. One times two is two. The meter leaps.', value: { k: 'pow', n: 2 }, board: 'level 1:  1 × 2 = 2', hand: 'crank' },
  { say: 'Crank again, level two. Two times two is four — it doubled once more.', value: { k: 'pow', n: 4 }, board: 'level 2:  2 × 2 = 4', hand: 'crank' },
  { say: 'Level three. Four times two is eight — doubling gets big fast.', value: { k: 'pow', n: 8 }, board: 'level 3:  4 × 2 = 8', hand: 'crank' },
  { say: 'Level four, the last one. Eight times two is sixteen. The meter is full.', value: { k: 'pow', n: 16 }, board: 'level 4:  8 × 2 = 16', hand: 'crank' },
  { say: 'Look at what we did — we started at one and multiplied by two once per level, four levels over.', value: { k: 'pow', n: 16 }, board: '1 × 2 × 2 × 2 × 2', hand: 'crank' },
  { say: 'So two to the fourth is sixteen. The exponent counted the levels, and the level counter agrees: four.', value: { k: 'pow', n: 16 }, board: '2⁴ = 16 · level 4', hand: 'crank' },
]

// Example 2 — the PRODUCT RULE, watched on the level counter.
const DEMO_STACK: Task = {
  kind: 'crank', title: 'Stack two power-ups', badge: '2³ · 2²', tone: 'a',
  context: 'Two power-ups, same base, fitted one on top of the other.',
  prompt: 'Crank 3 levels, then 2 more — read the stat.',
  instruction: 'Crank 3 levels, then 2 more — read the stat.',
  say: '', work: [], n: 32, base: 2, ref: 1,
}
const STACK_STEPS: DemoStep<V>[] = [
  { say: 'Now a harder one. Two power-ups, both base two: two cubed, and two squared. We fit one on top of the other.', value: { k: 'pow', n: 1 }, board: '2³ · 2² = ?', hand: 'crank' },
  { say: 'Start at one again, level zero, and crank the first one out. Three levels: two, four, eight.', value: { k: 'pow', n: 8 }, board: 'crank 3 → level 3, stat 8', hand: 'crank' },
  { say: 'The level counter reads three. That is the three in two cubed — it has been counting our turns all along.', value: { k: 'pow', n: 8 }, board: 'counter: level 3', hand: 'crank' },
  { say: 'Now stack the second power-up on top. Two squared is two more levels — do not start over, just keep cranking.', value: { k: 'pow', n: 16 }, board: 'stack: +1 level → 16', hand: 'crank' },
  { say: 'And the second of them. The stat is thirty-two.', value: { k: 'pow', n: 32 }, board: 'stack: +1 more → 32', hand: 'crank' },
  { say: 'Watch the counter: it went to three, then two more, and stopped at five. Three plus two is five.', value: { k: 'pow', n: 32 }, board: 'level 3 + 2 = level 5', hand: 'crank' },
  { say: 'That is the whole rule. Same base, stacked, and the levels ADD. Two cubed times two squared is two to the fifth: thirty-two.', value: { k: 'pow', n: 32 }, board: '2³ · 2² = 2⁵ = 32', hand: 'crank' },
]

// Example 3 — cranking BACK, through zero and below it.
const DEMO_BACK: Task = {
  kind: 'crank', title: 'Debuffed below zero', badge: '2⁻²', tone: 'b',
  context: 'A debuff divides your stat by 2 for every level it drags you down.',
  prompt: 'Turn the crank BACK 2 levels past zero.',
  instruction: 'Turn the crank BACK 2 levels past zero.',
  say: '', work: [], n: 0.25, base: 2, ref: 1, floor: 0.125, from: 1,
}
const BACK_STEPS: DemoStep<V>[] = [
  { say: 'Last one. A debuff — it does the opposite of a power-up. Every level it drags you down, it divides your stat by two.', value: { k: 'pow', n: 1 }, board: '2⁻² = ?', hand: 'crank' },
  { say: 'Turning the crank backwards is how we divide. Here we are at level zero, stat one.', value: { k: 'pow', n: 1 }, board: 'level 0:  stat = 1', hand: 'crank' },
  { say: 'Turn it back once. One divided by two is one half. The counter drops below zero, to negative one.', value: { k: 'pow', n: 0.5 }, board: 'level −1:  1 ÷ 2 = 1/2', hand: 'crank' },
  { say: 'Turn it back again. One half divided by two is one quarter, at level negative two.', value: { k: 'pow', n: 0.25 }, board: 'level −2:  1/2 ÷ 2 = 1/4', hand: 'crank' },
  { say: 'So the minus sign in the exponent is not a minus on the answer — the stat never goes below nothing. It is a direction: back down the levels.', value: { k: 'pow', n: 0.25 }, board: 'minus = crank BACK, not negative', hand: 'crank' },
  { say: 'Two to the negative two is one quarter — which is one over two squared. Below zero, the level turns into the bottom of a fraction.', value: { k: 'pow', n: 0.25 }, board: '2⁻² = 1/2² = 1/4', hand: 'crank' },
]

/** Hand-authored SVG arcade upgrade-bench. A charge tower + level ladder that ACTS
 *  OUT the crank: the meter's fill is the stat as a fraction of the top level, so
 *  each level visibly DOUBLES (or, below zero, HALVES); a "×base" chip springs at
 *  the fill's top as it climbs; the ladder tiles light one at a time with ×base
 *  connectors between them, and tiles below level zero carry fraction labels.
 *  Generic in the task's base and level range, so the same stage carries all three
 *  worked examples — one world, every operation. Everything sits on the exact math
 *  (fill = stat / top stat, level = log_base(stat)); only the stage is art.
 *  Continuous motion: the fill rides a spring-driven useMotionValue.
 *  useReducedMotion → end state, no leaps. */
function StatScene({ palette, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: V; stepIndex: number; frameCount: number; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const base = task.base ?? 2
  const ref = task.ref ?? 1
  const cur = value.n

  // level window: always includes zero, the starting stat and the answer.
  const lvlAns = levelOf(task.n, base, ref)
  const lvlFrom = levelOf(task.from ?? ref, base, ref)
  const hiLvl = Math.max(0, lvlAns, lvlFrom)
  const loLvl = Math.min(0, lvlAns, lvlFrom)
  const levels = Array.from({ length: hiLvl - loLvl + 1 }, (_, i) => loLvl + i)
  const topVal = ref * Math.pow(base, hiLvl)

  const level = levelOf(cur, base, ref)
  const solved = ended || stepIndex >= frameCount - 1 || cur === task.n
  const climbing = stepIndex > 0 && !solved
  const col = solved ? p.mint : p.goldDeep
  const glow = solved ? p.mint : p.gold

  // ── geometry ──
  const W = 340, H = 300
  const topY = 54, baseY = 258, maxH = baseY - topY
  const meterX = 40, meterW = 62
  const ladderX = 254, tileW = 66, tileH = 24
  const targetFrac = Math.min(1, Math.max(cur / topVal, 0.045))

  // ── continuous, spring-driven meter fill (the "leap") ──
  const mFrac = useMotionValue(reduce ? targetFrac : 0.045)
  useEffect(() => {
    const controls = animate(mFrac, targetFrac, reduce ? { duration: 0 } : { type: 'spring', stiffness: 130, damping: 13 })
    return () => controls.stop()
  }, [targetFrac, reduce, mFrac])
  const barY = useTransform(mFrac, (f) => topY + (1 - f) * maxH)
  const barH = useTransform(mFrac, (f) => f * maxH)
  const chipY = useTransform(mFrac, (f) => topY + (1 - f) * maxH - 15)

  const span = Math.max(1, levels.length - 1)
  const nodes = levels.map((lv, i) => ({ lv, i, val: ref * Math.pow(base, lv), y: baseY - (i / span) * maxH }))
  const spring = { type: 'spring' as const, stiffness: 300, damping: 18 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="clamp(230px, 32vw, 360px)" height="auto" style={{ borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="pu_sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a163f" />
            <stop offset="0.6" stopColor="#1b0f2c" />
            <stop offset="1" stopColor="#120a20" />
          </linearGradient>
          <radialGradient id="pu_spot" cx="0.5" cy="0.1" r="0.85">
            <stop offset="0" stopColor="#e6ccff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor={p.gold} stopOpacity="0.06" />
            <stop offset="1" stopColor={p.gold} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pu_fill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={col} stopOpacity="0.85" />
            <stop offset="1" stopColor={col} />
          </linearGradient>
        </defs>

        {/* ── arcade backdrop ── */}
        <rect x={0} y={0} width={W} height={H} fill="url(#pu_sky)" />
        <g opacity={0.5}>
          {Array.from({ length: 6 }).map((_, r) => (
            <g key={`sc${r}`}>
              {Array.from({ length: 18 }).map((_, i) => (
                <circle key={i} cx={12 + i * (W / 17)} cy={10 + r * 7} r={0.9} fill={p.cream} opacity={0.12} />
              ))}
            </g>
          ))}
        </g>
        <rect x={0} y={0} width={W} height={H} fill="url(#pu_spot)" />
        <motion.line x1={16} y1={baseY} x2={W - 16} y2={baseY} stroke={p.creamSoft} strokeWidth={1.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} />

        {/* ── exponent readout (top): baseⁿ = stat ── */}
        <motion.g key={`hd${cur}`} initial={reduce ? false : { scale: 0.8, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <text x={W / 2} y={34} textAnchor="middle" fill={p.cream} fontSize={26} fontFamily="var(--font-numeric)" fontWeight={800}>
            {pow(base, level)} <tspan fill={p.mutedOnPaper}>=</tspan> <tspan fill={col}>{fracLabel(cur)}</tspan>
          </text>
        </motion.g>

        {/* ── charge tower / power meter (left) ── */}
        <rect x={meterX} y={topY} width={meterW} height={maxH} rx={12} fill={p.glass} stroke={p.glassBorder} strokeWidth={1} />
        {nodes.slice(1).map((nd) => (
          <line key={`nt${nd.lv}`} x1={meterX} y1={baseY - (nd.val / topVal) * maxH} x2={meterX + meterW} y2={baseY - (nd.val / topVal) * maxH} stroke={p.glassBorder} strokeWidth={1} opacity={0.55} strokeDasharray="2 3" />
        ))}
        <motion.rect x={meterX + 3} width={meterW - 6} rx={9} fill="url(#pu_fill)" style={{ y: barY, height: barH }} />
        <motion.rect x={meterX + 3} width={meterW - 6} height={3} rx={1.5} fill={p.cream} opacity={0.5} style={{ y: barY }} />
        <text x={meterX + meterW / 2} y={baseY + 15} textAnchor="middle" fill={p.mutedOnPaper} fontSize={10} fontFamily="var(--font-numeric)" letterSpacing="0.12em">×{base}</text>

        {/* ── the "×base" multiplier chip riding the top of the meter as it leaps ── */}
        <motion.g style={{ y: chipY }}>
          <motion.g initial={false} animate={{ opacity: climbing ? 1 : 0, scale: climbing ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : { ...spring, stiffness: 420 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x={meterX + meterW + 4} y={0} width={38} height={22} rx={11} fill={p.goldDeep} stroke={glow} strokeWidth={1} />
            <text x={meterX + meterW + 4 + 19} y={15} textAnchor="middle" fill={p.cream} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={800}>×{base}</text>
          </motion.g>
        </motion.g>

        {/* ── level ladder (right): the stat at each level, with ×base connectors ── */}
        {nodes.slice(0, -1).map((nd, i) => {
          const next = nodes[i + 1]
          const on = level >= nd.lv + 1
          return (
            <g key={`cn${nd.lv}`}>
              <motion.line x1={ladderX} y1={nd.y - tileH / 2} x2={ladderX} y2={next.y + tileH / 2}
                stroke={on ? glow : p.glassBorder} strokeWidth={on ? 2 : 1} opacity={on ? 0.9 : 0.4}
                initial={{ pathLength: 0 }} animate={{ pathLength: on ? 1 : 0.001 }} transition={reduce ? { duration: 0 } : { duration: 0.4, ease: 'easeInOut' }} />
              <text x={ladderX + 12} y={(nd.y + next.y) / 2 + 4} fill={on ? glow : p.mutedOnPaper} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={700} opacity={on ? 1 : 0.5}>×{base}</text>
            </g>
          )
        })}
        {nodes.map((nd) => {
          const lit = level >= nd.lv
          const isCur = nd.lv === level
          const isZero = nd.lv === 0
          return (
            <motion.g key={`tile${nd.lv}`} initial={false}
              animate={{ scale: isCur && climbing && !reduce ? [1, 1.16, 1] : 1 }} transition={reduce ? { duration: 0 } : spring}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <rect x={ladderX - tileW / 2} y={nd.y - tileH / 2} width={tileW} height={tileH} rx={7}
                fill={lit ? p.glass : 'transparent'} stroke={lit ? (isCur ? glow : col) : (isZero ? p.gold : p.glassBorder)} strokeWidth={lit && isCur ? 2 : 1}
                opacity={lit ? 1 : isZero ? 0.8 : 0.45} style={lit && isCur ? { filter: `drop-shadow(0 0 6px ${glow})` } : undefined} />
              <text x={ladderX} y={nd.y + 5} textAnchor="middle" fill={lit ? p.cream : p.mutedOnPaper} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={800} style={{ fontVariantNumeric: 'tabular-nums' }}>{fracLabel(nd.val)}</text>
              <text x={ladderX - tileW / 2 - 8} y={nd.y + 4} textAnchor="end" fill={isZero ? p.gold : p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)" opacity={0.85}>L{nd.lv < 0 ? `−${-nd.lv}` : nd.lv}</text>
            </motion.g>
          )
        })}
      </svg>

      {/* the level counter, spelled out — this is where each law is READ */}
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(13px, 1.5vw, 18px)', fontWeight: 700, color: p.mutedOnPaper, minHeight: '1.3em', letterSpacing: '0.02em', textAlign: 'center' }}>
        level <span style={{ color: col }}>{level < 0 ? `−${-level}` : level}</span> · stat <span style={{ color: col }}>{fracLabel(cur)}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: solved ? p.mint : p.mutedOnPaper }}>
        {solved ? `${pow(base, lvlAns)} = ${fracLabel(task.n)} ✓` : `×${base} per level up · ÷${base} per level back`}
      </div>
    </div>
  )
}

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'exponentsPolynomials',
  title: 'POWER-UPS',
  ticketLabel: 'upgrade log',
  palette: P,
  motif: '⚡',
  makeTask,
  // PER-TASK gating. A question keeps the CRANK whenever the crank genuinely
  // performs the operation — building a power, stacking levels (the product rule),
  // walking levels back (the quotient rule), repeating a batch (power of a power),
  // and cranking below zero (negative exponents, and base-10 scientific notation).
  // Only the two the crank has no honest gesture for are tapped: the level-zero
  // stat ("don't crank" is not a gesture) and the score formula (no gear for a
  // polynomial). Their distractors are the real misconceptions.
  answerPad: (t) => (t.pad ? numChoices(t.n, t.pad) : []),
  // REQUIRED: V is a tagged union, so a bare tapped number never matches `v.k` and
  // EVERY padded answer would grade wrong — silently, since a wrong answer still
  // advances. That shipped once. Gate: src/__tests__/answerPadGrading.test.ts.
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'crank' ? { k: 'pow', n: t.from ?? t.ref ?? 1 } : { k: 'num', n: 0 }),
  grade: (t, v) => v.n === t.n,
  revealText: (t) => fracLabel(t.n),
  glide: (t, _from, setValue, later) =>
    later(() => setValue(t.kind === 'crank' ? { k: 'pow', n: t.n } : { k: 'num', n: t.n }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'crank') {
      return <PowerCrank P={palette} task={task} value={value} setValue={setValue}
        disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    // Fallback only: every `pad` task ships with `pad`, so the shell renders the
    // AnswerPad and never reaches this. Kept so a future one degrades to a slider.
    const n = value.k === 'num' ? value.n : 0
    return (
      <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={0} max={task.hi ?? 20}
        disabled={disabled} reveal={reveal}
        onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="SET IT ✓" />
    )
  },
  // One stage for all three examples — it reads the task's base and level window, so
  // the child watches the same bench whether the crank is climbing or going below zero.
  TutorialScene: ({ palette, task, value, stepIndex, frameCount, ended }) => (
    <StatScene palette={palette} task={task} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />
  ),
  start: {
    blurb: <><strong>You&apos;re charging game power-ups.</strong> Each level <strong>multiplies</strong> your stat — that&apos;s what an <strong>exponent</strong> is. Crank levels on to stack powers, crank back to spend them, and go <strong>below zero</strong> when a debuff bites.</>,
    ticket: { title: 'Power-up', badge: '2⁴', tone: 'a' },
    startLabel: 'Open the upgrade bench →',
  },
  overview: {
    say: 'Here is the plan. A power-up like two to the fourth starts your stat at one and multiplies by two once per level — four levels. So building a power means cranking it up level by level, and the level counter is the exponent. Stack a second power-up on and the levels add. Crank backwards and they take away. Keep cranking back past zero and the stat turns into a fraction. Let us work three of them out together, nice and slow.',
    problem: <>Build <strong>2⁴</strong>, then stack <strong>2³ · 2²</strong>, then crank back to <strong>2⁻²</strong>.</>,
    points: [
      <>The <strong>level counter</strong> IS the exponent — each level is one ×base.</>,
      <><strong>Stack</strong> power-ups and the levels <strong>add</strong>; <strong>spend</strong> one and they <strong>subtract</strong>.</>,
      <>Crank <strong>back past zero</strong> and the stat becomes a <strong>fraction</strong>.</>,
    ],
  },
  // Three worked examples, one per graded gesture. `tutorial` takes an array; the
  // scene branches on the task, so each example poses on its own level window.
  tutorial: [
    { task: DEMO_BUILD, initial: { k: 'pow', n: 1 }, hand: 'crank', steps: BUILD_STEPS },
    { task: DEMO_STACK, initial: { k: 'pow', n: 1 }, hand: 'crank', steps: STACK_STEPS },
    { task: DEMO_BACK, initial: { k: 'pow', n: 1 }, hand: 'crank', steps: BACK_STEPS },
  ],
  // No guided round: all three crank gestures are worked above, and the two padded
  // questions are answered with the shell's own tap mechanic.
  sig: (t) => t.badge,
}

export default function PowerUps(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
