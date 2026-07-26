'use client'
/**
 * FollowerGrowth — the Slope & Linear Graphs chapter (15–16) as a PLAYABLE GAME.
 * World: a creator's followers over WEEKS. The growth line is y = mx + b, where
 * b is the starting followers (the intercept) and m is the growth per week (the
 * slope). Building the line → LineSetter (set start b + growth m, the line draws
 * live). "Read the slope" → SlideValue dial.
 *
 * TWO ways to answer, gated PER QUESTION (never per chapter) — the Leaderboard rule:
 *   • TAP   → AnswerPad. A question whose answer is ONE NUMBER is tapped. Both
 *             "what is the growth per week" questions are single numbers, and the
 *             SlideValue dial was never doing the solving there — the child worked
 *             the rate out in their head and then dialled it. Distractors are real
 *             misconceptions (see `pad` on Task), so a wrong tap is a wrong METHOD.
 *   • BUILD → LineSetter. y = mx + b is a PAIR (m and b), not a single number, so
 *             these keep their instrument: setting the start dial and the growth
 *             dial IS constructing the line, and the line redraws as you do it.
 *             Its dials are labelled in this chapter's own words ("growth/week",
 *             "start"), not the generic "slope"/"start".
 *
 * No guided round: the walkthrough works BOTH graded gestures — the concept on the
 * growth chart, then the LineSetter dials themselves — so nothing scored play grades
 * is a gesture the child has never seen.
 *
 * Curriculum ramp (id "slopeLinearGraphs"):
 *   L1 — read the slope off the rule (TAP) / build a line from start + growth
 *   L2 — slope from two logged weeks (TAP, rise ÷ run) / build the line from two weeks
 *   L3 — write the line from a graph description / from a point + slope (build)
 * Math mirrors makeRound in SlopeLinearGraphsTeenLesson (integers only), rebuilt
 * as structured generators that expose {m, b} / a numeric slope.
 */
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion, useMotionValueEvent } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, LineSetter, SlideValue, numChoices, type Line } from './parts/gameKit'

// Growth palette — a bright analytics/social-green vibe over a dark night.
const P: Palette = {
  nightTop: '#132a2e', nightBot: '#0b1a1c',
  cream: '#eafcf4', creamSoft: 'rgba(234,252,244,0.82)',
  inkOnPaper: '#12261f', mutedOnPaper: '#5d867a',
  gold: '#59e0a6', goldDeep: '#25a877',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#8ff0c8',
  glass: 'rgba(16,38,32,0.6)', glassBorder: 'rgba(234,252,244,0.2)',
}

const RANGE = 5 // LineSetter grid: slope clamps ±5, start clamps ±RANGE
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const rnz = (lo: number, hi: number) => { let n = rint(lo, hi); while (n === 0) n = rint(lo, hi); return n }
/** A follower count is never negative. Start counts are ≥ 0, and a LOSING slope is
 *  capped so the line still sits at or above zero at every week the task names. */
const startB = (hi = RANGE) => rint(0, hi)
const slopeFor = (b: number, lastWeek: number, lo: number, hi: number) =>
  rnz(Math.max(lo, -Math.floor(b / Math.max(1, lastWeek))), hi)
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
/** Display integer with a real minus glyph. Never used inside `say`/`work` — U+2212
 *  speaks as nothing, so spoken strings keep the ASCII hyphen (docs/lessons.md). */
const disp = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `${n}`)
const pick = <T,>(xs: T[]): T => xs[rint(0, xs.length - 1)]

/** y = mx + b as a tidy string (m integer). */
function eqStr(m: number, b: number): string {
  if (m === 0) return `y = ${b}`
  const mPart = m === 1 ? 'x' : m === -1 ? '−x' : m < 0 ? `−${Math.abs(m)}x` : `${m}x`
  if (b === 0) return `y = ${mPart}`
  return `y = ${mPart} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`
}
const sayEq = (m: number, b: number) =>
  m === 0 ? `y equals ${spoken(b)}`
    : `y equals ${m === 1 ? '' : m === -1 ? 'negative ' : `${spoken(m)} `}x${b === 0 ? '' : `, ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)}`}`

// The answer is either a full growth line, or just the slope value.
type V = { k: 'line'; m: number; b: number } | { k: 'slope'; m: number }
interface Task extends BaseTask {
  kind: 'line' | 'slope'
  m: number
  b: number
  lo?: number; hi?: number // slope dial bounds (fallback instrument only)
  /** Set → this question is answered by TAPPING a number instead of working an
   *  instrument, and carries the misconception values that become the distractors.
   *  ⚠️ A distractor that EQUALS the answer for some parameter values is silently
   *  dropped by numChoices, so the one misconception the item exists to catch can
   *  vanish for a quarter of seeds (this is exactly what happened on Leaderboard,
   *  where a − 2c equals a − c² at c = 2). Every generator below therefore excludes
   *  the colliding parameters BY CONSTRUCTION rather than by hoping — the domains
   *  are exported so the whole space can be swept. */
  pad?: number[]
  /** The walkthrough example that poses on the real LineSetter dials. */
  dialDemo?: boolean
}

// ── L1: read the growth per week off the rule (TAP) ───────────────────────────
// The answer is one number, and the dial was never solving it — the child read the
// coefficient in their head and then moved a slider to it. Now they tap it.
export const READ_SLOPES = [-4, -3, -2, -1, 1, 2, 3, 4]
/** Starts that keep all three misconception distractors distinct from the answer
 *  AND from each other:  b ≠ |m|  (else "read the start instead of the rate" IS the
 *  answer, or is its mirror), b ≠ 0 (else "the count after one week" is the answer),
 *  b ≠ −2m (else that same distractor collides with the sign-flip one). */
export const readStarts = (m: number): number[] =>
  [1, 2, 3, 4, 5].filter((b) => b !== Math.abs(m) && b !== -2 * m)

export function readSlopeTaskFrom(m: number, b: number): Task {
  return {
    kind: 'slope', title: 'Growth rate', badge: eqStr(m, b), tone: 'a',
    context: `This rule tracks one creator's followers week by week. Two numbers in it do different jobs — one is where they started, the other is how far the count moves each week.`,
    padInstruction: 'Tap the followers gained each week — a fall counts as negative.',
    answerLabel: 'growth per week',
    prompt: `How many followers does the line ${eqStr(m, b)} gain each week?`,
    say: `A creator's follower line is ${sayEq(m, b)}. How many followers do they gain each week?`,
    work: [`In y = mx + b the b is where they start and the m is how many they gain each week. Here the start is ${b} and the gain is ${m}, so the followers change by ${m} every week.`],
    m, b, lo: -6, hi: 6,
    // read-the-start-instead-of-the-rate · sign flipped · the total after one week
    pad: [b, -m, m + b],
  }
}
const readSlopeTask = (): Task => {
  const m = pick(READ_SLOPES)
  return readSlopeTaskFrom(m, pick(readStarts(m)))
}

// ── L2: the growth per week from two logged weeks (TAP) — rise ÷ run ──────────
// New STRUCTURE, not bigger numbers: L1 hands you the rate written down, this one
// makes you find it from two readings. That is also the only place the rise/run
// misconceptions are real, so this is where they become the distractors.
export const WEEK_STARTS = [0, 1, 2]          // the first logged week
export const WEEK_RUNS = [2, 3, 4]            // run ≥ 2, else "the rise" IS the rate
export const WEEK_BASES = [0, 1, 2, 3, 4]
/** Slopes that (a) keep BOTH named weeks at or above zero followers and (b) keep the
 *  three misconception distractors distinct.  |m| ≠ run kills "reported the run"
 *  colliding with the answer or its sign-flip; m ≠ 1 kills "the rise" and "the run"
 *  collapsing onto each other. */
export const weekSlopes = (b: number, lastWeek: number, run: number): number[] => {
  // m ≥ −⌊b / lastWeek⌋ keeps m·lastWeek ≥ −b, i.e. the later named week never
  // drops below zero followers (the earlier one sits between b and it).
  const min = Math.max(-4, -Math.floor(b / Math.max(1, lastWeek)))
  const out: number[] = []
  for (let m = min; m <= 4; m++) if (m !== 0 && m !== 1 && Math.abs(m) !== run) out.push(m)
  return out
}

export function weeksTaskFrom(x1: number, run: number, b: number, m: number): Task {
  const x2 = x1 + run
  const y1 = m * x1 + b, y2 = m * x2 + b
  const rise = y2 - y1
  return {
    kind: 'slope', title: 'Read the log', badge: `wk ${x1}: ${disp(y1)}  →  wk ${x2}: ${disp(y2)}`, tone: 'a',
    // The slope can be negative, so this says "change", never "gain" — a losing week
    // is still a change, and calling it a gain would be false for half the seeds.
    context: `Two weeks from the creator's log, and they are not next to each other. The weekly rate is the whole change shared evenly across the weeks in between — spread over more weeks, the same change is a smaller rate.`,
    padInstruction: 'Tap the followers gained each week — a fall counts as negative.',
    answerLabel: 'growth per week',
    prompt: `Week ${x1} had ${y1} followers and week ${x2} had ${y2}. How many are gained each week?`,
    say: `At week ${spoken(x1)} they had ${spoken(y1)} followers, and at week ${spoken(x2)} they had ${spoken(y2)}. How many followers do they gain each week?`,
    work: [`From week ${x1} to week ${x2} is ${run} weeks, and the followers changed by ${rise}. Share that change across the ${run} weeks: ${rise} divided by ${run} is ${m} each week.`],
    m, b,
    // the whole rise, undivided · the run reported instead of the rate · sign flipped
    pad: [rise, run, -m],
  }
}
const slopeFromWeeksTask = (): Task => {
  const x1 = pick(WEEK_STARTS), run = pick(WEEK_RUNS), b = pick(WEEK_BASES)
  return weeksTaskFrom(x1, run, b, pick(weekSlopes(b, x1 + run, run)))
}

function buildStartGrowthTask(): Task {
  const b = startB()
  const m = rnz(-4, 4)
  return {
    kind: 'line', title: 'Growth plan', badge: `start ${b}, +${m}/week`, tone: 'a',
    prompt: `Build the line: start at ${b} followers, growing ${m} per week.`,
    say: `Build the growth line. It starts at ${spoken(b)} followers and grows ${spoken(m)} each week.`,
    work: [`Start followers is the intercept b = ${b}. Growth per week is the slope m = ${m}. So the line is ${eqStr(m, b)}.`],
    m, b,
  }
}

// ── L2: slope from two weeks → build the matching line (from a point too) ────
function twoPointsTask(): Task {
  let x1 = rint(0, 3), x2 = rint(1, 4)
  let guard = 0
  while (x2 === x1 && guard++ < 20) x2 = rint(1, 4)
  const b = startB(RANGE - 1)
  const m = slopeFor(b, Math.max(x1, x2), -3, 3)   // both logged weeks stay ≥ 0 followers
  const y1 = m * x1 + b
  const y2 = m * x2 + b
  return {
    kind: 'line', title: 'From two weeks', badge: `(${x1}, ${y1}) & (${x2}, ${y2})`, tone: 'a',
    prompt: `Two weeks are logged: (week ${x1}, ${y1}) and (week ${x2}, ${y2}). Build the growth line.`,
    say: `Two data points: at week ${spoken(x1)} there were ${spoken(y1)} followers, at week ${spoken(x2)} there were ${spoken(y2)}. Build the line through them.`,
    work: [`Slope is rise over run: (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${m}. The intercept is where week 0 sits: b = ${b}. So ${eqStr(m, b)}.`],
    m, b,
  }
}

// ── L3: write / build the line's equation from a graph or point + slope ─────
function writeEqTask(): Task {
  const m = rnz(-4, 4)
  const b = startB()
  return {
    // The badge must NOT contain eqStr(m, b) — that is the answer, printed on the
    // board (the coordinatePlane defect: the badge WAS the answer).
    kind: 'line', title: 'Write the line', badge: `crosses at ${b} · ${disp(m)} per step`, tone: 'b',
    prompt: `A follower graph crosses the y-axis at ${b} and rises ${m} per step. Build y = mx + b.`,
    say: `Write this line as y equals m x plus b. It crosses the y-axis at ${spoken(b)} and rises ${spoken(m)} for every step right.`,
    work: [`The y-intercept is b = ${b}. The slope is m = ${m}. So the equation is ${eqStr(m, b)}.`],
    m, b,
  }
}

function pointSlopeTask(): Task {
  const b = startB(RANGE - 1)
  const px = rint(1, 3)
  const m = slopeFor(b, px, -3, 3)                 // the named week stays ≥ 0 followers
  const py = m * px + b
  return {
    kind: 'line', title: 'Point + slope', badge: `slope ${m}, thru (${px}, ${py})`, tone: 'b',
    prompt: `The line grows ${m} per week and passes through (week ${px}, ${py}). Build its equation.`,
    say: `A line has slope ${spoken(m)} and passes through the point week ${spoken(px)}, ${spoken(py)} followers. Build its equation.`,
    work: [`Slope m = ${m}. Back up to week 0: b = ${py} − ${m}×${px} = ${b}. So ${eqStr(m, b)}.`],
    m, b,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const t = d === 1 ? (Math.random() < 0.5 ? readSlopeTask() : buildStartGrowthTask())
    : d === 2 ? (Math.random() < 0.5 ? slopeFromWeeksTask() : twoPointsTask())
      : (Math.random() < 0.5 ? writeEqTask() : pointSlopeTask())
  // A `line` answer is the whole equation, so the board's default "=" would read
  // "start 1, +2/week  =  y = 2x + 1" — a double-equals chain. Name the quantity
  // instead, in one place rather than on every generator.
  return t.kind === 'line' ? { ...t, answerLabel: 'the line is' } : t
}

// ── fixed worked example (walkthrough) — build start 1, +2/week ─────────────
const DEMO_TASK: Task = {
  kind: 'line', title: 'Growth plan', badge: 'start 1, +2/week', tone: 'a',
  prompt: '', say: '', work: ['Intercept b = 1, slope m = 2, so y = 2x + 1.'],
  m: 2, b: 1,
}
// The walkthrough acts out the BUILD: plot the intercept → count the run → count
// the rise → read the slope → join the steps into a line → write y = mx + b. The
// value carries the real {m, b}; `stepIndex` sequences the reveal (the scene keys
// its markers/labels off it). Eleven BABY steps — one idea + one chalkboard line +
// one scene beat each, no two moves folded together:
//  0 hook  1 axes  2 intercept(b=1)  3 run  4 rise  5 one step  6 slope
//  7 repeat  8 join→line + dot climbs  9 read equation  10 solved ✓
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Here's a creator, and this is their followers over the weeks. We're going to build the growth line — where it starts, and how fast it climbs.", value: { k: 'line', m: 0, b: 0 }, board: 'y = mx + b' },
  { say: 'Across the bottom we count the weeks. Going up, we count the followers. Every point says: at this week, this many followers.', value: { k: 'line', m: 0, b: 0 }, board: '→ weeks   ↑ followers' },
  { say: 'In week zero they started with one follower. That first spot is the y-intercept — we call it b. So b is one.', value: { k: 'line', m: 0, b: 1 }, board: 'start b = 1' },
  { say: 'Now, how fast do they grow? Step across just one week. That sideways move is the run, and the run is one.', value: { k: 'line', m: 2, b: 1 }, board: 'run: → 1 week' },
  { say: 'Over that one week they gained two followers, so we climb up two. That upward move is the rise, and the rise is two.', value: { k: 'line', m: 2, b: 1 }, board: 'rise: ↑ 2 followers' },
  { say: "There's one full step of the staircase: right one week, up two followers.", value: { k: 'line', m: 2, b: 1 }, board: 'one step: → 1, ↑ 2' },
  { say: 'The slope, m, is the rise divided by the run — two divided by one, which is two. That is two new followers every week.', value: { k: 'line', m: 2, b: 1 }, board: 'slope m = rise ÷ run = 2' },
  { say: 'And it keeps going — another week, up two again; another week, up two again. The same climb, every single week.', value: { k: 'line', m: 2, b: 1 }, board: 'grow 2 every week' },
  { say: 'Join all those steps together and they line up into one straight line — the growth line. Watch the followers climb from one up to five.', value: { k: 'line', m: 2, b: 1 }, board: 'join the steps → a line' },
  { say: 'We read it as y equals m x plus b. The m is two, the b is one — so y equals two x plus one.', value: { k: 'line', m: 2, b: 1 }, board: 'y = 2x + 1' },
  { say: 'Start at one, grow by two each week: y equals two x plus one.', value: { k: 'line', m: 2, b: 1 }, board: 'y = 2x + 1 ✓' },
]

// ── worked example 2: the same build, on the ACTUAL dials it is graded on ──────
// Scored play grades the LineSetter build, and the chart above is not the LineSetter
// — a child who watched only the chart has still never seen the control. (This
// replaces the old guided round, which rehearsed exactly this line but scored the
// child on a gesture the walkthrough had skipped.) Five baby steps: name the two
// dials, set the start, set the growth, commit.
const DEMO_DIAL: Task = {
  kind: 'line', title: 'Growth plan', badge: 'start 2, +1/week', tone: 'a',
  prompt: '', say: '', work: [], m: 1, b: 2, dialDemo: true,
}
const DEMO_DIAL_STEPS: DemoStep<V>[] = [
  { say: 'One more — this time on the dials you will actually use. This creator starts with two followers and gains one a week.', value: { k: 'line', m: 0, b: 0 }, board: 'start 2, +1/week' },
  { say: 'There are two dials under the grid. START is where week zero sits — that is the b. GROWTH PER WEEK is how fast it climbs — that is the m.', value: { k: 'line', m: 0, b: 0 }, board: 'start = b · growth = m' },
  { say: 'Set START to two. Watch the dot lift to two followers, where the line begins.', value: { k: 'line', m: 0, b: 2 }, board: 'start → 2' },
  { say: 'Now GROWTH PER WEEK. One follower a week, so nudge it up to one — and the line tips into a climb.', value: { k: 'line', m: 1, b: 2 }, board: 'growth → 1' },
  { say: 'That is the line: y equals x plus two. When yours looks like this, press PLOT THE GROWTH. Now it is your turn.', value: { k: 'line', m: 1, b: 2 }, board: 'y = x + 2 ✓' },
]

/** The LineSetter dials speak this chapter's vocabulary, not the generic
 *  "slope"/"start" — a child hunting for the words the prompt used must find them on
 *  the control, not a synonym. */
const DIAL_LABELS = { m: 'growth/week', b: 'start' }

// ── hand-authored SVG analytics stage (storyboard: docs/storyboards/follower-growth.md)
// A creator's growth dashboard: a profile stat card whose follower count ticks up,
// over a code-drawn week/follower chart. During the WALKTHROUGH the build ACTS OUT
// y = mx + b: the intercept springs in, a rise/run staircase draws step-by-step
// (run then rise emphasised on their own beats), the slope reads out, the steps
// JOIN into one straight line that sweeps in, and a dot CLIMBS the line while the
// profile count flows from 1 up to 5. Every marker sits on the exact coordinate
// mapping (toX/toY); only the profile card + backdrop are art. `stepIndex`
// sequences the reveal; `value` carries the real {m, b}. Pure SVG + Framer Motion,
// reduced-motion safe (durations collapse to 0 → end state).
function GrowthScene({ palette, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: V; stepIndex: number; frameCount: number; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const m = value.k === 'line' ? value.m : value.k === 'slope' ? value.m : 0
  const b = value.k === 'line' ? value.b : 0

  // ── chart coordinate map (square grid, centred; W wider to seat the stat card) ─
  const W = 300, H = 280, range = RANGE
  const span = 2 * range
  const padY = 24
  const cell = (H - 2 * padY) / span
  const gridW = span * cell
  const gridLeft = (W - gridW) / 2
  const toX = (x: number) => gridLeft + (x + range) * cell
  const toY = (y: number) => (H - padY) - (y + range) * cell
  const clampY = (y: number) => Math.max(-range - 0.6, Math.min(range + 0.6, y))

  // ── beat gating: `inWalk` = a real multi-step walkthrough is running; otherwise
  //    (intro preview / glide) show only what the value carries. ──
  const inWalk = frameCount > 1
  const si = stepIndex
  const set = m !== 0 || b !== 0
  const showAxisLabels = inWalk ? si >= 1 : true
  const showIntercept = inWalk ? si >= 2 : set
  const showStairs = inWalk ? si >= 3 : set
  const showSlopeLabel = inWalk ? si >= 6 : set
  const showLine = inWalk ? si >= 8 : set
  const showEq = inWalk ? si >= 9 : set
  const emphaRun = inWalk && si === 3
  const emphaRise = inWalk && si === 4
  const done = ended || (inWalk && si >= 10) || (!inWalk && set)
  const lineCol = done ? '#2fb37f' : (showLine ? p.gold : p.goldDeep)
  const spring = { type: 'spring' as const, stiffness: 320, damping: 20 }

  // rise/run staircase from the intercept: up to 3 steps that fit the grid.
  const steps = m !== 0 ? (() => {
    const out: { x: number; y0: number; y1: number }[] = []
    for (let x = 0; x < 3; x++) {
      const y0 = m * x + b, y1 = m * (x + 1) + b
      if (Math.abs(y1) > range || x + 1 > range) break
      out.push({ x, y0, y1 })
    }
    return out
  })() : []
  const endX = steps.length // how far along x the climb runs (weeks that fit)

  // ── CONTINUOUS climb: a motion value driven at 60fps, so a dot flows UP the
  //    finished line and the profile count reads off the same progress. ──
  const progress = useMotionValue(0)
  const climb = showLine && endX > 0
  useEffect(() => {
    const controls = animate(progress, climb ? 1 : 0, { duration: reduce ? 0 : (climb ? 1.5 : 0.3), ease: [0.33, 0.02, 0.2, 1] })
    return () => controls.stop()
  }, [climb, reduce, progress])
  const dotX = useTransform(progress, (t) => toX(endX * t))
  const dotY = useTransform(progress, (t) => toY(clampY(m * endX * t + b)))

  // profile follower count = the y-value under the climbing dot (b at rest → m·endX+b climbed).
  const baseCount = showIntercept ? Math.round(b) : 0
  const [followers, setFollowers] = useState(baseCount)
  useEffect(() => { setFollowers(Math.round(b + m * endX * progress.get())) }, [b, m, endX, showIntercept, progress])
  useMotionValueEvent(progress, 'change', (t) => setFollowers(Math.round(b + m * endX * t)))
  const shownCount = showIntercept ? followers : 0

  const path = (x1: number, y1: number, x2: number, y2: number) => `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} 
        style={{ width: 'clamp(210px, 31vw, 330px)', height: 'auto', borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="fg_panel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#163430" />
            <stop offset="0.6" stopColor="#102723" />
            <stop offset="1" stopColor="#0b1a1c" />
          </linearGradient>
          <radialGradient id="fg_glow" cx="0.72" cy="0.2" r="0.85">
            <stop offset="0" stopColor={p.gold} stopOpacity="0.14" />
            <stop offset="1" stopColor={p.gold} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── backdrop ── */}
        <rect x={0} y={0} width={W} height={H} fill="url(#fg_panel)" />
        <rect x={0} y={0} width={W} height={H} fill="url(#fg_glow)" />

        {/* ── faint chart grid ── */}
        {Array.from({ length: span + 1 }, (_, i) => (
          <g key={i}>
            <line x1={toX(-range) + i * cell} y1={toY(range)} x2={toX(-range) + i * cell} y2={toY(-range)} stroke={p.glassBorder} strokeWidth={i === range ? 0 : 0.4} opacity={0.5} />
            <line x1={toX(-range)} y1={toY(range) + i * cell} x2={toX(range)} y2={toY(range) + i * cell} stroke={p.glassBorder} strokeWidth={i === range ? 0 : 0.4} opacity={0.5} />
          </g>
        ))}
        {/* ── axes (load-bearing) draw in ── */}
        <motion.line x1={toX(-range)} y1={toY(0)} x2={toX(range)} y2={toY(0)} stroke={p.creamSoft} strokeWidth={1.4}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} />
        <motion.line x1={toX(0)} y1={toY(range)} x2={toX(0)} y2={toY(-range)} stroke={p.creamSoft} strokeWidth={1.4}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} />
        {/* axis meaning labels — spring in on beat 1 */}
        <motion.text x={toX(range)} y={toY(0) + 15} fontSize={9} fill={p.mutedOnPaper} textAnchor="end"
          initial={false} animate={{ opacity: showAxisLabels ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.4 }}>weeks →</motion.text>
        <motion.text x={toX(0) + 5} y={toY(range) + 10} fontSize={9} fill={p.mutedOnPaper}
          initial={false} animate={{ opacity: showAxisLabels ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.4 }}>↑ followers</motion.text>

        {/* ── rise/run staircase — draws out from the intercept ── */}
        {showStairs && steps.map((s, i) => {
          const runCol = emphaRun && i === 0 ? p.gold : p.mutedOnPaper
          const riseCol = emphaRise && i === 0 ? '#59e0a6' : p.mutedOnPaper
          const emph = (emphaRun || emphaRise) && i === 0
          return (
            <g key={`st${i}`}>
              {/* run: right one week */}
              <motion.path d={path(toX(s.x), toY(clampY(s.y0)), toX(s.x + 1), toY(clampY(s.y0)))}
                fill="none" stroke={runCol} strokeDasharray="3 3" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1, strokeWidth: emph ? 2.6 : 1.6 }}
                transition={reduce ? { duration: 0 } : { pathLength: { duration: 0.4, delay: i * 0.18 }, strokeWidth: { duration: 0.3 } }} />
              {/* rise: up m followers */}
              <motion.path d={path(toX(s.x + 1), toY(clampY(s.y0)), toX(s.x + 1), toY(clampY(s.y1)))}
                fill="none" stroke={riseCol} strokeDasharray="3 3" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1, strokeWidth: emph ? 2.6 : 1.6 }}
                transition={reduce ? { duration: 0 } : { pathLength: { duration: 0.4, delay: 0.2 + i * 0.18 }, strokeWidth: { duration: 0.3 } }} />
              {i === 0 && (
                <>
                  <text x={toX(s.x + 0.5)} y={toY(clampY(s.y0)) + 13} fontSize={emphaRun ? 12 : 9} fontWeight={800} fill={runCol} textAnchor="middle" style={{ transition: 'fill 300ms' }}>+1 wk</text>
                  <text x={toX(s.x + 1) + 5} y={toY(clampY((s.y0 + s.y1) / 2)) + 3} fontSize={emphaRise ? 12 : 9} fontWeight={800} fill={riseCol} style={{ transition: 'fill 300ms' }}>+{m}</text>
                </>
              )}
            </g>
          )
        })}

        {/* ── the growth line — sweeps in via pathLength once the steps join ── */}
        {set && (
          <motion.line x1={toX(-range)} y1={toY(clampY(m * -range + b))} x2={toX(range)} y2={toY(clampY(m * range + b))}
            stroke={lineCol} strokeWidth={3.4} strokeLinecap="round"
            initial={false}
            animate={{ pathLength: showLine ? 1 : 0, opacity: showLine ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.45, 0.05, 0.25, 1] }} />
        )}

        {/* ── climbing dot — rides the finished line ── */}
        {climb && (
          <motion.g style={{ x: dotX, y: dotY }}>
            <circle r={5.4} fill={lineCol} stroke="#fff" strokeWidth={1.6} />
          </motion.g>
        )}

        {/* ── start marker (intercept) — springs in ── */}
        <motion.g initial={false} animate={{ opacity: showIntercept ? 1 : 0, scale: showIntercept ? 1 : 0.4 }}
          transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle cx={toX(0)} cy={toY(clampY(b))} r={5} fill={done ? '#2fb37f' : p.gold} stroke="#fff" strokeWidth={1.6} />
          {!showLine && (
            <text x={toX(0) - 7} y={toY(clampY(b)) - 8} fontSize={10} fontWeight={800} fill={p.gold} textAnchor="end">start</text>
          )}
        </motion.g>

        {/* ── slope tag ── */}
        <motion.g initial={false} animate={{ opacity: showSlopeLabel ? 1 : 0, y: showSlopeLabel ? 0 : 6 }}
          transition={reduce ? { duration: 0 } : spring}>
          <rect x={toX(range) - 96} y={toY(-range) - 20} width={94} height={17} rx={5} fill={p.glass} stroke={p.glassBorder} />
          <text x={toX(range) - 49} y={toY(-range) - 8} fontSize={10} fontWeight={800} fill={p.gold} textAnchor="middle" fontFamily="var(--font-numeric)">slope m = {m}</text>
        </motion.g>

        {/* ── creator profile stat card (theme; sits over the empty corner) ── */}
        <g transform={`translate(8, 10)`}>
          <rect x={0} y={0} width={104} height={62} rx={11} fill="#0e2622" stroke={p.glassBorder} />
          <circle cx={17} cy={19} r={9} fill={p.goldDeep} />
          <circle cx={17} cy={16} r={3.4} fill="#0e2622" />
          <path d="M10.5,25 a6.5 6.5 0 0 1 13 0" fill="#0e2622" />
          <text x={30} y={15} fontSize={8.5} fill={p.mutedOnPaper}>@creator</text>
          <text x={30} y={22} fontSize={7} fill={p.mutedOnPaper}>followers</text>
          <text x={11} y={49} fontSize={20} fontWeight={800} fill={p.cream} fontFamily="var(--font-numeric)" style={{ fontVariantNumeric: 'tabular-nums' }}>{shownCount}</text>
          <g transform="translate(60, 36)">
            <rect x={0} y={0} width={38} height={16} rx={8} fill="rgba(89,224,166,0.16)" />
            <path d="M7,11 L11,6 L15,9 L20,4" fill="none" stroke="#59e0a6" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
            <text x={30} y={11} fontSize={7.5} fontWeight={800} fill="#59e0a6" textAnchor="middle">▲</text>
          </g>
        </g>
      </svg>
      <motion.div key={showEq ? 'eq' : 'tmpl'} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.35 }}
        style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(15px, 1.6vw, 22px)', fontWeight: 800, color: showEq ? lineCol : p.mutedOnPaper }}>
        {showEq ? eqStr(m, b) : 'y = m x + b'}
      </motion.div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>followers per week</div>
    </div>
  )
}

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'slopeLinearGraphs',
  title: 'FOLLOWER GROWTH',
  ticketLabel: 'growth log',
  palette: P,
  motif: '📈',
  makeTask,
  // PER-QUESTION gating: a question shows the pad only when its answer is a single
  // number AND the instrument was never doing the solving. Both "growth per week"
  // questions qualify; every `line` question keeps LineSetter, because y = mx + b is
  // a PAIR and setting the two dials IS the construction.
  answerPad: (t) => (t.pad ? numChoices(t.m, t.pad) : []),
  initialValue: (t) => (t.kind === 'slope' ? { k: 'slope', m: t.lo ?? -6 } : { k: 'line', m: 0, b: 0 }),
  grade: (t, v) => {
    // A padded question hands the TAPPED NUMBER straight through as V (GameShell
    // casts it), so grade has to accept a bare number as well as a value object.
    const raw = v as unknown
    if (typeof raw === 'number') return raw === t.m
    return t.kind === 'slope' ? v.k === 'slope' && v.m === t.m : v.k === 'line' && v.m === t.m && v.b === t.b
  },
  // ASCII hyphen, not U+2212: revealText is SPOKEN ("It was −3" reads as "It was 3").
  revealText: (t) => (t.kind === 'slope' ? `${t.m}` : eqStr(t.m, t.b)),
  glide: (t, _from, setValue, later) =>
    later(() => setValue(t.kind === 'slope' ? { k: 'slope', m: t.m } : { k: 'line', m: t.m, b: t.b }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'slope') {
      // Fallback only: every `slope` task ships with `pad`, so GameShell renders the
      // AnswerPad and never reaches this. Kept so a future slope task without `pad`
      // degrades to the dial rather than to nothing.
      const m = value.k === 'slope' ? value.m : 0
      return (
        <SlideValue P={palette} value={m} setValue={(x) => setValue({ k: 'slope', m: x })}
          min={task.lo ?? -6} max={task.hi ?? 6} disabled={disabled} reveal={reveal}
          onCommit={(x) => onCommit({ k: 'slope', m: x })} commitLabel="LOG THE RATE ✓" />
      )
    }
    // KEPT: the answer here is the PAIR (m, b), not a single number, so there is
    // nothing to put on a pad — building it on the dials IS the answer.
    const line: Line = value.k === 'line' ? { m: value.m, b: value.b } : { m: 0, b: 0 }
    return (
      <LineSetter P={palette} line={line} setLine={(l) => setValue({ k: 'line', m: l.m, b: l.b })}
        range={RANGE} disabled={disabled} reveal={reveal} labels={DIAL_LABELS}
        onCommit={(l) => onCommit({ k: 'line', m: l.m, b: l.b })} commitLabel="PLOT THE GROWTH ✓" />
    )
  },
  // Branches by example: the concept example poses on the growth chart, the dial
  // example on the real LineSetter — so the child watches the gesture they will be
  // graded on, not a different picture of it.
  TutorialScene: ({ palette, task, value, stepIndex, frameCount, ended }) =>
    task.dialDemo ? (
      <LineSetter P={palette} line={value.k === 'line' ? { m: value.m, b: value.b } : { m: 0, b: 0 }}
        setLine={() => {}} range={RANGE} disabled labels={DIAL_LABELS}
        onCommit={() => {}} commitLabel="PLOT THE GROWTH ✓" />
    ) : (
      <GrowthScene palette={palette} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />
    ),
  start: {
    blurb: <><strong>You&apos;re charting a creator&apos;s followers over weeks.</strong> The growth is a <strong>straight line</strong> — a starting count plus a steady gain each week. Read its slope, or build the whole line.</>,
    ticket: { title: 'Growth line', badge: 'y = 2x + 1', tone: 'a' },
    startLabel: 'Open the growth log →',
  },
  overview: {
    say: 'Here is the plan. Followers growing steadily over weeks form a straight line, written y equals m x plus b. The b is where they start — the intercept. The m is how many they gain each week — the slope. To build the line, we set the start and the growth. Let us do one together, nice and slow.',
    problem: <>Build the growth line that <strong>starts at 1</strong> follower and gains <strong>2 each week</strong>.</>,
    points: [
      <>The <strong>start</strong> (week 0) is the y-intercept <strong>b</strong>.</>,
      <>The <strong>growth per week</strong> is the slope <strong>m</strong> — steeper = faster.</>,
      <>Put them together as <strong>y = mx + b</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_TASK, initial: { k: 'line', m: 0, b: 0 }, hand: 'tap', steps: DEMO_STEPS },
    { task: DEMO_DIAL, initial: { k: 'line', m: 0, b: 0 }, hand: 'tap', steps: DEMO_DIAL_STEPS },
  ],
  // No guided round: the walkthrough works BOTH graded gestures — the concept on the
  // chart, then the LineSetter dials themselves. Walkthrough → straight into play.
  sig: (t) => t.badge,
}

export default function FollowerGrowth(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
