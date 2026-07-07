'use client'
/**
 * SkateRamp — the Triangles, Proof & Right-Triangle Trig chapter (15–16) as a
 * PLAYABLE GAME. World: a skate ramp / building whose STEEPNESS (angle of
 * elevation) and side lengths you work out — the same right-triangle math a
 * builder uses to keep a ramp within code.
 *
 * NON-MCQ except the ONE allowed proof sub-type (assemble-in-order, not a quiz):
 *   • DIAL  (SlideValue) — dial a missing ANGLE in degrees, a SIDE length, or a
 *            trig RATIO (graded with a small tolerance). Covers L1 angle
 *            relationships and L3 SOH-CAH-TOA + inverse-trig.
 *   • PROOF (StepPicker) — assemble the NEXT statement of a congruence proof
 *            (SAS / ASA). This is the single non-numeric interaction: you pick the
 *            statement that comes next in order, not a multiple-choice quiz answer.
 *
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * ramp/right-triangle scene → baby-step walkthrough → guided → scored play. The
 * math mirrors GeometryProofTrigTeenLesson.makeRound (L1/L2/L3); illustration
 * assets deferred, the scene is pure CSS/SVG.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, StepPicker, type SpecChoice } from './parts/gameKit'

// Steep concrete-ramp palette (dark first, safety-cone accents).
const P: Palette = {
  nightTop: '#1d2733', nightBot: '#10161e',
  cream: '#eef3f8', creamSoft: 'rgba(238,243,248,0.82)',
  inkOnPaper: '#18222e', mutedOnPaper: '#6a7889',
  gold: '#ffb648', goldDeep: '#d6841e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(24,38,54,0.6)', glassBorder: 'rgba(238,243,248,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

// Pythagorean triples → clean integer trig sides for the L3 "missing side" rounds.
const TRIPLES: [number, number, number][] = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25],
]

/** Answer value: a dialled number (angle°, side, or ratio) OR a picked proof step. */
type V = { k: 'num'; n: number } | { k: 'step'; id: string }

interface Task extends BaseTask {
  kind: 'dial' | 'proof'
  // dial:
  n?: number            // the correct number to dial
  lo?: number; hi?: number
  dstep?: number        // slider step (1 for angles/sides, 0.01 for ratios)
  tol?: number          // grading tolerance (0 for integers, small for ratios)
  unit?: string         // readout suffix ("°", "m", "")
  // proof:
  shown?: string[]      // statements already locked in (rendered on the scene)
  options?: SpecChoice[]
  answerId?: string
}

// ── L1: angle relationships → dial the missing angle (SlideValue, integer °) ─────
function makeL1(): Task {
  const roll = Math.random()
  if (roll < 0.34) {
    // Supplementary — angles on a straight line sum to 180.
    const a = rint(35, 145)
    const x = 180 - a
    return {
      kind: 'dial', title: 'Ramp edge', badge: `${a}° + x = 180°`, tone: 'a',
      prompt: `Dial the missing angle: ${a}° and x° sit on a straight line.`,
      say: `A ramp's edge meets the ground. One angle is ${a} degrees; the angle beside it, x, sits on the same straight line. Dial x.`,
      work: [`Angles on a straight line are supplementary: x = 180° − ${a}° = ${x}°.`],
      n: x, lo: 0, hi: 180, dstep: 1, tol: 0, unit: '°',
    }
  }
  if (roll < 0.62) {
    // Vertical angles are equal.
    const a = rint(25, 150)
    return {
      kind: 'dial', title: 'Crossing rails', badge: `x = ? (vertical to ${a}°)`, tone: 'a',
      prompt: `Dial x — its vertical angle is ${a}°.`,
      say: `Two rails cross. One angle is ${a} degrees. Dial its vertical angle, x.`,
      work: [`Vertical angles are equal, so x = ${a}°.`],
      n: a, lo: 0, hi: 180, dstep: 1, tol: 0, unit: '°',
    }
  }
  // Triangle-angle-sum — the ramp triangle: two angles known, dial the third.
  const a = rint(30, 90)
  let b = rint(30, 90)
  while (a + b >= 165) b = rint(20, 80)
  const x = 180 - a - b
  return {
    kind: 'dial', title: 'Ramp triangle', badge: `${a}° + ${b}° + x = 180°`, tone: 'a',
    prompt: `Dial the third angle of a ramp triangle with angles ${a}°, ${b}°, x°.`,
    say: `The ramp forms a triangle with angles ${a} degrees, ${b} degrees, and x degrees. Dial x.`,
    work: [`The angles of a triangle sum to 180°: x = 180° − ${a}° − ${b}° = ${x}°.`],
    n: x, lo: 0, hi: 180, dstep: 1, tol: 0, unit: '°',
  }
}

// ── L2: congruence — assemble the NEXT proof statement (StepPicker) ──────────────
function makeL2(): Task {
  if (Math.random() < 0.5) {
    // SAS: two sides + the included angle → △ABC ≅ △ADC.
    const options: SpecChoice[] = shuffle([
      { id: 'sas', label: '△ABC ≅ △ADC  —  SAS (two sides + included angle)' },
      { id: 'aaa', label: '△ABC ≅ △ADC  —  AAA (only proves similarity)' },
      { id: 'ssa', label: '△ABC ≅ △ADC  —  SSA (not a valid rule)' },
    ])
    return {
      kind: 'proof', title: 'Ramp brace', badge: 'AB ≅ AD,  ∠BAC ≅ ∠DAC,  AC shared', tone: 'a',
      prompt: 'Assemble the statement that finishes the proof.',
      say: 'A B is congruent to A D, the included angles at A are congruent, and A C is shared by both braces. Assemble the statement that finishes the proof.',
      work: ['Two sides and the angle BETWEEN them match → SAS proves △ABC ≅ △ADC.'],
      shown: ['AB ≅ AD  (given)', '∠BAC ≅ ∠DAC  (given, included angle)', 'AC ≅ AC  (reflexive — shared side)'],
      options, answerId: 'sas',
    }
  }
  // ASA: two angles + the included side → △PQR ≅ △PSR.
  const options: SpecChoice[] = shuffle([
    { id: 'asa', label: '△PQR ≅ △PSR  —  ASA (two angles + included side)' },
    { id: 'ssa', label: '△PQR ≅ △PSR  —  SSA (not a valid rule)' },
    { id: 'sim', label: '△PQR ~ △PSR  —  Similar (ASA gives congruence)' },
  ])
  return {
    kind: 'proof', title: 'Rail joint', badge: '∠QPR ≅ ∠SPR,  ∠QRP ≅ ∠SRP,  PR shared', tone: 'a',
    prompt: 'Assemble the statement that finishes the proof.',
    say: 'The angles at P are congruent, the angles at R are congruent, and the rail P R between them is shared. Assemble the statement that finishes the proof.',
    work: ['Two angles with the side BETWEEN them match → ASA proves △PQR ≅ △PSR.'],
    shown: ['∠QPR ≅ ∠SPR  (given)', 'PR ≅ PR  (reflexive — included side)', '∠QRP ≅ ∠SRP  (given)'],
    options, answerId: 'asa',
  }
}

// ── L3: SOH-CAH-TOA — dial a missing side, an angle of elevation, or a ratio ─────
function makeL3(): Task {
  const roll = Math.random()
  if (roll < 0.4) {
    // Missing SIDE from a Pythagorean triple (clean integer).
    const [p, q, h] = TRIPLES[rint(0, TRIPLES.length - 1)]
    const giveOpp = Math.random() < 0.5
    const known = giveOpp ? p : q
    const want = giveOpp ? q : p
    return {
      kind: 'dial', title: 'Ramp side', badge: `hyp ${h}, leg ${known} → other leg = ?`, tone: 'b',
      prompt: `Dial the missing side: a right-triangle ramp has hypotenuse ${h} m and one leg ${known} m.`,
      say: `A ramp is a right triangle with hypotenuse ${h} meters and one leg ${known} meters. Dial the length of the other leg.`,
      work: [`By the Pythagorean theorem, the other leg = √(${h}² − ${known}²) = ${want} m.`],
      n: want, lo: 0, hi: Math.max(30, h + 4), dstep: 1, tol: 0, unit: ' m',
    }
  }
  if (roll < 0.72) {
    // Missing ANGLE of elevation via inverse tangent (rounded integer degrees).
    const pick = TRIPLES[rint(0, TRIPLES.length - 1)]
    const opp = pick[0], adj = pick[1]
    const angle = Math.round((Math.atan2(opp, adj) * 180) / Math.PI)
    return {
      kind: 'dial', title: 'Ramp steepness', badge: `rise ${opp} m, run ${adj} m → angle = ?`, tone: 'b',
      prompt: `Dial the angle of elevation: the ramp rises ${opp} m over a ${adj} m run (nearest degree).`,
      say: `The skate ramp rises ${opp} meters over a run of ${adj} meters. To the nearest degree, dial its angle of elevation.`,
      work: [`tan θ = rise / run = ${opp}/${adj}, so θ = arctan(${opp}/${adj}) ≈ ${angle}°.`],
      n: angle, lo: 0, hi: 90, dstep: 1, tol: 0, unit: '°',
    }
  }
  // A trig RATIO for a common angle → dial the value to two decimals (tolerance).
  const opts: { deg: number; fn: 'sine' | 'cosine' | 'tangent'; sym: string }[] = [
    { deg: 30, fn: 'sine', sym: 'sin 30°' }, { deg: 60, fn: 'sine', sym: 'sin 60°' },
    { deg: 45, fn: 'cosine', sym: 'cos 45°' }, { deg: 30, fn: 'cosine', sym: 'cos 30°' },
    { deg: 45, fn: 'tangent', sym: 'tan 45°' },
  ]
  const o = opts[rint(0, opts.length - 1)]
  const rad = (o.deg * Math.PI) / 180
  const val = o.fn === 'sine' ? Math.sin(rad) : o.fn === 'cosine' ? Math.cos(rad) : Math.tan(rad)
  const rounded = Math.round(val * 100) / 100
  return {
    kind: 'dial', title: 'Ramp ratio', badge: `${o.sym} = ?`, tone: 'b',
    prompt: `Dial the value of ${o.sym} (two decimals).`,
    say: `The ramp's steepness ratio is ${o.sym}. Dial its value to two decimal places.`,
    work: [`${o.sym} ≈ ${rounded.toFixed(2)}.`],
    n: rounded, lo: 0, hi: 1.5, dstep: 0.01, tol: 0.02, unit: '',
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return makeL1()
  if (d === 2) return makeL2()
  return makeL3()
}

// ── fixed worked example (walkthrough) — the ramp triangle, angle of elevation ───
const DEMO_TASK: Task = {
  kind: 'dial', title: 'Ramp steepness', badge: 'rise 3 m, run 4 m → angle = ?', tone: 'b',
  prompt: '', say: '', work: ['tan θ = 3/4, so θ = arctan(0.75) ≈ 37°.'],
  n: 37, lo: 0, hi: 90, dstep: 1, tol: 0, unit: '°',
}
// Eleven BABY steps: the ramp is the hook (draw it → measure rise → measure run),
// then the trig unfolds one move per step (name the angle → tag opposite/adjacent →
// pick tangent → plug in → divide → invert → solve). Each step = one idea + one
// chalkboard line + its own scene beat. `value.n` drives the angle arc continuously:
// it opens to an indicative θ when we name the angle, widens as we invert, then
// sweeps to the true 37° on the solve beat.
//   beats: idx0 draw triangle · 1 rise · 2 run · 3 arc opens (θ named) · 4 tag sides
//          5–7 build tan θ readout · 8 arc widens · 9 arc → 37° + sight-line · 10 dial
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Here's a skate ramp. It's really a right triangle — watch it take shape.", value: { k: 'num', n: 0 }, board: 'a skate ramp (right triangle)' },
  { say: 'It rises three meters — straight up the tall side.', value: { k: 'num', n: 0 }, board: 'rise = 3 m' },
  { say: 'And it runs four meters flat along the ground.', value: { k: 'num', n: 0 }, board: 'run = 4 m' },
  { say: 'How steeply it leans is the angle of elevation — the angle a skater looks up. Call it θ.', value: { k: 'num', n: 16 }, board: 'θ = angle of elevation' },
  { say: 'Line the sides up with θ. The rise is OPPOSITE the angle; the run is ADJACENT, right next to it.', value: { k: 'num', n: 16 }, board: 'opp = 3,  adj = 4' },
  { say: 'Opposite over adjacent is the tangent ratio. So we use tangent.', value: { k: 'num', n: 16 }, board: 'tan θ = opp / adj' },
  { say: 'Put the numbers in: tangent of θ is three over four.', value: { k: 'num', n: 16 }, board: 'tan θ = 3 / 4' },
  { say: 'Three divided by four is zero point seven five.', value: { k: 'num', n: 16 }, board: 'tan θ = 0.75' },
  { say: 'Now undo the tangent. To turn that ratio back into the angle, take the inverse tangent of zero point seven five.', value: { k: 'num', n: 26 }, board: 'θ = arctan(0.75)' },
  { say: 'That comes out to about thirty-seven degrees. Watch the ramp lean to exactly that.', value: { k: 'num', n: 37 }, board: 'θ ≈ 37°' },
  { say: 'So the ramp sits at about thirty-seven degrees. On the dial, that is thirty-seven.', value: { k: 'num', n: 37 }, board: 'dial 37° ✓' },
]

// ── hand-authored SVG skate-ramp scene (storyboard: docs/storyboards/skate-ramp.md)
// A dusk skate spot, all vector. The ramp IS the right triangle, drawn on an exact
// px-per-metre mapping so the pictured lean equals arctan(3/4) ≈ 37°:
//   A (bottom-left)  = the angle-of-elevation corner θ, a skater looks up from here
//   B (bottom-right) = the right angle (rise ⟂ run)
//   C (top-right)    = the top of the ramp (a flag)
//   run  = A→B (ADJACENT to θ) · rise = B→C (OPPOSITE θ) · hyp = A→C (the ramp / sight-line)
// During the WALKTHROUGH the ramp draws in, the sides highlight, and the angle arc at A
// sweeps open — driven CONTINUOUSLY by a useMotionValue tracking `value.n` — first to an
// indicative θ, then to the true 37° as we invert the tangent, ending with a mint
// sight-line up to the flag. The math skeleton stays exact; only the stage is art.
const D2R = Math.PI / 180
function RampScene({ palette, task, value, stepIndex, ended }: { palette: Palette; task: Task; value: V; stepIndex: number; ended: boolean }) {
  void task
  const p = palette
  const reduce = useReducedMotion()
  const W = 340, H = 210
  const groundY = 176
  const perM = 55                          // px per metre (run 4 m = 220 px, rise 3 m = 165 px)
  const Ax = 56, Ay = groundY              // elevation corner θ (skater's eye)
  const Bx = Ax + 4 * perM, By = groundY   // right-angle corner
  const Cx = Bx, Cy = groundY - 3 * perM   // top of the ramp

  // beat gating (baby steps: see DEMO_STEPS)
  const drawn = stepIndex >= 0
  const showRise = stepIndex >= 1
  const showRun = stepIndex >= 2
  const showAngle = stepIndex >= 3
  const showTags = stepIndex >= 4
  const showRatio = stepIndex >= 5
  const solved = ended || stepIndex >= 9

  const targetDeg = ended ? 37 : (value.k === 'num' ? Math.max(0, Math.min(90, value.n)) : 0)
  const angleTxt = solved ? '37°' : 'θ'
  const col = solved ? '#2fb37f' : p.goldDeep
  const spring = { type: 'spring' as const, stiffness: 300, damping: 18 }

  // ── CONTINUOUS angle sweep: a motion value animated toward `value.n` at 60fps, so
  //    the arc OPENS between beats instead of snapping. useTransform rebuilds the arc
  //    path `d` (and the θ-label position) live from the animated degree. ──
  const AR = 50
  const angle = useMotionValue(reduce ? targetDeg : 0)
  useEffect(() => {
    const c = animate(angle, targetDeg, { duration: reduce ? 0 : (solved ? 0.9 : 0.8), ease: [0.33, 0.02, 0.2, 1] })
    return () => c.stop()
  }, [targetDeg, reduce, solved, angle])
  const arcD = useTransform(angle, (d) => {
    const ex = Ax + AR * Math.cos(d * D2R)
    const ey = Ay - AR * Math.sin(d * D2R)
    return `M ${(Ax + AR).toFixed(1)} ${Ay} A ${AR} ${AR} 0 0 0 ${ex.toFixed(1)} ${ey.toFixed(1)}`
  })
  const labX = useTransform(angle, (d) => Ax + (AR + 16) * Math.cos((d / 2) * D2R))
  const labY = useTransform(angle, (d) => Ay - (AR + 16) * Math.sin((d / 2) * D2R) + 5)

  const triD = `M ${Ax} ${Ay} L ${Cx} ${Cy} L ${Bx} ${By} Z`
  const fadeT = { duration: reduce ? 0 : 0.4 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'clamp(240px, 32vw, 360px)', height: 'auto', borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }} role="img" aria-label="skate ramp right triangle acting out the angle of elevation">
        <defs>
          <linearGradient id="sr_sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#23303f" />
            <stop offset="0.6" stopColor="#182430" />
            <stop offset="1" stopColor="#101820" />
          </linearGradient>
          <radialGradient id="sr_sun" cx="0.82" cy="0.2" r="0.5">
            <stop offset="0" stopColor="#ffd98a" stopOpacity="0.34" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sr_ramp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a99a8" />
            <stop offset="1" stopColor="#5a6875" />
          </linearGradient>
          <linearGradient id="sr_rampM" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5cd6ac" />
            <stop offset="1" stopColor="#2fb37f" />
          </linearGradient>
        </defs>

        {/* ── dusk backdrop ── */}
        <rect x={0} y={0} width={W} height={H} fill="url(#sr_sky)" />
        <rect x={0} y={0} width={W} height={H} fill="url(#sr_sun)" />
        <circle cx={W * 0.82} cy={H * 0.2} r={16} fill="#ffdf9a" opacity={0.5} />

        {/* ground line = the run's baseline (draws L→R) */}
        <motion.line x1={0} y1={groundY} x2={W} y2={groundY} stroke={p.creamSoft} strokeWidth={2}
          initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} />

        {/* ── the ramp (the right triangle) ── */}
        {/* solid ramp fill, colour eases to mint when solved */}
        <motion.path d={triD} fill={solved ? 'url(#sr_rampM)' : 'url(#sr_ramp)'} opacity={0.9}
          initial={{ opacity: 0 }} animate={{ opacity: drawn ? 0.9 : 0 }} transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.25 }} />
        {/* outline draws in on step 0 */}
        <motion.path d={triD} fill="none" stroke={col} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: drawn ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.75, ease: 'easeInOut' }} style={{ transition: 'stroke 400ms' }} />

        {/* rise edge (right side, OPPOSITE θ) highlights on step 1 */}
        <motion.line x1={Bx} y1={By} x2={Cx} y2={Cy} stroke={p.gold} strokeWidth={4.5} strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }} animate={{ pathLength: showRise ? 1 : 0, opacity: showRise ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.45 }} />
        {/* run edge (bottom, ADJACENT to θ) highlights on step 2 */}
        <motion.line x1={Ax} y1={Ay} x2={Bx} y2={By} stroke={p.gold} strokeWidth={4.5} strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }} animate={{ pathLength: showRun ? 1 : 0, opacity: showRun ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.45 }} />

        {/* right-angle square at B — springs in when the angle is named */}
        <motion.rect x={Bx - 15} y={By - 15} width={15} height={15} fill="none" stroke={p.mutedOnPaper} strokeWidth={1.6}
          initial={false} animate={{ opacity: showAngle ? 1 : 0, scale: showAngle ? 1 : 0.4 }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />

        {/* angle arc at A — continuous sweep to `value.n` degrees */}
        <motion.path d={arcD} fill="none" stroke={col} strokeWidth={2.8} strokeLinecap="round"
          initial={false} animate={{ opacity: showAngle ? 1 : 0 }} transition={fadeT} style={{ transition: 'stroke 400ms' }} />
        {/* θ / 37° label riding the arc's bisector */}
        <motion.text style={{ x: labX, y: labY, transition: 'fill 400ms' }} textAnchor="middle" fill={col} fontSize={16} fontWeight={800} fontFamily="var(--font-numeric)"
          initial={false} animate={{ opacity: showAngle ? 1 : 0 }} transition={fadeT}>{angleTxt}</motion.text>

        {/* ── the flag at the top of the ramp ── */}
        <motion.g initial={false} animate={{ opacity: drawn ? 1 : 0, scale: drawn ? 1 : 0.4 }} transition={reduce ? { duration: 0 } : { ...spring, delay: 0.5 }} style={{ transformBox: 'fill-box', transformOrigin: `${Cx}px ${Cy}px` }}>
          <line x1={Cx} y1={Cy} x2={Cx} y2={Cy - 20} stroke={p.cream} strokeWidth={1.6} />
          <path d={`M ${Cx} ${Cy - 20} L ${Cx + 16} ${Cy - 15} L ${Cx} ${Cy - 10} Z`} fill={solved ? p.mint : p.coral} />
        </motion.g>

        {/* ── the skater at A, looking up the ramp ── */}
        <g>
          <line x1={Ax - 18} y1={groundY} x2={Ax - 6} y2={groundY} stroke={p.mutedOnPaper} strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={Ax - 16} cy={groundY - 2} r={2.4} fill={p.mutedOnPaper} />
          <circle cx={Ax - 8} cy={groundY - 2} r={2.4} fill={p.mutedOnPaper} />
          <line x1={Ax - 12} y1={groundY - 4} x2={Ax - 12} y2={groundY - 18} stroke={p.coralDeep} strokeWidth={3.4} strokeLinecap="round" />
          <circle cx={Ax - 12} cy={groundY - 23} r={4.6} fill="#f0c9a0" stroke="#22303e" strokeWidth={1} />
          {/* arm — points up the ramp; lifts on solve */}
          <motion.line x1={Ax - 12} y1={groundY - 15} x2={Ax - 2} y2={groundY - 20}
            stroke={p.coralDeep} strokeWidth={2.8} strokeLinecap="round"
            initial={false} animate={{ x2: Ax + (solved ? 6 : 0), y2: groundY - (solved ? 30 : 20) }} transition={reduce ? { duration: 0 } : spring} />
        </g>

        {/* ── side length labels ── */}
        {/* rise 3 m (right of the vertical side) */}
        <motion.g initial={false} animate={{ opacity: showRise ? 1 : 0, x: showRise ? 0 : 8 }} transition={reduce ? { duration: 0 } : spring}>
          <text x={Bx + 8} y={(By + Cy) / 2 - 2} fill={p.cream} fontSize={14} fontWeight={800} fontFamily="var(--font-numeric)" textAnchor="start">rise 3 m</text>
          <motion.text x={Bx + 8} y={(By + Cy) / 2 + 13} fill={p.gold} fontSize={10} fontWeight={700} fontFamily="var(--font-numeric)" letterSpacing="0.06em" textAnchor="start"
            initial={false} animate={{ opacity: showTags ? 1 : 0 }} transition={fadeT}>opposite</motion.text>
        </motion.g>
        {/* run 4 m (below the bottom side) */}
        <motion.g initial={false} animate={{ opacity: showRun ? 1 : 0, y: showRun ? 0 : 6 }} transition={reduce ? { duration: 0 } : spring}>
          <text x={(Ax + Bx) / 2} y={groundY + 17} fill={p.cream} fontSize={14} fontWeight={800} fontFamily="var(--font-numeric)" textAnchor="middle">run 4 m</text>
          <motion.text x={(Ax + Bx) / 2} y={groundY + 30} fill={p.gold} fontSize={10} fontWeight={700} fontFamily="var(--font-numeric)" letterSpacing="0.06em" textAnchor="middle"
            initial={false} animate={{ opacity: showTags ? 1 : 0 }} transition={fadeT}>adjacent</motion.text>
        </motion.g>

        {/* ── final sight-line up the ramp (A→C) — grows via pathLength on solve ── */}
        <motion.line x1={Ax} y1={Ay} x2={Cx} y2={Cy} stroke={p.mint} strokeWidth={2.4} strokeDasharray="6 5" strokeLinecap="round"
          initial={false} animate={{ pathLength: solved ? 1 : 0, opacity: solved ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.6, ease: [0.4, 0.05, 0.25, 1] }} />
        <motion.circle cx={Cx} cy={Cy} r={4.5} fill={p.mint} stroke={p.cream} strokeWidth={1.3}
          initial={false} animate={{ opacity: solved ? 1 : 0, scale: solved ? 1 : 0.4 }} transition={reduce ? { duration: 0 } : { ...spring, delay: solved ? 0.5 : 0 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      </svg>

      {/* running trig readout under the ramp */}
      <div key={solved ? 's' : showRatio ? `r${stepIndex}` : 'i'} style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(14px, 1.5vw, 21px)', fontWeight: 800, color: col, transition: 'color 400ms', animation: reduce ? 'none' : 'srFade 350ms ease both' }}>
        {solved ? 'θ ≈ 37°'
          : stepIndex >= 7 ? 'tan θ = 0.75'
            : stepIndex >= 6 ? 'tan θ = 3 / 4'
              : showRatio ? 'tan θ = opp / adj'
                : 'rise 3 m · run 4 m'}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>ramp steepness</div>
      <style>{`@keyframes srFade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}

const numGrade = (t: Task, n: number) => Math.abs(n - (t.n ?? 0)) <= (t.tol ?? 0)

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'geometryProofTrig',
  title: 'SKATE RAMP',
  ticketLabel: 'ramp log',
  palette: P,
  motif: '🛹',
  makeTask,
  initialValue: (t) => (t.kind === 'dial' ? { k: 'num', n: t.lo ?? 0 } : { k: 'step', id: '' }),
  grade: (t, v) => (t.kind === 'dial' ? v.k === 'num' && numGrade(t, v.n) : v.k === 'step' && v.id === t.answerId),
  revealText: (t) => (t.kind === 'dial'
    ? `${(t.dstep ?? 1) < 1 ? (t.n ?? 0).toFixed(2) : t.n}${t.unit ?? ''}`
    : (t.options?.find((o) => o.id === t.answerId)?.label as string) ?? '✓'),
  glide: (t, _from, setValue, later) => later(() => setValue(t.kind === 'dial' ? { k: 'num', n: t.n ?? 0 } : { k: 'step', id: t.answerId ?? '' }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'dial') {
      const n = value.k === 'num' ? value.n : 0
      const dec = (task.dstep ?? 1) < 1
      return (
        <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })}
          min={task.lo ?? 0} max={task.hi ?? 180} step={task.dstep ?? 1}
          format={(m) => `${dec ? m.toFixed(2) : m}${task.unit ?? ''}`}
          disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="SET IT ✓" />
      )
    }
    const id = value.k === 'step' ? value.id : ''
    return (
      <StepPicker P={palette} choices={task.options ?? []} value={id} setValue={(x) => setValue({ k: 'step', id: x })}
        correct={task.answerId} disabled={disabled} reveal={reveal}
        onCommit={(x) => onCommit({ k: 'step', id: x })} commitLabel="THAT'S THE STEP ✓"
        prompt="assemble the next statement" />
    )
  },
  TutorialScene: ({ palette, task, value, stepIndex, ended }) => (
    <RampScene palette={palette} task={task} value={value} stepIndex={stepIndex} ended={ended} />
  ),
  start: {
    blurb: <><strong>You&apos;re inspecting a skate ramp.</strong> A ramp is a <strong>right triangle</strong> — its steepness is an <strong>angle</strong>, and its sides obey <strong>SOH-CAH-TOA</strong>. Dial missing angles and sides, and prove braces are identical.</>,
    ticket: { title: 'Ramp steepness', badge: 'rise 3, run 4', tone: 'b' },
    startLabel: 'Inspect the ramp →',
  },
  overview: {
    say: 'Here is the plan. A skate ramp is really a right triangle. How steep it leans is an angle of elevation, and we can find it from two measured sides. The rise is opposite the angle and the run is next to it, so opposite over adjacent gives the tangent, and the inverse tangent gives the angle back. Let us work one out together, nice and slow.',
    problem: <>A ramp <strong>rises 3 m</strong> over a <strong>4 m run</strong>. What&apos;s its angle of elevation?</>,
    points: [
      <>The <strong>rise</strong> is opposite the angle; the <strong>run</strong> is adjacent to it.</>,
      <>Opposite ÷ adjacent = <strong>tan θ</strong> = 3 ÷ 4 = 0.75.</>,
      <>Undo the tangent: <strong>θ = arctan(0.75) ≈ 37°</strong>.</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'num', n: 0 }, hand: 'drag', steps: DEMO_STEPS },
  guided: {
    task: {
      kind: 'dial', title: 'Ramp triangle', badge: '60° + 70° + x = 180°', tone: 'a',
      prompt: '', say: 'Your turn. A ramp triangle has angles sixty degrees, seventy degrees, and x. Dial x.',
      work: ['x = 180° − 60° − 70° = 50°.'],
      n: 50, lo: 0, hi: 180, dstep: 1, tol: 0, unit: '°',
    },
    coach: 'Your turn — I will help. Dial the missing angle.', hand: 'drag',
  },
  sig: (t) => t.badge,
}

export default function SkateRamp(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
