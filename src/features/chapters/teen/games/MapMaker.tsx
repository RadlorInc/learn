'use client'
/**
 * MapMaker — the Geometry (Mensuration & Transformations) chapter (15–16) as a
 * PLAYABLE GAME on the shared 12–14 GameShell.
 * World: a game-level EDITOR / map maker. You size round zones and crates by their
 * measurement (circumference, area, surface area, volume), and you PLACE objects by
 * building their transformed image coordinate (translate / reflect / rotate) or a
 * segment's midpoint.
 *
 * NON-MCQ, two production interactions (variety within the chapter):
 *   • MEASURE → a number DIAL (SlideValue): dial the measurement. Because the answer
 *              is a decimal (π ≈ 3.14159), it's graded with a TOLERANCE and the dial
 *              range sits tightly around the answer at step 0.1.
 *   • POINT   → a COORDINATE BUILDER (PartsBuilder → (a, b)): construct the integer
 *              lattice point where the placed / transformed object lands.
 *
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * map scene → baby-step walkthrough → guided → scored play. Illustration assets
 * deferred; the scene is code-drawn (pure CSS/SVG, no image assets). The math mirrors
 * GeometryTransformationsTeenLesson's makeRound (L1 circle, L2 solids, L3 transforms).
 */
import { useEffect, type CSSProperties } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, PartsBuilder } from './parts/gameKit'

const P: Palette = {
  nightTop: '#12233b', nightBot: '#0a1420',
  cream: '#eaf3ff', creamSoft: 'rgba(234,243,255,0.82)',
  inkOnPaper: '#132339', mutedOnPaper: '#6a7c9a',
  gold: '#7fd0ff', goldDeep: '#2f8fd6',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(18,35,59,0.6)', glassBorder: 'rgba(234,243,255,0.2)',
}

const PI = 3.14159
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
/** Round to 1 decimal (the grid/dial resolution for measurements). */
const r1 = (n: number) => Math.round(n * 10) / 10
const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)

// The answer is either a decimal measurement (dial) or an integer coordinate pair.
type V = { k: 'measure'; n: number } | { k: 'pt'; a: number; b: number }

interface Task extends BaseTask {
  kind: 'measure' | 'point'
  // measure
  n?: number; unit?: string
  // point
  x?: number; y?: number
  // scene hint: 'circle' round-zone resize | 'reflect'/'translate' object placement
  scene?: 'circle' | 'move'
}

// ── L1: circle circumference / area (SlideValue, tolerance) ──────────────────
function circleTask(d: 1 | 2 | 3): Task {
  const r = rint(2, 8)
  const area = Math.random() < 0.5
  const n = r1(area ? PI * r * r : 2 * PI * r)
  return {
    kind: 'measure', scene: 'circle',
    title: 'Round zone', badge: area ? `round zone · r = ${r}  (area)` : `round zone · r = ${r}  (edge)`, tone: 'a',
    prompt: area
      ? `Size the round zone: dial its AREA for radius ${r} (A = πr²).`
      : `Size the round zone: dial its CIRCUMFERENCE for radius ${r} (C = 2πr).`,
    say: area
      ? `Size the round zone. Its radius is ${r}. Dial the area — pi times r squared.`
      : `Size the round zone. Its radius is ${r}. Dial the distance around — two pi r.`,
    work: [area
      ? `Area = πr² ≈ 3.14159 × ${r}² = ${n}. Dial ${n}.`
      : `Circumference = 2πr ≈ 2 × 3.14159 × ${r} = ${n}. Dial ${n}.`],
    n, unit: area ? 'sq' : 'len',
  }
}

// ── L2: surface area / volume of solids (SlideValue, tolerance) ──────────────
function solidTask(d: 1 | 2 | 3): Task {
  const which = rint(0, 3)
  if (which === 0) {
    // Rectangular crate volume = l·w·h (integer, still on the dial).
    const l = rint(2, 6), w = rint(2, 5), h = rint(2, 5)
    const n = l * w * h
    return {
      kind: 'measure', scene: 'circle',
      title: 'Crate', badge: `crate ${l} × ${w} × ${h}`, tone: 'a',
      prompt: `Size the crate: dial its VOLUME (${l} × ${w} × ${h}).`,
      say: `Size the crate. It measures ${l} by ${w} by ${h}. Dial its volume.`,
      work: [`Volume = l × w × h = ${l} × ${w} × ${h} = ${n}. Dial ${n}.`],
      n, unit: 'cu',
    }
  }
  if (which === 1) {
    // Cylinder volume = πr²h.
    const r = rint(2, 5), h = rint(2, 6)
    const n = r1(PI * r * r * h)
    return {
      kind: 'measure', scene: 'circle',
      title: 'Silo', badge: `silo · r = ${r}, h = ${h}`, tone: 'b',
      prompt: `Size the silo: dial its VOLUME (V = πr²h).`,
      say: `Size the silo. Radius ${r}, height ${h}. Dial its volume — pi r squared h.`,
      work: [`Volume = πr²h ≈ 3.14159 × ${r}² × ${h} = ${n}. Dial ${n}.`],
      n, unit: 'cu',
    }
  }
  if (which === 2) {
    // Cone volume = (1/3)πr²h.
    const r = rint(2, 5), h = rint(3, 6)
    const n = r1((PI * r * r * h) / 3)
    return {
      kind: 'measure', scene: 'circle',
      title: 'Cone tower', badge: `cone · r = ${r}, h = ${h}`, tone: 'b',
      prompt: `Size the cone tower: dial its VOLUME (V = ⅓πr²h).`,
      say: `Size the cone tower. Radius ${r}, height ${h}. Dial its volume — one third pi r squared h.`,
      work: [`Volume = ⅓πr²h ≈ (1/3) × 3.14159 × ${r}² × ${h} = ${n}. Dial ${n}.`],
      n, unit: 'cu',
    }
  }
  // Sphere volume = (4/3)πr³.
  const r = rint(2, 4)
  const n = r1((4 / 3) * PI * r * r * r)
  return {
    kind: 'measure', scene: 'circle',
    title: 'Dome', badge: `dome · r = ${r}`, tone: 'b',
    prompt: `Size the dome: dial its VOLUME (V = ⁴⁄₃πr³).`,
    say: `Size the dome. Its radius is ${r}. Dial its volume — four thirds pi r cubed.`,
    work: [`Volume = ⁴⁄₃πr³ ≈ (4/3) × 3.14159 × ${r}³ = ${n}. Dial ${n}.`],
    n, unit: 'cu',
  }
}

// ── L3: transformation image coordinate + midpoint (PartsBuilder integer pair) ─
function pointTask(d: 1 | 2 | 3): Task {
  const which = rint(0, 3)
  if (which === 0) {
    // Translate the object to its image spot.
    const sx = rint(-4, 2), sy = rint(-4, 2)
    const dx = rint(1, 4), dy = rint(1, 4)
    const x = sx + dx, y = sy + dy
    return {
      kind: 'point', scene: 'move',
      title: 'Place: translate', badge: `move (${fmtInt(sx)}, ${fmtInt(sy)}) by (+${dx}, +${dy})`, tone: 'a',
      prompt: `Place the object: translate (${fmtInt(sx)}, ${fmtInt(sy)}) by (x + ${dx}, y + ${dy}). Build the image point.`,
      say: `Place the object. Slide the point at ${spoken(sx)}, ${spoken(sy)} — ${dx} right and ${dy} up. Build where it lands.`,
      work: [`Add ${dx} to x and ${dy} to y: (${fmtInt(sx)} + ${dx}, ${fmtInt(sy)} + ${dy}) = (${fmtInt(x)}, ${fmtInt(y)}). Build it.`],
      x, y,
    }
  }
  if (which === 1) {
    // Reflect the object across an axis.
    const axis: 'x' | 'y' = Math.random() < 0.5 ? 'x' : 'y'
    let sx = rint(-5, 5), sy = rint(-5, 5)
    let guard = 0
    while ((sx === 0 || sy === 0) && guard++ < 20) { sx = rint(-5, 5); sy = rint(-5, 5) }
    const x = axis === 'x' ? sx : -sx
    const y = axis === 'x' ? -sy : sy
    return {
      kind: 'point', scene: 'move',
      title: 'Place: reflect', badge: `reflect (${fmtInt(sx)}, ${fmtInt(sy)}) over the ${axis}-axis`, tone: 'a',
      prompt: `Place the object: reflect (${fmtInt(sx)}, ${fmtInt(sy)}) across the ${axis}-axis. Build the image point.`,
      say: `Place the object. Flip the point at ${spoken(sx)}, ${spoken(sy)} across the ${axis === 'x' ? 'x' : 'y'} axis. Build where it lands.`,
      work: [axis === 'x'
        ? `Reflecting across the x-axis flips the sign of y: (${fmtInt(sx)}, ${fmtInt(y)}). Build it.`
        : `Reflecting across the y-axis flips the sign of x: (${fmtInt(x)}, ${fmtInt(sy)}). Build it.`],
      x, y,
    }
  }
  if (which === 2) {
    // Rotate 180° about the origin → (−x, −y).
    let sx = rint(-5, 5), sy = rint(-5, 5)
    let guard = 0
    while ((sx === 0 && sy === 0) && guard++ < 20) { sx = rint(-5, 5); sy = rint(-5, 5) }
    const x = -sx, y = -sy
    return {
      kind: 'point', scene: 'move',
      title: 'Place: rotate', badge: `rotate (${fmtInt(sx)}, ${fmtInt(sy)}) 180° about O`, tone: 'b',
      prompt: `Place the object: rotate (${fmtInt(sx)}, ${fmtInt(sy)}) 180° about the origin. Build the image point.`,
      say: `Place the object. Spin the point at ${spoken(sx)}, ${spoken(sy)} a half turn about the origin. Build where it lands.`,
      work: [`A 180° rotation flips both signs: (${fmtInt(x)}, ${fmtInt(y)}). Build it.`],
      x, y,
    }
  }
  // Midpoint of a segment (force an even sum → lattice midpoint).
  let ax = rint(-5, 5), ay = rint(-5, 5)
  let bx = rint(-5, 5), by = rint(-5, 5)
  let guard = 0
  while ((((ax + bx) % 2 !== 0) || ((ay + by) % 2 !== 0) || (ax === bx && ay === by)) && guard++ < 60) {
    bx = rint(-5, 5); by = rint(-5, 5)
  }
  const x = (ax + bx) / 2, y = (ay + by) / 2
  return {
    kind: 'point', scene: 'move',
    title: 'Place: midpoint', badge: `midpoint of (${fmtInt(ax)}, ${fmtInt(ay)}) → (${fmtInt(bx)}, ${fmtInt(by)})`, tone: 'b',
    prompt: `Drop a checkpoint at the MIDPOINT of the segment from (${fmtInt(ax)}, ${fmtInt(ay)}) to (${fmtInt(bx)}, ${fmtInt(by)}). Build the point.`,
    say: `Drop a checkpoint halfway between ${spoken(ax)}, ${spoken(ay)} and ${spoken(bx)}, ${spoken(by)}. Build the midpoint.`,
    work: [`Average the coordinates: ((${fmtInt(ax)} + ${fmtInt(bx)})/2, (${fmtInt(ay)} + ${fmtInt(by)})/2) = (${fmtInt(x)}, ${fmtInt(y)}). Build it.`],
    x, y,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return circleTask(d)
  if (d === 2) return solidTask(d)
  return pointTask(d)
}

// ── fixed worked example (walkthrough) — size a round zone by its area ────────
const DEMO_TASK: Task = {
  kind: 'measure', scene: 'circle',
  title: 'Round zone', badge: 'round zone · r = 3  (area)', tone: 'a',
  prompt: '', say: '', work: ['Area = πr² ≈ 3.14159 × 3² = 28.3.'],
  n: r1(PI * 9), unit: 'sq',
}
const DEMO_ANS = DEMO_TASK.n! // 28.3
// The zone GROWS across the beats: drop it → we need area → the rule → radius →
// square it → nine → bring in pi → multiply → land → lock it in. ELEVEN baby
// steps: one idea + one board line + one value beat each; the fill wedge sweeps
// continuously as `n` climbs toward 28.3, and the r²/×π cues key off stepIndex.
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Welcome to the level editor. Let's drop a round zone onto the map. Its radius is three — that's from the middle out to the edge.", value: { k: 'measure', n: r1(DEMO_ANS * 0.14) }, board: 'round zone,  r = 3' },
  { say: 'To fit this zone into the level, we need to know its area — how much ground it covers.', value: { k: 'measure', n: r1(DEMO_ANS * 0.14) }, board: 'need: area' },
  { say: 'The rule for the area of any circle is pi times the radius squared.', value: { k: 'measure', n: r1(DEMO_ANS * 0.22) }, board: 'A = π r²' },
  { say: 'So we start with the radius. Here it is — three squares from the center to the edge.', value: { k: 'measure', n: r1(DEMO_ANS * 0.32) }, board: 'r = 3' },
  { say: 'Now square the radius. Squaring three means three rows of three little squares.', value: { k: 'measure', n: r1(DEMO_ANS * 0.5) }, board: 'r² = 3²' },
  { say: 'Count them up — three rows of three is nine. So r squared is nine.', value: { k: 'measure', n: r1(DEMO_ANS * 0.5) }, board: 'r² = 9' },
  { say: 'Next we bring in pi. Pi is a little more than three — about three point one four.', value: { k: 'measure', n: r1(DEMO_ANS * 0.62) }, board: 'π ≈ 3.14' },
  { say: 'Multiply the nine by pi.', value: { k: 'measure', n: r1(DEMO_ANS * 0.82) }, board: 'A = 9 × π' },
  { say: 'Nine times three point one four is about twenty-eight point three.', value: { k: 'measure', n: DEMO_ANS }, board: 'A ≈ 28.3' },
  { say: 'So this round zone covers about twenty-eight point three squares of the map.', value: { k: 'measure', n: DEMO_ANS }, board: 'area ≈ 28.3' },
  { say: 'Dial the size to twenty-eight point three to lock the zone into the level.', value: { k: 'measure', n: DEMO_ANS }, board: 'size = 28.3 ✓' },
]

/** A filled pie-sector path from the top (−90°), sweeping `sweepDeg` clockwise. */
function sectorPath(cx: number, cy: number, r: number, sweepDeg: number, startDeg = -90): string {
  const s = Math.max(0, Math.min(359.99, sweepDeg))
  if (s < 0.6 || r <= 0) return ''
  const a0 = (startDeg * Math.PI) / 180
  const a1 = ((startDeg + s) * Math.PI) / 180
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
  const large = s > 180 ? 1 : 0
  return `M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r.toFixed(1)},${r.toFixed(1)} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`
}

// ── hand-authored SVG level-editor scene (storyboard: docs/storyboards/map-maker.md)
// A blueprint editor canvas. During the WALKTHROUGH it ACTS OUT sizing a round
// zone: a radar fill wedge sweeps around continuously as the dialled value climbs,
// the outline radius grows, an r² tile lattice blooms on the "square" beat, a × π
// cue on the multiply beat, and a HUD counter counts up to the area. Continuous
// motion rides a `useMotionValue` frac (dialled / answer) mapped through
// `useTransform`, so it FLOWS between beats. The POINT sub-type (scored L3 play /
// reveal) is a signed coordinate map: a ghost origin, a dashed travel arrow, and
// the placed object SPRINGS onto its lattice coordinate. Everything sits on the
// exact mapping; `useReducedMotion` collapses to the end state. Pure SVG, no assets.
function MapScene({ palette, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: V; stepIndex: number; frameCount: number; ended: boolean
}) {
  void frameCount
  const p = palette
  const reduce = useReducedMotion()
  const solved = ended
  const CX = 122, CY = 122
  const spring = { type: 'spring' as const, stiffness: 320, damping: 20 }

  // ── MEASURE hooks: the fill fraction (dialled / answer) drives everything ──
  const target = task.n ?? 1
  const curN = value.k === 'measure' ? value.n : 0
  const measureFrac = target > 0 ? Math.max(0.08, Math.min(1, curN / target)) : 0.08
  const mFrac = useMotionValue(measureFrac)
  useEffect(() => {
    const c = animate(mFrac, measureFrac, reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 18 })
    return () => c.stop()
  }, [measureFrac, reduce, mFrac])
  const zoneR = useTransform(mFrac, (f) => 16 + f * 86)
  const radiusX2 = useTransform(mFrac, (f) => CX + 16 + f * 86)
  const fillPath = useTransform(mFrac, (f) => sectorPath(CX, CY, 16 + f * 86 - 3, f * 359.99))
  const tipX = useTransform(mFrac, (f) => CX + (16 + f * 86 - 3) * Math.cos((-90 + f * 359.99) * Math.PI / 180))
  const tipY = useTransform(mFrac, (f) => CY + (16 + f * 86 - 3) * Math.sin((-90 + f * 359.99) * Math.PI / 180))
  const areaText = useTransform(mFrac, (f) => (target * f).toFixed(1))

  // ── POINT hooks: the object springs to its image lattice coordinate ──
  const ptA = value.k === 'pt' ? value.a : 0
  const ptB = value.k === 'pt' ? value.b : 0
  const tx = CX + ptA * 20, ty = CY - ptB * 20
  const mx = useMotionValue(tx), my = useMotionValue(ty)
  useEffect(() => {
    const c1 = animate(mx, tx, reduce ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 20 })
    const c2 = animate(my, ty, reduce ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 20 })
    return () => { c1.stop(); c2.stop() }
  }, [tx, ty, reduce, mx, my])

  const col = solved ? '#2fb37f' : p.goldDeep
  const gridLines = []
  for (let i = 0; i <= 10; i++) {
    const t = 12 + i * 22
    gridLines.push(<line key={`h${i}`} x1={12} y1={t} x2={232} y2={t} stroke="rgba(234,243,255,0.10)" strokeWidth={1} />)
    gridLines.push(<line key={`v${i}`} x1={t} y1={12} x2={t} y2={232} stroke="rgba(234,243,255,0.10)" strokeWidth={1} />)
  }
  const wrap: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }
  const svgStyle: CSSProperties = { background: p.glass, border: `1px solid ${p.glassBorder}`, borderRadius: 12, display: 'block' }
  const framePath = { initial: { pathLength: 0 as number }, animate: { pathLength: 1 as number }, transition: reduce ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const } }

  // ── MEASURE scene — a growing round zone whose fill tracks the dialled value ──
  if (task.kind === 'measure') {
    const sweeping = stepIndex >= 1 && stepIndex <= 7 && !solved
    const radiusBeat = stepIndex >= 3 && stepIndex <= 5 && !solved
    const showSquare = (stepIndex === 4 || stepIndex === 5) && !solved
    const showPi = (stepIndex === 6 || stepIndex === 7) && !solved
    const landed = solved || stepIndex >= 8
    return (
      <div style={wrap}>
        <svg viewBox="0 0 244 244" width="clamp(180px, 26vw, 300px)" height="clamp(180px, 26vw, 300px)" style={svgStyle}>
          {gridLines}
          {/* editor frame draws itself in */}
          <motion.rect x={6} y={6} width={232} height={232} rx={10} fill="none" stroke={p.glassBorder} strokeWidth={1.2} {...framePath} />
          <text x={14} y={20} fill={p.mutedOnPaper} fontSize={8} letterSpacing="0.14em" fontFamily="var(--font-numeric)">LEVEL EDITOR</text>

          {/* the round zone: fill wedge sweeps as the size climbs */}
          <motion.path d={fillPath} fill={landed ? 'rgba(47,179,127,0.22)' : 'rgba(127,208,255,0.16)'} style={{ transition: 'fill 300ms' }} />
          <motion.circle cx={CX} cy={CY} r={zoneR} fill="none" stroke={col} strokeWidth={3} />
          {/* leading-edge tip riding the fill wedge while sizing */}
          {!landed && <motion.circle cx={tipX} cy={tipY} r={3.6} fill={p.gold} />}

          {/* radius guide + r = 3 tag (radius / square beats) */}
          {radiusBeat && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.3 }}>
              <motion.line x1={CX} y1={CY} x2={radiusX2} y2={CY} stroke={p.gold} strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
              <text x={CX + 34} y={CY - 6} textAnchor="middle" fill={p.gold} fontSize={12} fontWeight={800} fontFamily="var(--font-numeric)">r = 3</text>
            </motion.g>
          )}

          {/* r² cue — a 3×3 lattice of unit tiles springs in inside the zone */}
          {showSquare && (
            <g>
              {[0, 1, 2].map((gx) => [0, 1, 2].map((gy) => (
                <motion.rect key={`sq${gx}-${gy}`} x={CX - 27 + gx * 18} y={CY - 27 + gy * 18} width={16} height={16} rx={2}
                  fill="rgba(127,208,255,0.30)" stroke={p.gold} strokeWidth={1}
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={reduce ? { duration: 0 } : { ...spring, delay: (gx * 3 + gy) * 0.04 }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
              )))}
              <text x={CX} y={CY + 46} textAnchor="middle" fill={p.gold} fontSize={12} fontWeight={800} fontFamily="var(--font-numeric)">3² = 9</text>
            </g>
          )}

          {/* × π cue */}
          {showPi && (
            <motion.text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fill={p.gold} fontSize={22} fontWeight={800} fontFamily="var(--font-numeric)"
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={reduce ? { duration: 0 } : spring}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>× π</motion.text>
          )}

          {/* crosshair anchor at the zone centre */}
          <line x1={CX - 7} y1={CY} x2={CX + 7} y2={CY} stroke={p.creamSoft} strokeWidth={1} opacity={0.7} />
          <line x1={CX} y1={CY - 7} x2={CX} y2={CY + 7} stroke={p.creamSoft} strokeWidth={1} opacity={0.7} />
          <circle cx={CX} cy={CY} r={3.5} fill={p.cream} />
        </svg>
        <motion.div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px, 2.4vw, 30px)', fontWeight: 800, color: col, transition: 'color 300ms' }}>
          {solved ? target : areaText}
        </motion.div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>
          {landed ? 'zone size ✓' : 'zone size'}
        </div>
      </div>
    )
  }

  // ── POINT scene — the object springs to its image spot; ghost + travel arrow ──
  const moved = !(ptA === 0 && ptB === 0) || solved
  const arrow = moved && (tx !== CX || ty !== CY)
  return (
    <div style={wrap}>
      <svg viewBox="0 0 244 244" width="clamp(180px, 26vw, 300px)" height="clamp(180px, 26vw, 300px)" style={svgStyle}>
        {gridLines}
        <motion.rect x={6} y={6} width={232} height={232} rx={10} fill="none" stroke={p.glassBorder} strokeWidth={1.2} {...framePath} />
        <text x={14} y={20} fill={p.mutedOnPaper} fontSize={8} letterSpacing="0.14em" fontFamily="var(--font-numeric)">LEVEL EDITOR</text>
        {/* signed axes */}
        <motion.line x1={CX} y1={12} x2={CX} y2={232} stroke="rgba(234,243,255,0.34)" strokeWidth={1.5} {...framePath} />
        <motion.line x1={12} y1={CY} x2={232} y2={CY} stroke="rgba(234,243,255,0.34)" strokeWidth={1.5} {...framePath} />
        {/* ghost of the origin position */}
        {arrow && (
          <rect x={CX - 7} y={CY - 7} width={14} height={14} rx={3} fill="none" stroke="rgba(234,243,255,0.4)" strokeWidth={1.5} strokeDasharray="3 3" />
        )}
        {/* travel arrow from the ghost to the image spot (draws in) */}
        {arrow && (
          <motion.line x1={CX} y1={CY} x2={tx} y2={ty} stroke={p.gold} strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.9 }} transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeInOut' }} />
        )}
        {/* the placed object — springs to its image coordinate */}
        <motion.rect width={14} height={14} rx={3} x={-7} y={-7}
          fill={moved ? (solved ? '#2fb37f' : p.gold) : 'rgba(234,243,255,0.35)'} stroke={p.cream} strokeWidth={1.5}
          style={{ x: mx, y: my, transition: 'fill 300ms' }} />
      </svg>
      <motion.div key={`${ptA},${ptB}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? { duration: 0 } : spring}
        style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(18px, 2.2vw, 28px)', fontWeight: 800, color: solved ? '#2fb37f' : p.goldDeep }}>
        ({fmtInt(ptA)}, {fmtInt(ptB)})
      </motion.div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>drop point</div>
    </div>
  )
}

// Grade a measurement with a tolerance (decimals can't be exact).
const near = (v: number, ans: number) => Math.abs(v - ans) < 0.5

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'geometryTransformations',
  title: 'MAP MAKER',
  ticketLabel: 'level spec',
  palette: P,
  motif: '🗺️',
  makeTask,
  initialValue: (t) =>
    t.kind === 'measure'
      ? { k: 'measure', n: r1(Math.max(0, (t.n ?? 0) - 6)) }
      : { k: 'pt', a: 0, b: 0 },
  grade: (t, v) =>
    t.kind === 'measure'
      ? v.k === 'measure' && near(v.n, t.n ?? 0)
      : v.k === 'pt' && v.a === t.x && v.b === t.y,
  revealText: (t) => (t.kind === 'measure' ? `${t.n}` : `(${fmtInt(t.x ?? 0)}, ${fmtInt(t.y ?? 0)})`),
  glide: (t, _from, setValue, later) =>
    later(() => setValue(t.kind === 'measure'
      ? { k: 'measure', n: t.n ?? 0 }
      : { k: 'pt', a: t.x ?? 0, b: t.y ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'measure') {
      const ans = task.n ?? 0
      const n = value.k === 'measure' ? value.n : 0
      // Tight range around the answer, step 0.1 so the decimal is reachable.
      const lo = r1(Math.max(0, ans - 8))
      const hi = r1(ans + 8)
      return (
        <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'measure', n: r1(x) })}
          min={lo} max={hi} step={0.1} format={(x) => `${r1(x)}`}
          disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'measure', n: r1(x) })} commitLabel="SIZE IT ✓" />
      )
    }
    const a = value.k === 'pt' ? value.a : 0, b = value.k === 'pt' ? value.b : 0
    return (
      <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'pt', a: pr.a, b: pr.b })} min={-9} max={9}
        template={(x, y) => `(${fmtInt(x)}, ${fmtInt(y)})`} labels={['x', 'y']}
        disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'pt', a: pr.a, b: pr.b })} commitLabel="PLACE IT ✓" />
    )
  },
  TutorialScene: ({ palette, task, value, stepIndex, frameCount, ended }) => (
    <MapScene palette={palette} task={task} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />
  ),
  start: {
    blurb: <><strong>You&apos;re building a game level.</strong> Size the round zones and crates by their <strong>measurement</strong>, and <strong>place</strong> objects by their transformed coordinates. Milo will show you one first.</>,
    ticket: { title: 'Level spec', badge: 'round zone · r = 3', tone: 'a' },
    startLabel: 'Open the editor →',
  },
  overview: {
    say: 'Here is the plan. A round zone on the map is sized by its area — pi times the radius squared. We square the radius, then multiply by pi. Let us size one together, nice and slow.',
    problem: <>Size a <strong>round zone</strong> with radius <strong>3</strong> — dial its <strong>area</strong>.</>,
    points: [
      <>A circle&apos;s area is <strong>A = πr²</strong> (π ≈ 3.14).</>,
      <>First <strong>square the radius</strong>: 3² = 9.</>,
      <>Then <strong>multiply by π</strong>: 9 × 3.14 ≈ 28.3.</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'measure', n: r1(DEMO_ANS * 0.2) }, hand: 'drag', steps: DEMO_STEPS },
  guided: {
    task: {
      kind: 'measure', scene: 'circle',
      title: 'Round zone', badge: 'round zone · r = 2  (area)', tone: 'a',
      prompt: '', say: 'Your turn. Size this round zone — radius two, dial its area.',
      work: ['Area = πr² ≈ 3.14159 × 2² = 12.6.'],
      n: r1(PI * 4), unit: 'sq',
    },
    coach: 'Your turn — I will help. Size this round zone: dial its area.',
    hand: 'drag',
  },
  sig: (t) => t.badge,
}

export default function MapMaker(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
