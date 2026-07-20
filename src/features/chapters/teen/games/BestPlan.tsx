'use client'
/**
 * BestPlan — the Systems of Equations chapter (15–16) as a PLAYABLE GAME.
 * World: ONE phone account. Two things live in that world and both are ordinary
 * things a phone customer actually says:
 *   • TWO PLANS, each a cost line — a monthly fee plus a rate per gigabyte. The
 *     smart choice is the BREAK-EVEN point, where the two plans cost the same.
 *   • ONE BILL WITH TWO LINES on it — yours and your sibling's. The bill states the
 *     TOTAL, and you know YOURS COSTS $d MORE. That is a sum and a difference of two
 *     unknowns, said in plain English, which is what elimination needs.
 *
 * ⚠️ WHY THE BILL EXISTS. This chapter used to run elimination on `x + y = s` and
 * `x − y = d` while showing a phone-plan badge. "Plan A minus Plan B" has NO REFERENT
 * in two plans — you cannot subtract one plan from another — so the world evaporated
 * and the child was doing bare symbol manipulation wearing a phone badge. A sum and a
 * difference both mean something on a shared BILL, so elimination moved there. It is
 * the same account, the same story, the same money: one world, two of its surfaces.
 *
 * ⚠️ WHY EVERY BREAK-EVEN IS POSITIVE NOW. The old generators drew slopes from
 * [-2,-1,1,2] and crossings from rint(-5,6), so a phone plan could get CHEAPER the
 * more you used it, and two thirds of the break-evens landed at a negative gigabyte
 * or a negative dollar. A break-even "at −3 GB" is not a thing, and a child reasoning
 * from the physical model was punished for it. Every plan is now built the way real
 * plans are — positive fee, positive rate — and Plan B always trades a BIGGER fee for
 * a SMALLER rate, which is exactly why the cheaper plan swaps over at a positive
 * usage. The story is not decoration on the constraint; the constraint IS the story.
 *
 * HOW THE CHILD ANSWERS, gated PER QUESTION (never per chapter):
 *   • BUILD  → L1's crossing is a POINT (x, y), a pair, not a single number — so it
 *              keeps its instrument: the chart itself, with a marker the child drives
 *              onto the crossing. Reading a graph is the skill; the graph is present.
 *   • TAP    → L2 (how many GB until they cost the same) and L3 (what YOUR line costs)
 *              are single numbers, so they take the AnswerPad. Distractors are the
 *              real misconceptions: reading the crossing's y as its x, solving for the
 *              wrong variable, splitting the bill evenly, forgetting to halve.
 *   • SORT   → the one/none/infinite case is a classification, not a number, so it
 *              keeps the SpecPicker.
 *
 * No guided round: the walkthrough works all THREE graded pictures (the chart, the
 * bill, the parallel pair), so nothing is scored that was never shown.
 * All code-drawn (no image assets).
 */
import { useEffect, type ReactElement } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, PartsBuilder, SpecPicker, SlideValue, numChoices } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1a1633', nightBot: '#0e0b1e',
  cream: '#f1eefb', creamSoft: 'rgba(241,238,251,0.82)',
  inkOnPaper: '#1c1734', mutedOnPaper: '#7a6ea0',
  gold: '#8f7bff', goldDeep: '#5b46c9',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(26,22,51,0.6)', glassBorder: 'rgba(241,238,251,0.2)',
}

const rpick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const ptStr = (x: number, y: number) => `(${fmtInt(x)}, ${fmtInt(y)})`

/** Format y = mx + b with real minus signs (a plan's cost line). */
function lineEq(m: number, b: number): string {
  const mPart = m === 1 ? 'x' : m === -1 ? '−x' : `${m < 0 ? '−' : ''}${Math.abs(m)}x`
  if (b === 0) return `y = ${mPart}`
  return `y = ${mPart} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`
}

// The answer is a crossing POINT (a pair), a single NUMBER (padded), or a
// solution-count sort. V is a TAGGED UNION → `padValue` below is mandatory.
type V = { k: 'pt'; a: number; b: number } | { k: 'num'; n: number } | { k: 'pick'; id: string }

type Plan = { m: number; b: number }

interface Task extends BaseTask {
  kind: 'cross' | 'months' | 'bill' | 'classify'
  lines?: Plan[]                         // the two plan cost lines (cross / months / classify)
  x?: number; y?: number                 // cross: the integer crossing point
  n?: number                             // months / bill: the single-number answer
  /** Set → answered by TAPPING a choice. Carries the misconception values that
   *  become the distractors, so a wrong tap names a wrong METHOD, not a slip. */
  pad?: number[]
  answerId?: string                      // classify: 'one' | 'none' | 'infinite'
}

// ── THE PLAN PAIR, built so the world stays true ──────────────────────────────
// Plan A: small fee `b1`, steep rate `m1` (pay-as-you-go). Plan B: bigger fee, gentler
// rate. Both fees and both rates are POSITIVE, so cost always grows with usage; and
// because B trades fee for rate, the crossing sits at
//   x0 = (b2 − b1) / (m1 − m2) > 0   and   y0 = m1·x0 + b1 > 0.
// Positivity is structural here, not filtered in afterwards.
type Cross = { lines: [Plan, Plan]; x0: number; y0: number }
function crossOf(m1: number, m2: number, b1: number, x0: number): Cross {
  const b2 = b1 + (m1 - m2) * x0
  return { lines: [{ m: m1, b: b1 }, { m: m2, b: b2 }], x0, y0: m1 * x0 + b1 }
}

// L1 pool — must fit inside the visible chart (0..CHART_MAX both axes), because L1
// is answered BY READING THE CHART. A crossing off the edge would be unanswerable.
const CHART_MAX = 8
const L1_POOL: Cross[] = []
for (let x0 = 1; x0 <= 6; x0++)
  for (let m1 = 2; m1 <= 4; m1++)
    for (let m2 = 1; m2 < m1; m2++)
      for (let b1 = 1; b1 <= 4; b1++) {
        const c = crossOf(m1, m2, b1, x0)
        if (c.y0 <= CHART_MAX) L1_POOL.push(c)   // b2 = y0 − m2·x0 < y0, so B's fee fits too
      }

// L2 pool — padded, so no chart bound. `m1 − m2 ≥ 2` is REQUIRED: at a rate gap of 1
// the "subtracted the fees but forgot to divide" distractor (b2 − b1) EQUALS the
// answer, numChoices drops it, and the misconception worth catching vanishes.
const L2_POOL: Cross[] = []
for (let x0 = 2; x0 <= 6; x0++)
  for (let m1 = 3; m1 <= 6; m1++)
    for (let m2 = 1; m2 <= m1 - 2; m2++)
      for (let b1 = 2; b1 <= 9; b1++) L2_POOL.push(crossOf(m1, m2, b1, x0))

// L3 pool — the shared bill. `x` = your line, `y` = your sibling's, both positive
// dollars, yours the dearer one so "yours costs $d more" is TRUE. Same parity keeps
// the "split it evenly" distractor (s/2) a whole dollar amount, so it can't be spotted
// as the odd one out; x ≠ 2y keeps "s − d" from colliding with the answer.
type Bill = { x: number; y: number }
const L3_POOL: Bill[] = []
for (let y = 1; y <= 9; y++)
  for (let x = y + 2; x <= Math.min(y + 10, 15); x += 2)
    if (x !== 2 * y) L3_POOL.push({ x, y })

// ── L1: read the crossing off the chart — build the point ─────────────────────
function crossTask(): Task {
  const { lines, x0, y0 } = rpick(L1_POOL)
  return {
    kind: 'cross', title: 'Break-even', badge: `${lineEq(lines[0].m, lines[0].b)}  &  ${lineEq(lines[1].m, lines[1].b)}`, tone: 'a',
    context: `Plan A: $${lines[0].b} a month plus $${lines[0].m} a gigabyte. Plan B: $${lines[1].b} plus $${lines[1].m}.`,
    instruction: 'Move the marker onto the point where the two lines cross.',
    showEquals: false,
    prompt: 'Build the point where the two plans cost the same.',
    say: `Both plans are drawn on the chart. Find where the two lines cross — that is the usage where they cost exactly the same — and move the marker onto it.`,
    work: [`The plan lines cross at ${ptStr(x0, y0)}: at ${x0} gigabytes both plans cost $${y0}.`],
    lines, x: x0, y: y0,
  }
}

// ── L2: substitution — how many GB until the plans cost the same? ─────────────
// A single number → the AnswerPad. Distractors, in order: reading the crossing's
// COST as its usage; subtracting the two fees and stopping (forgetting to divide by
// the rate gap); and subtracting the fees the wrong way round, which lands on a
// NEGATIVE usage — a child who is reasoning from the world can rule that one out,
// which is the point of a world that behaves.
function monthsTask(): Task {
  const { lines, x0, y0 } = rpick(L2_POOL)
  const [A, B] = lines
  return {
    kind: 'months', title: 'When do they tie?', badge: `${lineEq(A.m, A.b)}   &   ${lineEq(B.m, B.b)}`, tone: 'a',
    context: `Plan A is $${A.b} a month plus $${A.m} a gigabyte. Plan B is $${B.b} plus $${B.m}.`,
    padInstruction: 'Tap how many gigabytes until both plans cost the same.',
    showEquals: false,
    prompt: 'How many gigabytes until the two plans cost the same?',
    say: `Plan A costs ${spoken(A.b)} dollars plus ${spoken(A.m)} a gigabyte. Plan B costs ${spoken(B.b)} plus ${spoken(B.m)}. Set the two costs equal and find the usage where they tie.`,
    work: [`Set them equal: ${A.m}x + ${A.b} = ${B.m}x + ${B.b}. Take ${B.m}x from both sides: ${A.m - B.m}x + ${A.b} = ${B.b}. Take ${A.b} off: ${A.m - B.m}x = ${B.b - A.b}, so x = ${x0} gigabytes.`],
    lines, n: x0,
    pad: [y0, B.b - A.b, -x0],
  }
}

// ── L3: elimination on the shared BILL — what does YOUR line cost? ────────────
// The sum is the bill total; the difference is how much more your line costs. Both
// are sentences a person says about a bill, which is what the plan pair could not
// give. Distractors: solving for the wrong variable (your sibling's line), splitting
// the total evenly (ignoring the difference entirely), and forgetting to halve 2x.
function billTask(): Task {
  const { x, y } = rpick(L3_POOL)
  const s = x + y, d = x - y
  return {
    kind: 'bill', title: 'Split the bill', badge: `x + y = ${s}   &   x − y = ${d}`, tone: 'b',
    context: `One account, two lines. The bill totals $${s}, and your line costs $${d} more than your sibling's.`,
    padInstruction: 'Tap what YOUR line costs, in dollars.',
    showEquals: false,
    prompt: `Your line is x, theirs is y. What does your line cost?`,
    say: `The whole bill is ${spoken(s)} dollars, and your line costs ${spoken(d)} dollars more than your sibling's. Add the two equations to cancel y, then find what your line costs.`,
    work: [`Add them: the plus y and the minus y cancel, leaving 2x = ${s + d}, so x = $${x}. Then y = $${y}, and $${x} − $${y} = $${d}. ✓`],
    n: x,
    pad: [y, s / 2, s + d],
  }
}

// ── L3: classify one / none / infinite ───────────────────────────────────────
// Kept because a systems chapter that never meets the parallel case has not taught
// its own name. Built from the same positive-fee, positive-rate plans, so the "one
// solution" case still crosses at a real usage.
function classifyTask(): Task {
  const type = rpick(['one', 'none', 'infinite'] as const)
  let lines: Plan[]
  let why: string
  if (type === 'one') {
    lines = rpick(L1_POOL).lines
    why = 'different rates per gigabyte, so the plans cross exactly once'
  } else {
    const m = rpick([1, 2, 3]), b = rpick([1, 2, 3, 4])
    if (type === 'none') {
      lines = [{ m, b }, { m, b: b + rpick([2, 3, 4]) }]
      why = 'the same rate but a different monthly fee — one is always dearer by the same amount, so they never meet'
    } else {
      lines = [{ m, b }, { m, b }]
      why = 'the same fee and the same rate — it is the very same plan twice'
    }
  }
  const label = type === 'one' ? 'one solution' : type === 'none' ? 'no solution' : 'infinitely many solutions'
  return {
    kind: 'classify', title: 'Which case?', badge: `${lineEq(lines[0].m, lines[0].b)}   &   ${lineEq(lines[1].m, lines[1].b)}`, tone: 'b',
    context: 'Two plans from the same shop.',
    instruction: 'Sort this pair: how many break-even points does it have?',
    showEquals: false,
    prompt: 'How many break-even points does this pair of plans have?',
    say: 'How many break-even points does this pair of plans have: one, none, or infinitely many? Sort it into the right bin.',
    work: [`These have ${label}: ${why}.`],
    lines, answerId: type,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return crossTask()                                    // read the crossing
  if (d === 2) return monthsTask()                                   // solve it algebraically
  return Math.random() < 0.4 ? classifyTask() : billTask()           // elimination + the three cases
}

const CLASSIFY_CHOICES = [
  { id: 'one', label: 'One' },
  { id: 'none', label: 'None' },
  { id: 'infinite', label: 'Infinitely many' },
]

// ── shared chart geometry — used by BOTH the walkthrough scene and the L1 instrument,
//    so the picture the child solves on is the picture they were taught on. ──────
const CW = 320, CH = 240, CPAD = 30
const RANGE = CHART_MAX
const sx = (x: number) => CPAD + (x / RANGE) * (CW - 2 * CPAD)
const sy = (y: number) => CH - CPAD - (y / RANGE) * (CH - 2 * CPAD)
const FLOOR_Y = sy(0)
const TICKS = [2, 4, 6, 8]

/** Endpoints of a plan line clipped to the visible 0..RANGE window. */
function segOf(m: number, b: number) {
  const pts: [number, number][] = []
  for (let x = 0; x <= RANGE; x += 0.25) { const y = m * x + b; if (y >= 0 && y <= RANGE) pts.push([x, y]) }
  if (pts.length < 2) return null
  const a = pts[0], c = pts[pts.length - 1]
  return { x1: sx(a[0]), y1: sy(a[1]), x2: sx(c[0]), y2: sy(c[1]) }
}

/** The exact crossing, or null for a parallel/identical pair. */
function crossOfLines(l0?: Plan, l1?: Plan) {
  if (!l0 || !l1) return null
  const denom = l0.m - l1.m
  if (denom === 0) return null            // parallel or identical: there is no one point
  const x = (l1.b - l0.b) / denom
  return { x, y: l0.m * x + l0.b }
}

/** Axes, grid, ticks and the two plan lines — the static skeleton both pictures share. */
function ChartFrame({ p, lines, drawA = true, drawB = true, reduce }: {
  p: Palette; lines: Plan[]; drawA?: boolean; drawB?: boolean; reduce?: boolean | null
}): ReactElement {
  const lineCols = [p.gold, p.coral]
  return (
    <>
      {TICKS.map((g) => (
        <g key={`grid${g}`} opacity={0.5}>
          <line x1={sx(g)} y1={CPAD} x2={sx(g)} y2={FLOOR_Y} stroke={p.glassBorder} strokeWidth={0.5} strokeDasharray="2 4" />
          <line x1={CPAD} y1={sy(g)} x2={CW - CPAD} y2={sy(g)} stroke={p.glassBorder} strokeWidth={0.5} strokeDasharray="2 4" />
        </g>
      ))}
      <line x1={CPAD} y1={FLOOR_Y} x2={CW - CPAD} y2={FLOOR_Y} stroke={p.creamSoft} strokeWidth={1.6} />
      <line x1={CPAD} y1={FLOOR_Y} x2={CPAD} y2={CPAD} stroke={p.creamSoft} strokeWidth={1.6} />
      <text x={CW - CPAD} y={FLOOR_Y + 16} fill={p.mutedOnPaper} fontSize={10} textAnchor="end" style={{ fontFamily: 'var(--font-numeric)' }}>GB used →</text>
      <text x={CPAD - 7} y={CPAD + 2} fill={p.mutedOnPaper} fontSize={10} textAnchor="end" style={{ fontFamily: 'var(--font-numeric)' }}>$</text>
      {TICKS.map((g) => (
        <text key={`xt${g}`} x={sx(g)} y={FLOOR_Y + 14} fill={p.mutedOnPaper} fontSize={8.5} textAnchor="middle" style={{ fontFamily: 'var(--font-numeric)' }}>{g}</text>
      ))}
      {TICKS.map((g) => (
        <text key={`yt${g}`} x={CPAD - 6} y={sy(g) + 3} fill={p.mutedOnPaper} fontSize={8.5} textAnchor="end" style={{ fontFamily: 'var(--font-numeric)' }}>{g}</text>
      ))}
      {[lines[0], lines[1]].map((l, i) => {
        if (!l) return null
        const s = segOf(l.m, l.b)
        if (!s) return null
        const shown = i === 0 ? drawA : drawB
        return (
          <motion.line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={lineCols[i]} strokeWidth={3} strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: shown ? 1 : 0, opacity: shown ? 0.95 : 0 }}
            transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }} />
        )
      })}
    </>
  )
}

// ── L1 INSTRUMENT: the chart IS the answer surface ───────────────────────────
// The crossing is a PAIR, so this question never gets the AnswerPad — and the skill
// is reading a graph, so the graph has to be on screen while it is read. The two
// steppers drive a mint marker across the plot with live drop-guides; the child
// lands it on the visible crossing. Nothing is computed off-platform and dialled in.
function CrossReader({ P: p, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: V; setValue: (v: V) => void
  disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}): ReactElement {
  const a = value.k === 'pt' ? value.a : 0
  const b = value.k === 'pt' ? value.b : 0
  const lines = task.lines ?? []
  const onCrossing = a === task.x && b === task.y
  const mk = reveal || onCrossing ? p.mint : p.gold
  return (
    // gk-scene-cap: on a short frame the chart is capped so the builder's ▲▼ and the
    // commit button keep a finger-sized share of the scaled column (see GameShell).
    <div className="gk-scene-cap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.4vh, 16px)', width: '100%' }}>
      <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: 'clamp(240px, 31vw, 340px)', height: 'auto', background: p.glass, border: `1px solid ${p.glassBorder}`, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
        <ChartFrame p={p} lines={lines} />
        <g style={{ fontFamily: 'var(--font-numeric)' }}>
          <circle cx={CPAD + 2} cy={13} r={4} fill={p.gold} />
          <text x={CPAD + 10} y={17} fill={p.creamSoft} fontSize={10} fontWeight={700}>Plan A</text>
          <circle cx={CW - CPAD - 60} cy={13} r={4} fill={p.coral} />
          <text x={CW - CPAD - 52} y={17} fill={p.creamSoft} fontSize={10} fontWeight={700}>Plan B</text>
        </g>
        {/* drop-guides from the marker to both axes — reading a coordinate, made visible */}
        <line x1={sx(a)} y1={sy(b)} x2={sx(a)} y2={FLOOR_Y} stroke={mk} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7} />
        <line x1={sx(a)} y1={sy(b)} x2={CPAD} y2={sy(b)} stroke={mk} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7} />
        <g style={{ transition: 'transform 220ms' }} transform={`translate(${sx(a)}, ${sy(b)})`}>
          <circle r={9} fill={mk} opacity={0.22} />
          <circle r={5} fill={mk} stroke={p.cream} strokeWidth={1.4} />
        </g>
        <text x={sx(a)} y={FLOOR_Y + 14} textAnchor="middle" fill={mk} fontSize={10} fontWeight={800} style={{ fontFamily: 'var(--font-numeric)' }}>{a}</text>
        <text x={CPAD - 6} y={sy(b) - 4} textAnchor="end" fill={mk} fontSize={10} fontWeight={800} style={{ fontFamily: 'var(--font-numeric)' }}>${b}</text>
      </svg>
      <PartsBuilder P={p} value={{ a, b }} setValue={(pr) => setValue({ k: 'pt', a: pr.a, b: pr.b })} min={0} max={RANGE}
        template={(x, y) => `(${x} GB, $${y})`} labels={['GB', '$']}
        disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'pt', a: pr.a, b: pr.b })} commitLabel="LOCK THE DEAL ✓" />
    </div>
  )
}

// ── fixed worked example 1 (the chart) — Plan A: $1 fee + $2/GB, Plan B: $3 + $1/GB.
// They cross at (2 GB, $5): the pay-as-you-go plan wins below 2 GB, the bigger-fee
// plan wins above it. That swap is the whole reason anyone compares plans.
const DEMO_CROSS = crossOf(2, 1, 1, 2)
const DEMO_TASK: Task = {
  kind: 'cross', title: 'Break-even', badge: 'y = 2x + 1   &   y = x + 3', tone: 'a',
  prompt: '', say: '',
  work: ['Set 2x + 1 = x + 3: x = 2, then y = 5. So (2, 5).'],
  lines: DEMO_CROSS.lines, x: 2, y: 5,
}

// Beats — ONE idea + ONE board line each. The scene reads `stepIndex` to unlock each
// visual beat (draw A → draw B → scan the usage → break-even springs → algebra) and
// `value` (a,b) to drive the answer marker: it waits at the origin until x is solved,
// SLIDES along the usage axis, then RISES to the shared cost.
//   0 hook  1 A draws  2 B draws  3 low usage  4 high usage  5 they tie
//   6 crossing springs  7 set equal  8 take x off both sides  9 take the fee off
//  10 x = 2 → marker slides  11 y = 5 → marker rises  12 locked
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "You're at the phone shop comparing two plans. Each plan's cost is a line — dollars going up, gigabytes going across.", value: { k: 'pt', a: 0, b: 0 }, board: 'compare two plans' },
  { say: 'Plan A is pay as you go: one dollar a month, plus two dollars every gigabyte. Cheap to start, but it climbs steeply.', value: { k: 'pt', a: 0, b: 0 }, board: 'A: y = 2x + 1' },
  { say: 'Plan B charges three dollars a month, but only one dollar a gigabyte. It starts higher and climbs gently.', value: { k: 'pt', a: 0, b: 0 }, board: 'B: y = x + 3' },
  { say: 'Scan across to one gigabyte. Plan A is three dollars, Plan B is four. Plan A is the cheaper deal here.', value: { k: 'pt', a: 0, b: 0 }, board: 'at 1 GB → A cheaper' },
  { say: 'Now scan to three gigabytes. Plan A has climbed to seven dollars, Plan B is only six. They have swapped over.', value: { k: 'pt', a: 0, b: 0 }, board: 'at 3 GB → B cheaper' },
  { say: 'So somewhere in between, the two dots meet. At that usage both plans cost exactly the same.', value: { k: 'pt', a: 0, b: 0 }, board: 'somewhere they tie' },
  { say: 'That meeting spot is the break-even point — where the two lines cross. Watch it light up.', value: { k: 'pt', a: 0, b: 0 }, board: 'break-even = the crossing' },
  { say: 'To find it exactly, set the two costs equal: two x plus one equals x plus three.', value: { k: 'pt', a: 0, b: 0 }, board: '2x + 1 = x + 3' },
  { say: 'Take one x away from both sides. That leaves x plus one equals three.', value: { k: 'pt', a: 0, b: 0 }, board: 'x + 1 = 3' },
  { say: 'Now take the one dollar fee off both sides, so x is on its own.', value: { k: 'pt', a: 0, b: 0 }, board: 'x = 2' },
  { say: 'x is two. Two gigabytes. If a question ever asks only how many gigabytes until the plans tie, that number is the answer.', value: { k: 'pt', a: 2, b: 0 }, board: 'x = 2 GB' },
  { say: 'Put two back into either plan: two times two plus one is five dollars. The marker rises to the crossing.', value: { k: 'pt', a: 2, b: 5 }, board: 'y = 2(2) + 1 = 5' },
  { say: 'There it is — the plans break even at two gigabytes, five dollars. Move the marker onto that crossing.', value: { k: 'pt', a: 2, b: 5 }, board: 'break-even = (2 GB, $5)' },
]

// ── worked example 2 (the BILL) — the picture elimination actually lives in ────
// One account, two lines: yours (x) and your sibling's (y). The bill says the TOTAL
// is $20; you know yours costs $4 MORE. Both facts are ordinary sentences about a
// bill, which is exactly what the two-plan picture could never supply for a
// difference. Eight beats, ending on the number the pad will ask for.
const DEMO_BILL: Task = {
  kind: 'bill', title: 'Split the bill', badge: 'x + y = 20   &   x − y = 4', tone: 'b',
  prompt: '', say: '', work: [],
  n: 12,
}
const DEMO_BILL_STEPS: DemoStep<V>[] = [
  { say: 'Different picture, same account. One bill, two lines on it: yours and your sibling\'s. Neither line is printed separately.', value: { k: 'pt', a: 0, b: 0 }, board: 'one bill, two lines' },
  { say: 'The bill says the total is twenty dollars. Both lines together come to twenty.', value: { k: 'pt', a: 0, b: 0 }, board: 'x + y = 20' },
  { say: 'And you know one more thing: your line costs four dollars more than theirs. That is the difference between them.', value: { k: 'pt', a: 0, b: 0 }, board: 'x − y = 4' },
  { say: 'Stack the two facts. Notice the y in the first has a plus, and the y in the second has a minus.', value: { k: 'pt', a: 0, b: 0 }, board: 'stack them' },
  { say: 'So add the two lines together. Plus y and minus y cancel each other out — the sibling\'s line disappears.', value: { k: 'pt', a: 0, b: 0 }, board: 'add → the y cancels' },
  { say: 'What is left is two x equals twenty-four. Twenty plus four.', value: { k: 'pt', a: 0, b: 0 }, board: '2x = 24' },
  { say: 'Halve it: your line costs twelve dollars.', value: { k: 'pt', a: 12, b: 0 }, board: 'x = $12' },
  { say: 'Then their line is twenty take twelve, which is eight. Check it: twelve minus eight is four. Both facts hold. Your line is twelve.', value: { k: 'pt', a: 12, b: 8 }, board: 'y = $8  ·  12 − 8 = 4 ✓' },
]

// ── worked example 3 (the parallel pair) — the sorting gesture, worked ────────
// Same rate, different fee: the gap never closes, so there is NO break-even. Five
// beats, so the chart's later solve beats never fire.
const DEMO_PARALLEL: Task = {
  kind: 'classify', title: 'Which case?', badge: 'y = x + 1   &   y = x + 4', tone: 'b',
  prompt: '', say: '', work: [],
  lines: [{ m: 1, b: 1 }, { m: 1, b: 4 }], answerId: 'none',
}
const DEMO_PARALLEL_STEPS: DemoStep<V>[] = [
  { say: 'One last picture. Not every pair of plans breaks even at all.', value: { k: 'pt', a: 0, b: 0 }, board: 'two more plans' },
  { say: 'This Plan A is one dollar a month plus one dollar a gigabyte.', value: { k: 'pt', a: 0, b: 0 }, board: 'A: y = x + 1' },
  { say: 'And this Plan B charges four dollars a month — but exactly the same one dollar a gigabyte.', value: { k: 'pt', a: 0, b: 0 }, board: 'B: y = x + 4' },
  { say: 'At one gigabyte, B costs three dollars more. Same rate, so the gap stays open.', value: { k: 'pt', a: 0, b: 0 }, board: 'B is $3 dearer' },
  { say: 'At three gigabytes, B is still exactly three dollars dearer. The lines never meet, so there is no break-even. Sort a pair like this into None.', value: { k: 'pt', a: 0, b: 0 }, board: 'never meet → None' },
]

// ── hand-authored SVG comparison chart (storyboard: docs/storyboards/best-plan.md)
// A phone-shop cost-vs-usage chart. The math skeleton (axes, GB/$ ticks, both exact
// cost lines, the crossing) sits on the precise sx/sy mapping shared with the L1
// instrument. During the WALKTHROUGH it ACTS OUT the compare-and-solve: the lines
// DRAW in, a usage SCANNER sweeps across so the cheaper plan visibly swaps, the
// break-even SPRINGS in, then a mint marker SLIDES to x and RISES to y (driven by
// `value` through motion values so it flows between beats). `stepIndex` gates each
// beat; `useReducedMotion` collapses to the end state.
function PlanChart({ palette, task, value, stepIndex, frameCount, ended }: { palette: Palette; task: Task; value: V; stepIndex: number; frameCount: number; ended: boolean }) {
  const p = palette
  const reduce = useReducedMotion()
  const spring = { type: 'spring' as const, stiffness: 300, damping: 20 }

  const lines = task.lines ?? []
  const l0 = lines[0], l1 = lines[1]
  const costAt = (l: Plan | undefined, x: number) => (l ? l.m * x + l.b : 0)
  // A parallel/identical pair has NO crossing — guarding this is load-bearing: the
  // old version divided by a zero slope gap and drew a phantom crossing at (0, b).
  const X = crossOfLines(l0, l1)
  const crossInView = !!X && X.x >= 0 && X.x <= RANGE && X.y >= 0 && X.y <= RANGE

  // ── beat gating from stepIndex. frameCount==1 = intro pose. ──
  const inTutorial = frameCount > 1
  const drawA = !inTutorial || stepIndex >= 1
  const drawB = !inTutorial || stepIndex >= 2
  const sweeping = inTutorial && stepIndex >= 3 && stepIndex <= 5
  const meet = !inTutorial || stepIndex >= 6
  const showLegend = !inTutorial || stepIndex >= 2
  const showAns = inTutorial && stepIndex >= 10
  const showX = inTutorial && stepIndex >= 10
  const showY = inTutorial && stepIndex >= 11
  const resolved = !inTutorial || ended || stepIndex >= 12
  const sweepLabel = crossInView
    ? (stepIndex === 3 ? 'Plan A is cheaper here' : stepIndex === 4 ? 'Plan B is cheaper here' : 'tied — they meet')
    : 'the gap never closes'

  const ax = value.k === 'pt' ? value.a : 0
  const ay = value.k === 'pt' ? value.b : 0
  const built = value.k === 'pt' && value.a !== 0 && value.b !== 0

  // ── motion values: the usage scanner, the live costs, and the answer marker ──
  const usageMV = useMotionValue(2)
  const ansX = useMotionValue(0)
  const ansY = useMotionValue(0)
  // scan 1 → 3 → 2. Both stay inside the 0..8 window for every walkthrough pair, so
  // the riding dots never leave the chart.
  const usageTarget = sweeping ? [1, 3, 2][stepIndex - 3] : (X ? X.x : 2)
  useEffect(() => {
    const c = animate(usageMV, usageTarget, { duration: reduce ? 0 : 0.9, ease: [0.33, 0.02, 0.2, 1] })
    return () => c.stop()
  }, [usageTarget, reduce, usageMV])
  useEffect(() => {
    const c = animate(ansX, ax, { duration: reduce ? 0 : 0.7, ease: [0.33, 0.02, 0.2, 1] })
    return () => c.stop()
  }, [ax, reduce, ansX])
  useEffect(() => {
    const c = animate(ansY, ay, { duration: reduce ? 0 : 0.7, ease: [0.33, 0.02, 0.2, 1] })
    return () => c.stop()
  }, [ay, reduce, ansY])

  const scanPx = useTransform(usageMV, (u) => sx(u))
  const dotAY = useTransform(usageMV, (u) => sy(costAt(l0, u)))
  const dotBY = useTransform(usageMV, (u) => sy(costAt(l1, u)))
  const costAStr = useTransform(usageMV, (u) => `$${Math.round(costAt(l0, u))}`)
  const costBStr = useTransform(usageMV, (u) => `$${Math.round(costAt(l1, u))}`)
  const ansPx = useTransform(ansX, (x) => sx(x))
  const ansPy = useTransform(ansY, (y) => sy(y))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: 'clamp(240px, 31vw, 340px)', height: 'auto', background: p.glass, border: `1px solid ${p.glassBorder}`, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
        <ChartFrame p={p} lines={lines} drawA={drawA} drawB={drawB} reduce={reduce} />

        {/* usage SCANNER — a dot rides each plan line, so the cheaper one sits lower */}
        {sweeping && (
          <>
            <motion.g style={{ x: scanPx }}>
              <line x1={0} y1={CPAD} x2={0} y2={FLOOR_Y} stroke={p.creamSoft} strokeWidth={1.3} strokeDasharray="3 3" opacity={0.5} />
              <motion.g style={{ y: dotAY }}><circle r={4} fill={p.gold} stroke={p.cream} strokeWidth={1} /></motion.g>
              <motion.g style={{ y: dotBY }}><circle r={4} fill={p.coral} stroke={p.cream} strokeWidth={1} /></motion.g>
            </motion.g>
            <text x={CW / 2} y={CH - 7} textAnchor="middle" fill={p.creamSoft} fontSize={10} fontWeight={700} style={{ fontFamily: 'var(--font-numeric)' }}>{sweepLabel}</text>
          </>
        )}

        {/* break-even drop-guides — down to the usage axis, across to the cost axis */}
        {meet && crossInView && X && (
          <g>
            <motion.line x1={sx(X.x)} y1={sy(X.y)} x2={sx(X.x)} y2={FLOOR_Y} stroke={showX ? p.mint : p.creamSoft} strokeWidth={1.3} strokeDasharray="3 3"
              initial={{ opacity: 0 }} animate={{ opacity: showX ? 0.85 : 0.45 }} transition={{ duration: reduce ? 0 : 0.3 }} />
            <motion.line x1={sx(X.x)} y1={sy(X.y)} x2={CPAD} y2={sy(X.y)} stroke={showY ? p.mint : p.creamSoft} strokeWidth={1.3} strokeDasharray="3 3"
              initial={{ opacity: 0 }} animate={{ opacity: showY ? 0.85 : 0.35 }} transition={{ duration: reduce ? 0 : 0.3 }} />
            {showX && (
              <motion.text x={sx(X.x)} y={FLOOR_Y + 14} textAnchor="middle" fill={p.mint} fontSize={11} fontWeight={800} style={{ fontFamily: 'var(--font-numeric)' }}
                initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={spring}>{fmtInt(X.x)} GB</motion.text>
            )}
            {showY && (
              <motion.text x={CPAD - 6} y={sy(X.y) - 4} textAnchor="end" fill={p.mint} fontSize={11} fontWeight={800} style={{ fontFamily: 'var(--font-numeric)' }}
                initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={spring}>${fmtInt(X.y)}</motion.text>
            )}
          </g>
        )}

        {/* break-even crossing — springs in, glows mint when resolved, soft pulse ring */}
        {meet && crossInView && X && (
          <motion.g initial={reduce ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? { duration: 0 } : spring}
            style={{ x: sx(X.x), y: sy(X.y) }}>
            {resolved && !reduce && (
              <motion.circle r={6} fill={p.mint} initial={{ scale: 1, opacity: 0.35 }} animate={{ scale: [1, 2.1, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            )}
            <circle r={6} fill={resolved ? p.mint : p.gold} stroke={p.cream} strokeWidth={1.6} />
          </motion.g>
        )}

        {/* the answer marker — SLIDES along the usage axis to x, then RISES to y */}
        {showAns && (
          <motion.g style={{ x: ansPx, y: ansPy }}>
            <circle r={8} fill={p.mint} opacity={0.22} />
            <circle r={4.8} fill={p.mint} stroke={p.cream} strokeWidth={1.2} />
            {showY && (
              <motion.text x={10} y={-7} fill={p.mint} fontSize={12} fontWeight={800} style={{ fontFamily: 'var(--font-numeric)' }}
                initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={spring}>{ptStr(ax, ay)}</motion.text>
            )}
          </motion.g>
        )}

        {/* live plan-cost legend — the two prices count as the scanner moves */}
        {showLegend && (
          <g style={{ fontFamily: 'var(--font-numeric)' }}>
            <circle cx={CPAD + 2} cy={13} r={4} fill={p.gold} />
            <text x={CPAD + 10} y={17} fill={p.creamSoft} fontSize={10} fontWeight={700}>Plan A</text>
            <motion.text x={CPAD + 52} y={17} fill={p.gold} fontSize={11} fontWeight={800}>{costAStr}</motion.text>
            <circle cx={CW - CPAD - 86} cy={13} r={4} fill={p.coral} />
            <text x={CW - CPAD - 40} y={17} textAnchor="end" fill={p.creamSoft} fontSize={10} fontWeight={700}>Plan B</text>
            <motion.text x={CW - CPAD} y={17} textAnchor="end" fill={p.coral} fontSize={11} fontWeight={800}>{costBStr}</motion.text>
          </g>
        )}
      </svg>
      <div key={`${ax},${ay}`} style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(15px, 1.6vw, 22px)', fontWeight: 800, color: resolved && built ? p.mint : p.creamSoft, transition: 'color 300ms' }}>
        {built ? `break-even ${ptStr(ax, ay)}` : crossInView ? 'find where they cross' : 'do these ever meet?'}
      </div>
    </div>
  )
}

// ── THE BILL — elimination's picture ─────────────────────────────────────────
// A printed account statement with two line items whose amounts are hidden, the
// printed TOTAL, and the one extra fact you know: yours costs $d more. Adding the two
// facts is shown as a physical thing — the +y and the −y strike through and cancel —
// so "the y disappears" is watched, not asserted. Walkthrough-only (the graded
// question is a single dollar amount and takes the AnswerPad).
function BillBoard({ P: p, value, stepIndex, frameCount }: {
  P: Palette; value: V; stepIndex: number; frameCount: number
}): ReactElement {
  const yours = value.k === 'pt' ? value.a : 0
  const theirs = value.k === 'pt' ? value.b : 0
  const inWalk = frameCount > 1
  const showTotal = !inWalk || stepIndex >= 1
  const showDiff = !inWalk || stepIndex >= 2
  const stacked = !inWalk || stepIndex >= 3
  const cancelled = !inWalk || stepIndex >= 4
  const doubled = !inWalk || stepIndex >= 5

  const row = (label: string, amount: number, lit: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', borderBottom: `1px dashed ${p.glassBorder}` }}>
      <span style={{ fontSize: 'clamp(11px,1.2vw,14px)', color: p.creamSoft, fontWeight: 700 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(17px,2vw,24px)', fontWeight: 800, color: lit ? p.mint : p.gold, transition: 'color 300ms' }}>
        {amount > 0 ? `$${amount}` : '?'}
      </span>
    </div>
  )
  const eq = (text: string, on: boolean, strike?: boolean) => (
    <div style={{
      fontFamily: 'var(--font-numeric)', fontSize: 'clamp(14px,1.7vw,20px)', fontWeight: 800,
      color: strike ? p.mutedOnPaper : p.cream, opacity: on ? 1 : 0,
      textDecoration: strike ? 'line-through' : 'none', transition: 'opacity 320ms, color 320ms',
    }}>{text}</div>
  )

  return (
    <div style={{ width: 'clamp(268px, 44vw, 380px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${p.nightTop}, ${p.nightBot})`, border: `1.5px solid ${p.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', padding: 'clamp(14px,2vh,20px) clamp(14px,2vw,22px)', display: 'flex', flexDirection: 'column', gap: 'clamp(8px,1.4vh,14px)' }}>
      <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.creamSoft }}>Account statement</div>
      <div>
        {row('Your line  (x)', yours, yours > 0)}
        {row("Sibling's line  (y)", theirs, theirs > 0)}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 8 }}>
          <span style={{ fontSize: 'clamp(11px,1.2vw,14px)', color: p.cream, fontWeight: 800 }}>TOTAL</span>
          <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(19px,2.2vw,26px)', fontWeight: 800, color: showTotal ? p.cream : 'transparent', transition: 'color 300ms' }}>$20</span>
        </div>
      </div>
      <div style={{ minHeight: '1.5em', textAlign: 'center', fontSize: 'clamp(11px,1.2vw,14px)', fontWeight: 700, color: showDiff ? p.coral : 'transparent', transition: 'color 300ms' }}>
        yours costs $4 more than theirs
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: 'clamp(74px,10vh,96px)', justifyContent: 'center' }}>
        {eq('x + y = 20', stacked, cancelled)}
        {eq('x − y = 4', stacked, cancelled)}
        <div style={{ width: 'clamp(96px,13vw,140px)', height: 2, background: stacked ? p.glassBorder : 'transparent', margin: '3px 0', transition: 'background 300ms' }} />
        <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(16px,2vw,23px)', fontWeight: 800, color: p.mint, opacity: doubled ? 1 : 0, transition: 'opacity 320ms' }}>
          2x = 24
        </div>
      </div>
    </div>
  )
}

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'systemsOfEquations',
  title: 'BEST PLAN',
  ticketLabel: 'plan compare',
  palette: P,
  motif: '📱',
  makeTask,
  // PER-TASK gating: a question shows the pad only when its answer is a single
  // number. The crossing is a PAIR and the case-sort is a category, so both keep
  // their instruments — the chart is how L1 is solved, not decoration beside it.
  answerPad: (t) => (t.pad ? numChoices(t.n ?? 0, t.pad) : []),
  // REQUIRED here: V is a tagged union, so a bare tapped number would never match
  // `v.k === 'num'` and every padded answer would grade wrong, silently. (It shipped
  // that way once in Leaderboard — see src/__tests__/answerPadGrading.test.ts.)
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'cross' ? { k: 'pt', a: 0, b: 0 } : t.kind === 'classify' ? { k: 'pick', id: '' } : { k: 'num', n: 0 }),
  grade: (t, v) =>
    t.kind === 'cross' ? v.k === 'pt' && v.a === t.x && v.b === t.y
      : t.kind === 'classify' ? v.k === 'pick' && v.id === t.answerId
        : v.k === 'num' && v.n === t.n,
  revealText: (t) => {
    if (t.kind === 'cross') return `${t.x} GB, $${t.y}`
    if (t.kind === 'classify') return t.answerId === 'one' ? 'One solution' : t.answerId === 'none' ? 'No solution' : 'Infinitely many'
    return t.kind === 'bill' ? `$${t.n}` : `${t.n} GB`
  },
  glide: (t, _from, setValue, later) => later(() => setValue(
    t.kind === 'cross' ? { k: 'pt', a: t.x ?? 0, b: t.y ?? 0 }
      : t.kind === 'classify' ? { k: 'pick', id: t.answerId ?? '' }
        : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'cross') {
      return <CrossReader P={palette} task={task} value={value} setValue={setValue}
        disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    if (task.kind === 'classify') {
      const id = value.k === 'pick' ? value.id : ''
      return (
        <SpecPicker P={palette} choices={CLASSIFY_CHOICES} value={id} setValue={(x) => setValue({ k: 'pick', id: x })}
          correct={task.answerId} disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'pick', id: x })}
          commitLabel="SORT IT ✓" prompt="break-even points?" />
      )
    }
    // Fallback only: every `months`/`bill` task ships with `pad`, so GameShell renders
    // the AnswerPad and never reaches this. Kept so a future single-number task
    // without `pad` degrades to a dial rather than to nothing.
    const n = value.k === 'num' ? value.n : 0
    return <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={0} max={30}
      disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="LOCK IT IN ✓" />
  },
  // Branches by example: the chart examples pose on the chart, the elimination
  // example on the BILL — so the child watches the picture each question is set in,
  // never a different one.
  TutorialScene: ({ palette, task, value, stepIndex, frameCount, ended }) =>
    task.kind === 'bill'
      ? <BillBoard P={palette} value={value} stepIndex={stepIndex} frameCount={frameCount} />
      : <PlanChart palette={palette} task={task} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />,
  start: {
    blurb: <><strong>One phone account, two things to work out.</strong> Two plans are two cost lines — the smart choice is the <strong>break-even point</strong> where they cost the same. And when the bill lands with <strong>two lines on it</strong>, a total and a difference are enough to find both.</>,
    ticket: { title: 'Two plans', badge: 'y = 2x + 1  &  y = x + 3', tone: 'a' },
    startLabel: 'Compare the plans →',
  },
  overview: {
    say: 'Here is the plan. Two phone plans can be drawn as two cost lines: a monthly fee, plus a rate for every gigabyte. The best deal is the break-even point, where the lines cross and both plans cost the same. Later the bill arrives with two lines on it, and a total plus a difference is enough to find them both. Let us work them out together, nice and slow.',
    problem: <>Where do <strong>y = 2x + 1</strong> and <strong>y = x + 3</strong> break even?</>,
    points: [
      <>Each plan is a <strong>cost line</strong> — a monthly fee, then a rate per GB.</>,
      <>The <strong>break-even point</strong> is where the two lines <strong>cross</strong>.</>,
      <>Set the costs <strong>equal</strong>, solve for x, then read the cost.</>,
      <>On a shared bill, <strong>add</strong> the total and the difference — the other line cancels.</>,
    ],
  },
  // THREE worked examples, one per graded picture: the chart (build the crossing),
  // the bill (elimination), and the parallel pair (the sort). Nothing is scored that
  // the walkthrough has not shown — which is why there is no guided round.
  tutorial: [
    { task: DEMO_TASK, initial: { k: 'pt', a: 0, b: 0 }, hand: 'tap', steps: DEMO_STEPS },
    { task: DEMO_BILL, initial: { k: 'pt', a: 0, b: 0 }, hand: 'tap', steps: DEMO_BILL_STEPS },
    { task: DEMO_PARALLEL, initial: { k: 'pt', a: 0, b: 0 }, hand: 'tap', steps: DEMO_PARALLEL_STEPS },
  ],
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function BestPlan(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
