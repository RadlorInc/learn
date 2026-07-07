'use client'
/**
 * TheShot — the Quadratics & Parabolas chapter (15–16) as a PLAYABLE GAME.
 * World: a basketball shot 🏀 — the ball's flight is a projectile ARC (a parabola).
 * Where it lands = the ROOTS; the peak of the arc = the VERTEX.
 *
 * NON-MCQ, the interaction MATCHES the theme (build the answer, don't pick it):
 *   • ROOTS   → PartsBuilder "x = a, b"  (where the ball lands — two landing x's).
 *   • VERTEX  → PartsBuilder "(a, b)"    (the peak of the arc — its coordinates).
 * The one exception (irrational quadratic-formula roots can't be built as integers):
 *   • FORMULA → SpecPicker radical-form options  (pick the radical-form landing).
 *
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * parabola arc scene → baby-step walkthrough → guided → scored play. The math is
 * mirrored from QuadraticsParabolasTeenLesson.makeRound (L1 read / L2 solve /
 * L3 quadratic formula). Illustration assets deferred; the scene is code-drawn SVG.
 */
import { useEffect, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, PartsBuilder, SpecPicker, type SpecChoice } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1c3d', nightBot: '#160f24',
  cream: '#f3edff', creamSoft: 'rgba(243,237,255,0.82)',
  inkOnPaper: '#1e1630', mutedOnPaper: '#7a6d95',
  gold: '#ffb347', goldDeep: '#e08a1e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(40,26,64,0.6)', glassBorder: 'rgba(243,237,255,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)
const minus = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)

// ── value + task types ──────────────────────────────────────────────────────
// roots  → the two landing x's (order-independent)
// vertex → the peak coordinates (a, b) = (h, k)
// pick   → a radical-form choice id (irrational quadratic-formula roots)
type V =
  | { k: 'roots'; a: number; b: number }
  | { k: 'vertex'; a: number; b: number }
  | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'roots' | 'vertex' | 'formula'
  // parabola y = pa·x² + pb·x + pc (drawn in the scene)
  pa: number; pb: number; pc: number
  r1?: number; r2?: number     // roots
  h?: number; kk?: number      // vertex (h, k)
  choices?: SpecChoice[]       // formula options
  answerId?: string            // formula correct id
}

/** Build a parabola with integer roots r1, r2 (a = ±1) and its vertex. */
function fromRoots(a: number, r1: number, r2: number) {
  if (r1 > r2) [r1, r2] = [r2, r1]
  const pb = -a * (r1 + r2)
  const pc = a * r1 * r2
  const h = (r1 + r2) / 2
  const kk = a * (h - r1) * (h - r2)
  return { a, r1, r2, pb, pc, h, kk }
}

// ── L1: read roots OR vertex off a shown integer-rooted parabola ────────────
function readTask(): Task {
  const a = pick([1, 1, -1])
  let r1 = rint(-4, 4), r2 = rint(-4, 4), g = 0
  while (r2 === r1 && g++ < 20) r2 = rint(-4, 4)
  const q = fromRoots(a, r1, r2)
  if (Math.random() < 0.5) {
    return {
      kind: 'roots', title: 'The landing', badge: `y = ${quad(q.a, q.pb, q.pc)}`, tone: 'a',
      prompt: 'Build where the ball lands — the two roots.',
      say: `Read the arc. Where does the ball land — the two x values where it crosses the floor? Build them.`,
      work: [`It crosses the floor at x = ${minus(q.r1)} and x = ${minus(q.r2)} — those are the roots.`],
      pa: q.a, pb: q.pb, pc: q.pc, r1: q.r1, r2: q.r2,
    }
  }
  return {
    kind: 'vertex', title: 'The peak', badge: `y = ${quad(q.a, q.pb, q.pc)}`, tone: 'a',
    prompt: 'Build the peak of the arc — the vertex (h, k).',
    say: `Read the arc. Where is the peak — the turning point of the shot? Build the vertex.`,
    work: [`The peak is halfway between the roots at x = ${minus(q.h)}, and there y = ${minus(q.kk)}. Vertex (${minus(q.h)}, ${minus(q.kk)}).`],
    pa: q.a, pb: q.pb, pc: q.pc, h: q.h, kk: q.kk,
  }
}

// ── L2: solve by factoring (roots) OR by square roots → build the roots ─────
function solveTask(): Task {
  if (Math.random() < 0.5) {
    // factor x² + bx + c = 0, integer roots
    let r1 = rint(-6, 6), r2 = rint(-6, 6), g = 0
    while ((r2 === r1 || r1 === 0 || r2 === 0) && g++ < 30) { r1 = rint(-6, 6); r2 = rint(-6, 6) }
    const q = fromRoots(1, r1, r2)
    return {
      kind: 'roots', title: 'Solve the shot', badge: `${quad(1, q.pb, q.pc)} = 0`, tone: 'a',
      prompt: 'Solve by factoring — build the two roots.',
      say: `Solve this shot by factoring. Find where it lands and build the two roots.`,
      work: [`Two numbers that multiply to ${minus(q.pc)} and add to ${minus(q.pb)} are ${minus(-q.r1)} and ${minus(-q.r2)}. So x = ${minus(q.r1)} and x = ${minus(q.r2)}.`],
      pa: 1, pb: q.pb, pc: q.pc, r1: q.r1, r2: q.r2,
    }
  }
  // square roots: x² = k (perfect square) → roots ±root
  const root = rint(2, 7)
  const k = root * root
  return {
    kind: 'roots', title: 'Solve the shot', badge: `x² = ${k}`, tone: 'a',
    prompt: 'Solve by square roots — build both roots.',
    say: `Solve x squared equals ${k} by taking square roots. Build both landing points.`,
    work: [`Take the square root of both sides — remember both signs: x = ±√${k} = ±${root}.`],
    pa: 1, pb: 0, pc: -k, r1: -root, r2: root,
  }
}

// ── L3: quadratic formula, irrational discriminant → pick the radical form ──
function formulaTask(): Task {
  let b = 0, c = 0, disc = 0, g = 0
  do { b = rint(-6, 6); c = rint(-5, 5); disc = b * b - 4 * c; g++ }
  while ((disc <= 0 || Number.isInteger(Math.sqrt(disc))) && g < 200)
  const ans = `x = (${minus(-b)} ± √${disc}) / 2`
  const opts = shuffle([
    { id: ans, label: ans },
    { id: `x = (${minus(b)} ± √${disc}) / 2`, label: `x = (${minus(b)} ± √${disc}) / 2` },
    { id: `x = (${minus(-b)} ± √${disc + 4}) / 2`, label: `x = (${minus(-b)} ± √${disc + 4}) / 2` },
    { id: `x = (${minus(-b)} ± √${Math.abs(disc - 4)}) / 2`, label: `x = (${minus(-b)} ± √${Math.abs(disc - 4)}) / 2` },
  ])
  return {
    kind: 'formula', title: 'Long-range shot', badge: `${quad(1, b, c)} = 0`, tone: 'b',
    prompt: 'The ball lands at irrational spots — pick the radical form.',
    say: `This shot lands at points you cannot count off — irrational. Use the quadratic formula and pick the radical form where it lands.`,
    work: [`With a = 1, b = ${minus(b)}, c = ${minus(c)}: discriminant = b² − 4ac = ${disc}. Then x = (−b ± √disc) / 2a = ${ans}.`],
    pa: 1, pb: b, pc: c, choices: opts, answerId: ans,
  }
}

/** Tidy y = a x² + b x + c into a label. */
function quad(a: number, b: number, c: number): string {
  const aPart = a === 1 ? 'x²' : a === -1 ? '−x²' : `${a < 0 ? '−' : ''}${Math.abs(a)}x²`
  let s = aPart
  if (b !== 0) s += ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? 'x' : `${Math.abs(b)}x`}`
  if (c !== 0) s += ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
  return s
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return readTask()
  if (d === 2) return solveTask()
  return formulaTask()
}

// ── fixed worked example (walkthrough) — read the landing off an arc ────────
// y = x² − 4  →  roots ±2, vertex (0, −4).  Find the roots.
const DEMO_TASK: Task = {
  kind: 'roots', title: 'The landing', badge: 'y = x² − 4', tone: 'a',
  prompt: '', say: '', work: ['It crosses the floor at x = −2 and x = 2 — those are the roots.'],
  pa: 1, pb: 0, pc: -4, r1: -2, r2: 2,
}
// The walkthrough acts out the SHOT: the ball launches from the left root, rises
// to the peak (vertex), and falls to the right root. `a` carries the ball's
// progress along the arc (0 = left launch, 50 = peak, 100 = right landing); `b`
// is a beat flag the scene reads to reveal markers/labels as they're spoken.
//   b=0 idle/setup · b=1 launched, rising · b=2 at peak · b=3 landed · b=4 solved
// Ten BABY steps: the physical shot is the hook (setup → launch → peak → land),
// then the algebra unfolds one move per step while the ball rests at the landing.
// Each step = one idea + one chalkboard line + its own scene beat.
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Here's a shot. The ball's flight traces a curve called a parabola: y equals x squared minus four.", value: { k: 'roots', a: 0, b: 0 }, board: 'y = x² − 4' },
  { say: 'The two roots are where the ball lands — the spots where its flight touches the floor, the line where y equals zero.', value: { k: 'roots', a: 0, b: 0 }, board: 'roots: where y = 0' },
  { say: 'Watch it go. The ball launches up from the left and starts to arc across the court.', value: { k: 'roots', a: 10, b: 1 }, board: 'launch → it arcs' },
  { say: 'Up it rises to the peak of the arc — the turning point, the very top of the shot.', value: { k: 'roots', a: 50, b: 2 }, board: 'peak = turning point' },
  { say: 'Then it falls back down and lands on the right. Those two landing spots are the roots we want.', value: { k: 'roots', a: 100, b: 3 }, board: 'it lands: two roots' },
  { say: 'To find exactly where it lands, we set the height to zero. On the floor, y equals zero.', value: { k: 'roots', a: 100, b: 3 }, board: 'set y = 0' },
  { say: 'So our equation becomes x squared minus four equals zero.', value: { k: 'roots', a: 100, b: 3 }, board: 'x² − 4 = 0' },
  { say: 'Add four to both sides, so x squared sits on its own: x squared equals four.', value: { k: 'roots', a: 100, b: 3 }, board: 'x² = 4' },
  { say: 'Take the square root of both sides — and keep both signs, because a positive and a negative both work. x equals plus or minus the square root of four.', value: { k: 'roots', a: 100, b: 3 }, board: 'x = ±√4' },
  { say: 'The square root of four is two, so x is plus or minus two. The ball lands at negative two and at two. Build those two roots.', value: { k: 'roots', a: 100, b: 4 }, board: 'x = ±2  →  x = −2, 2' },
]

// ── hand-authored SVG basketball court (storyboard: docs/storyboards/the-shot.md)
// A stylised arena stage — dusk backdrop + spotlight + crowd, wood court floor at
// the x-axis, a chalk math grid over it, a shooter at the left root and a target
// hoop at the right root. During the WALKTHROUGH the ball ACTS OUT the shot: it
// launches from the left root spinning with a squash, arcs to the peak (peak
// marker springs), and drops through the net at the right landing (net swish +
// root pins). Everything sits on the exact coordinate mapping (sx/sy) so the math
// stays correct; only the *stage* around it is art. Outside the walkthrough the
// same set marks the roots / vertex the task carries, ball resting at the target.
function ArcScene({ palette, task, value, stepIndex, ended }: {
  palette: Palette; task: Task; value: V; stepIndex: number; ended: boolean
}) {
  void stepIndex
  const p = palette
  const reduce = useReducedMotion()
  const W = 340, H = 300, R = 10 // grid half-range in x; y mapped so floor (y=0) sits mid-frame
  const sx = (x: number) => ((x + R) / (2 * R)) * W
  const sy = (y: number) => H - ((y + R) / (2 * R)) * H
  const floorY = sy(0)

  // the graphed parabola y = pa x² + pb x + c (the equation on the board) — faint chalk trace
  const graphD = useMemo(() => {
    const f = (x: number) => task.pa * x * x + task.pb * x + task.pc
    const pts: string[] = []
    for (let i = 0; i <= 120; i++) {
      const x = -R + (i / 120) * (2 * R)
      const y = f(x)
      if (y < -R - 2 || y > R + 2) { if (pts.length) pts.push('M'); continue }
      pts.push(`${pts.length && pts[pts.length - 1] !== 'M' ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`)
    }
    return pts.join(' ').replace(/M M/g, 'M').trim()
  }, [task.pa, task.pb, task.pc])

  const hasRoots = task.r1 !== undefined && task.r2 !== undefined
  const hasVertex = task.h !== undefined && task.kk !== undefined
  const inBox = (x: number, y: number) => Math.abs(x) <= R && Math.abs(y) <= R

  const acting = value.k === 'roots' && hasRoots && task.kind === 'roots'
  const targetProg = acting ? Math.max(0, Math.min(100, value.a)) / 100 : 0
  const beat = acting ? value.b : 0

  // shot-arc geometry: a downward projectile arc (∩) through the two roots
  const rL = hasRoots ? Math.min(task.r1!, task.r2!) : -2
  const rR = hasRoots ? Math.max(task.r1!, task.r2!) : 2
  const mid = (rL + rR) / 2
  const PEAK = 6
  const half = (rR - rL) / 2 || 1
  const shotY = (x: number) => PEAK * (1 - ((x - mid) / half) ** 2)

  // ── CONTINUOUS ball travel: a motion value driven at 60fps by Framer Motion,
  //    so the ball flows along the CURVE between beats instead of snapping. ──
  const progress = useMotionValue(0)
  useEffect(() => {
    const controls = animate(progress, targetProg, { duration: reduce ? 0 : (acting ? 1.5 : 0.3), ease: [0.33, 0.02, 0.2, 1] })
    return () => controls.stop()
  }, [targetProg, acting, reduce, progress])
  const ballCX = useTransform(progress, (t) => sx(rL + (rR - rL) * t))
  const ballCY = useTransform(progress, (t) => sy(shotY(rL + (rR - rL) * t)))
  const ballSpin = useTransform(progress, (t) => -t * 760)                      // spins as it flies
  const squashX = useTransform(progress, [0, 0.12, 0.86, 1], [0.78, 1, 1, 1.16]) // stretch on release, squash on land
  const squashY = useTransform(progress, [0, 0.12, 0.86, 1], [1.22, 1, 1, 0.82])
  // the flight trail grows continuously behind the ball
  const trailD = useTransform(progress, (t) => {
    const out: string[] = []
    const N = 44
    for (let i = 0; i <= N; i++) {
      const x = rL + (rR - rL) * (i / N) * t
      out.push(`${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(shotY(x)).toFixed(1)}`)
    }
    return out.join(' ')
  })

  const rising = beat === 1 || beat === 2
  const landed = beat >= 3
  const released = acting && beat >= 1
  const showRoots = acting ? beat >= 3 : (ended || task.kind !== 'roots')
  const showVertex = acting ? beat >= 2 : (ended || task.kind !== 'vertex')
  const showPeak = acting && beat >= 2
  const done = ended || task.kind === 'formula' || (acting && beat >= 4)
  const graphCol = done ? p.mint : p.gold
  const spring = { type: 'spring' as const, stiffness: 320, damping: 18 }
  const B = 12 // ball radius (svg units)

  // shooter geometry (at the left root, standing on the floor)
  const shX = sx(rL)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="clamp(230px, 32vw, 360px)" height="auto" style={{ borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="ts_sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#241634" />
            <stop offset="0.55" stopColor="#1b1029" />
            <stop offset="1" stopColor="#140b1f" />
          </linearGradient>
          <radialGradient id="ts_spot" cx="0.5" cy="0.16" r="0.75">
            <stop offset="0" stopColor="#fff3d6" stopOpacity="0.30" />
            <stop offset="0.45" stopColor="#ffd98a" stopOpacity="0.08" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ts_wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a4a24" />
            <stop offset="1" stopColor="#5a3418" />
          </linearGradient>
          <radialGradient id="ts_ball" cx="0.36" cy="0.32" r="0.75">
            <stop offset="0" stopColor="#ffb765" />
            <stop offset="0.55" stopColor="#f08a2e" />
            <stop offset="1" stopColor="#c9631a" />
          </radialGradient>
        </defs>

        {/* ── arena backdrop ── */}
        <rect x={0} y={0} width={W} height={H} fill="url(#ts_sky)" />
        {/* crowd tiers — faint silhouette rows high up */}
        <g opacity={0.5}>
          {[18, 30, 42].map((cy, r) => (
            <g key={`crowd${r}`} opacity={0.16 + r * 0.03}>
              <rect x={0} y={cy} width={W} height={9} fill="#0c0716" />
              {Array.from({ length: 20 }).map((_, i) => (
                <circle key={i} cx={8 + i * (W / 19)} cy={cy + 3} r={2.2} fill={i % 3 === 0 ? p.gold : p.cream} opacity={0.35} />
              ))}
            </g>
          ))}
        </g>
        {/* spotlight pooling onto the court */}
        <rect x={0} y={0} width={W} height={H} fill="url(#ts_spot)" />

        {/* ── court floor at the x-axis + dim apron below ── */}
        <rect x={0} y={floorY} width={W} height={H - floorY} fill="url(#ts_wood)" opacity={0.9} />
        <rect x={0} y={floorY} width={W} height={H - floorY} fill="#0c0716" opacity={0.34} />
        {/* floor sheen + a receding key arc */}
        <ellipse cx={W / 2} cy={floorY} rx={W * 0.46} ry={10} fill="#ffe6b0" opacity={0.06} />
        <path d={`M${sx(-3)},${floorY} A ${sx(3) - sx(0)} 22 0 0 1 ${sx(3)},${floorY}`} fill="none" stroke="#ffe6b0" strokeOpacity={0.12} strokeWidth={1.4} />

        {/* ── chalk math grid + axis (over the court, load-bearing) ── */}
        {[-R, -5, 5, R].map((gx) => (
          <line key={`v${gx}`} x1={sx(gx)} y1={0} x2={sx(gx)} y2={H} stroke={p.glassBorder} strokeWidth={0.6} opacity={0.5} />
        ))}
        {[5, R].map((gy) => (
          <g key={`h${gy}`}>
            <line x1={0} y1={sy(gy)} x2={W} y2={sy(gy)} stroke={p.glassBorder} strokeWidth={0.6} strokeDasharray="3 4" opacity={0.4} />
            <line x1={0} y1={sy(-gy)} x2={W} y2={sy(-gy)} stroke={p.glassBorder} strokeWidth={0.6} strokeDasharray="3 4" opacity={0.4} />
          </g>
        ))}
        <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke={p.glassBorder} strokeWidth={1} opacity={0.55} />
        <motion.line x1={0} y1={floorY} x2={W} y2={floorY} stroke={p.creamSoft} strokeWidth={1.8}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} />
        {/* x-axis ticks/labels at the integer roots-range */}
        {[-8, -4, 4, 8].map((n) => inBox(n, 0) && (
          <text key={`xl${n}`} x={sx(n)} y={floorY + 15} textAnchor="middle" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">{n}</text>
        ))}

        {/* faint graph of the board equation (shares the roots with the flight) */}
        <motion.path d={graphD} fill="none" stroke={graphCol} strokeWidth={acting ? 1.6 : 2.6} strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: acting ? 0.32 : 0.9 }} transition={{ duration: reduce ? 0 : 0.9, ease: 'easeInOut' }} />

        {/* ── target hoop at the right landing root ── */}
        <g>
          {/* hoop rim ellipse on the baseline */}
          <ellipse cx={sx(rR)} cy={floorY} rx={13} ry={4.4} fill="none" stroke={done ? p.mint : '#ff5a3c'} strokeWidth={3} />
          <ellipse cx={sx(rR)} cy={floorY} rx={13} ry={4.4} fill="#ff5a3c" opacity={0.12} />
          {/* net skirt hanging into the apron — swishes when the ball lands */}
          <motion.g animate={landed && !reduce ? { scaleY: [1, 1.18, 0.94, 1.06, 1] } : { scaleY: 1 }} transition={{ duration: 0.6 }} style={{ transformBox: 'fill-box', transformOrigin: 'top center' }}>
            {[-9, -4.5, 0, 4.5, 9].map((dx, i) => (
              <line key={`net${i}`} x1={sx(rR) + dx} y1={floorY} x2={sx(rR) + dx * 0.4} y2={floorY + 16} stroke={p.cream} strokeOpacity={0.6} strokeWidth={1} />
            ))}
            <line x1={sx(rR) - 6} y1={floorY + 7} x2={sx(rR) + 6} y2={floorY + 7} stroke={p.cream} strokeOpacity={0.45} strokeWidth={0.8} />
          </motion.g>
        </g>

        {/* ── shooter at the left launch root ── */}
        <g opacity={0.92}>
          {/* legs + body */}
          <line x1={shX - 3} y1={floorY} x2={shX - 3} y2={floorY - 12} stroke="#2a1a3d" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={shX + 3} y1={floorY} x2={shX + 3} y2={floorY - 12} stroke="#2a1a3d" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={shX} y1={floorY - 11} x2={shX} y2={floorY - 26} stroke={p.coralDeep} strokeWidth={5} strokeLinecap="round" />
          <circle cx={shX} cy={floorY - 31} r={5} fill="#f0c9a0" stroke="#2a1a3d" strokeWidth={1} />
          {/* arms — extend upward on release */}
          <motion.line x1={shX} y1={floorY - 22} x2={shX + 9} y2={released ? floorY - 34 : floorY - 20}
            stroke={p.coralDeep} strokeWidth={3.2} strokeLinecap="round"
            animate={{ y2: released ? floorY - 34 : floorY - 20, x2: released ? shX + 11 : shX + 9 }} transition={reduce ? { duration: 0 } : spring} />
          <motion.line x1={shX} y1={floorY - 22} x2={shX - 9} y2={released ? floorY - 34 : floorY - 20}
            stroke={p.coralDeep} strokeWidth={3.2} strokeLinecap="round"
            animate={{ y2: released ? floorY - 34 : floorY - 20, x2: released ? shX - 11 : shX - 9 }} transition={reduce ? { duration: 0 } : spring} />
        </g>

        {/* ── the acted-out shot flight ── */}
        {acting && (
          <>
            {/* launch/land uprights on the floor */}
            <line x1={sx(rL)} y1={floorY} x2={sx(rL)} y2={floorY - 8} stroke={p.creamSoft} strokeWidth={1.6} opacity={0.6} />
            {/* flight trail — grows continuously behind the ball */}
            <motion.path d={trailD} fill="none" stroke={p.gold} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 6" opacity={0.85} />
            {/* peak marker — springs in as the ball reaches the top */}
            <motion.g initial={false} animate={{ opacity: showPeak ? 1 : 0, scale: showPeak ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <line x1={sx(mid)} y1={sy(PEAK)} x2={sx(mid)} y2={floorY} stroke={p.gold} strokeWidth={0.8} strokeDasharray="2 4" opacity={0.5} />
              <circle cx={sx(mid)} cy={sy(PEAK)} r={4.5} fill={p.gold} stroke={p.cream} strokeWidth={1.3} />
              <text x={sx(mid)} y={sy(PEAK) - 9} textAnchor="middle" fill={p.gold} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}>peak</text>
            </motion.g>
            {/* the ball — continuous, curve-following travel with spin + squash */}
            {released && (
              <motion.g style={{ x: ballCX, y: ballCY }}>
                <motion.g style={{ rotate: ballSpin, scaleX: squashX, scaleY: squashY, transformBox: 'fill-box', transformOrigin: 'center' }}>
                  <circle r={B} fill="url(#ts_ball)" stroke="#8f4712" strokeWidth={1} />
                  <path d={`M${-B},0 A ${B} ${B} 0 0 0 ${B},0`} fill="none" stroke="#7a3d0e" strokeWidth={1} opacity={0.8} />
                  <line x1={0} y1={-B} x2={0} y2={B} stroke="#7a3d0e" strokeWidth={1} opacity={0.8} />
                  <path d={`M${-B * 0.86},${-B * 0.5} Q 0 ${-B * 0.1} ${B * 0.86},${-B * 0.5}`} fill="none" stroke="#7a3d0e" strokeWidth={0.9} opacity={0.7} />
                </motion.g>
              </motion.g>
            )}
          </>
        )}

        {/* root landing markers — spring in once landed (or outside the walkthrough) */}
        {hasRoots && [task.r1!, task.r2!].map((rx, i) => inBox(rx, 0) && (
          <motion.g key={`r${i}`} initial={false} animate={{ opacity: showRoots ? 1 : 0, scale: showRoots ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : { ...spring, delay: showRoots ? i * 0.08 : 0 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={sx(rx)} cy={floorY} r={5.5} fill={done ? p.mint : p.coralDeep} stroke={p.cream} strokeWidth={1.5} />
            <text x={sx(rx)} y={floorY + 26} textAnchor="middle" fill={done ? p.mint : p.creamSoft} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={700}>{minus(rx)}</text>
          </motion.g>
        ))}

        {/* vertex marker (vertex tasks / reveal) */}
        {hasVertex && inBox(task.h!, task.kk!) && (
          <motion.g initial={false} animate={{ opacity: showVertex ? 1 : 0, scale: showVertex ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={sx(task.h!)} cy={sy(task.kk!)} r={6.5} fill={p.gold} stroke={p.cream} strokeWidth={1.5} />
            <text x={sx(task.h!) + 8} y={sy(task.kk!) - 8} fill={p.gold} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={700}>({minus(task.h!)}, {minus(task.kk!)})</text>
          </motion.g>
        )}
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>
        {acting
          ? (landed ? (done ? 'where it lands ✓' : 'where it lands') : rising ? 'rising to the peak' : 'the shot')
          : task.kind === 'vertex' ? 'the peak' : task.kind === 'formula' ? 'irrational landing' : 'where it lands'}
      </div>
    </div>
  )
}

// ── template renderers ──────────────────────────────────────────────────────
const rootsTemplate = (a: number, b: number) => `x = ${a > 0 ? `+${a}` : a}, ${b > 0 ? `+${b}` : b}`
const vertexTemplate = (a: number, b: number) => `(${a > 0 ? `+${a}` : a}, ${b > 0 ? `+${b}` : b})`

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'quadraticsParabolas',
  title: 'THE SHOT',
  ticketLabel: 'shot chart',
  palette: P,
  motif: '🏀',
  makeTask,
  initialValue: (t) =>
    t.kind === 'formula' ? { k: 'pick', id: '' }
      : t.kind === 'vertex' ? { k: 'vertex', a: 0, b: 0 }
        : { k: 'roots', a: 0, b: 0 },
  grade: (t, v) => {
    if (t.kind === 'formula') return v.k === 'pick' && v.id === t.answerId
    if (t.kind === 'vertex') return v.k === 'vertex' && v.a === t.h && v.b === t.kk
    // roots — order-independent
    return v.k === 'roots' && ((v.a === t.r1 && v.b === t.r2) || (v.a === t.r2 && v.b === t.r1))
  },
  revealText: (t) =>
    t.kind === 'formula' ? (t.answerId ?? '')
      : t.kind === 'vertex' ? `(${minus(t.h ?? 0)}, ${minus(t.kk ?? 0)})`
        : `x = ${minus(t.r1 ?? 0)}, ${minus(t.r2 ?? 0)}`,
  glide: (t, _from, setValue, later) => later(() => {
    if (t.kind === 'formula') setValue({ k: 'pick', id: t.answerId ?? '' })
    else if (t.kind === 'vertex') setValue({ k: 'vertex', a: t.h ?? 0, b: t.kk ?? 0 })
    else setValue({ k: 'roots', a: t.r1 ?? 0, b: t.r2 ?? 0 })
  }, 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'formula') {
      const id = value.k === 'pick' ? value.id : ''
      return <SpecPicker P={palette} choices={task.choices ?? []} value={id} setValue={(x) => setValue({ k: 'pick', id: x })}
        correct={task.answerId} disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'pick', id: x })}
        commitLabel="CALL THE SHOT ✓" prompt="Where does it land?" />
    }
    if (task.kind === 'vertex') {
      const a = value.k === 'vertex' ? value.a : 0, b = value.k === 'vertex' ? value.b : 0
      return <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'vertex', a: pr.a, b: pr.b })} min={-12} max={12}
        template={vertexTemplate} labels={['x of peak', 'y of peak']}
        disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'vertex', a: pr.a, b: pr.b })} commitLabel="MARK THE PEAK ✓" />
    }
    const a = value.k === 'roots' ? value.a : 0, b = value.k === 'roots' ? value.b : 0
    return <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'roots', a: pr.a, b: pr.b })} min={-12} max={12}
      template={rootsTemplate} labels={['lands at', 'and at']}
      disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'roots', a: pr.a, b: pr.b })} commitLabel="TAKE THE SHOT ✓" />
  },
  TutorialScene: ({ palette, task, value, stepIndex, ended }) => (
    <ArcScene palette={palette} task={task} value={value} stepIndex={stepIndex} ended={ended} />
  ),
  start: {
    blurb: <><strong>Every shot traces a parabola.</strong> The <strong>peak</strong> of the arc is the vertex; where the ball <strong>lands</strong> are the roots. Read the arc, or solve the quadratic to find them.</>,
    ticket: { title: 'The shot', badge: 'y = x² − 4', tone: 'a' },
    startLabel: 'Step to the line →',
  },
  overview: {
    say: "Here is the plan. A basketball shot flies in a curve called a parabola. The peak of the arc is the vertex, and the two spots where it lands on the floor are the roots. We can read them off the arc, or solve the quadratic to find them. Let us do one together, nice and slow.",
    problem: <>Where does the shot <strong>y = x² − 4</strong> land — its two <strong>roots</strong>?</>,
    points: [
      <>The ball <strong>lands</strong> where the curve crosses the floor (y = 0).</>,
      <>Set <strong>y = 0</strong> and solve: x² = 4, so x = ±2.</>,
      <>The <strong>peak</strong> (vertex) sits halfway between the two landings.</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'roots', a: 0, b: 0 }, hand: 'tap', steps: DEMO_STEPS },
  guided: {
    task: {
      kind: 'roots', title: 'The landing', badge: 'y = x² − 9', tone: 'a', prompt: '',
      say: 'Your turn — I will help. This shot is x squared minus nine. Build where it lands, both roots.',
      work: ['x² = 9, so x = ±3. Lands at x = −3 and x = 3.'],
      pa: 1, pb: 0, pc: -9, r1: -3, r2: 3,
    },
    coach: 'Your turn — I will help. Build where this shot lands.', hand: 'tap',
  },
  sig: (t) => `${t.kind}|${t.badge}`,
}

export default function TheShot(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
