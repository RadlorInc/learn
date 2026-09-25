'use client'
/**
 * The diagrams Grades 3–8 draw: every Picture kind that is not one of Module 1's object pictures (./Pictures.tsx).
 * All SVG, all driven by the data in a lesson, all in the SampleUI look (thick ink outlines, flat teal / yellow / mint).
 * A diagram on Screen 8 or in practice is a static picture of the QUESTION — it must never show the answer; that is the
 * lesson author's job (docs/new-flow/AUTHORING.md), checked by the answer-key review, not by this file.
 *
 * `motion` reveals the parts one after another (bars shading, jumps, points, cubes), the "picture that moves" of Screens 4–6.
 */
import { useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import type { Picture } from './script'
import { INK, ACCENT } from './Pictures'
// The drawings keep their own teal for the second colour of a figure (a hand, a ray, an answer row): it is
// content, like the chalk, and Pictures' TEAL is now the pale button fill, which would vanish on a white figure.
const TEAL = '#0f8a7a'

export const TONE = ['#fff', '#9cf0d8', '#ffd166', '#ffb3a3', '#b9d4ff'] as const
const F = 'var(--font-display), system-ui, sans-serif'

const reveal = (i: number, motion?: boolean, gap = 450): CSSProperties =>
  motion ? { opacity: 0, animation: `lp-in .35s ease-out ${i * gap}ms forwards` } : {}

const fmt = (v: number) => (Math.round(v * 1000) / 1000).toLocaleString('en-US').replace('-', '−')

function Svg({ w, h, label, children, max = 380 }: { w: number; h: number; label: string; children: ReactNode; max?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}
      style={{ width: '100%', height: 'auto', maxHeight: max, display: 'block', margin: '0 auto', overflow: 'visible', fontFamily: F }}>
      {children}
    </svg>
  )
}

const T = ({ x, y, s = 18, a = 'middle', w = 800, fill = INK, children, style }: { x: number; y: number; s?: number; a?: 'start' | 'middle' | 'end'; w?: number; fill?: string; children: ReactNode; style?: CSSProperties }) =>
  <text x={x} y={y} fontSize={s} textAnchor={a} fontWeight={w} fill={fill} dominantBaseline="middle" style={style}>{letters(children)}</text>

/** One `tspan` per letter, so the pen in LessonPlayer can write a word letter by letter (a glyph's outline is traced,
 *  then its ink fills in). The text content is unchanged: speech, search and screen readers still read the whole word. */
export const letters = (c: ReactNode) =>
  typeof c === 'string' || typeof c === 'number' ? [...String(c)].map((ch, i) => <tspan key={i} data-c="">{ch}</tspan>) : c

/** Breaks a line at spaces so no row is longer than `n` characters (a word longer than `n` keeps its own row). */
export function wrap(t: string, n: number): string[] {
  const out: string[] = []
  for (const word of t.split(' ')) {
    const last = out.length - 1
    if (last >= 0 && (out[last] + ' ' + word).length <= n) out[last] += ' ' + word
    else out.push(word)
  }
  return out
}

// Text width, for sizing an SVG around its words. Measured on a canvas in the display font once the page is live;
// the server (and the first client render, so hydration matches) uses an estimate. Re-measures when a font loads,
// because Fredoka is wider than its fallback.
let fontTick = 0, ctx: CanvasRenderingContext2D | null | undefined
const onFonts = (cb: () => void) => {
  const f = () => { fontTick++; cb() }
  document.fonts?.addEventListener('loadingdone', f)
  return () => document.fonts?.removeEventListener('loadingdone', f)
}
export function useTextWidth() {
  const live = useSyncExternalStore(onFonts, () => fontTick, () => -1)
  if (live >= 0 && !/jsdom/.test(navigator.userAgent)) {
    ctx ??= document.createElement('canvas').getContext('2d')
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display') || 'sans-serif'
    if (ctx) return (t: string, s: number, w: number) => { ctx!.font = `${w} ${s}px ${family}`; return ctx!.measureText(t).width }
  }
  return (t: string, s: number) => t.length * s * 0.6
}

export interface InkRow { t: string; s: number; w?: number; fill?: string }

/**
 * Words on the board, as SVG so the pen can write them: an equation, a line she writes, a card. `box` puts them on a
 * card with an ink outline and shadow (the outline is drawn too). Sized to its words and never wider than its column:
 * on a phone it shrinks as a whole instead of wrapping differently from the tablet.
 */
export function Ink({ rows, box, a = 'middle', minW = 0, minRows = 0 }: { rows: InkRow[]; box?: string; a?: 'start' | 'middle'; minW?: number; minRows?: number }) {
  const tw = useTextWidth()
  const pad = box ? 18 : 4, gapY = 0.3
  const W = Math.max(minW, ...rows.map(r => tw(r.t, r.s, r.w ?? 800))) + pad * 2
  const hs = rows.map(r => r.s * (1 + gapY))
  const H = hs.reduce((x, y) => x + y, 0) + Math.max(0, minRows - rows.length) * (rows.at(-1)?.s ?? 0) * (1 + gapY) + pad * 2 - (box ? 0 : rows[0].s * gapY)
  let y = pad - (box ? 0 : rows[0].s * gapY / 2)
  return (
    <svg viewBox={`${box ? -2 : 0} ${box ? -2 : 0} ${W + (box ? 8 : 0)} ${H + (box ? 8 : 0)}`} role="img" aria-label={rows.map(r => r.t).join(' ')}
      style={{ width: W + (box ? 10 : 0), maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', overflow: 'visible', fontFamily: F }}>
      {box && <>
        <rect x={4} y={4} width={W} height={H} rx={16} fill={INK} />
        <rect x={0} y={0} width={W} height={H} rx={16} fill={box} stroke={INK} strokeWidth={4} />
      </>}
      {rows.map((r, i) => {
        const at = y + hs[i] / 2
        y += hs[i]
        return <text key={i} x={a === 'start' ? pad : W / 2} y={at} fontSize={r.s} fontWeight={r.w ?? 800} fill={r.fill ?? INK} textAnchor={a} dominantBaseline="middle">{letters(r.t)}</text>
      })}
    </svg>
  )
}

type P<K extends Picture['kind']> = Extract<Picture, { kind: K }>

export function Diagram({ p }: { p: Picture }) {
  switch (p.kind) {
    case 'bars': return <Bars p={p} />
    case 'tape': return <Tape p={p} />
    case 'numline': return <NumLine p={p} />
    case 'clock': return <Clock p={p} />
    case 'measure': return <Measure p={p} />
    case 'blocks': return <Blocks p={p} />
    case 'columns': return <Columns p={p} />
    case 'longdiv': return <LongDiv p={p} />
    case 'grid': return <Grid p={p} />
    case 'area': return <Area p={p} />
    case 'poly': return <Poly p={p} />
    case 'angle': return <Angle p={p} />
    case 'chart': return <Chart p={p} />
    case 'plot': return <Plot p={p} />
    case 'coord': return <Coord p={p} />
    case 'table': return <Table p={p} />
    case 'cubes': return <Cubes p={p} />
    case 'solid': return <Solid p={p} />
    case 'chips': return <Chips p={p} />
    case 'balance': return <Balance p={p} />
    case 'spinner': return <Spinner p={p} />
    default: return null
  }
}

// ── Fraction bars ──────────────────────────────────────────────────────────────────────────────
function Bars({ p }: { p: P<'bars'> }) {
  const W = 520, bh = 58, gap = 26, lw = p.bars.some(b => b.label) ? 110 : 0
  const H = p.bars.length * (bh + gap) - gap + 8
  let k = 0
  return (
    <Svg w={W + lw + 8} h={H} label={p.bars.map(b => `${b.parts} equal parts, ${b.shaded} shaded`).join('; ')}>
      {p.bars.map((b, i) => {
        const y = 4 + i * (bh + gap), cw = W / b.parts
        return (
          <g key={i}>
            {Array.from({ length: b.parts }, (_, j) => {
              const tone = j < b.shaded ? 1 : j < b.shaded + (b.shade2 ?? 0) ? 2 : 0
              return <rect key={j} x={4 + j * cw} y={y} width={cw} height={bh} fill={TONE[tone]} stroke={INK} strokeWidth={4}
                style={tone ? reveal(k++, p.motion, 300) : undefined} />
            })}
            {b.split && Array.from({ length: b.parts }, (_, j) => Array.from({ length: b.split! - 1 }, (_, s) => {
              const x = 4 + j * cw + ((s + 1) * cw) / b.split!
              return <line key={`${j}-${s}`} x1={x} y1={y + 4} x2={x} y2={y + bh - 4} stroke={INK} strokeWidth={2.5} strokeDasharray="6 5"
                style={reveal(b.parts + j, p.motion, 350)} />
            }))}
            {b.label && <T x={W + 24} y={y + bh / 2} s={26} a="start">{b.label}</T>}
          </g>
        )
      })}
    </Svg>
  )
}

// ── Tape diagram ───────────────────────────────────────────────────────────────────────────────
function Tape({ p }: { p: P<'tape'> }) {
  const total = Math.max(...p.rows.map(r => r.cells.reduce((s, c) => s + c.w, 0)))
  const lw = p.rows.some(r => r.label) ? 120 : 0, W = 520, u = W / total, rh = 56, gap = 44
  const H = p.rows.length * (rh + gap) - gap + (p.rows.some(r => r.brace) ? 44 : 6)
  let k = 0
  return (
    <Svg w={lw + W + 8} h={H} label="Tape diagram">
      {p.rows.map((r, i) => {
        const y = 4 + i * (rh + gap)
        let x = lw + 4
        return (
          <g key={i}>
            {r.label && <T x={lw - 10} y={y + rh / 2} s={20} a="end">{r.label}</T>}
            {r.cells.map((c, j) => {
              const cx = x; x += c.w * u
              return (
                <g key={j} style={reveal(k++, p.motion, 300)}>
                  <rect x={cx} y={y} width={c.w * u} height={rh} fill={TONE[c.shade ? 1 : 0]} stroke={INK} strokeWidth={4} />
                  {c.text && <T x={cx + (c.w * u) / 2} y={y + rh / 2} s={22}>{c.text}</T>}
                </g>
              )
            })}
            {r.brace && <>
              <path d={`M ${lw + 6} ${y + rh + 8} q 0 12 12 12 H ${x - 14} q 12 0 12 -12`} fill="none" stroke={INK} strokeWidth={3} />
              <T x={(lw + x) / 2} y={y + rh + 34} s={20}>{r.brace}</T>
            </>}
          </g>
        )
      })}
    </Svg>
  )
}

// ── Number line ────────────────────────────────────────────────────────────────────────────────
function NumLine({ p }: { p: P<'numline'> }) {
  const W = 640, x0 = 30, span = W - 60, y = 110
  const px = (v: number) => x0 + ((v - p.min) / (p.max - p.min)) * span
  const ticks = Array.from({ length: p.ticks + 1 }, (_, i) => p.min + ((p.max - p.min) * i) / p.ticks)
  const labelOf = (i: number, v: number) =>
    Array.isArray(p.labels) ? p.labels[i] : p.labels === 'none' ? null : p.labels === 'ends' ? (i === 0 || i === p.ticks ? fmt(v) : null) : fmt(v)
  const small = p.ticks > 12
  return (
    <Svg w={W} h={170} label={`Number line from ${fmt(p.min)} to ${fmt(p.max)}`}>
      <line x1={x0 - 14} y1={y} x2={x0 + span + 14} y2={y} stroke={INK} strokeWidth={4} />
      <path d={`M ${x0 - 22} ${y} l 12 -8 v 16 z M ${x0 + span + 22} ${y} l -12 -8 v 16 z`} fill={INK} />
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={px(v)} y1={y - 12} x2={px(v)} y2={y + 12} stroke={INK} strokeWidth={3} />
          {labelOf(i, v) != null && <T x={px(v)} y={y + 34} s={small ? 15 : 20}>{labelOf(i, v)}</T>}
        </g>
      ))}
      {p.ray && (() => {
        const a = px(p.ray.from), b = p.ray.dir === 'right' ? x0 + span + 16 : x0 - 16
        return <g>
          <line x1={a} y1={y} x2={b} y2={y} stroke={TEAL} strokeWidth={9} />
          <path d={p.ray.dir === 'right' ? `M ${b + 10} ${y} l -16 -11 v 22 z` : `M ${b - 10} ${y} l 16 -11 v 22 z`} fill={TEAL} />
          <circle cx={a} cy={y} r={11} fill={p.ray.open ? '#fff' : TEAL} stroke={TEAL} strokeWidth={5} />
        </g>
      })()}
      {p.jumps?.map((j, i) => {
        const a = px(j.from), b = px(j.to), m = (a + b) / 2, lift = Math.min(70, Math.abs(b - a) / 2 + 20)
        return (
          <g key={i} style={reveal(i, p.motion, 550)}>
            <path d={`M ${a} ${y - 6} Q ${m} ${y - lift * 1.4} ${b} ${y - 6}`} fill="none" stroke={ACCENT} strokeWidth={4} />
            <path d={`M ${b} ${y - 6} l ${a < b ? -12 : 12} -8 l ${a < b ? 3 : -3} 12 z`} fill={ACCENT} />
            {j.label && <T x={m} y={y - lift - 12} s={18} fill={ACCENT}>{j.label}</T>}
          </g>
        )
      })}
      {p.points?.map((pt, i) => (
        <g key={i} style={reveal(i + (p.jumps?.length ?? 0), p.motion, 550)}>
          <circle cx={px(pt.at)} cy={y} r={11} fill={pt.open ? '#fff' : ACCENT} stroke={INK} strokeWidth={3.5} />
          {pt.label && <T x={px(pt.at)} y={y - 30} s={20} fill={INK}>{pt.label}</T>}
        </g>
      ))}
    </Svg>
  )
}

// ── Clock ──────────────────────────────────────────────────────────────────────────────────────
function Clock({ p }: { p: P<'clock'> }) {
  const c = 150, r = 110
  const at = (deg: number, len: number) => [c + len * Math.sin((deg * Math.PI) / 180), c - len * Math.cos((deg * Math.PI) / 180)]
  const hourDeg = ((p.h % 12) + p.m / 60) * 30, minDeg = p.m * 6
  const [hx, hy] = at(hourDeg, 58), [mx, my] = at(minDeg, 90)
  return (
    <Svg w={300} h={300} max={320} label={p.hands === false ? 'A clock with no hands' : `A clock showing ${p.h}:${String(p.m).padStart(2, '0')}`}>
      <circle cx={c} cy={c} r={r + 16} fill="#fff" stroke={INK} strokeWidth={7} />
      {Array.from({ length: 60 }, (_, i) => {
        const [x1, y1] = at(i * 6, r + 6), [x2, y2] = at(i * 6, i % 5 ? r - 2 : r - 10)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={i % 5 ? 2 : 4} />
      })}
      {Array.from({ length: 12 }, (_, i) => { const [x, y] = at((i + 1) * 30, r - 30); return <T key={i} x={x} y={y} s={24}>{i + 1}</T> })}
      {p.fives && Array.from({ length: 12 }, (_, i) => {
        const [x, y] = at((i + 1) * 30, r + 36)
        return <T key={i} x={x} y={y} s={15} fill={TEAL}>{String(((i + 1) * 5) % 60).padStart(2, '0')}</T>
      })}
      {p.hands !== false && <>
        <line x1={c} y1={c} x2={hx} y2={hy} stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <line x1={c} y1={c} x2={mx} y2={my} stroke={TEAL} strokeWidth={6} strokeLinecap="round" />
      </>}
      <circle cx={c} cy={c} r={8} fill={INK} />
    </Svg>
  )
}

// ── Measuring tools ────────────────────────────────────────────────────────────────────────────
function Measure({ p }: { p: P<'measure'> }) {
  const min = p.min ?? 0, every = p.labelEvery ?? p.step
  const n = Math.round((p.max - min) / p.step)
  const vals = Array.from({ length: n + 1 }, (_, i) => min + i * p.step)
  const isLabel = (v: number) => Math.abs(((v - min) / every) - Math.round((v - min) / every)) < 1e-6
  const has = p.value != null

  if (p.tool === 'ruler') {
    const W = 620, x0 = 30, span = W - 60, px = (v: number) => x0 + ((v - min) / (p.max - min)) * span
    return (
      <Svg w={W} h={170} label={`A ruler from ${min} to ${p.max} ${p.unit}`}>
        {has && <rect x={px(min)} y={24} width={px(p.value!) - px(min)} height={30} rx={8} fill={TONE[2]} stroke={INK} strokeWidth={4} />}
        <rect x={x0 - 14} y={70} width={span + 28} height={80} rx={6} fill="#fff6c8" stroke={INK} strokeWidth={4} />
        {vals.map((v, i) => {
          const whole = Math.abs(v - Math.round(v)) < 1e-6, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6
          return <g key={i}>
            <line x1={px(v)} y1={70} x2={px(v)} y2={70 + (whole ? 34 : half ? 24 : 14)} stroke={INK} strokeWidth={whole ? 3.5 : 2.5} />
            {isLabel(v) && <T x={px(v)} y={124} s={20}>{fmt(v)}</T>}
          </g>
        })}
        <T x={x0 + span} y={140} s={14} a="end" w={700}>{p.unit}</T>
      </Svg>
    )
  }

  if (p.tool === 'scale') {
    const cx = 200, cy = 190, r = 150
    const ang = (v: number) => Math.PI * 1.1 + ((v - min) / (p.max - min)) * Math.PI * 0.8
    const pt = (v: number, len: number) => [cx + len * Math.cos(ang(v)), cy + len * Math.sin(ang(v))]
    const [nx, ny] = pt(has ? p.value! : min, r - 30)
    return (
      <Svg w={400} h={250} max={320} label={`A weighing scale from ${min} to ${p.max} ${p.unit}`}>
        <path d={`M ${cx - r - 20} ${cy} A ${r + 20} ${r + 20} 0 0 1 ${cx + r + 20} ${cy} Z`} fill="#fff" stroke={INK} strokeWidth={6} />
        {vals.map((v, i) => {
          const [x1, y1] = pt(v, r), [x2, y2] = pt(v, isLabel(v) ? r - 18 : r - 9), [lx, ly] = pt(v, r - 38)
          return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={isLabel(v) ? 4 : 2} />
            {isLabel(v) && <T x={lx} y={ly} s={16}>{fmt(v)}</T>}</g>
        })}
        {has && <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={ACCENT} strokeWidth={7} strokeLinecap="round" />}
        <circle cx={cx} cy={cy} r={12} fill={INK} />
        <T x={cx} y={cy + 32} s={22}>{p.unit}</T>
      </Svg>
    )
  }

  // jug (capacity) and thermometer: a vertical scale
  const H = 320, y0 = 290, top = 30, py = (v: number) => y0 - ((v - min) / (p.max - min)) * (y0 - top)
  const thermo = p.tool === 'thermometer'
  const bw = thermo ? 34 : 150, bx = thermo ? 110 : 60
  return (
    <Svg w={320} h={H + 20} max={340} label={`A ${thermo ? 'thermometer' : 'measuring jug'} from ${min} to ${p.max} ${p.unit}`}>
      {has && <rect x={bx} y={py(p.value!)} width={bw} height={y0 - py(p.value!)} fill={thermo ? '#ff6b4a' : TONE[4]} />}
      <rect x={bx} y={top - 14} width={bw} height={y0 - top + 14} rx={thermo ? 17 : 8} fill="none" stroke={INK} strokeWidth={6} />
      {thermo && <circle cx={bx + bw / 2} cy={y0 + 22} r={28} fill="#ff6b4a" stroke={INK} strokeWidth={6} />}
      {vals.map((v, i) => (
        <g key={i}>
          <line x1={bx + bw} y1={py(v)} x2={bx + bw + (isLabel(v) ? 22 : 12)} y2={py(v)} stroke={INK} strokeWidth={isLabel(v) ? 4 : 2} />
          {isLabel(v) && <T x={bx + bw + 30} y={py(v)} s={18} a="start">{fmt(v)}</T>}
        </g>
      ))}
      <T x={thermo ? bx - 14 : bx + bw / 2} y={thermo ? top : y0 + 26} s={18} a={thermo ? 'end' : 'middle'}>{p.unit}</T>
    </Svg>
  )
}

// ── Base-ten blocks ────────────────────────────────────────────────────────────────────────────
function Blocks({ p }: { p: P<'blocks'> }) {
  const s = 9, gap = 18
  const flatW = s * 10, rodW = s, onesPerRow = 10
  const rowsOnes = Math.ceil(p.ones / onesPerRow)
  const flatsW = p.hundreds * (flatW + 10), rodsW = p.tens * (rodW + 8)
  const onesW = Math.min(p.ones, onesPerRow) * (s + 5)
  const W = Math.max(flatsW + rodsW + onesW + gap * 3, 200), H = Math.max(flatW, rowsOnes * (s + 6) + 40) + 40
  let k = 0
  const rodX = flatsW + gap, onesX = rodX + rodsW + gap
  return (
    <Svg w={W} h={H} max={260} label={`${p.hundreds} hundreds, ${p.tens} tens, ${p.ones} ones`}>
      {Array.from({ length: p.hundreds }, (_, i) => (
        <g key={`h${i}`} style={reveal(k++, p.motion, 200)}>
          <rect x={i * (flatW + 10)} y={10} width={flatW} height={flatW} fill={TONE[2]} stroke={INK} strokeWidth={3} />
          {Array.from({ length: 9 }, (_, j) => <g key={j}>
            <line x1={i * (flatW + 10) + (j + 1) * s} y1={10} x2={i * (flatW + 10) + (j + 1) * s} y2={10 + flatW} stroke={INK} strokeWidth={0.8} />
            <line x1={i * (flatW + 10)} y1={10 + (j + 1) * s} x2={i * (flatW + 10) + flatW} y2={10 + (j + 1) * s} stroke={INK} strokeWidth={0.8} />
          </g>)}
        </g>
      ))}
      {Array.from({ length: p.tens }, (_, i) => (
        <g key={`t${i}`} style={reveal(k++, p.motion, 200)}>
          <rect x={rodX + i * (rodW + 8)} y={10} width={rodW} height={flatW} fill={TONE[1]} stroke={INK} strokeWidth={3} />
          {Array.from({ length: 9 }, (_, j) => <line key={j} x1={rodX + i * (rodW + 8)} y1={10 + (j + 1) * s} x2={rodX + i * (rodW + 8) + rodW} y2={10 + (j + 1) * s} stroke={INK} strokeWidth={0.8} />)}
        </g>
      ))}
      {Array.from({ length: p.ones }, (_, i) => (
        <rect key={`o${i}`} x={onesX + (i % onesPerRow) * (s + 5)} y={10 + Math.floor(i / onesPerRow) * (s + 6)} width={s} height={s}
          fill={TONE[3]} stroke={INK} strokeWidth={2} style={reveal(k++, p.motion, 120)} />
      ))}
      {p.trade === 'ones' && p.ones >= 10 && <rect x={onesX - 6} y={4} width={onesPerRow * (s + 5) + 6} height={s + 12} rx={9} fill="none" stroke={ACCENT} strokeWidth={4} />}
      {p.trade === 'tens' && p.tens >= 10 && <rect x={rodX - 6} y={4} width={10 * (rodW + 8) + 4} height={flatW + 12} rx={9} fill="none" stroke={ACCENT} strokeWidth={4} />}
      <T x={W / 2} y={H - 14} s={16} w={700}>{p.hundreds} hundreds · {p.tens} tens · {p.ones} ones</T>
    </Svg>
  )
}

// ── Column arithmetic ─────────────────────────────────────────────────────────────────────────
function Columns({ p }: { p: P<'columns'> }) {
  const cw = 34, lines = [...p.rows, ...(p.answer !== undefined ? [p.answer ?? ''] : [])]
  const n = Math.max(...lines.map(r => r.length), p.carry?.length ?? 0, p.places?.length ?? 0) + 1
  const W = n * cw + 20, top = (p.places ? 34 : 0) + (p.carry ? 30 : 0)
  const H = top + p.rows.length * 46 + (p.answer !== undefined ? 60 : 10)
  const chars = (s: string, y: number, size: number, fill = INK, style?: CSSProperties) =>
    s.split('').map((ch, i) => ch === ' ' ? null : <T key={i} x={W - 10 - (s.length - i) * cw + cw / 2} y={y} s={size} fill={fill} style={style}>{ch}</T>)
  return (
    <Svg w={W} h={H} max={320} label={`Written ${p.op === '+' ? 'addition' : p.op === '×' ? 'multiplication' : 'subtraction'}: ${p.rows.join(', ')}`}>
      {p.places && p.places.map((pl, i) => <T key={i} x={W - 10 - (p.places!.length - i) * cw + cw / 2} y={14} s={13} fill={TEAL}>{pl}</T>)}
      {p.carry && chars(p.carry, (p.places ? 34 : 0) + 12, 18, ACCENT, reveal(0, p.motion))}
      {p.rows.map((r, i) => <g key={i}>
        {chars(r, top + 24 + i * 46, 34)}
        {i === p.rows.length - 1 && p.op && <T x={18} y={top + 24 + i * 46} s={32}>{p.op}</T>}
      </g>)}
      <line x1={4} y1={top + p.rows.length * 46 + 2} x2={W - 4} y2={top + p.rows.length * 46 + 2} stroke={INK} strokeWidth={4} />
      {p.answer !== undefined && (p.answer
        ? chars(p.answer, top + p.rows.length * 46 + 30, 34, TEAL, reveal(1, p.motion))
        : <rect x={W - 10 - (n - 1) * cw} y={top + p.rows.length * 46 + 10} width={(n - 1) * cw} height={42} rx={8} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="8 6" />)}
    </Svg>
  )
}

// ── Long division ──────────────────────────────────────────────────────────────────────────────
function LongDiv({ p }: { p: P<'longdiv'> }) {
  const cw = 30, left = (p.divisor.length + 1) * cw, width = Math.max(p.dividend.length, ...(p.work ?? []).map(w => w.length)) * cw
  const W = left + width + 30, H = 110 + (p.work?.length ?? 0) * 40
  const row = (s: string, y: number, fill = INK) => s.split('').map((ch, i) => ch === ' ' ? null : <T key={i} x={left + 14 + i * cw + cw / 2} y={y} s={30} fill={fill}>{ch}</T>)
  return (
    <Svg w={W} h={H} max={320} label={`${p.dividend} divided by ${p.divisor}`}>
      {p.quotient && row(p.quotient, 26, TEAL)}
      <path d={`M ${left} 96 q 16 -24 0 -48 H ${W - 6}`} fill="none" stroke={INK} strokeWidth={4} />
      {p.divisor.split('').map((ch, i) => <T key={i} x={10 + i * cw + cw / 2} y={72} s={30}>{ch}</T>)}
      {row(p.dividend, 72)}
      {p.work?.map((w, i) => {
        const minus = w.trimStart().startsWith('−'), body = minus ? w.replace('−', '') : w   // the − takes no column of its own
        const first = body.search(/\S/)
        return <g key={i}>
          {minus && <T x={left + 14 + (first - 1) * cw + cw / 2} y={112 + i * 40} s={30} fill={ACCENT}>−</T>}
          {row(body, 112 + i * 40, minus ? ACCENT : INK)}
          {minus && <line x1={left + 14 + (first - 1) * cw} y1={130 + i * 40} x2={left + 14 + body.trimEnd().length * cw} y2={130 + i * 40} stroke={INK} strokeWidth={3} />}
        </g>
      })}
    </Svg>
  )
}

// ── Square tiles ───────────────────────────────────────────────────────────────────────────────
function Grid({ p }: { p: P<'grid'> }) {
  const s = Math.min(46, 460 / p.cols, 340 / p.rows), lw = p.left ? 70 : 10, tw = p.top ? 36 : 10
  const hidden = (r: number, c: number) => p.hide?.some(h => r >= h.r && r < h.r + h.h && c >= h.c && c < h.c + h.w)
  const toneAt = (r: number, c: number) => { const sh = p.shade?.findIndex(h => r >= h.r && r < h.r + h.h && c >= h.c && c < h.c + h.w) ?? -1; return sh < 0 ? null : { i: sh, tone: p.shade![sh].tone ?? 1 } }
  return (
    <Svg w={lw + p.cols * s + 10} h={tw + p.rows * s + 10} label={`${p.rows} rows of ${p.cols} squares`}>
      {p.top && <T x={lw + (p.cols * s) / 2} y={16} s={20}>{p.top}</T>}
      {p.left && <T x={lw - 12} y={tw + (p.rows * s) / 2} s={20} a="end">{p.left}</T>}
      {Array.from({ length: p.rows }, (_, r) => Array.from({ length: p.cols }, (_, c) => {
        if (hidden(r, c)) return null
        const t = toneAt(r, c)
        return <rect key={`${r}-${c}`} x={lw + c * s} y={tw + r * s} width={s} height={s} fill={TONE[t ? t.tone : 0]} stroke={INK} strokeWidth={2.5}
          style={t ? reveal(t.i, p.motion, 600) : undefined} />
      }))}
      {p.split?.col != null && <line x1={lw + p.split.col * s} y1={tw - 6} x2={lw + p.split.col * s} y2={tw + p.rows * s + 6} stroke={ACCENT} strokeWidth={6} strokeDasharray="10 7" />}
      {p.split?.row != null && <line x1={lw - 6} y1={tw + p.split.row * s} x2={lw + p.cols * s + 6} y2={tw + p.split.row * s} stroke={ACCENT} strokeWidth={6} strokeDasharray="10 7" />}
    </Svg>
  )
}

// ── Area model ────────────────────────────────────────────────────────────────────────────────
function Area({ p }: { p: P<'area'> }) {
  const ws = p.widths ?? p.cols.map(() => 1), hs = p.heights ?? p.rows.map(() => 1)
  const W = 420, H = Math.min(260, 110 * p.rows.length), sw = W / ws.reduce((a, b) => a + b, 0), sh = H / hs.reduce((a, b) => a + b, 0)
  const lx = 70, ty = 40
  let k = 0
  return (
    <Svg w={lx + W + 10} h={ty + H + 10} label={`Area model: ${p.cols.join(' + ')} by ${p.rows.join(' + ')}`}>
      {p.cols.map((c, i) => { const x = lx + ws.slice(0, i).reduce((a, b) => a + b, 0) * sw; return <T key={i} x={x + (ws[i] * sw) / 2} y={20} s={22}>{c}</T> })}
      {p.rows.map((r, j) => { const y = ty + hs.slice(0, j).reduce((a, b) => a + b, 0) * sh; return <T key={j} x={lx - 12} y={y + (hs[j] * sh) / 2} s={22} a="end">{r}</T> })}
      {p.rows.map((_, j) => p.cols.map((_, i) => {
        const x = lx + ws.slice(0, i).reduce((a, b) => a + b, 0) * sw, y = ty + hs.slice(0, j).reduce((a, b) => a + b, 0) * sh
        const text = p.cells?.[j]?.[i]
        return <g key={`${j}-${i}`} style={text ? reveal(k++, p.motion, 600) : undefined}>
          <rect x={x} y={y} width={ws[i] * sw} height={hs[j] * sh} fill={TONE[((i + j) % 2) + 1]} stroke={INK} strokeWidth={4} />
          {text && <T x={x + (ws[i] * sw) / 2} y={y + (hs[j] * sh) / 2} s={24}>{text}</T>}
        </g>
      }))}
    </Svg>
  )
}

// ── Shapes on a plane (triangles, quadrilaterals, composite shapes, transformations, circles) ──
type Pt = [number, number]
function Poly({ p }: { p: P<'poly'> }) {
  const all: Pt[] = [...p.shapes.flatMap(s => s.pts), ...(p.segs ?? []).flatMap(s => [s.a, s.b]), ...(p.labels ?? []).map(l => l.at),
    ...(p.circles ?? []).flatMap(c => [[c.c[0] - c.r, c.c[1] - c.r], [c.c[0] + c.r, c.c[1] + c.r]] as Pt[])]
  const xs = all.map(q => q[0]), ys = all.map(q => q[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const pad = 56, S = Math.min(460 / Math.max(maxX - minX, 1), 300 / Math.max(maxY - minY, 1))
  const W = (maxX - minX) * S + pad * 2, H = (maxY - minY) * S + pad * 2
  const X = (x: number) => pad + (x - minX) * S, Y = (y: number) => pad + (maxY - y) * S
  return (
    <Svg w={W} h={H} label="A shape">
      {p.grid && Array.from({ length: Math.floor(maxX) - Math.ceil(minX) + 1 }, (_, i) => <line key={`gx${i}`} x1={X(Math.ceil(minX) + i)} y1={Y(minY)} x2={X(Math.ceil(minX) + i)} y2={Y(maxY)} stroke="#e4d3b6" strokeWidth={1.5} />)}
      {p.grid && Array.from({ length: Math.floor(maxY) - Math.ceil(minY) + 1 }, (_, i) => <line key={`gy${i}`} x1={X(minX)} y1={Y(Math.ceil(minY) + i)} x2={X(maxX)} y2={Y(Math.ceil(minY) + i)} stroke="#e4d3b6" strokeWidth={1.5} />)}
      {p.shapes.map((s, si) => {
        const pts = s.pts, n = pts.length, cx = pts.reduce((a, q) => a + q[0], 0) / n, cy = pts.reduce((a, q) => a + q[1], 0) / n
        return (
          <g key={si} style={reveal(si, p.motion, 700)}>
            <path d={`M ${pts.map(q => `${X(q[0])} ${Y(q[1])}`).join(' L ')}${s.open ? '' : ' Z'}`} fill={s.open ? 'none' : TONE[s.tone ?? 1]}
              stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeDasharray={s.dashed ? '12 9' : undefined} />
            {s.right?.map(i => {
              const v = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], k = 16
              const ua = norm([X(a[0]) - X(v[0]), Y(a[1]) - Y(v[1])]), ub = norm([X(b[0]) - X(v[0]), Y(b[1]) - Y(v[1])])
              const [vx, vy] = [X(v[0]), Y(v[1])]
              return <path key={i} d={`M ${vx + ua[0] * k} ${vy + ua[1] * k} L ${vx + (ua[0] + ub[0]) * k} ${vy + (ua[1] + ub[1]) * k} L ${vx + ub[0] * k} ${vy + ub[1] * k}`} fill="none" stroke={INK} strokeWidth={3} />
            })}
            {s.sides?.map((lab, i) => {
              if (!lab) return null
              const a = pts[i], b = pts[(i + 1) % n], mx = X((a[0] + b[0]) / 2), my = Y((a[1] + b[1]) / 2)
              const nx = my - Y(cy), ny = -(mx - X(cx))  // not used directly; push away from the centre instead
              void nx; void ny
              const d = norm([mx - X(cx), my - Y(cy)])
              return <T key={i} x={mx + d[0] * 26} y={my + d[1] * 24} s={20}>{lab}</T>
            })}
            {s.angles?.map((lab, i) => {
              if (!lab) return null
              const v = pts[i], d = norm([X(cx) - X(v[0]), Y(cy) - Y(v[1])])
              return <T key={i} x={X(v[0]) + d[0] * 36} y={Y(v[1]) + d[1] * 30} s={17} fill={TEAL}>{lab}</T>
            })}
            {s.names?.map((lab, i) => {
              if (!lab) return null
              const v = pts[i], d = norm([X(v[0]) - X(cx), Y(v[1]) - Y(cy)])
              return <T key={i} x={X(v[0]) + d[0] * 20} y={Y(v[1]) + d[1] * 20} s={18}>{lab}</T>
            })}
            {s.ticks?.map(i => {
              const a = pts[i], b = pts[(i + 1) % n], mx = X((a[0] + b[0]) / 2), my = Y((a[1] + b[1]) / 2)
              const t = norm([X(b[0]) - X(a[0]), Y(b[1]) - Y(a[1])])
              return <line key={`t${i}`} x1={mx - t[1] * 9} y1={my + t[0] * 9} x2={mx + t[1] * 9} y2={my - t[0] * 9} stroke={INK} strokeWidth={3} />
            })}
          </g>
        )
      })}
      {p.circles?.map((c, i) => (
        <g key={`c${i}`}>
          <circle cx={X(c.c[0])} cy={Y(c.c[1])} r={c.r * S} fill={TONE[1]} stroke={INK} strokeWidth={5} />
          {c.show && <line x1={c.show === 'd' ? X(c.c[0] - c.r) : X(c.c[0])} y1={Y(c.c[1])} x2={X(c.c[0] + c.r)} y2={Y(c.c[1])} stroke={ACCENT} strokeWidth={4} />}
          <circle cx={X(c.c[0])} cy={Y(c.c[1])} r={5} fill={INK} />
          {c.label && <T x={c.show === 'd' ? X(c.c[0]) : X(c.c[0] + c.r / 2)} y={Y(c.c[1]) - 18} s={20}>{c.label}</T>}
        </g>
      ))}
      {p.segs?.map((s, i) => {
        const [ax, ay, bx, by] = [X(s.a[0]), Y(s.a[1]), X(s.b[0]), Y(s.b[1])], u = norm([bx - ax, by - ay])
        const head = (x: number, y: number, d: number[]) => <path d={`M ${x} ${y} l ${-d[0] * 16 - d[1] * 8} ${-d[1] * 16 + d[0] * 8} l ${d[1] * 16} ${-d[0] * 16} z`} fill={s.tone === 2 ? ACCENT : INK} />
        return (
          <g key={`s${i}`} style={reveal(i + p.shapes.length, p.motion, 600)}>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke={s.tone === 2 ? ACCENT : INK} strokeWidth={4.5} strokeDasharray={s.dashed ? '10 8' : undefined} />
            {(s.arrow === 'end' || s.arrow === 'both') && head(bx, by, u)}
            {s.arrow === 'both' && head(ax, ay, [-u[0], -u[1]])}
            {s.dots && <><circle cx={ax} cy={ay} r={7} fill={INK} /><circle cx={bx} cy={by} r={7} fill={INK} /></>}
            {s.label && <T x={(ax + bx) / 2 - u[1] * 22} y={(ay + by) / 2 + u[0] * 22} s={19} fill={s.tone === 2 ? ACCENT : INK}>{s.label}</T>}
          </g>
        )
      })}
      {p.labels?.map((l, i) => <T key={`l${i}`} x={X(l.at[0])} y={Y(l.at[1])} s={l.size ?? 20} fill={l.tone === 2 ? ACCENT : l.tone === 1 ? TEAL : INK}>{l.text}</T>)}
    </Svg>
  )
}
const norm = (v: number[]) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l] }

// ── Angles and the protractor ──────────────────────────────────────────────────────────────────
function Angle({ p }: { p: P<'angle'> }) {
  const cx = 230, cy = 230, R = 180
  const ray = (deg: number, len = R) => [cx + len * Math.cos((-deg * Math.PI) / 180), cy + len * Math.sin((-deg * Math.PI) / 180)]
  const cuts = p.parts ? p.parts.reduce<number[]>((acc, d) => [...acc, (acc.at(-1) ?? 0) + d], []) : [p.deg]
  const arc = (from: number, to: number, r: number) => {
    const [x1, y1] = ray(from, r), [x2, y2] = ray(to, r)
    return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 0 ${x2} ${y2}`
  }
  return (
    <Svg w={460} h={260} max={320} label={p.label ?? `An angle`}>
      {p.protractor && <>
        <path d={`M ${cx - R - 20} ${cy} A ${R + 20} ${R + 20} 0 0 1 ${cx + R + 20} ${cy} Z`} fill="#fff6c8" stroke={INK} strokeWidth={3} opacity={0.95} />
        {Array.from({ length: 19 }, (_, i) => {
          const [x1, y1] = ray(i * 10, R + 20), [x2, y2] = ray(i * 10, R + (i % 3 ? 8 : 2)), [lx, ly] = ray(i * 10, R - 12)
          return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={2} />{i % 3 === 0 && <T x={lx} y={ly} s={13} w={700}>{i * 10}</T>}</g>
        })}
      </>}
      {p.parts
        ? p.parts.map((d, i) => {
            const from = i ? cuts[i - 1] : 0, [lx, ly] = ray((from + cuts[i]) / 2, 84)
            return <g key={i} style={reveal(i, p.motion, 700)}>
              <path d={`${arc(from, cuts[i], 60)} L ${cx} ${cy} Z`} fill={TONE[i % 2 ? 2 : 1]} stroke={INK} strokeWidth={2} />
              {p.partLabels?.[i] !== null && <T x={lx} y={ly} s={18}>{p.partLabels?.[i] ?? `${d}°`}</T>}
            </g>
          })
        : p.deg === 90 && !p.protractor
          ? <path d={`M ${cx + 34} ${cy} v -34 h -34`} fill="none" stroke={INK} strokeWidth={3} />
          : <path d={arc(0, p.deg, 56)} fill="none" stroke={TEAL} strokeWidth={5} />}
      {[0, ...cuts].map((d, i) => { const [x, y] = ray(d); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={INK} strokeWidth={i === 0 || i === cuts.length ? 6 : 3.5} strokeLinecap="round" /> })}
      <circle cx={cx} cy={cy} r={7} fill={INK} />
      {p.label && !p.parts && (() => { const [x, y] = ray(p.deg / 2, 92); return <T x={x} y={y} s={22} fill={TEAL}>{p.label}</T> })()}
    </Svg>
  )
}

// ── Graphs: bar, picture, dot (line plot), histogram ──────────────────────────────────────────
function Chart({ p }: { p: P<'chart'> }) {
  const scale = p.scale ?? 1, max = p.max ?? Math.ceil(Math.max(...p.values) / scale) * scale
  if (p.type === 'picture') {
    const lw = 150, iw = 40, H = p.labels.length * 54 + 50
    const maxIcons = Math.ceil(max / scale)
    return (
      <Svg w={lw + maxIcons * iw + 20} h={H} label="Picture graph">
        {p.labels.map((l, i) => {
          const full = Math.floor(p.values[i] / scale), half = p.values[i] % scale ? 1 : 0, y = 30 + i * 54
          return <g key={i}>
            <T x={lw - 14} y={y} s={20} a="end">{l}</T>
            <line x1={lw} y1={y + 27} x2={lw + maxIcons * iw} y2={y + 27} stroke="#e4d3b6" strokeWidth={2} />
            {Array.from({ length: full + half }, (_, j) => <g key={j} style={reveal(i, p.motion, 500)}>
              <clipPath id={`half-${i}-${j}`}><rect x={lw + j * iw} y={y - 20} width={j >= full ? iw / 2 - 2 : iw} height={40} /></clipPath>
              <path d={star(lw + j * iw + iw / 2 - 2, y, 17)} fill={TONE[2]} stroke={INK} strokeWidth={2.5} clipPath={`url(#half-${i}-${j})`} />
            </g>)}
          </g>
        })}
        <T x={lw + 10} y={H - 14} s={18} a="start" w={800}>Each ★ = {p.key ?? `${scale} ${p.unit ?? ''}`}</T>
      </Svg>
    )
  }
  if (p.type === 'dot') {
    const W = Math.max(420, p.labels.length * 70), lx = 30, span = W - 60, y = 230, dx = span / Math.max(p.labels.length - 1, 1)
    return (
      <Svg w={W} h={290} label="Line plot">
        <line x1={lx - 10} y1={y} x2={lx + span + 10} y2={y} stroke={INK} strokeWidth={4} />
        {p.labels.map((l, i) => <g key={i}>
          <line x1={lx + i * dx} y1={y - 8} x2={lx + i * dx} y2={y + 8} stroke={INK} strokeWidth={3} />
          <T x={lx + i * dx} y={y + 30} s={18}>{l}</T>
          {Array.from({ length: p.values[i] }, (_, j) => <T key={j} x={lx + i * dx} y={y - 24 - j * 30} s={28} fill={TEAL} style={reveal(i, p.motion, 350)}>✕</T>)}
        </g>)}
        {p.xLabel && <T x={W / 2} y={y + 56} s={17} w={700}>{p.xLabel}</T>}
      </Svg>
    )
  }
  const W = 520, H = 300, lx = 60, by = 240, bw = p.type === 'hist' ? (W - lx) / p.labels.length : Math.min(80, (W - lx) / p.labels.length - 20)
  const py = (v: number) => by - (v / max) * (by - 30)
  return (
    <Svg w={W + 10} h={H + (p.xLabel ? 24 : 0)} label={p.type === 'hist' ? 'Histogram' : 'Bar graph'}>
      {Array.from({ length: Math.round(max / scale) + 1 }, (_, i) => i * scale).map(v => <g key={v}>
        <line x1={lx} y1={py(v)} x2={W} y2={py(v)} stroke="#e4d3b6" strokeWidth={1.5} />
        <T x={lx - 10} y={py(v)} s={15} a="end">{fmt(v)}</T>
      </g>)}
      <line x1={lx} y1={20} x2={lx} y2={by} stroke={INK} strokeWidth={4} />
      <line x1={lx} y1={by} x2={W} y2={by} stroke={INK} strokeWidth={4} />
      {p.labels.map((l, i) => {
        const x = p.type === 'hist' ? lx + i * bw : lx + 14 + i * (bw + 20)
        return <g key={i}>
          <rect x={x} y={py(p.values[i])} width={bw} height={by - py(p.values[i])} fill={TONE[(i % 3) + 1]} stroke={INK} strokeWidth={3.5} style={reveal(i, p.motion, 450)} />
          <T x={x + bw / 2} y={by + 22} s={15}>{l}</T>
        </g>
      })}
      {p.yLabel && <T x={16} y={130} s={15} w={700} style={{ transform: 'rotate(-90deg)', transformOrigin: '16px 130px' }}>{p.yLabel}</T>}
      {p.xLabel && <T x={(lx + W) / 2} y={by + 50} s={16} w={700}>{p.xLabel}</T>}
    </Svg>
  )
}
const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; return `${i ? 'L' : 'M'} ${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}` }).join(' ') + ' Z'

// ── Scatter plot ──────────────────────────────────────────────────────────────────────────────
function Plot({ p }: { p: P<'plot'> }) {
  const W = 480, H = 320, lx = 60, by = 270, xs = p.xStep ?? Math.max(1, p.xMax / 10), ys = p.yStep ?? Math.max(1, p.yMax / 10)
  const X = (x: number) => lx + (x / p.xMax) * (W - lx - 10), Y = (y: number) => by - (y / p.yMax) * (by - 20)
  return (
    <Svg w={W} h={H + 20} label="Scatter plot">
      {Array.from({ length: Math.floor(p.xMax / xs) + 1 }, (_, i) => i * xs).map(v => <g key={`x${v}`}><line x1={X(v)} y1={20} x2={X(v)} y2={by} stroke="#e4d3b6" /><T x={X(v)} y={by + 20} s={14}>{fmt(v)}</T></g>)}
      {Array.from({ length: Math.floor(p.yMax / ys) + 1 }, (_, i) => i * ys).map(v => <g key={`y${v}`}><line x1={lx} y1={Y(v)} x2={W - 10} y2={Y(v)} stroke="#e4d3b6" /><T x={lx - 8} y={Y(v)} s={14} a="end">{fmt(v)}</T></g>)}
      <line x1={lx} y1={20} x2={lx} y2={by} stroke={INK} strokeWidth={4} /><line x1={lx} y1={by} x2={W - 10} y2={by} stroke={INK} strokeWidth={4} />
      {p.points.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={8} fill={TEAL} stroke={INK} strokeWidth={2} style={reveal(i, p.motion, 120)} />)}
      <clipPath id="plot-clip"><rect x={lx} y={20} width={W - lx - 10} height={by - 20} /></clipPath>
      {p.fit && <line clipPath="url(#plot-clip)" x1={X(p.fit[0][0])} y1={Y(p.fit[0][1])} x2={X(p.fit[1][0])} y2={Y(p.fit[1][1])} stroke={ACCENT} strokeWidth={5} style={reveal(p.points.length, p.motion, 120)} />}
      {p.xLabel && <T x={(lx + W) / 2} y={by + 44} s={16} w={700}>{p.xLabel}</T>}
      {p.yLabel && <T x={14} y={by / 2} s={16} w={700} style={{ transform: 'rotate(-90deg)', transformOrigin: `14px ${by / 2}px` }}>{p.yLabel}</T>}
    </Svg>
  )
}

// ── Coordinate plane ──────────────────────────────────────────────────────────────────────────
function Coord({ p }: { p: P<'coord'> }) {
  const step = p.step ?? 1, n = (p.max - p.min) / step, S = Math.min(40, 420 / n), pad = 30
  const size = n * S + pad * 2
  const X = (x: number) => pad + ((x - p.min) / (p.max - p.min)) * n * S, Y = (y: number) => pad + ((p.max - y) / (p.max - p.min)) * n * S
  const labelEvery = n > 12 ? 2 : 1
  const clip = (a: Pt, b: Pt): [Pt, Pt] => {
    if (a[0] === b[0]) return [[a[0], p.min], [a[0], p.max]]
    const m = (b[1] - a[1]) / (b[0] - a[0]), f = (x: number) => a[1] + m * (x - a[0])
    return [[p.min, f(p.min)], [p.max, f(p.max)]]
  }
  return (
    <Svg w={size} h={size} max={400} label={`Coordinate grid from ${p.min} to ${p.max}`}>
      <defs><clipPath id="coord-clip"><rect x={pad} y={pad} width={n * S} height={n * S} /></clipPath></defs>
      {Array.from({ length: n + 1 }, (_, i) => p.min + i * step).map(v => <g key={v}>
        <line x1={X(v)} y1={Y(p.min)} x2={X(v)} y2={Y(p.max)} stroke={v === 0 ? INK : '#e4d3b6'} strokeWidth={v === 0 ? 4 : 1.5} />
        <line x1={X(p.min)} y1={Y(v)} x2={X(p.max)} y2={Y(v)} stroke={v === 0 ? INK : '#e4d3b6'} strokeWidth={v === 0 ? 4 : 1.5} />
        {Math.round(v / step) % labelEvery === 0 && v !== 0 && <>
          <T x={X(v)} y={Y(Math.max(p.min, 0)) + 14} s={12} w={700}>{fmt(v)}</T>
          <T x={X(Math.max(p.min, 0)) - 12} y={Y(v)} s={12} w={700}>{fmt(v)}</T>
        </>}
      </g>)}
      {p.min === 0 && <T x={X(0) - 10} y={Y(0) + 14} s={12} w={700}>0</T>}
      <g clipPath="url(#coord-clip)">
        {p.lines?.map((l, i) => {
          const [a, b] = l.extend ? clip(l.a, l.b) : [l.a, l.b]
          return <line key={i} x1={X(a[0])} y1={Y(a[1])} x2={X(b[0])} y2={Y(b[1])} stroke={l.tone === 2 ? ACCENT : TEAL} strokeWidth={l.dashed ? 4 : 5} strokeDasharray={l.dashed ? '9 7' : undefined} style={reveal(i, p.motion, 600)} />
        })}
      </g>
      {p.lines?.map((l, i) => l.label && <T key={`ll${i}`} x={(X(l.a[0]) + X(l.b[0])) / 2 + 14} y={(Y(l.a[1]) + Y(l.b[1])) / 2 - 14} s={17} fill={l.tone === 2 ? ACCENT : TEAL}>{l.label}</T>)}
      {p.points?.map((pt, i) => <g key={`p${i}`} style={reveal(i + (p.lines?.length ?? 0), p.motion, 500)}>
        <circle cx={X(pt.x)} cy={Y(pt.y)} r={8} fill={ACCENT} stroke={INK} strokeWidth={2.5} />
        {pt.label && <T x={X(pt.x) + 12} y={Y(pt.y) - 16} s={17} a="start">{pt.label}</T>}
      </g>)}
    </Svg>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────────────────────
function Table({ p }: { p: P<'table'> }) {
  const tw = useTextWidth()
  const marked = (r: number, c: number) => p.mark?.some(([mr, mc]) => mr === r && mc === c)
  // Row -1 is the heading row. A long cell wraps; each column is as wide as its widest line. A wide table (a 5-place
  // chart) is scaled down as a whole to fit a phone, never cut off.
  const all = [...(p.head ? [{ r: -1, cells: p.head }] : []), ...p.rows.map((cells, r) => ({ r, cells }))]
  const S = 20, HS = 19, px = 12, lh = 1.25
  const size = (r: number, c: number) => (r < 0 || (p.rowHead && c === 0) ? HS : S)
  const weight = (r: number, c: number) => (r < 0 || (p.rowHead && c === 0) ? 900 : 700)
  const lines = all.map(({ r, cells }) => cells.map((t, c) => wrap(t, 16).map(l => ({ l, s: size(r, c), w: weight(r, c) }))))
  const cols = Math.max(...all.map(x => x.cells.length))
  const cw = Array.from({ length: cols }, (_, c) => Math.max(40, ...lines.flatMap(row => (row[c] ?? []).map(x => tw(x.l, x.s, x.w)))) + px * 2)
  const rh = lines.map(row => Math.max(...row.map(ls => ls.length)) * S * lh + 16)
  const xs = cw.map((_, c) => cw.slice(0, c).reduce((a, b) => a + b, 0)), W = cw.reduce((a, b) => a + b, 0)
  const ys = rh.map((_, i) => rh.slice(0, i).reduce((a, b) => a + b, 0)), H = rh.reduce((a, b) => a + b, 0)
  return (
    <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} role="img" aria-label="Table"
      style={{ width: W + 4, maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', overflow: 'visible', fontFamily: F }}>
      <g>
        {all.map(({ r, cells }, i) => (
          <g key={i} style={r >= 0 ? reveal(r, p.motion, 400) : undefined}>
            {cells.map((_, c) => {
              const bg = r >= 0 && marked(r, c) ? TONE[1] : r < 0 || (p.rowHead && c === 0) ? TONE[2] : '#fff'
              const ls = lines[i][c]
              return <g key={c}>
                <rect x={xs[c]} y={ys[i]} width={cw[c]} height={rh[i]} fill={bg} stroke={INK} strokeWidth={3} />
                {ls.map((x, k) => <T key={k} x={xs[c] + cw[c] / 2} y={ys[i] + rh[i] / 2 + (k - (ls.length - 1) / 2) * S * lh} s={x.s} w={x.w}>{x.l}</T>)}
              </g>
            })}
          </g>
        ))}
      </g>
    </svg>
  )
}

// ── Unit cubes (volume) ───────────────────────────────────────────────────────────────────────
function Cubes({ p }: { p: P<'cubes'> }) {
  const s = Math.min(34, 260 / (p.l + p.w)), layers = p.layers ?? p.h
  // x runs right-down, y runs left-down, z runs up. Visible faces: the top, the y+1 face and the x+1 face.
  const iso = (x: number, y: number, z: number): Pt => [(x - y) * s * 0.87, (x + y) * s * 0.5 - z * s]
  const cubes: [number, number, number][] = []
  for (let z = 0; z < layers; z++) for (let y = 0; y < p.w; y++) for (let x = 0; x < p.l; x++) cubes.push([x, y, z])
  cubes.sort((a, b) => a[2] - b[2] || (a[0] + a[1]) - (b[0] + b[1]))   // painter's order: bottom first, back first
  const ox = p.w * s * 0.87 + 20, oy = p.h * s + 20
  const W = (p.l + p.w) * s * 0.87 + 40, H = (p.l + p.w) * s * 0.5 + p.h * s + 40
  const path = (pts: Pt[], close = true) => `M ${pts.map(q => `${ox + q[0]} ${oy + q[1]}`).join(' L ')}${close ? ' Z' : ''}`
  const face = (pts: Pt[], fill: string, key: string) => <path key={key} d={path(pts)} fill={fill} stroke={INK} strokeWidth={2} />
  return (
    <Svg w={W} h={H} max={340} label={`A box ${p.l} cubes long, ${p.w} wide and ${p.h} high`}>
      {cubes.map(([x, y, z], i) => (
        <g key={i} style={reveal(z, p.motion, 800)}>
          {face([iso(x, y, z + 1), iso(x + 1, y, z + 1), iso(x + 1, y + 1, z + 1), iso(x, y + 1, z + 1)], TONE[1], 't')}
          {face([iso(x, y + 1, z), iso(x + 1, y + 1, z), iso(x + 1, y + 1, z + 1), iso(x, y + 1, z + 1)], TONE[2], 'l')}
          {face([iso(x + 1, y, z), iso(x + 1, y + 1, z), iso(x + 1, y + 1, z + 1), iso(x + 1, y, z + 1)], '#ffc98a', 'r')}
        </g>
      ))}
      {p.h > layers && <path fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="8 7"
        d={`${path([iso(0, 0, p.h), iso(p.l, 0, p.h), iso(p.l, p.w, p.h), iso(0, p.w, p.h)])} ${path([iso(p.l, 0, layers), iso(p.l, 0, p.h)], false)} ${path([iso(p.l, p.w, layers), iso(p.l, p.w, p.h)], false)} ${path([iso(0, p.w, layers), iso(0, p.w, p.h)], false)}`} />}
    </Svg>
  )
}

// ── Solids ────────────────────────────────────────────────────────────────────────────────────
function Solid({ p }: { p: P<'solid'> }) {
  const L = p.labels ?? {}, st = { stroke: INK, strokeWidth: 5, fill: TONE[1] }
  const dash = { stroke: INK, strokeWidth: 3, fill: 'none', strokeDasharray: '9 7' }
  return (
    <Svg w={360} h={300} max={320} label={`A ${p.shape}`}>
      {p.shape === 'cylinder' && <>
        <path d="M 90 70 V 230 A 90 28 0 0 0 270 230 V 70" {...st} />
        <ellipse cx={180} cy={70} rx={90} ry={28} {...st} fill={TONE[2]} />
        <path d="M 90 230 A 90 28 0 0 1 270 230" {...dash} />
        <line x1={180} y1={70} x2={270} y2={70} stroke={ACCENT} strokeWidth={4} /><circle cx={180} cy={70} r={4} fill={INK} />
      </>}
      {p.shape === 'cone' && <>
        <path d="M 180 40 L 90 230 A 90 28 0 0 0 270 230 Z" {...st} />
        <path d="M 90 230 A 90 28 0 0 1 270 230" {...dash} />
        <line x1={180} y1={40} x2={180} y2={230} {...dash} />
        <line x1={180} y1={230} x2={270} y2={230} stroke={ACCENT} strokeWidth={4} />
      </>}
      {p.shape === 'sphere' && <>
        <circle cx={180} cy={150} r={110} {...st} />
        <path d="M 70 150 A 110 30 0 0 0 290 150" stroke={INK} strokeWidth={3} fill="none" />
        <path d="M 70 150 A 110 30 0 0 1 290 150" {...dash} />
        <line x1={180} y1={150} x2={290} y2={150} stroke={ACCENT} strokeWidth={4} /><circle cx={180} cy={150} r={4} fill={INK} />
      </>}
      {p.shape === 'prism' && <>
        <path d="M 60 110 L 120 60 H 300 V 200 L 240 250 H 60 Z" {...st} />
        <path d="M 60 110 H 240 V 250 M 240 110 L 300 60" stroke={INK} strokeWidth={5} fill="none" />
        <path d="M 120 60 V 200 H 300 M 120 200 L 60 250" {...dash} />
      </>}
      {p.shape === 'pyramid' && <>
        <path d="M 180 40 L 60 220 L 200 260 L 300 200 Z" {...st} />
        <path d="M 180 40 L 200 260" stroke={INK} strokeWidth={5} />
        <path d="M 60 220 L 170 180 L 300 200 M 170 180 L 180 40" {...dash} />
      </>}
      {L.r && <T x={p.shape === 'sphere' ? 235 : 225} y={p.shape === 'sphere' ? 132 : p.shape === 'cone' ? 252 : 56} s={18} fill={ACCENT}>{L.r}</T>}
      {L.h && <T x={p.shape === 'cone' ? 200 : p.shape === 'prism' ? 312 : 290} y={150} s={20} a="start">{L.h}</T>}
      {L.l && <T x={150} y={272} s={20}>{L.l}</T>}
      {L.w && <T x={290} y={240} s={20} a="start">{L.w}</T>}
    </Svg>
  )
}

// ── Positive and negative counters ────────────────────────────────────────────────────────────
function Chips({ p }: { p: P<'chips'> }) {
  const r = 22, d = 56, cols = Math.max(p.pos, p.neg, 1)
  const W = cols * d + 20, pairs = p.pairs ?? 0
  const chip = (i: number, y: number, plus: boolean) => (
    <g key={`${plus}${i}`}>
      <circle cx={10 + d / 2 + i * d} cy={y} r={r} fill={plus ? TONE[2] : TONE[3]} stroke={INK} strokeWidth={3.5} />
      <T x={10 + d / 2 + i * d} y={y + 1} s={28} w={900}>{plus ? '+' : '−'}</T>
    </g>
  )
  return (
    <Svg w={W} h={150} max={220} label={`${p.pos} positive and ${p.neg} negative counters`}>
      {Array.from({ length: pairs }, (_, i) => <rect key={`z${i}`} x={10 + i * d + 3} y={10} width={d - 6} height={130} rx={24} fill="none" stroke={ACCENT} strokeWidth={4} strokeDasharray="8 6" style={reveal(i, p.motion, 500)} />)}
      {Array.from({ length: p.pos }, (_, i) => chip(i, 44, true))}
      {Array.from({ length: p.neg }, (_, i) => chip(i, 106, false))}
    </Svg>
  )
}

// ── Balance scale (equations) ─────────────────────────────────────────────────────────────────
function Balance({ p }: { p: P<'balance'> }) {
  const pan = (x: number, text: string) => (
    <g>
      <line x1={x} y1={90} x2={x - 70} y2={170} stroke={INK} strokeWidth={3} />
      <line x1={x} y1={90} x2={x + 70} y2={170} stroke={INK} strokeWidth={3} />
      <path d={`M ${x - 95} 170 H ${x + 95} Q ${x + 80} 205 ${x} 205 Q ${x - 80} 205 ${x - 95} 170 Z`} fill={TONE[2]} stroke={INK} strokeWidth={5} />
      <T x={x} y={186} s={26} w={900}>{text}</T>
    </g>
  )
  return (
    <Svg w={560} h={300} max={300} label={`A balance: ${p.left} on one side, ${p.right} on the other`}>
      <path d="M 250 290 H 310 L 290 110 H 270 Z" fill={TONE[1]} stroke={INK} strokeWidth={5} />
      <line x1={120} y1={90} x2={440} y2={90} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <circle cx={280} cy={90} r={12} fill={INK} />
      {pan(120, p.left)}{pan(440, p.right)}
    </Svg>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────────────────────
function Spinner({ p }: { p: P<'spinner'> }) {
  const c = 150, r = 120, n = p.parts.length
  const pt = (i: number, rr = r) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2; return [c + rr * Math.cos(a), c + rr * Math.sin(a)] }
  return (
    <Svg w={300} h={300} max={300} label={`A spinner with ${n} equal parts`}>
      {p.parts.map((lab, i) => {
        const [x1, y1] = pt(i), [x2, y2] = pt(i + 1), [lx, ly] = pt(i + 0.5, r * 0.62)
        const tone = p.tones?.[i] ?? (i % 3) + 1
        return <g key={i}>
          <path d={`M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 ${n === 1 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={TONE[tone]} stroke={INK} strokeWidth={4} />
          <T x={lx} y={ly} s={22}>{lab}</T>
        </g>
      })}
      <path d={`M ${c} ${c} L ${c + 10} ${c - 34} L ${c} ${c - 48} L ${c - 10} ${c - 34} Z`} fill={INK} transform={`rotate(35 ${c} ${c})`} />
      <circle cx={c} cy={c} r={10} fill="#fff" stroke={INK} strokeWidth={4} />
    </Svg>
  )
}
