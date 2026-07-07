'use client'
/**
 * BestPlan — the Systems of Equations chapter (15–16) as a PLAYABLE GAME.
 * World: choosing the BEST PHONE PLAN. Two plans are two pricing LINES (a monthly
 * cost that grows with usage). The smart choice is the BREAK-EVEN point — where the
 * two plans cost the same. Solving the system = finding that crossing point (x, y).
 *
 * NON-MCQ (except the solution-count classification, styled as sorting):
 *   • SOLVE     → BUILD the crossing point (x, y) with the PartsBuilder (two steppers
 *                 assemble the point template, labels x / y). Production, not picking.
 *   • CLASSIFY  → SpecPicker with three "sort" cards: one / none / infinite solutions.
 *
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * cost-vs-usage chart (two plan lines, a marker sliding to the crossing point as the
 * walkthrough advances) → baby-step walkthrough → guided → scored play. The math is
 * mirrored from SystemsOfEquationsTeenLesson.makeRound (L1 graph / L2 substitution /
 * L3 elimination + classify) with clean integer solutions. No image assets.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, PartsBuilder, SpecPicker } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1a1633', nightBot: '#0e0b1e',
  cream: '#f1eefb', creamSoft: 'rgba(241,238,251,0.82)',
  inkOnPaper: '#1c1734', mutedOnPaper: '#7a6ea0',
  gold: '#8f7bff', goldDeep: '#5b46c9',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(26,22,51,0.6)', glassBorder: 'rgba(241,238,251,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
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

// The answer is either a crossing point (solve) or a solution-count sort (classify).
type V = { k: 'pt'; a: number; b: number } | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'solve' | 'classify'
  lines: { m: number; b: number }[]     // the two plan lines, shown as context
  x?: number; y?: number                 // solve: the integer crossing point
  answerId?: string                      // classify: 'one' | 'none' | 'infinite'
}

/** Build a 2-line system that crosses at integer (x0,y0) with distinct slopes. */
function systemThrough(x0: number, y0: number) {
  let m1 = rpick([-2, -1, 1, 2])
  let m2 = rpick([-2, -1, 1, 2, 3])
  let guard = 0
  while (m1 === m2 && guard++ < 20) m2 = rpick([-2, -1, 1, 2, 3])
  if (m1 === m2) m2 = m1 + 1
  return { lines: [{ m: m1, b: y0 - m1 * x0 }, { m: m2, b: y0 - m2 * x0 }], x0, y0 }
}

// ── L1: solve by graphing — find the crossing point ──────────────────────────
function solveGraph(): Task {
  const { lines, x0, y0 } = systemThrough(rint(-3, 3), rint(-3, 3))
  return {
    kind: 'solve', title: 'Break-even', badge: `${lineEq(lines[0].m, lines[0].b)}  &  ${lineEq(lines[1].m, lines[1].b)}`, tone: 'a',
    prompt: `Read the graph: build the point (x, y) where the two plans cost the same.`,
    say: `Look at the graph. The two plans cost the same where the lines cross. Build that crossing point as an x, y pair.`,
    work: [`The plan lines cross at ${ptStr(x0, y0)}. Build x = ${fmtInt(x0)}, y = ${fmtInt(y0)}.`],
    lines, x: x0, y: y0,
  }
}

// ── L2: substitution — solve the system, build the point ─────────────────────
function solveSub(): Task {
  const { lines, x0, y0 } = systemThrough(rint(-4, 4), rint(-4, 5))
  return {
    kind: 'solve', title: 'Break-even', badge: `${lineEq(lines[0].m, lines[0].b)}  &  ${lineEq(lines[1].m, lines[1].b)}`, tone: 'a',
    prompt: `Solve by substitution: build the point (x, y) where the plans meet.`,
    say: `Solve this by substitution. Set the two plan costs equal, find x, then y. Build the crossing point.`,
    work: [`Set them equal: ${lineEq(lines[0].m, lines[0].b).slice(4)} = ${lineEq(lines[1].m, lines[1].b).slice(4)} gives x = ${fmtInt(x0)}, then y = ${fmtInt(y0)}. So ${ptStr(x0, y0)}.`],
    lines, x: x0, y: y0,
  }
}

// ── L3: elimination (x+y=s, x−y=diff) — build the point ──────────────────────
function solveElim(): Task {
  const x0 = rint(-5, 6), y0 = rint(-5, 6)
  const s = x0 + y0, diff = x0 - y0
  const lines = [{ m: -1, b: s }, { m: 1, b: -diff }]
  return {
    kind: 'solve', title: 'Break-even', badge: `x + y = ${fmtInt(s)}   &   x − y = ${fmtInt(diff)}`, tone: 'b',
    prompt: `Eliminate by adding the equations, then build the point (x, y).`,
    say: `Use elimination. x plus y is ${spoken(s)}, and x minus y is ${spoken(diff)}. Add them to cancel y, then build the crossing point.`,
    work: [`Add the equations: 2x = ${fmtInt(s + diff)}, so x = ${fmtInt(x0)}; then y = ${fmtInt(y0)}. So ${ptStr(x0, y0)}.`],
    lines, x: x0, y: y0,
  }
}

// ── L3: classify one / none / infinite ───────────────────────────────────────
function classify(): Task {
  const type = rpick(['one', 'none', 'infinite'] as const)
  const m = rpick([-2, -1, 1, 2])
  const b = rint(-3, 3)
  let lines: { m: number; b: number }[]
  let why: string
  if (type === 'one') {
    let m2 = rpick([-2, -1, 1, 2, 3]); if (m2 === m) m2 = m + 1
    lines = [{ m, b }, { m: m2, b: b + rint(1, 3) }]
    why = 'different slopes, so the plans cross exactly once'
  } else if (type === 'none') {
    lines = [{ m, b }, { m, b: b + rint(2, 4) }]
    why = 'same slope, different start — parallel plans never meet'
  } else {
    lines = [{ m, b }, { m, b }]
    why = 'same slope and same start — they are the very same plan'
  }
  const label = type === 'one' ? 'one solution' : type === 'none' ? 'no solution' : 'infinitely many solutions'
  return {
    kind: 'classify', title: 'Which case?', badge: `${lineEq(lines[0].m, lines[0].b)}   &   ${lineEq(lines[1].m, lines[1].b)}`, tone: 'b',
    prompt: 'Sort this pair of plans: how many break-even points does it have?',
    say: 'How many break-even points does this pair of plans have: one, none, or infinitely many? Sort it into the right bin.',
    work: [`These have ${label}: ${why}.`],
    lines, answerId: type,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return solveGraph()
  if (d === 2) return solveSub()
  // L3 — elimination + classification
  const roll = Math.random()
  if (roll < 0.4) return classify()
  return Math.random() < 0.5 ? solveElim() : solveSub()
}

const CLASSIFY_CHOICES = [
  { id: 'one', label: 'One' },
  { id: 'none', label: 'None' },
  { id: 'infinite', label: 'Infinitely many' },
]

// ── fixed worked example (walkthrough) — a two-plan break-even ────────────────
// Plan A: y = x + 1 ; Plan B: y = −x + 5  → cross at (2, 3).
const DEMO_TASK: Task = {
  kind: 'solve', title: 'Break-even', badge: 'y = x + 1   &   y = −x + 5', tone: 'a',
  prompt: '', say: '',
  work: ['Set x + 1 = −x + 5: 2x = 4, x = 2; then y = 3. So (2, 3).'],
  lines: [{ m: 1, b: 1 }, { m: -1, b: 5 }], x: 2, y: 3,
}

// Walkthrough beats — GRANULAR baby steps, ONE idea + ONE board line each. The
// scene reads `stepIndex` to unlock each visual beat (draw A → draw B → scan the
// usage → break-even springs → algebra → build the point) and `value` (a,b) to
// drive the answer marker: it stays at the origin until we've solved x, then
// SLIDES along the usage axis to x, then RISES to the shared cost y.
//   0 hook: a comparison chart          9 isolate 2x = 4
//   1 Plan A line draws in             10 x = 2  → answer marker slides to usage 2
//   2 Plan B line draws in             11 y = 3  → marker rises to the crossing (2,3)
//   3 scan LOW usage → A cheaper       12 locked → break-even (2,3), all mint
//   4 scan HIGH usage → B cheaper
//   5 scan the MIDDLE → they tie
//   6 the break-even point springs in
//   7 set the two costs equal
//   8 gather the x terms
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "You're at the phone store comparing two plans. Each plan's monthly cost is drawn as a line — cost going up, usage going across.", value: { k: 'pt', a: 0, b: 0 }, board: 'compare two plans' },
  { say: 'Here is Plan A: y equals x plus one. Its line draws in — it starts at one dollar and climbs as you use more.', value: { k: 'pt', a: 0, b: 0 }, board: 'A: y = x + 1' },
  { say: 'Now Plan B: y equals negative x plus five. Its line draws in the other way, sloping down as usage grows.', value: { k: 'pt', a: 0, b: 0 }, board: 'B: y = −x + 5' },
  { say: 'Let us scan across the usage. At low usage, Plan A sits lower on the chart — Plan A is the cheaper deal here.', value: { k: 'pt', a: 0, b: 0 }, board: 'low usage → A cheaper' },
  { say: 'Now scan to high usage. The lines have swapped — Plan B sits lower now, so Plan B is the cheaper deal here.', value: { k: 'pt', a: 0, b: 0 }, board: 'high usage → B cheaper' },
  { say: 'Right in the middle, the two dots meet. At that usage both plans cost exactly the same.', value: { k: 'pt', a: 0, b: 0 }, board: 'they meet in the middle' },
  { say: 'That meeting spot is the break-even point — where the two lines cross. Watch it light up.', value: { k: 'pt', a: 0, b: 0 }, board: 'break-even = the crossing' },
  { say: 'To find it exactly, set the two costs equal: x plus one equals negative x plus five.', value: { k: 'pt', a: 0, b: 0 }, board: 'x + 1 = −x + 5' },
  { say: 'Add x to both sides to gather the x terms together: two x plus one equals five.', value: { k: 'pt', a: 0, b: 0 }, board: '2x + 1 = 5' },
  { say: 'Subtract one from both sides, so the x term is on its own: two x equals four.', value: { k: 'pt', a: 0, b: 0 }, board: '2x = 4' },
  { say: 'Divide both sides by two: x equals two. Watch the marker slide across to two gigabytes of usage.', value: { k: 'pt', a: 2, b: 0 }, board: 'x = 2' },
  { say: 'Put x equals two back in: y equals two plus one, which is three dollars. The marker rises to the crossing.', value: { k: 'pt', a: 2, b: 3 }, board: 'y = 2 + 1 = 3' },
  { say: 'There it is — the plans break even at the point two, three. Build that crossing point with the steppers.', value: { k: 'pt', a: 2, b: 3 }, board: 'break-even = (2, 3)' },
]

// ── hand-authored SVG comparison chart (storyboard: docs/storyboards/best-plan.md)
// A phone-store cost-vs-usage chart. The math skeleton (axes, GB/$ ticks, the two
// exact cost lines, the crossing) is code-drawn and sits on the precise sx/sy
// mapping. During the WALKTHROUGH it ACTS OUT the compare-and-solve: both plan
// lines DRAW in (pathLength), a usage SCANNER sweeps across so the cheaper plan
// visibly swaps at the middle, the break-even point SPRINGS in, then a mint answer
// marker SLIDES along the usage axis to x and RISES to the shared cost y (driven by
// `value` a,b through motion values, so it flows between beats). `stepIndex` gates
// each beat; `useReducedMotion` collapses to the end state. Outside the walkthrough
// (intro pose, frameCount==1) the full picture rests: both lines + the mint crossing.
function PlanChart({ palette, task, value, stepIndex, frameCount, ended }: { palette: Palette; task: Task; value: V; stepIndex: number; frameCount: number; ended: boolean }) {
  const p = palette
  const reduce = useReducedMotion()
  const W = 320, H = 240, PAD = 30
  const RANGE = 6 // plane spans 0..RANGE both axes (demo point (2,3) fits)
  const sx = (x: number) => PAD + (x / RANGE) * (W - 2 * PAD)
  const sy = (y: number) => H - PAD - (y / RANGE) * (H - 2 * PAD)
  const floorY = sy(0)
  const lineCols = [p.gold, p.coral]
  const spring = { type: 'spring' as const, stiffness: 300, damping: 20 }

  // Endpoints of each plan line clipped to the visible 0..RANGE window.
  const seg = (m: number, b: number) => {
    const pts: [number, number][] = []
    for (let x = 0; x <= RANGE; x += 0.25) { const y = m * x + b; if (y >= 0 && y <= RANGE) pts.push([x, y]) }
    if (pts.length < 2) return null
    const a = pts[0], c = pts[pts.length - 1]
    return { x1: sx(a[0]), y1: sy(a[1]), x2: sx(c[0]), y2: sy(c[1]) }
  }

  const l0 = task.lines[0], l1 = task.lines[1]
  const costAt = (l: { m: number; b: number } | undefined, x: number) => (l ? l.m * x + l.b : 0)
  // the exact crossing
  const denom = (l0?.m ?? 0) - (l1?.m ?? 0)
  const xc = denom !== 0 ? ((l1?.b ?? 0) - (l0?.b ?? 0)) / denom : 0
  const yc = costAt(l0, xc)
  const crossInView = xc >= 0 && xc <= RANGE && yc >= 0 && yc <= RANGE

  // ── beat gating from stepIndex (see DEMO_STEPS). frameCount==1 = intro pose. ──
  const inTutorial = frameCount > 1
  const drawA = !inTutorial || stepIndex >= 1
  const drawB = !inTutorial || stepIndex >= 2
  const sweeping = inTutorial && stepIndex >= 3 && stepIndex <= 5
  const meet = !inTutorial || stepIndex >= 6              // crossing point present
  const showLegend = !inTutorial || stepIndex >= 2
  const showAns = inTutorial && stepIndex >= 10           // answer marker slides/rises
  const showX = inTutorial && stepIndex >= 10
  const showY = inTutorial && stepIndex >= 11
  const resolved = !inTutorial || ended || stepIndex >= 12
  const sweepLabel = stepIndex === 3 ? 'Plan A is cheaper here' : stepIndex === 4 ? 'Plan B is cheaper here' : 'tied — they meet'

  const ax = value.k === 'pt' ? value.a : 0
  const ay = value.k === 'pt' ? value.b : 0
  const built = value.k === 'pt' && value.a !== 0 && value.b !== 0

  // ── motion values: the usage scanner + the two live costs, and the answer marker ──
  const usageMV = useMotionValue(2)  // horizontal focus (data units) — scanner / cost readouts
  const ansX = useMotionValue(0)     // answer-marker usage
  const ansY = useMotionValue(0)     // answer-marker cost
  // scanner target: sweep 1 → 4 → 2 across the three scan beats; else park at the crossing
  const usageTarget = sweeping ? [1, 4, 2][stepIndex - 3] : xc
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
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'clamp(240px, 31vw, 340px)', height: 'auto', background: p.glass, border: `1px solid ${p.glassBorder}`, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
        {/* faint plot grid */}
        {[2, 4, 6].map((g) => (
          <g key={`grid${g}`} opacity={0.5}>
            <line x1={sx(g)} y1={PAD} x2={sx(g)} y2={floorY} stroke={p.glassBorder} strokeWidth={0.5} strokeDasharray="2 4" />
            <line x1={PAD} y1={sy(g)} x2={W - PAD} y2={sy(g)} stroke={p.glassBorder} strokeWidth={0.5} strokeDasharray="2 4" />
          </g>
        ))}

        {/* axes — draw in */}
        <motion.line x1={PAD} y1={floorY} x2={W - PAD} y2={floorY} stroke={p.creamSoft} strokeWidth={1.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }} />
        <motion.line x1={PAD} y1={floorY} x2={PAD} y2={PAD} stroke={p.creamSoft} strokeWidth={1.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }} />
        <text x={W - PAD} y={floorY + 16} fill={p.mutedOnPaper} fontSize={10} textAnchor="end" style={{ fontFamily: 'var(--font-numeric)' }}>GB used →</text>
        <text x={PAD - 7} y={PAD + 2} fill={p.mutedOnPaper} fontSize={10} textAnchor="end" style={{ fontFamily: 'var(--font-numeric)' }}>$</text>
        {/* GB ticks */}
        {[2, 4, 6].map((g) => (
          <text key={`xt${g}`} x={sx(g)} y={floorY + 14} fill={p.mutedOnPaper} fontSize={8.5} textAnchor="middle" style={{ fontFamily: 'var(--font-numeric)' }}>{g}</text>
        ))}
        {/* $ ticks */}
        {[2, 4, 6].map((g) => (
          <text key={`yt${g}`} x={PAD - 6} y={sy(g) + 3} fill={p.mutedOnPaper} fontSize={8.5} textAnchor="end" style={{ fontFamily: 'var(--font-numeric)' }}>{g}</text>
        ))}

        {/* the two plan cost lines — each DRAWS in on its beat (pathLength) */}
        {[l0, l1].map((l, i) => {
          if (!l) return null
          const s = seg(l.m, l.b)
          if (!s) return null
          const shown = i === 0 ? drawA : drawB
          return (
            <motion.line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={lineCols[i]} strokeWidth={3} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: shown ? 1 : 0, opacity: shown ? 0.95 : 0 }}
              transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut', delay: reduce ? 0 : (shown && inTutorial ? 0.1 : 0) }} />
          )
        })}

        {/* usage SCANNER — sweeps across; a dot rides each plan line so the cheaper one sits lower */}
        {sweeping && (
          <>
            <motion.g style={{ x: scanPx }}>
              <line x1={0} y1={PAD} x2={0} y2={floorY} stroke={p.creamSoft} strokeWidth={1.3} strokeDasharray="3 3" opacity={0.5} />
              <motion.g style={{ y: dotAY }}><circle r={4} fill={p.gold} stroke={p.cream} strokeWidth={1} /></motion.g>
              <motion.g style={{ y: dotBY }}><circle r={4} fill={p.coral} stroke={p.cream} strokeWidth={1} /></motion.g>
            </motion.g>
            <text x={W / 2} y={H - 7} textAnchor="middle" fill={p.creamSoft} fontSize={10} fontWeight={700} style={{ fontFamily: 'var(--font-numeric)' }}>{sweepLabel}</text>
          </>
        )}

        {/* break-even drop-guides — to the usage axis (x) and across to the cost axis (y) */}
        {meet && crossInView && (
          <g>
            <motion.line x1={sx(xc)} y1={sy(yc)} x2={sx(xc)} y2={floorY} stroke={showX ? p.mint : p.creamSoft} strokeWidth={1.3} strokeDasharray="3 3"
              initial={{ opacity: 0 }} animate={{ opacity: showX ? 0.85 : 0.45 }} transition={{ duration: reduce ? 0 : 0.3 }} />
            <motion.line x1={sx(xc)} y1={sy(yc)} x2={PAD} y2={sy(yc)} stroke={showY ? p.mint : p.creamSoft} strokeWidth={1.3} strokeDasharray="3 3"
              initial={{ opacity: 0 }} animate={{ opacity: showY ? 0.85 : 0.35 }} transition={{ duration: reduce ? 0 : 0.3 }} />
            {showX && (
              <motion.text x={sx(xc)} y={floorY + 14} textAnchor="middle" fill={p.mint} fontSize={11} fontWeight={800} style={{ fontFamily: 'var(--font-numeric)' }}
                initial={reduce ? false : { opacity: 0, y: floorY + 8 }} animate={{ opacity: 1, y: floorY + 14 }} transition={spring}>x = {fmtInt(xc)}</motion.text>
            )}
            {showY && (
              <motion.text x={PAD - 6} y={sy(yc) - 4} textAnchor="end" fill={p.mint} fontSize={11} fontWeight={800} style={{ fontFamily: 'var(--font-numeric)' }}
                initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={spring}>${fmtInt(yc)}</motion.text>
            )}
          </g>
        )}

        {/* break-even crossing — springs in, glows mint when resolved, soft pulse ring */}
        {meet && crossInView && (
          <motion.g initial={reduce ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? { duration: 0 } : spring}
            style={{ x: sx(xc), y: sy(yc) }}>
            {resolved && !reduce && (
              <motion.circle r={6} fill={p.mint} initial={{ scale: 1, opacity: 0.35 }} animate={{ scale: [1, 2.1, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            )}
            <circle r={6} fill={resolved ? p.mint : p.gold} stroke={p.cream} strokeWidth={1.6} />
          </motion.g>
        )}

        {/* the answer marker — SLIDES along the usage axis to x, then RISES to the shared cost y */}
        {showAns && (
          <motion.g style={{ x: ansPx, y: ansPy }}>
            <circle r={8} fill={p.mint} opacity={0.22} />
            <circle r={4.8} fill={p.mint} stroke={p.cream} strokeWidth={1.2} />
            {showY && (
              <motion.text x={10} y={-7} fill={p.mint} fontSize={12} fontWeight={800} style={{ fontFamily: 'var(--font-numeric)' }}
                initial={reduce ? false : { opacity: 0, x: 4 }} animate={{ opacity: 1, x: 10 }} transition={spring}>{ptStr(ax, ay)}</motion.text>
            )}
          </motion.g>
        )}

        {/* live plan-cost legend — the two prices count as the scanner moves */}
        {showLegend && (
          <g style={{ fontFamily: 'var(--font-numeric)' }}>
            <circle cx={PAD + 2} cy={13} r={4} fill={p.gold} />
            <text x={PAD + 10} y={17} fill={p.creamSoft} fontSize={10} fontWeight={700}>Plan A</text>
            <motion.text x={PAD + 52} y={17} fill={p.gold} fontSize={11} fontWeight={800}>{costAStr}</motion.text>
            <circle cx={W - PAD - 86} cy={13} r={4} fill={p.coral} />
            <text x={W - PAD - 40} y={17} textAnchor="end" fill={p.creamSoft} fontSize={10} fontWeight={700}>Plan B</text>
            <motion.text x={W - PAD} y={17} textAnchor="end" fill={p.coral} fontSize={11} fontWeight={800}>{costBStr}</motion.text>
          </g>
        )}
      </svg>
      <div key={`${ax},${ay}`} style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(15px, 1.6vw, 22px)', fontWeight: 800, color: resolved && built ? p.mint : p.creamSoft, transition: 'color 300ms' }}>
        {built ? `break-even ${ptStr(ax, ay)}` : 'find where they cross'}
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
  initialValue: (t) => (t.kind === 'solve' ? { k: 'pt', a: 0, b: 0 } : { k: 'pick', id: '' }),
  grade: (t, v) => {
    if (t.kind === 'solve') return v.k === 'pt' && v.a === t.x && v.b === t.y
    return v.k === 'pick' && v.id === t.answerId
  },
  revealText: (t) => {
    if (t.kind === 'solve') return ptStr(t.x ?? 0, t.y ?? 0)
    return t.answerId === 'one' ? 'One solution' : t.answerId === 'none' ? 'No solution' : 'Infinitely many'
  },
  glide: (t, _from, setValue, later) => {
    if (t.kind === 'solve') later(() => setValue({ k: 'pt', a: t.x ?? 0, b: t.y ?? 0 }), 320)
    else later(() => setValue({ k: 'pick', id: t.answerId ?? '' }), 320)
  },
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'solve') {
      const a = value.k === 'pt' ? value.a : 0, b = value.k === 'pt' ? value.b : 0
      return (
        <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'pt', a: pr.a, b: pr.b })} min={-9} max={9}
          template={(x, y) => `(${fmtInt(x)}, ${fmtInt(y)})`} labels={['x', 'y']}
          disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'pt', a: pr.a, b: pr.b })} commitLabel="LOCK THE DEAL ✓" />
      )
    }
    const id = value.k === 'pick' ? value.id : ''
    return (
      <SpecPicker P={palette} choices={CLASSIFY_CHOICES} value={id} setValue={(x) => setValue({ k: 'pick', id: x })}
        correct={task.answerId} disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'pick', id: x })}
        commitLabel="SORT IT ✓" prompt="break-even points?" />
    )
  },
  TutorialScene: ({ palette, task, value, stepIndex, frameCount, ended }) => (
    <PlanChart palette={palette} task={task} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />
  ),
  start: {
    blurb: <><strong>You&apos;re picking the best phone plan.</strong> Two plans are two cost lines. The smart choice is the <strong>break-even point</strong> — where they cost the same. Solving the system finds it exactly.</>,
    ticket: { title: 'Two plans', badge: 'y = x + 1  &  y = −x + 5', tone: 'a' },
    startLabel: 'Compare the plans →',
  },
  overview: {
    say: 'Here is the plan. Two phone plans can be drawn as two cost lines. The best deal is the break-even point, where the lines cross and both plans cost exactly the same. To find it, we make the two costs equal, solve for x, then find y. Let us do one together, nice and slow.',
    problem: <>Where do <strong>y = x + 1</strong> and <strong>y = −x + 5</strong> break even?</>,
    points: [
      <>Each plan is a <strong>cost line</strong> — the price grows with usage.</>,
      <>The <strong>break-even point</strong> is where the two lines <strong>cross</strong>.</>,
      <>Set the costs <strong>equal</strong>, solve for x, then build the point (x, y).</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'pt', a: 0, b: 0 }, hand: 'tap', steps: DEMO_STEPS },
  guided: {
    task: {
      kind: 'solve', title: 'Break-even', badge: 'y = x − 1   &   y = −x + 3', tone: 'a', prompt: '',
      say: 'Your turn — I will help. These two plans cross at one point. Build the break-even point.',
      work: ['Set x − 1 = −x + 3: 2x = 4, x = 2; then y = 1. So (2, 1).'],
      lines: [{ m: 1, b: -1 }, { m: -1, b: 3 }], x: 2, y: 1,
    },
    coach: 'Your turn — I will help. Build where these two plans break even.', hand: 'tap',
  },
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function BestPlan(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
