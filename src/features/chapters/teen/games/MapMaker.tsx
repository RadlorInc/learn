'use client'
/**
 * MapMaker — the Geometry & Transformations chapter (15–16) as a PLAYABLE GAME.
 * World: a game-level EDITOR. You size round zones and crates by their measurement,
 * and you MOVE objects around the level grid — sliding, mirroring, spinning and
 * scaling them into place.
 *
 * ⚠️ TWO THINGS WERE REBUILT HERE. Both are worth reading before editing.
 *
 * ① COVERAGE. The chapter is called "Geometry & Transformations" and its hint reads
 *    "Circles, solids & transformations", but transformations used to appear ONLY at
 *    tier 3. The adaptive engine ramps 1→2→3 and DEMOTES on a wrong answer, so a
 *    child who never got promoted past L2 finished the chapter having never met a
 *    transformation at all — the half of the title they were promised. The
 *    curriculum ramp in docs/curriculum-12-18.md does read "circles → solids →
 *    transformations", but that is a difficulty ordering, not a licence to gate the
 *    title topic behind mastery of a different topic. Both strands now run at EVERY
 *    tier and get harder together:
 *      L1  circle (area / circumference)     ·  TRANSLATE   (slide by a vector)
 *      L2  prism & cylinder volume           ·  REFLECT, ROTATE 180°  (sign flips)
 *      L3  cone volume                       ·  ROTATE 90°, DILATE, MIDPOINT
 *    Difficulty is new structure, not bigger numbers: one formula → three factors →
 *    a division; a slide → a flip → a coordinate swap / a scaling.
 *
 * ② MECHANIC. The old hardest question was dialling ⁴⁄₃π·4³ = 268.1 to one decimal:
 *    calculator work typed into a slider, which no illustration on this board ever
 *    performed. Two changes retire it. Every mensuration answer is now an EXACT
 *    INTEGER — circle and round-solid answers are given IN TERMS OF π (area = r²·π,
 *    so the child produces r², the part they can actually reason about) — and those
 *    questions are answered on the AnswerPad, where the distractors are the real
 *    mistakes (diameter for radius, the circumference formula used for area,
 *    forgetting to square). The sphere is gone: ⁴⁄₃πr³ is a whole number of π only
 *    at r = 3, so it cannot be asked honestly more than one way. See the report.
 *
 *    Meanwhile the grid now PERFORMS the transformation. `MoveGrid` lets the child
 *    DRAG the object across the level; while they drag, the board narrates their own
 *    gesture in mathematical language — the vector they have moved by, the halfway
 *    point between start and finish, the turn about the origin, the scale factor
 *    from the origin. It never says right or wrong before they commit (that would be
 *    hot/cold guessing, the failure BalanceBench was rejected for); it says what they
 *    just did, so the child compares it to the instruction themselves.
 *
 * WHY THE GRID SURVIVES THE PAD FAN-OUT: a transformed object's position is a PAIR,
 * not a single number, so it cannot go on the AnswerPad — and dragging it there is
 * the operation itself, not a dressed-up way to enter a number worked out elsewhere.
 *
 * No guided round: the walkthrough works BOTH graded gestures (the round zone, then
 * a reflection dragged across the axis). Scene is code-drawn, no assets.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, CommitBtn, numChoices } from './parts/gameKit'
import { rint, pick } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#12233b', nightBot: '#0a1420',
  cream: '#eaf3ff', creamSoft: 'rgba(234,243,255,0.82)',
  inkOnPaper: '#132339', mutedOnPaper: '#6a7c9a',
  gold: '#7fd0ff', goldDeep: '#2f8fd6',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(18,35,59,0.6)', glassBorder: 'rgba(234,243,255,0.2)',
}

/** Signed vector component, always with its sign: "+3" / "−2". */
const sgn = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `+${n}`)
/** SPOKEN integer — a minus glyph reads as nothing, so speech gets words. */
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
/** One decimal, but drop a trailing .0 (a halfway point is often a whole number). */
const d1 = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** The answer is either an integer MEASUREMENT (tapped on the pad) or an integer
 *  lattice POINT (dragged on the grid). Tagged union ⇒ `padValue` is mandatory. */
type V = { k: 'num'; n: number } | { k: 'pt'; a: number; b: number }

type Move = 'translate' | 'reflect' | 'rot180' | 'rot90' | 'dilate' | 'midpoint'

interface Task extends BaseTask {
  kind: 'measure' | 'move'
  // measure — answer is `n`, shown with `suffix` ('π' or ' cu')
  n?: number
  suffix?: string
  pad?: number[]
  // move — the object starts at (ax, ay) and must land on (x, y)
  mv?: Move
  ax?: number; ay?: number
  bx?: number; by?: number      // midpoint: the segment's other end
  axis?: 'x' | 'y'              // reflect
  dx?: number; dy?: number      // translate
  scale?: number                // dilate
  x?: number; y?: number        // the answer point
}

// ══════════════════════════════════════════════════════════════════════════════
// MENSURATION — every answer an exact integer, tapped on the pad.
// Round figures are answered IN TERMS OF π: the child produces the coefficient
// (r², 2r, r²h, r²h⁄3), which is the part they can reason about; π is never
// multiplied out, so no decimal precision is ever demanded of them.
// ══════════════════════════════════════════════════════════════════════════════

/** L1 — circle area (r²π) or circumference (2rπ).
 *  r ≥ 3 deliberately: at r = 2 the "used the circumference formula for area"
 *  distractor (2r = 4) EQUALS the area coefficient (r² = 4), numChoices drops the
 *  duplicate, and the one misconception this item exists to catch vanishes. */
function circleTask(): Task {
  const r = rint(3, 6)
  const area = Math.random() < 0.5
  const n = area ? r * r : 2 * r
  return {
    kind: 'measure', suffix: 'π',
    title: 'Round zone', tone: 'a',
    badge: area ? `area = ? × π    (r = ${r})` : `edge = ? × π    (r = ${r})`,
    context: `A round zone on the map reaches ${r} squares out from its middle.`,
    prompt: area ? `Area of a circle with radius ${r}, in terms of π.` : `Circumference of a circle with radius ${r}, in terms of π.`,
    padInstruction: 'Tap the number that goes in front of π.',
    showEquals: false,
    say: area
      ? `A round zone with radius ${r}. Its area is pi times the radius squared. How many pi is that?`
      : `A round zone with radius ${r}. The distance around it is two pi r. How many pi is that?`,
    work: [area
      ? `Area = π r². Square the radius first: ${r}² = ${r * r}. So the area is ${r * r} π.`
      : `Circumference = 2 π r. Double the radius: 2 × ${r} = ${2 * r}. So the edge is ${2 * r} π.`],
    n,
    // diameter mistaken for radius · the OTHER circle formula · forgot to square/double
    pad: area ? [4 * r * r, 2 * r, r] : [r * r, r, 4 * r],
  }
}

/** L2 — a rectangular crate (l·w·h) or a cylinder silo (r²h·π). Three factors
 *  instead of one, which is the new structure, not bigger numbers. */
function solidTask(): Task {
  if (Math.random() < 0.5) {
    const l = rint(2, 6), w = rint(2, 5), h = rint(2, 5)
    const n = l * w * h
    return {
      kind: 'measure', suffix: ' cu',
      title: 'Crate', tone: 'a',
      badge: `volume = ?    (${l} × ${w} × ${h})`,
      context: `A supply crate on the level is ${l} by ${w} by ${h} squares.`,
      prompt: `Volume of a ${l} × ${w} × ${h} crate.`,
      padInstruction: 'Tap the volume, in cubes.',
      showEquals: false,
      say: `A crate ${l} by ${w} by ${h}. How many unit cubes fill it?`,
      work: [`Volume = length × width × height = ${l} × ${w} × ${h} = ${n} cubes.`],
      n,
      // added instead of multiplied · only the floor (area, not volume) · doubled
      pad: [l + w + h, l * w, 2 * l * w * h],
    }
  }
  const r = rint(2, 5), h = rint(2, 6)
  const n = r * r * h
  return {
    kind: 'measure', suffix: 'π',
    title: 'Silo', tone: 'b',
    badge: `volume = ? × π    (r = ${r}, h = ${h})`,
    context: `A round silo ${r} squares across from its middle, standing ${h} high.`,
    prompt: `Volume of a cylinder with radius ${r} and height ${h}, in terms of π.`,
    padInstruction: 'Tap the number that goes in front of π.',
    showEquals: false,
    say: `A silo with radius ${r} and height ${h}. Its volume is pi r squared, times the height. How many pi is that?`,
    work: [`Volume = π r² h. Square the radius: ${r}² = ${r * r}. Then × ${h}: ${r * r} × ${h} = ${n}. So the volume is ${n} π.`],
    n,
    // forgot to square r · used the circumference (2r) as the base · diameter for radius
    pad: [r * h, 2 * r * h, 4 * r * r * h],
  }
}

/** L3 — a cone tower, ⅓πr²h. The new structure is the DIVISION: the child must
 *  take a third of a quantity they just built. h is a multiple of 3 so the answer
 *  stays a whole number of π — the child is never asked for a decimal. */
function coneTask(): Task {
  const r = rint(2, 5), h = pick([3, 6])
  const n = (r * r * h) / 3
  return {
    kind: 'measure', suffix: 'π',
    title: 'Cone tower', tone: 'b',
    badge: `volume = ? × π    (r = ${r}, h = ${h})`,
    context: `A cone-topped tower, ${r} squares across from its middle and ${h} high.`,
    prompt: `Volume of a cone with radius ${r} and height ${h}, in terms of π.`,
    padInstruction: 'Tap the number that goes in front of π.',
    showEquals: false,
    say: `A cone tower with radius ${r} and height ${h}. A cone holds one third of the silo that would fit around it. How many pi is that?`,
    work: [`A cone is a third of the cylinder around it. That cylinder is π r² h = ${r * r} × ${h} = ${r * r * h} π. A third of ${r * r * h} is ${n}, so the cone is ${n} π.`],
    n,
    // forgot the ⅓ (the whole cylinder) · diameter for radius · forgot to square r
    pad: [r * r * h, (4 * r * r * h) / 3, (r * h) / 3],
  }
}

/** L3 — a dome, ⁴⁄₃πr³. RESTORED after being cut for demanding a decimal: once
 *  round figures are answered IN TERMS OF π that reason is gone, and ⁴⁄₃r³ is a
 *  whole number at r = 3 (36π) AND r = 6 (288π) — two seeds, not the one the
 *  removal note claimed. The curriculum doc lists spheres for this chapter, so
 *  dropping them was a real coverage loss with a stale justification. */
function domeTask(): Task {
  const r = pick([3, 6])
  const n = (4 * r * r * r) / 3
  return {
    kind: 'measure', suffix: 'π',
    title: 'Dome', tone: 'b',
    badge: `volume = ? × π    (r = ${r})`,
    context: `A domed roof, ${r} squares from its middle to the edge.`,
    prompt: `Volume of a sphere with radius ${r}, in terms of π.`,
    padInstruction: 'Tap the number that goes in front of π.',
    showEquals: false,
    say: `A dome with radius ${r}. A sphere holds four thirds of r cubed, times pi. How many pi is that?`,
    work: [`A sphere is four thirds of r cubed, times π. r cubed is ${r} × ${r} × ${r} = ${r * r * r}. Four thirds of ${r * r * r} is ${n}, so the dome is ${n} π.`],
    n,
    // forgot the ⁴⁄₃ (just r³) · squared instead of cubed · used the diameter
    pad: [r * r * r, r * r, (4 * (2 * r) ** 3) / 3],
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TRANSFORMATIONS — dragged on the level grid. The answer is a PAIR, so these
// keep their instrument; and the drag IS the transformation, not a way of typing
// in a coordinate worked out on paper.
// ══════════════════════════════════════════════════════════════════════════════

const GR = 6 // grid half-span; every start and image point stays inside it

function moveTask(mv: Move): Task {
  const base = { kind: 'move' as const, showEquals: false, tone: 'a' as const }

  if (mv === 'translate') {
    const dx = pick([-3, -2, -1, 1, 2, 3]), dy = pick([-3, -2, -1, 1, 2, 3])
    const ax = rint(-3, 3), ay = rint(-3, 3)
    return {
      ...base, mv, title: 'Slide it', ax, ay, dx, dy, x: ax + dx, y: ay + dy,
      badge: `slide (${disp(ax)}, ${disp(ay)})  by  (${sgn(dx)}, ${sgn(dy)})`,
      context: 'The prop needs sliding to a new spot on the level.',
      prompt: `Drag the prop ${Math.abs(dx)} ${dx < 0 ? 'left' : 'right'} and ${Math.abs(dy)} ${dy < 0 ? 'down' : 'up'}.`,
      instruction: 'Drag the prop to where it lands.',
      say: `Slide the prop at ${spoken(ax)}, ${spoken(ay)} by ${spoken(dx)} across and ${spoken(dy)} up. Drag it to where it lands.`,
      work: [`Sliding adds to each coordinate: x goes ${disp(ax)} ${sgn(dx)} = ${disp(ax + dx)}, y goes ${disp(ay)} ${sgn(dy)} = ${disp(ay + dy)}. It lands on (${disp(ax + dx)}, ${disp(ay + dy)}).`],
    }
  }

  if (mv === 'reflect') {
    const axis: 'x' | 'y' = Math.random() < 0.5 ? 'x' : 'y'
    let ax = rint(-5, 5), ay = rint(-5, 5)
    while (ax === 0 || ay === 0) { ax = rint(-5, 5); ay = rint(-5, 5) }
    const x = axis === 'x' ? ax : -ax
    const y = axis === 'x' ? -ay : ay
    return {
      ...base, mv, title: 'Mirror it', ax, ay, axis, x, y,
      badge: `mirror (${disp(ax)}, ${disp(ay)})  in the ${axis}-axis`,
      context: `The ${axis}-axis is a mirror line across the level.`,
      prompt: `Drag the prop to its mirror image across the ${axis}-axis.`,
      instruction: 'Drag the prop to its mirror spot.',
      say: `Mirror the prop at ${spoken(ax)}, ${spoken(ay)} across the ${axis} axis. Drag it to where the reflection sits.`,
      work: [axis === 'x'
        ? `The x-axis is the mirror, so x stays ${disp(ax)} and y flips to the other side: ${disp(ay)} becomes ${disp(y)}. It lands on (${disp(x)}, ${disp(y)}).`
        : `The y-axis is the mirror, so y stays ${disp(ay)} and x flips to the other side: ${disp(ax)} becomes ${disp(x)}. It lands on (${disp(x)}, ${disp(y)}).`],
    }
  }

  if (mv === 'rot180') {
    let ax = rint(-5, 5), ay = rint(-5, 5)
    while (ax === 0 && ay === 0) { ax = rint(-5, 5); ay = rint(-5, 5) }
    return {
      ...base, mv, title: 'Spin it', tone: 'b', ax, ay, x: -ax, y: -ay,
      badge: `turn (${disp(ax)}, ${disp(ay)})  half a turn about O`,
      context: 'The prop pivots around the centre of the level.',
      prompt: 'Drag the prop to where a half turn about the origin puts it.',
      instruction: 'Drag the prop through the centre.',
      say: `Spin the prop at ${spoken(ax)}, ${spoken(ay)} half a turn about the origin. Drag it to where it comes to rest.`,
      work: [`A half turn carries a point straight through the origin to the same distance the other side, so both coordinates flip: (${disp(-ax)}, ${disp(-ay)}).`],
    }
  }

  if (mv === 'rot90') {
    // Quarter turn counter-clockwise about O: (x, y) → (−y, x).
    let ax = rint(-5, 5), ay = rint(-5, 5)
    while (ax === 0 && ay === 0) { ax = rint(-5, 5); ay = rint(-5, 5) }
    return {
      ...base, mv, title: 'Quarter turn', tone: 'b', ax, ay, x: -ay, y: ax,
      badge: `turn (${disp(ax)}, ${disp(ay)})  a quarter turn ↺ about O`,
      context: 'The prop swings a quarter turn anticlockwise around the centre.',
      prompt: 'Drag the prop to where a quarter turn anticlockwise puts it.',
      instruction: 'Drag the prop a quarter turn round.',
      say: `Turn the prop at ${spoken(ax)}, ${spoken(ay)} a quarter turn anticlockwise about the origin. Drag it to where it stops.`,
      work: [`A quarter turn anticlockwise swaps the coordinates and flips the sign of the new x: (${disp(ax)}, ${disp(ay)}) goes to (${disp(-ay)}, ${disp(ax)}).`],
    }
  }

  if (mv === 'dilate') {
    const scale = pick([2, 3])
    const lim = scale === 2 ? 3 : 2
    let ax = rint(-lim, lim), ay = rint(-lim, lim)
    while (ax === 0 && ay === 0) { ax = rint(-lim, lim); ay = rint(-lim, lim) }
    return {
      ...base, mv, title: 'Scale it up', tone: 'b', ax, ay, scale, x: ax * scale, y: ay * scale,
      badge: `scale (${disp(ax)}, ${disp(ay)})  by ×${scale}  from O`,
      context: 'The prop is being blown up from the centre of the level.',
      prompt: `Drag the prop ${scale} times as far from the origin, straight out along the same line.`,
      instruction: 'Drag the prop out along the same line.',
      say: `Scale the prop at ${spoken(ax)}, ${spoken(ay)} by ${scale}, out from the origin. Drag it to where it lands.`,
      work: [`Scaling from the origin multiplies BOTH coordinates: (${disp(ax)} × ${scale}, ${disp(ay)} × ${scale}) = (${disp(ax * scale)}, ${disp(ay * scale)}).`],
    }
  }

  // midpoint — the checkpoint halfway along a segment. Both sums forced even so
  // the answer is a lattice point (no half-squares to place).
  const ax = rint(-5, 5), ay = rint(-5, 5)
  let bx = rint(-5, 5), by = rint(-5, 5)
  let guard = 0
  while ((((ax + bx) % 2 !== 0) || ((ay + by) % 2 !== 0) || (ax === bx && ay === by)) && guard++ < 80) {
    bx = rint(-5, 5); by = rint(-5, 5)
  }
  return {
    ...base, mv: 'midpoint', title: 'Halfway checkpoint', tone: 'b',
    ax, ay, bx, by, x: (ax + bx) / 2, y: (ay + by) / 2,
    badge: `midpoint of (${disp(ax)}, ${disp(ay)}) — (${disp(bx)}, ${disp(by)})`,
    context: 'A checkpoint goes halfway along the patrol route.',
    prompt: 'Drag the checkpoint to the middle of the route.',
    instruction: 'Drag the checkpoint to the middle.',
    say: `Drop a checkpoint halfway between ${spoken(ax)}, ${spoken(ay)} and ${spoken(bx)}, ${spoken(by)}. Drag it to the middle.`,
    work: [`The middle is the average of the ends: ((${disp(ax)} + ${disp(bx)}) ÷ 2, (${disp(ay)} + ${disp(by)}) ÷ 2) = (${disp((ax + bx) / 2)}, ${disp((ay + by) / 2)}).`],
  }
}

/** BOTH strands at every tier — see the coverage note at the top of the file. */
function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? circleTask() : moveTask('translate')
  if (d === 2) return Math.random() < 0.5 ? solidTask() : moveTask(Math.random() < 0.5 ? 'reflect' : 'rot180')
  return Math.random() < 0.5
    ? (Math.random() < 0.5 ? coneTask() : domeTask())
    : moveTask(pick<Move>(['rot90', 'dilate', 'midpoint']))
}

// ══════════════════════════════════════════════════════════════════════════════
// MoveGrid — the level grid, and the instrument that PERFORMS the transformation.
//
// The child DRAGS the prop across the grid; it snaps to the lattice. While they
// drag, the readout describes THEIR OWN GESTURE in the language of the
// transformation being asked for — the vector moved, the halfway point between
// start and finish, the turn about the origin, the scale factor out from the
// origin. That is the definition of each transformation made visible: a mirror
// line passes through the halfway point; a half turn puts the origin there; a
// dilation keeps you on the same ray, further out.
//
// It never says "right" or "wrong" before commit. Live correctness feedback turns
// solving into hot/cold nudging (the reason live tilt was rejected on BalanceBench);
// a description of your own move leaves the reasoning with the child.
// ══════════════════════════════════════════════════════════════════════════════
function MoveGrid({ P: p, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: V; setValue: (v: V) => void
  disabled?: boolean; reveal?: boolean; onCommit?: (v: V) => void
}) {
  const S = 300, pad = 18
  const cell = (S - 2 * pad) / (2 * GR)
  const X = (v: number) => pad + (v + GR) * cell
  const Y = (v: number) => pad + (GR - v) * cell
  const [dragging, setDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const ax = task.ax ?? 0, ay = task.ay ?? 0
  const px = value.k === 'pt' ? value.a : ax
  const py = value.k === 'pt' ? value.b : ay
  const mv = task.mv ?? 'translate'
  const col = reveal ? p.mint : p.gold

  const place = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return
    const r = e.currentTarget.getBoundingClientRect()
    const gx = Math.round(((e.clientX - r.left) / r.width * S - pad) / cell - GR)
    const gy = Math.round(GR - ((e.clientY - r.top) / r.height * S - pad) / cell)
    const cx = Math.max(-GR, Math.min(GR, gx)), cy = Math.max(-GR, Math.min(GR, gy))
    if (cx !== px || cy !== py) setValue({ k: 'pt', a: cx, b: cy })
  }

  // ── the readout: what the child has just done, said mathematically ──
  const moved = px !== ax || py !== ay
  const hx = (ax + px) / 2, hy = (ay + py) / 2                  // halfway point
  const dPre = Math.hypot(ax, ay), dNow = Math.hypot(px, py)
  const onRay = ax * py - ay * px === 0 && ax * px + ay * py > 0 // same ray out of O
  const turn = (() => {
    if (!moved || (ax === 0 && ay === 0)) return 0
    const t = (Math.atan2(py, px) - Math.atan2(ay, ax)) * 180 / Math.PI
    return Math.round(((t % 360) + 360) % 360)
  })()
  const dA = Math.hypot(px - ax, py - ay)
  const dB = Math.hypot(px - (task.bx ?? 0), py - (task.by ?? 0))

  let readout = 'Drag the prop.'
  if (moved) {
    if (mv === 'translate') readout = `moved (${sgn(px - ax)}, ${sgn(py - ay)})`
    else if (mv === 'reflect' || mv === 'rot180') {
      const onX = hy === 0, onY = hx === 0
      readout = `halfway point (${d1(hx)}, ${d1(hy)})`
        + (onX && onY ? ' — the origin' : onX ? ' — on the x-axis' : onY ? ' — on the y-axis' : '')
    } else if (mv === 'rot90') readout = `turned ${turn}° about O`
    else if (mv === 'dilate') readout = `${dPre ? (dNow / dPre).toFixed(1) : '—'}× as far from O${onRay ? ' · same line out' : ' · off the line'}`
    else readout = `${d1(dA)} from one end · ${d1(dB)} from the other`
  }

  const grid = []
  for (let i = 0; i <= 2 * GR; i++) {
    const major = i === GR
    grid.push(<line key={`h${i}`} x1={pad} y1={pad + i * cell} x2={S - pad} y2={pad + i * cell}
      stroke={major ? 'rgba(234,243,255,0.42)' : 'rgba(234,243,255,0.10)'} strokeWidth={major ? 1.6 : 0.6} />)
    grid.push(<line key={`v${i}`} x1={pad + i * cell} y1={pad} x2={pad + i * cell} y2={S - pad}
      stroke={major ? 'rgba(234,243,255,0.42)' : 'rgba(234,243,255,0.10)'} strokeWidth={major ? 1.6 : 0.6} />)
  }

  // The mirror line, drawn thick and gold — the child must SEE what they fold over.
  const mirror = mv === 'reflect' && (task.axis === 'x'
    ? <line x1={pad} y1={Y(0)} x2={S - pad} y2={Y(0)} stroke={p.gold} strokeWidth={3} strokeDasharray="7 5" opacity={0.85} />
    : <line x1={X(0)} y1={pad} x2={X(0)} y2={S - pad} stroke={p.gold} strokeWidth={3} strokeDasharray="7 5" opacity={0.85} />)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      <svg ref={svgRef} viewBox={`0 0 ${S} ${S}`}
        onPointerDown={(e) => { if (disabled) return; e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); place(e) }}
        onPointerMove={(e) => { if (dragging) place(e) }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        style={{
          width: 'min(78vw, 34vh)', height: 'min(78vw, 34vh)', touchAction: 'none',
          background: p.glass, border: `1px solid ${p.glassBorder}`, borderRadius: 12,
          cursor: disabled ? 'default' : 'grab',
        }}>
        {grid}
        {mirror}

        {/* midpoint: the route itself, drawn end to end */}
        {mv === 'midpoint' && (
          <line x1={X(ax)} y1={Y(ay)} x2={X(task.bx ?? 0)} y2={Y(task.by ?? 0)} stroke={p.creamSoft} strokeWidth={2.4} opacity={0.75} />
        )}

        {/* rotations & dilation: the arms out of the origin the child is working with */}
        {(mv === 'rot180' || mv === 'rot90' || mv === 'dilate') && (
          <>
            <line x1={X(0)} y1={Y(0)} x2={X(ax)} y2={Y(ay)} stroke={p.creamSoft} strokeWidth={1.6} opacity={0.6} />
            {moved && <line x1={X(0)} y1={Y(0)} x2={X(px)} y2={Y(py)} stroke={col} strokeWidth={1.6} strokeDasharray="4 3" />}
            <circle cx={X(0)} cy={Y(0)} r={3.5} fill={p.gold} />
          </>
        )}

        {/* the travel line from start to the placed spot, plus its halfway point —
            the cue that makes a mirror line and a half turn readable */}
        {moved && (
          <>
            <line x1={X(ax)} y1={Y(ay)} x2={X(px)} y2={Y(py)} stroke={col} strokeWidth={2} strokeDasharray="5 4" opacity={0.9} />
            {(mv === 'reflect' || mv === 'rot180') && (
              <circle cx={X(hx)} cy={Y(hy)} r={4} fill="none" stroke={p.cream} strokeWidth={1.6} />
            )}
          </>
        )}

        {/* the START ghost — where the prop was before the child touched it */}
        <rect x={X(ax) - 8} y={Y(ay) - 8} width={16} height={16} rx={4} fill="none"
          stroke="rgba(234,243,255,0.5)" strokeWidth={1.6} strokeDasharray="3 3" />
        {mv === 'midpoint' && (
          <rect x={X(task.bx ?? 0) - 8} y={Y(task.by ?? 0) - 8} width={16} height={16} rx={4} fill="none"
            stroke="rgba(234,243,255,0.5)" strokeWidth={1.6} strokeDasharray="3 3" />
        )}

        {/* the prop itself, wherever the child has dragged it */}
        <rect x={X(px) - 9} y={Y(py) - 9} width={18} height={18} rx={4}
          fill={moved ? col : 'rgba(234,243,255,0.35)'} stroke={p.cream} strokeWidth={1.6}
          style={{ transition: dragging ? 'none' : 'x 180ms, y 180ms, fill 200ms' }} />
      </svg>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.2vw,28px)', fontWeight: 800, color: col }}>
          ({disp(px)}, {disp(py)})
        </div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1.05vw,13px)', letterSpacing: '0.06em', color: p.creamSoft, minHeight: '1.3em' }}>
          {readout}
        </div>
      </div>

      {onCommit && (
        <CommitBtn P={p} label="PLACE IT ✓" disabled={disabled || !moved} onClick={() => onCommit({ k: 'pt', a: px, b: py })} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// WALKTHROUGH — two worked examples, one per graded gesture (constraint: no
// guided round, so nothing may be scored that the walkthrough has not shown).
// ══════════════════════════════════════════════════════════════════════════════

// ① the round zone: area in terms of π, r = 3 → 9π.
const DEMO_MEASURE: Task = {
  kind: 'measure', suffix: 'π', title: 'Round zone', tone: 'a',
  badge: 'area = ? × π    (r = 3)', prompt: '', say: '', showEquals: false,
  work: ['Area = π r². Square the radius: 3² = 9. So the area is 9 π.'],
  n: 9,
}
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Welcome to the level editor. Let's drop a round zone onto the map. Its radius is three — that's from the middle out to the edge.", value: { k: 'num', n: 1 }, board: 'round zone,  r = 3' },
  { say: 'To fit this zone into the level we need its area — how much ground it covers.', value: { k: 'num', n: 1 }, board: 'need: area' },
  { say: 'The rule for the area of any circle is pi times the radius squared.', value: { k: 'num', n: 2 }, board: 'A = π r²' },
  { say: 'So we start with the radius. Here it is — three squares from the centre to the edge.', value: { k: 'num', n: 3 }, board: 'r = 3' },
  { say: 'Now square the radius. Squaring three means three rows of three little squares.', value: { k: 'num', n: 5 }, board: 'r² = 3²' },
  { say: 'Count them up — three rows of three is nine. So r squared is nine.', value: { k: 'num', n: 6 }, board: 'r² = 9' },
  { say: 'Now the pi. We are not going to multiply it out into a long decimal — we keep pi as pi.', value: { k: 'num', n: 7 }, board: 'keep π as π' },
  { say: 'Nine of them. The area is nine pi.', value: { k: 'num', n: 9 }, board: 'A = 9 π' },
  { say: 'So the number that goes in front of pi is nine. That is the one you would tap.', value: { k: 'num', n: 9 }, board: 'answer: 9' },
]

// ② the mirror: reflect (3, 2) across the x-axis. The gesture is the DRAG, and the
//    walkthrough drags it — one square at a time down through the mirror line — so
//    the halfway-point cue is something the child has watched work before it is
//    ever scored.
const DEMO_MOVE: Task = {
  kind: 'move', mv: 'reflect', axis: 'x', title: 'Mirror it', tone: 'a',
  badge: 'mirror (3, 2)  in the x-axis', prompt: '', say: '', showEquals: false,
  ax: 3, ay: 2, x: 3, y: -2,
  work: ['The x-axis is the mirror, so x stays 3 and y flips: 2 becomes −2.'],
}
const DEMO_MOVE_STEPS: DemoStep<V>[] = [
  { say: 'Now a different job. This prop sits at three across, two up — and we need its mirror image.', value: { k: 'pt', a: 3, b: 2 }, board: 'prop at (3, 2)' },
  { say: 'The gold dashed line is the mirror. Here it is the x-axis, running straight across the level.', value: { k: 'pt', a: 3, b: 2 }, board: 'mirror = x-axis' },
  { say: 'A mirror image sits the same distance from the mirror, straight opposite. The prop is two squares above the line.', value: { k: 'pt', a: 3, b: 2 }, board: '2 above the line' },
  { say: 'So drag it straight down. One square — it is now one above the line.', value: { k: 'pt', a: 3, b: 1 }, board: 'down 1 → (3, 1)' },
  { say: 'Two squares — it is sitting right on the mirror. Not there yet; the mirror is the halfway mark, not the finish.', value: { k: 'pt', a: 3, b: 0 }, board: 'down 2 → on the line' },
  { say: 'Keep going, the same distance again. Three squares — one below the line.', value: { k: 'pt', a: 3, b: -1 }, board: 'down 3 → (3, −1)' },
  { say: 'Four squares — two below. Now it is two below the mirror, matching the two above. That is the reflection.', value: { k: 'pt', a: 3, b: -2 }, board: 'down 4 → (3, −2)' },
  { say: 'Look at the small ring on the travel line: the halfway point sits exactly on the mirror. That is what tells you a reflection is right.', value: { k: 'pt', a: 3, b: -2 }, board: 'halfway on the mirror' },
  { say: 'And read the coordinates. The three across never changed — only the up-down flipped, from two to negative two.', value: { k: 'pt', a: 3, b: -2 }, board: '(3, 2) → (3, −2)' },
]

// ── the round-zone scene (walkthrough only — in play these questions are tapped) ──
/** A filled pie sector from the top (−90°), sweeping clockwise. */
function sectorPath(cx: number, cy: number, r: number, sweepDeg: number, startDeg = -90): string {
  const s = Math.max(0, Math.min(359.99, sweepDeg))
  if (s < 0.6 || r <= 0) return ''
  const a0 = (startDeg * Math.PI) / 180
  const a1 = ((startDeg + s) * Math.PI) / 180
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
  return `M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r.toFixed(1)},${r.toFixed(1)} 0 ${s > 180 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`
}

function ZoneScene({ palette, task, value, stepIndex, ended }: {
  palette: Palette; task: Task; value: V; stepIndex: number; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const CX = 122, CY = 122
  const spring = { type: 'spring' as const, stiffness: 320, damping: 20 }
  const target = task.n ?? 1
  const cur = value.k === 'num' ? value.n : 0
  const frac = Math.max(0.08, Math.min(1, cur / target))
  const mFrac = useMotionValue(frac)
  useEffect(() => {
    const c = animate(mFrac, frac, reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 18 })
    return () => c.stop()
  }, [frac, reduce, mFrac])
  const zoneR = useTransform(mFrac, (f) => 16 + f * 86)
  const radiusX2 = useTransform(mFrac, (f) => CX + 16 + f * 86)
  const fillPath = useTransform(mFrac, (f) => sectorPath(CX, CY, 16 + f * 86 - 3, f * 359.99))

  const solved = ended
  const col = solved ? '#2fb37f' : p.goldDeep
  const radiusBeat = stepIndex >= 3 && stepIndex <= 5 && !solved
  const showSquare = (stepIndex === 4 || stepIndex === 5) && !solved
  const showPi = stepIndex >= 6 && !solved
  const landed = solved || stepIndex >= 7

  const grid = []
  for (let i = 0; i <= 10; i++) {
    const t = 12 + i * 22
    grid.push(<line key={`h${i}`} x1={12} y1={t} x2={232} y2={t} stroke="rgba(234,243,255,0.10)" strokeWidth={1} />)
    grid.push(<line key={`v${i}`} x1={t} y1={12} x2={t} y2={232} stroke="rgba(234,243,255,0.10)" strokeWidth={1} />)
  }
  const wrap: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }

  return (
    <div style={wrap}>
      <svg viewBox="0 0 244 244" 
        style={{ width: 'clamp(180px, 26vw, 300px)', height: 'clamp(180px, 26vw, 300px)', background: p.glass, border: `1px solid ${p.glassBorder}`, borderRadius: 12, display: 'block' }}>
        {grid}
        <motion.rect x={6} y={6} width={232} height={232} rx={10} fill="none" stroke={p.glassBorder} strokeWidth={1.2}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' }} />
        <text x={14} y={20} fill={p.mutedOnPaper} fontSize={8} letterSpacing="0.14em" fontFamily="var(--font-numeric)">LEVEL EDITOR</text>

        <motion.path d={fillPath} fill={landed ? 'rgba(47,179,127,0.22)' : 'rgba(127,208,255,0.16)'} style={{ transition: 'fill 300ms' }} />
        <motion.circle cx={CX} cy={CY} r={zoneR} fill="none" stroke={col} strokeWidth={3} />

        {radiusBeat && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.3 }}>
            <motion.line x1={CX} y1={CY} x2={radiusX2} y2={CY} stroke={p.gold} strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
            <text x={CX + 34} y={CY - 6} textAnchor="middle" fill={p.gold} fontSize={12} fontWeight={800} fontFamily="var(--font-numeric)">r = 3</text>
          </motion.g>
        )}

        {showSquare && (
          <g>
            {[0, 1, 2].map((gx) => [0, 1, 2].map((gy) => (
              <motion.rect key={`sq${gx}-${gy}`} x={CX - 27 + gx * 18} y={CY - 27 + gy * 18} width={16} height={16} rx={2}
                fill="rgba(127,208,255,0.30)" stroke={p.gold} strokeWidth={1}
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                transition={reduce ? { duration: 0 } : { ...spring, delay: (gx * 3 + gy) * 0.04 }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            )))}
            <text x={CX} y={CY + 48} textAnchor="middle" fill={p.gold} fontSize={12} fontWeight={800} fontFamily="var(--font-numeric)">3² = 9</text>
          </g>
        )}

        {showPi && (
          <motion.text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fill={p.gold} fontSize={20} fontWeight={800} fontFamily="var(--font-numeric)"
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={reduce ? { duration: 0 } : spring}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>{cur} × π</motion.text>
        )}

        <line x1={CX - 7} y1={CY} x2={CX + 7} y2={CY} stroke={p.creamSoft} strokeWidth={1} opacity={0.7} />
        <line x1={CX} y1={CY - 7} x2={CX} y2={CY + 7} stroke={p.creamSoft} strokeWidth={1} opacity={0.7} />
        <circle cx={CX} cy={CY} r={3.5} fill={p.cream} />
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px, 2.4vw, 30px)', fontWeight: 800, color: col }}>
        {cur}π
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>
        {landed ? 'zone area ✓' : 'zone area'}
      </div>
    </div>
  )
}

export const CONFIG: GameConfig<V, Task> = {
  chapterId: 'geometryTransformations',
  title: 'MAP MAKER',
  ticketLabel: 'level spec',
  palette: P,
  motif: '🗺️',
  makeTask,
  // PER-QUESTION gating. A measurement is a single number the illustration was
  // never solving — it goes on the pad. A transformed position is a PAIR, and
  // dragging it there IS the transformation, so it keeps the grid.
  answerPad: (t) => (t.pad ? numChoices(t.n ?? 0, t.pad, { min: 1 }) : []),
  // REQUIRED: V is a tagged union, so a bare tapped number would never satisfy
  // `v.k === 'num'` and every padded answer would silently grade wrong.
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'measure' ? { k: 'num', n: 0 } : { k: 'pt', a: t.ax ?? 0, b: t.ay ?? 0 }),
  grade: (t, v) => t.kind === 'measure'
    ? v.k === 'num' && v.n === t.n
    : v.k === 'pt' && v.a === t.x && v.b === t.y,
  revealText: (t) => (t.kind === 'measure' ? `${t.n}${t.suffix ?? ''}` : `(${disp(t.x ?? 0)}, ${disp(t.y ?? 0)})`),
  glide: (t, _from, setValue, later) => later(() => setValue(t.kind === 'measure'
    ? { k: 'num', n: t.n ?? 0 }
    : { k: 'pt', a: t.x ?? 0, b: t.y ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'move') {
      return <MoveGrid P={palette} task={task} value={value} setValue={setValue}
        disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    // Fallback only: every measure task ships `pad`, so the shell renders the
    // AnswerPad and never reaches this. Kept so a future measure task without
    // `pad` degrades to a dial rather than to nothing. Integer step — this
    // chapter no longer asks anyone for a decimal.
    const ans = task.n ?? 0
    const n = value.k === 'num' ? value.n : 0
    return <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: Math.round(x) })}
      min={0} max={Math.max(12, ans * 2)} step={1} format={(x) => `${Math.round(x)}${task.suffix ?? ''}`}
      disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: Math.round(x) })} commitLabel="SIZE IT ✓" />
  },
  // Branches by example: the round-zone beats pose on the zone scene, the mirror
  // beats on the level grid itself — so the child watches the gesture they will be
  // graded on, not a different picture.
  TutorialScene: ({ palette, task, value, stepIndex, ended }) =>
    task.kind === 'move'
      ? <MoveGrid P={palette} task={task} value={value} setValue={() => {}} disabled />
      : <ZoneScene palette={palette} task={task} value={value} stepIndex={stepIndex} ended={ended} />,
  start: {
    blurb: <><strong>You&apos;re building a game level.</strong> Size the round zones and crates by their <strong>measurement</strong>, and <strong>drag</strong> props into place — sliding, mirroring, spinning and scaling them on the grid. Milo will show you both.</>,
    ticket: { title: 'Level spec', badge: 'round zone · r = 3', tone: 'a' },
    startLabel: 'Open the editor →',
  },
  overview: {
    say: 'Here is the plan. A round zone is sized by its area — pi times the radius squared — and we keep pi as pi, so the answer stays a tidy whole number. Then we move props around the level: sliding them, mirroring them across a line, spinning them about the centre. Let us work one of each, nice and slow.',
    problem: <>Size a <strong>round zone</strong> (r = 3), then <strong>mirror</strong> a prop across the x-axis.</>,
    points: [
      <>A circle&apos;s area is <strong>A = πr²</strong> — square the radius, keep the π.</>,
      <>A <strong>slide</strong> adds to each coordinate; a <strong>mirror</strong> flips one of them.</>,
      <>The mirror line always sits at the <strong>halfway point</strong> of the move.</>,
    ],
  },
  tutorial: [
    { task: DEMO_MEASURE, initial: { k: 'num', n: 1 }, hand: 'tap', steps: DEMO_STEPS },
    { task: DEMO_MOVE, initial: { k: 'pt', a: 3, b: 2 }, hand: 'dragV', steps: DEMO_MOVE_STEPS },
  ],
  // No guided round: the walkthrough works BOTH graded gestures (tap a measurement,
  // drag a prop), so nothing scored play asks for is unrehearsed.
  sig: (t) => `${t.kind}:${t.mv ?? ''}:${t.badge}`,
}

export default function MapMaker(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
