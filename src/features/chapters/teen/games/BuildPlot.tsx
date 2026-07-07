'use client'
/**
 * BuildPlot — the Factoring chapter (15–16) as a PLAYABLE GAME.
 * World: laying out a rectangular plot. Its AREA is a trinomial (x² + bx + c); the
 * two SIDE LENGTHS are the factors (x + p)(x + q). The child BUILDS the two sides
 * with the PartsBuilder (production, not multiple-choice) — factoring matters
 * because it's a construct-the-answer skill, so here you construct it.
 *
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * area rectangle → baby-step walkthrough → guided → scored play. Illustration
 * assets deferred; the scene is code-drawn.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, PartsBuilder, type Parts } from './parts/gameKit'

const P: Palette = {
  nightTop: '#132a1f', nightBot: '#0b1a13',
  cream: '#e9f7ee', creamSoft: 'rgba(233,247,238,0.82)',
  inkOnPaper: '#14261c', mutedOnPaper: '#5f8571',
  gold: '#8fe06a', goldDeep: '#4e9e2f',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(15,34,24,0.6)', glassBorder: 'rgba(233,247,238,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
/** Format a factor "(x + n)" / "(x − n)". */
const fac = (n: number) => (n < 0 ? `(x − ${Math.abs(n)})` : `(x + ${n})`)
/** Format the area trinomial x² + bx + c with correct signs. */
function areaExpr(b: number, c: number): string {
  let s = 'x²'
  if (b !== 0) s += b < 0 ? ` − ${Math.abs(b)}x` : ` + ${b}x`
  if (c !== 0) s += c < 0 ? ` − ${Math.abs(c)}` : ` + ${c}`
  return s
}
const sayExpr = (b: number, c: number) =>
  `x squared${b !== 0 ? `, ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} x` : ''}${c !== 0 ? `, ${c < 0 ? 'minus' : 'plus'} ${Math.abs(c)}` : ''}`

interface Task extends BaseTask { ra: number; rb: number }

function build(ra: number, rb: number, d: 1 | 2 | 3): Task {
  const b = ra + rb, c = ra * rb
  const area = areaExpr(b, c)
  const answer = `${fac(ra)}${fac(rb)}`
  return {
    title: 'Plot', badge: `area = ${area}`, tone: d === 3 ? 'b' : 'a',
    prompt: `Build the two sides of a plot with area ${area}.`,
    say: `Build the two sides of the plot. Its area is ${sayExpr(b, c)}.`,
    work: [`Find two numbers that multiply to ${c} and add to ${b}: ${ra} and ${rb}. So the sides are ${answer}.`],
    ra, rb,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return build(rint(1, 5), rint(1, 5), d)
  if (d === 2) {
    if (Math.random() < 0.4) { const n = rint(2, 7); return build(-n, n, d) } // difference of squares
    return build(rint(1, 8), rint(1, 8), d)
  }
  // L3 — a negative side length → mixed-sign constant
  return Math.random() < 0.5 ? build(rint(2, 7), -rint(1, 6), d) : build(-rint(2, 7), rint(1, 8), d)
}

const DEMO_TASK = build(2, 3, 1) // area x² + 5x + 6 → (x + 2)(x + 3)

// The walkthrough ASSEMBLES the plot: the area slab splits into an x² square,
// x-strips and unit tiles, the tiles glide into a 2×3 corner block, and the two
// side lengths are read off the edges. `stepIndex` drives the scene beats; `value`
// {a,b} carries the two numbers once found (2 and 3). Eleven BABY steps — one idea,
// one board line, one beat each; the theme hook first, then factor one move at a time.
const DEMO_STEPS: DemoStep<Parts>[] = [
  { say: "Here's your build plot. Its whole area, marked out on the ground, is x squared plus five x plus six.", value: { a: 0, b: 0 }, board: 'area = x² + 5x + 6' },
  { say: 'Factoring finds the two side lengths of this plot — the width and the height that multiply to give that area.', value: { a: 0, b: 0 }, board: 'find: width × height' },
  { say: 'Break the area into blocks: one big x-by-x square, some x-long strips, and a few single unit tiles.', value: { a: 0, b: 0 }, board: 'x²  +  5x  +  6' },
  { say: 'Look at the last number, six — those are the six unit tiles in the corner. We need two numbers that MULTIPLY to six.', value: { a: 0, b: 0 }, board: 'need: ▢ × ▢ = 6' },
  { say: 'And those same two numbers must ADD to the middle number, five — the five x-strips.', value: { a: 0, b: 0 }, board: 'and: ▢ + ▢ = 5' },
  { say: 'Two and three work. Two times three is six, so the tiles form a neat two-by-three block.', value: { a: 2, b: 3 }, board: '2 × 3 = 6' },
  { say: 'And two plus three is five — three strips along one edge, two along the other. It checks out.', value: { a: 2, b: 3 }, board: '2 + 3 = 5 ✓' },
  { say: 'So one side of the plot is x plus two — the height, with its two extra tile rows.', value: { a: 2, b: 3 }, board: 'one side: x + 2' },
  { say: 'The other side is x plus three — the width, with its three extra tile columns.', value: { a: 2, b: 3 }, board: 'other side: x + 3' },
  { say: 'Put it together: a plot x plus two by x plus three. The area is factored.', value: { a: 2, b: 3 }, board: '(x + 2)(x + 3)' },
  { say: 'Now build the two sides yourself with the steppers — x plus two and x plus three.', value: { a: 2, b: 3 } },
]

// ── hand-authored SVG build-plot area model (storyboard: docs/storyboards/build-plot.md)
// A top-down build lot: earth + a faint square build grid, the plot footprint drawn
// as a survey outline, then the area (x² + 5x + 6) ASSEMBLED from blocks — an x·x
// square (gold), x-long strips (coral, 3 down the right + 2 along the bottom = 5x),
// and six unit tiles (mint) that glide up from a staging pile into a 3×2 corner
// block (= 6). The two sides are then read off the edges with spring-in brackets:
// (x + 3) across the top, (x + 2) down the left. Everything sits on the exact unit
// grid so the model always sums to x² + 5x + 6 and factors to (x + 2)(x + 3).
// `stepIndex` gates the beats; a shared motion progress makes the tiles FLOW in.

/** One unit tile: glides from its pile spot (px,py) to its corner cell (fx,fy) as
 *  the shared `place` progress goes 0→1, so the six tiles flow into the 3×2 block. */
function UnitTile({ place, px, py, fx, fy, fill, stroke }: {
  place: ReturnType<typeof useMotionValue<number>>
  px: number; py: number; fx: number; fy: number; fill: string; stroke: string
}) {
  const x = useTransform(place, (v: number) => px + (fx - px) * v)
  const y = useTransform(place, (v: number) => py + (fy - py) * v)
  const o = useTransform(place, [0, 0.2, 1], [0, 0.55, 1])
  return (
    <motion.g style={{ x, y, opacity: o }}>
      <rect x={0} y={0} width={U} height={U} rx={3} fill={fill} stroke={stroke} strokeWidth={1} />
    </motion.g>
  )
}

/** One x-long strip: slides in from off the edge (fromDX/fromDY) to its final spot
 *  as `place` goes 0→1. Used for the 3 right columns (3x) and 2 bottom rows (2x). */
function Strip({ place, fx, fy, w, h, fromDX, fromDY, fill, stroke }: {
  place: ReturnType<typeof useMotionValue<number>>
  fx: number; fy: number; w: number; h: number; fromDX: number; fromDY: number; fill: string; stroke: string
}) {
  const x = useTransform(place, (v: number) => fx + fromDX * (1 - v))
  const y = useTransform(place, (v: number) => fy + fromDY * (1 - v))
  const o = useTransform(place, [0, 0.25, 1], [0, 0.4, 1])
  return (
    <motion.g style={{ x, y, opacity: o }}>
      <rect x={0} y={0} width={w} height={h} rx={2} fill={fill} stroke={stroke} strokeWidth={1} />
    </motion.g>
  )
}

const U = 20            // one unit tile side (svg units)
const XL = 74           // the "x" length (svg units) — clearly longer than a unit
const OX = 130, OY = 72 // plot footprint top-left
const VW = 360, VH = 300
const SPR = { type: 'spring' as const, stiffness: 320, damping: 20 }

function PlotScene({ palette, task, value, stepIndex, ended }: {
  palette: Palette; task: Task; value: Parts; stepIndex: number; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const beat = ended ? 10 : stepIndex
  void value // {a,b} carries the found numbers; the visual is driven by task + beat

  // Area-model dimensions derived from the task's factors (demo: 2 and 3).
  const cols = Math.max(Math.abs(task.ra), Math.abs(task.rb)) || 3   // right x-strips (→ width side)
  const rows = Math.min(Math.abs(task.ra), Math.abs(task.rb)) || 2   // bottom x-strips (→ height side)
  const Wd = XL + cols * U          // plot width  = x + cols
  const Hh = XL + rows * U          // plot height = x + rows
  const cornerX = OX + XL           // where the unit tiles begin (x)
  const cornerY = OY + XL

  // Shared assembly progress: tiles + strips + square ride this so they FLOW in
  // together on the SPLIT beat instead of snapping. (reduced-motion → instant.)
  const place = useMotionValue(0)
  useEffect(() => {
    const controls = animate(place, beat >= 2 ? 1 : 0, { duration: reduce ? 0 : 0.75, ease: [0.33, 0.02, 0.2, 1] })
    return () => controls.stop()
  }, [beat, reduce, place])
  const slabO = useTransform(place, [0, 0.5], [1, 0])   // solid area slab fades as it splits
  const sqScale = useTransform(place, [0, 1], [0.72, 1])
  const sqO = useTransform(place, [0, 0.3, 1], [0, 0.4, 1])

  const split = beat >= 2
  const emphMult = beat >= 3               // highlight the 6 unit tiles
  const emphAdd = beat >= 4                // highlight the 5 x-strips
  const showSideA = beat >= 8              // left bracket  (x + rows)
  const showSideB = beat >= 9              // top bracket   (x + cols)
  const done = beat >= 10
  const solvedCol = '#2fb37f'
  const trans = reduce ? { duration: 0 } : SPR

  // fills
  const sqFill = 'rgba(143,224,106,0.30)', sqStroke = done ? solvedCol : p.gold
  const stripFill = 'rgba(255,138,112,0.30)', stripStroke = done ? solvedCol : p.coralDeep
  const tileFill = 'rgba(92,214,172,0.34)', tileStroke = done ? solvedCol : '#2fb37f'

  // unit tiles: final cells (3×2 corner) + staging pile positions (a row below the plot)
  const total = cols * rows
  const pileW = total * (U + 4) - 4
  const pileX0 = OX + (Wd - pileW) / 2
  const pileY = VH - 40
  const tiles: { px: number; py: number; fx: number; fy: number }[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c
    tiles.push({ px: pileX0 + i * (U + 4), py: pileY, fx: cornerX + c * U, fy: cornerY + r * U })
  }

  const areaTxt = task.badge.replace('area = ', '')
  const cap = done ? 'two sides built ✓'
    : beat >= 8 ? 'reading the sides'
      : beat >= 3 ? 'multiply to 6, add to 5'
        : beat >= 2 ? 'splitting the area'
          : 'the plot area'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="clamp(230px, 32vw, 360px)" height="auto"
        style={{ borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="bp_ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#193527" />
            <stop offset="1" stopColor="#0e2019" />
          </linearGradient>
        </defs>

        {/* ── build-plot ground + faint square build grid ── */}
        <rect x={0} y={0} width={VW} height={VH} fill="url(#bp_ground)" />
        <g opacity={0.5}>
          {Array.from({ length: Math.floor(VW / U) + 1 }).map((_, i) => (
            <line key={`gv${i}`} x1={i * U} y1={0} x2={i * U} y2={VH} stroke={p.glassBorder} strokeWidth={0.5} opacity={0.35} />
          ))}
          {Array.from({ length: Math.floor(VH / U) + 1 }).map((_, i) => (
            <line key={`gh${i}`} x1={0} y1={i * U} x2={VW} y2={i * U} stroke={p.glassBorder} strokeWidth={0.5} opacity={0.35} />
          ))}
        </g>

        {/* ── plot footprint survey outline — draws in once ── */}
        <motion.rect x={OX} y={OY} width={Wd} height={Hh} rx={4} fill="none" stroke={p.creamSoft} strokeWidth={1.6} strokeDasharray="5 5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.7 }} transition={{ duration: reduce ? 0 : 0.8, ease: 'easeInOut' }} />

        {/* ── the SOLID area slab (beats 0–1) — fades out as it splits ── */}
        <motion.g style={{ opacity: slabO }}>
          <rect x={OX} y={OY} width={Wd} height={Hh} rx={6} fill="rgba(143,224,106,0.14)" stroke={p.goldDeep} strokeWidth={2} />
          <text x={OX + Wd / 2} y={OY + Hh / 2 + 6} textAnchor="middle" fill={p.cream} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={17}>{areaTxt}</text>
        </motion.g>

        {/* ── assembled area model (revealed on SPLIT) ── */}
        {/* x² square (gold) */}
        <motion.g style={{ opacity: sqO, scale: sqScale, transformBox: 'fill-box', transformOrigin: 'center' }}>
          <rect x={OX} y={OY} width={XL} height={XL} rx={4} fill={sqFill} stroke={sqStroke} strokeWidth={1.6} />
          <text x={OX + XL / 2} y={OY + XL / 2 + 7} textAnchor="middle" fill={done ? solvedCol : p.gold} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={20}>x²</text>
        </motion.g>

        {/* right x-strips (cols) → the width side; slide in from the right */}
        {Array.from({ length: cols }).map((_, c) => (
          <Strip key={`rs${c}`} place={place} fx={cornerX + c * U} fy={OY} w={U} h={XL} fromDX={40} fromDY={0} fill={stripFill} stroke={stripStroke} />
        ))}
        {/* bottom x-strips (rows) → the height side; slide in from below */}
        {Array.from({ length: rows }).map((_, r) => (
          <Strip key={`bs${r}`} place={place} fx={OX} fy={cornerY + r * U} w={XL} h={U} fromDX={0} fromDY={40} fill={stripFill} stroke={stripStroke} />
        ))}

        {/* x-strip region labels (the split middle term) */}
        {split && (
          <>
            <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={trans}
              x={cornerX + cols * U / 2} y={OY + XL / 2 + 5} textAnchor="middle" fill={done ? solvedCol : p.coral} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={15}>{cols}x</motion.text>
            <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={trans}
              x={OX + XL / 2} y={cornerY + rows * U / 2 + 5} textAnchor="middle" fill={done ? solvedCol : p.coral} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={15}>{rows}x</motion.text>
          </>
        )}

        {/* six unit tiles — glide from the pile into the 3×2 corner block */}
        {tiles.map((t, i) => (
          <UnitTile key={`t${i}`} place={place} px={t.px} py={t.py} fx={t.fx} fy={t.fy} fill={tileFill} stroke={tileStroke} />
        ))}
        {/* corner unit-count label (= c) */}
        {split && (
          <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={trans}
            x={cornerX + cols * U / 2} y={cornerY + rows * U + 15} textAnchor="middle" fill={done ? solvedCol : p.mint} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={13}>{cols * rows} tiles</motion.text>
        )}

        {/* ── emphasis glows: 6 (multiply) then 5x (add) ── */}
        <motion.rect x={cornerX - 3} y={cornerY - 3} width={cols * U + 6} height={rows * U + 6} rx={5} fill="none" stroke={p.mint} strokeWidth={2}
          initial={false} animate={{ opacity: emphMult && !done ? 0.95 : 0 }} transition={trans} />
        <motion.g initial={false} animate={{ opacity: emphAdd && !done ? 0.9 : 0 }} transition={trans}>
          <rect x={cornerX - 2} y={OY - 2} width={cols * U + 4} height={XL + 4} rx={4} fill="none" stroke={p.coral} strokeWidth={1.6} strokeDasharray="4 3" />
          <rect x={OX - 2} y={cornerY - 2} width={XL + 4} height={rows * U + 4} rx={4} fill="none" stroke={p.coral} strokeWidth={1.6} strokeDasharray="4 3" />
        </motion.g>

        {/* ── side brackets read off the edges ── */}
        {/* TOP bracket — width = x + cols → (x + cols) */}
        <motion.g initial={false} animate={{ opacity: showSideB ? 1 : 0, y: showSideB ? 0 : -8 }} transition={trans}>
          <line x1={OX} y1={OY - 14} x2={OX + Wd} y2={OY - 14} stroke={p.gold} strokeWidth={1.6} />
          <line x1={OX} y1={OY - 14} x2={OX} y2={OY - 8} stroke={p.gold} strokeWidth={1.6} />
          <line x1={OX + Wd} y1={OY - 14} x2={OX + Wd} y2={OY - 8} stroke={p.gold} strokeWidth={1.6} />
          <line x1={cornerX} y1={OY - 17} x2={cornerX} y2={OY - 11} stroke={p.gold} strokeWidth={1.2} opacity={0.7} />
          <text x={OX + Wd / 2} y={OY - 20} textAnchor="middle" fill={done ? solvedCol : p.gold} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={14}>(x + {cols})</text>
        </motion.g>
        {/* LEFT bracket — height = x + rows → (x + rows) */}
        <motion.g initial={false} animate={{ opacity: showSideA ? 1 : 0, x: showSideA ? 0 : -8 }} transition={trans}>
          <line x1={OX - 14} y1={OY} x2={OX - 14} y2={OY + Hh} stroke={p.gold} strokeWidth={1.6} />
          <line x1={OX - 14} y1={OY} x2={OX - 8} y2={OY} stroke={p.gold} strokeWidth={1.6} />
          <line x1={OX - 14} y1={OY + Hh} x2={OX - 8} y2={OY + Hh} stroke={p.gold} strokeWidth={1.6} />
          <line x1={OX - 17} y1={cornerY} x2={OX - 11} y2={cornerY} stroke={p.gold} strokeWidth={1.2} opacity={0.7} />
          <text x={OX - 22} y={OY + Hh / 2} textAnchor="middle" fill={done ? solvedCol : p.gold} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={14}
            transform={`rotate(-90 ${OX - 22} ${OY + Hh / 2})`}>(x + {rows})</text>
        </motion.g>
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>{cap}</div>
    </div>
  )
}

const CONFIG: GameConfig<Parts, Task> = {
  chapterId: 'factoringPolynomials',
  title: 'BUILD PLOT',
  ticketLabel: 'blueprint',
  palette: P,
  motif: '🟩',
  makeTask,
  initialValue: () => ({ a: 0, b: 0 }),
  grade: (t, v) => (v.a === t.ra && v.b === t.rb) || (v.a === t.rb && v.b === t.ra),
  revealText: (t) => `${fac(t.ra)}${fac(t.rb)}`,
  glide: (t, _from, setValue, later) => later(() => setValue({ a: t.ra, b: t.rb }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    <PartsBuilder P={palette} value={value} setValue={setValue} min={-9} max={9}
      template={(a, b) => `${fac(a)}${fac(b)}`} labels={['side 1', 'side 2']}
      disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="LAY IT OUT ✓" />
  ),
  TutorialScene: ({ palette, task, value, stepIndex, ended }) => (
    <PlotScene palette={palette} task={task} value={value} stepIndex={stepIndex} ended={ended} />
  ),
  start: {
    blurb: <><strong>You&apos;re laying out a rectangular plot.</strong> Its <strong>area</strong> is written as a trinomial — factoring finds the two <strong>side lengths</strong>. Build them.</>,
    ticket: { title: 'Plot area', badge: 'x² + 5x + 6', tone: 'a' },
    startLabel: 'Open the blueprint →',
  },
  overview: {
    say: 'Here is the plan. A rectangular plot has an area written as x squared plus five x plus six. Factoring finds the two side lengths that multiply together to give that area. We look for two numbers that multiply to the last number and add to the middle one. Let us build one together.',
    problem: <>Build the two sides of a plot whose area is <strong>x² + 5x + 6</strong>.</>,
    points: [
      <>The two sides look like <strong>(x + ▢)</strong> and <strong>(x + ▢)</strong>.</>,
      <>The two numbers must <strong>multiply</strong> to the last number (6)…</>,
      <>…and <strong>add</strong> to the middle number (5).</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { a: 0, b: 0 }, hand: 'tap', steps: DEMO_STEPS },
  guided: { task: build(1, 4, 1), coach: 'Your turn — I will help. Build the two sides of this plot.', hand: 'tap' },
  sig: (t) => t.badge,
}

export default function BuildPlot(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
