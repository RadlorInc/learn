'use client'
/**
 * The pictures a new-flow lesson draws. Code-drawn on purpose (one idea, one clear picture, no scene).
 * ponytail: objects are simple shapes per kind; swap in drawn art per Obj when the art exists.
 *
 * `scratch` turns a picture into the Screen 8 scratch pad: every tap adds one (fills the next slot,
 * deals to the next plate, rings the next object, makes the next jump). It never grades anything.
 */
import type { CSSProperties } from 'react'
import { scratchLineMax, type Obj, type Picture } from './script'
import { Diagram } from './Diagrams'

export const INK = '#2a1c14', SOFT = '#6d4c3d', ACCENT = '#ff6b4a', TEAL = '#0f8a7a', GOOD = '#1f7a43', BAD = '#c1121f', CARD = '#FFFFFF', LINE = '#d9c3a0'

// The frame from the founder's SampleUI template, shared by the topic path and the lesson player.
export const PAGE_BG = 'radial-gradient(circle at 12% 20%, #ffe08a 0 90px, transparent 91px), radial-gradient(circle at 88% 10%, #ffb3a3 0 70px, transparent 71px), radial-gradient(circle at 80% 85%, #9cf0d8 0 110px, transparent 111px), #f3c98b'
export const shell: CSSProperties = { width: '100%', background: '#fff6e8', borderRadius: 28, border: `6px solid ${INK}`, boxShadow: `10px 10px 0 ${INK}`,
  overflow: 'hidden', display: 'flex', flexDirection: 'column', color: INK }
export const topBar: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#ff8a65', color: INK, fontWeight: 800 }

/** One object's size. The player sets `--lp-u` from the viewport so the picture grows on a tablet; 20px is the phone size. */
const u = (k: number) => `calc(var(--lp-u, 20px) * ${k})`

const OBJ: Record<Obj, CSSProperties> = {
  cookie:  { background: '#C98B4A', borderRadius: '50%' },
  muffin:  { background: '#8A5A3B', borderRadius: '45% 45% 20% 20%' },
  chair:   { background: '#5B7FD1', borderRadius: 4 },
  plant:   { background: '#3FA56B', borderRadius: '50% 50% 10% 10%' },
  dot:     { background: '#2F6FDB', borderRadius: '50%' },
  sock:    { background: '#D16BA5', borderRadius: '6px 6px 10px 10px', width: u(0.7) },
  finger:  { background: '#E9B38A', borderRadius: 8, width: u(0.5) },
  straw:   { background: '#E0A21B', borderRadius: 3, width: u(0.25), height: u(1.3) },
  wheel:   { background: '#2B2B2B', borderRadius: '50%', boxShadow: 'inset 0 0 0 calc(var(--lp-u, 20px) * .25) #2B2B2B, inset 0 0 0 calc(var(--lp-u, 20px) * .4) #9aa0a6' },
  apple:   { background: '#D6423A', borderRadius: '45% 45% 50% 50%' },
  sticker: { background: '#F2B33D', borderRadius: 5, transform: 'rotate(45deg)' },
  crayon:  { background: '#7B4FD1', borderRadius: 3, width: u(0.4), height: u(1.2) },
}

/** What a tap does on each scratch picture, said in the child's words (a turned tray has its own Turn button). */
const TAP_CUE: Partial<Record<Picture['kind'], string>> = {
  groups: 'Tap the picture to add one.',
  array: 'Tap the picture to fill the next spot.',
  line: 'Tap the picture to make a jump.',
  share: 'Tap the basket to share one out.',
  rings: 'Tap the picture to circle one.',
}

// Drawn art (Higgsfield, public/assets/lessons). An Obj without art keeps its code-drawn shape above.
const ART: Partial<Record<Obj, string>> = {
  cookie: '/assets/lessons/cookie.webp',
  dot: '/assets/lessons/marble.webp',
  sticker: '/assets/lessons/star.webp',
}

const anim = (delay: number, motion?: boolean): CSSProperties =>
  motion ? { opacity: 0, animation: `lp-in .35s ease-out ${delay}ms forwards` } : {}

export function Thing({ obj, empty, n, style }: { obj: Obj; empty?: boolean; n?: number; style?: CSSProperties }) {
  const art = !empty && ART[obj]
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: u(1), height: u(1), flexShrink: 0,
      ...(empty ? { border: `2px dashed ${LINE}`, borderRadius: '50%', background: 'transparent' }
        : art ? { background: `center / contain no-repeat url(${art})` } : OBJ[obj]), ...style }}>
      {n !== undefined && <b style={{ position: 'absolute', left: '50%', color: INK,
        // On drawn art the number sits ON the object in a chip; above it, a neighbour would cover it.
        ...(art ? { top: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, background: CARD, borderRadius: 999, padding: '0 4px', fontSize: 12, lineHeight: '16px' }
          : { top: -16, transform: 'translateX(-50%)', fontSize: 11 }) }}>{n}</b>}
    </span>
  )
}

const box: CSSProperties = { background: '#fff6e8', border: `3px solid ${INK}`, borderRadius: 16, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', justifyContent: 'center' }
const label: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, color: INK }

/** The tap cue for a scratch picture, or null when a tap does nothing (or has its own labelled button). */
export const tapCue = (p: Picture) => (p.kind === 'array' && p.turn ? null : TAP_CUE[p.kind] ?? null)

export interface Scratch { taps: number; onTap: () => void }

export function Pic({ p, scratch }: { p: Picture; scratch?: Scratch }) {
  const tap = scratch ? { onClick: scratch.onTap, role: 'button' as const, 'aria-label': 'Tap to use the picture', style: { cursor: 'pointer' } } : {}
  const taps = scratch?.taps ?? 0

  switch (p.kind) {
    case 'eq':
      return (
        <div style={{ ...label, fontSize: 'clamp(26px, 5vw, 36px)', textAlign: 'center', lineHeight: 1.35 }}>
          {p.text}
          {p.lines?.map((l, i) => <div key={i} style={{ fontSize: 'clamp(22px, 4vw, 30px)', ...anim(i * 700, true) }}>{l}</div>)}
        </div>
      )

    case 'cards':
      // "One thing not to do": a big Not this card beside a big Do this card (the template's Trap door).
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {([[p.wrong, false], [p.right, true]] as const).map(([t, ok]) => (
            <div key={String(ok)} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 22px', borderRadius: 22,
              border: `4px solid ${INK}`, background: ok ? '#b7f0c6' : '#ffb4b4' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 'clamp(20px, 2.4vw, 26px)', color: INK }}>
                <span aria-hidden style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: ok ? GOOD : BAD, border: `3px solid ${INK}`, color: '#fff', fontSize: 20, fontWeight: 900 }}>{ok ? '✓' : '✕'}</span>
                {ok ? 'Do this' : 'Not this'}
              </span>
              <span style={{ ...label, fontSize: 'clamp(28px, 3.6vw, 38px)' }}>{t}</span>
            </div>
          ))}
        </div>
      )

    case 'groups': {
      let k = 0
      return (
        <div {...tap} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', ...tap.style }}>
          {Array.from({ length: p.groups }, (_, g) => (
            <div key={g} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {p.show === 'running' && <span style={{ ...label, fontSize: 18, ...anim(g * 700, p.motion ?? true) }}>{(g + 1) * p.each}</span>}
              <div style={{ ...box, borderRadius: 999, minWidth: u(3.2), minHeight: `calc(${u(1)} + 24px)`, padding: `${p.show === 'count' ? 22 : 12}px 10px 10px`,
                // Cookies sit on a drawn plate; the plate grows with the count so they never spill off it.
                ...(p.obj === 'cookie' ? { width: u(2.6 + p.each * 0.5), height: u(2.6 + p.each * 0.5), padding: u(0.6), gap: 2, border: 'none', alignContent: 'center',
                  background: 'center / contain no-repeat url(/assets/lessons/plate.webp)' } : {}),
                ...(p.show === 'rings' ? p.obj === 'cookie' ? { boxShadow: `0 0 0 4px ${ACCENT}`, ...anim(g * 600, p.motion) }
                  : { borderColor: ACCENT, boxShadow: `0 0 0 3px ${ACCENT}33`, ...anim(g * 600, p.motion) } : {}) }}>
                {Array.from({ length: p.each }, () => {
                  const i = k++
                  // Scratch: an empty plate fills as the child taps — no dashed slot per item, which would be the answer drawn to count.
                  return scratch && i >= Math.min(taps, p.groups * p.each) ? null : <Thing key={i} obj={p.obj} n={p.show === 'count' ? i + 1 : undefined} style={p.obj === 'cookie' ? { width: u(1.1), height: u(1.1) } : undefined} />
                })}
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'scatter':
      return (
        <div style={{ position: 'relative', width: u(11), height: u(6), margin: '0 auto', ...box, display: 'block' }}>
          {Array.from({ length: p.n }, (_, i) => (
            <Thing key={i} obj={p.obj} style={{ position: 'absolute', left: `${(i * 37) % 86 + 4}%`, top: `${(i * 53) % 70 + 8}%`, transform: `rotate(${(i * 47) % 60 - 30}deg)` }} />
          ))}
        </div>
      )

    case 'array': {
      const cells = p.rows * p.cols
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div {...(p.turn ? {} : tap)} style={{ ...box, display: 'grid', gridTemplateColumns: `${p.show === 'rows' ? 'auto ' : ''}repeat(${p.cols}, calc(var(--lp-u, 20px) + 2px))${p.show === 'running' ? ' auto' : ''}`,
            gap: 6, alignItems: 'center', justifyItems: 'center',
            // A rotation does not change layout size: reserve the height the turned tray will need (one column pitch per item).
            ...(p.turn ? { margin: `calc((var(--lp-u, 20px) + 8px) * ${Math.max(0, p.cols - p.rows) / 2}) 0` } : {}),
            ...(p.turn && p.motion ? { animation: 'lp-turn 1.4s ease-in-out .4s forwards' } : {}),
            ...(p.turn && scratch && taps % 2 ? { transform: 'rotate(90deg)' } : {}), transition: 'transform .8s', ...(p.turn ? {} : tap.style) }}>
            {Array.from({ length: p.rows }, (_, r) => [
              p.show === 'rows' && <span key={`n${r}`} style={{ ...label, ...anim(r * 600, p.motion) }}>{r + 1}</span>,
              ...Array.from({ length: p.cols }, (_, c) => {
                const i = r * p.cols + c
                const glow = p.show === 'oneRow' && r === 0
                return <Thing key={i} obj={p.obj}
                  empty={(!!scratch && !p.turn && i >= taps) || (p.missing && i === cells - 1)}
                  n={glow ? c + 1 : undefined}
                  style={{ ...(p.show === 'oneRow' && r > 0 ? { opacity: 0.3 } : {}), ...(p.show === 'rows' || p.show === 'running' ? anim(r * 600, p.motion) : {}) }} />
              }),
              p.show === 'running' && <span key={`t${r}`} style={{ ...label, marginLeft: 6, ...anim(r * 600 + 200, p.motion) }}>{(r + 1) * p.cols}</span>,
            ])}
          </div>
          {p.turn && scratch && <button type="button" onClick={scratch.onTap} style={pill}>↻ Turn</button>}
        </div>
      )
    }

    case 'line': {
      const max = scratch ? scratchLineMax(p.step) : (p.max ?? scratchLineMax(p.step))
      const W = 420, x0 = 18, span = W - 36, y = 78, px = (v: number) => x0 + (v / max) * span
      const jumps = scratch ? taps : p.jumps
      return (
        <div {...tap} style={{ overflowX: 'auto', ...tap.style }}>
          <svg viewBox={`0 0 ${W} 120`} style={{ width: '100%', minWidth: 300, height: 'auto', display: 'block' }} role="img" aria-label={`Number line from 0 to ${max}`}>
            <line x1={x0} y1={y} x2={x0 + span} y2={y} stroke={INK} strokeWidth={3} />
            {Array.from({ length: Math.floor(max / p.step) + 1 }, (_, k) => k * p.step).map(v => (
              <g key={v}>
                <line x1={px(v)} y1={y - 8} x2={px(v)} y2={y + 8} stroke={INK} strokeWidth={2} />
                <text x={px(v)} y={y + 30} textAnchor="middle" fontSize={max / p.step > 10 ? 14 : 19} fontWeight={700} fill={INK}>{v}</text>
              </g>
            ))}
            {Array.from({ length: Math.min(jumps, Math.floor(max / p.step)) }, (_, k) => {
              const a = px(k * p.step), b = px((k + 1) * p.step), m = (a + b) / 2
              return (
                <g key={k} style={p.motion && !scratch ? { opacity: 0, animation: `lp-in .35s ease-out ${k * 600}ms forwards` } : undefined}>
                  <path d={`M ${a} ${y - 4} Q ${m} ${y - 50} ${b} ${y - 4}`} fill="none" stroke={ACCENT} strokeWidth={4} />
                  {p.show === 'count' && <text x={m} y={y - 36} textAnchor="middle" fontSize={18} fontWeight={800} fill={ACCENT}>{k + 1}</text>}
                </g>
              )
            })}
          </svg>
        </div>
      )
    }

    case 'share': {
      const uneven = p.state === 'uneven' ? unevenSplit(p.total, p.groups) : null
      const dealt = scratch ? Math.min(taps, p.total) : p.state === 'start' ? 0 : p.total
      const inPlate = (g: number) => uneven ? uneven[g] : Math.floor(dealt / p.groups) + (g < dealt % p.groups ? 1 : 0)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div {...tap} style={{ ...box, minHeight: 44, minWidth: 140, ...tap.style }} aria-label="Basket">
            {Array.from({ length: uneven ? 0 : p.total - dealt }, (_, i) => <Thing key={i} obj={p.obj} />)}
            {!uneven && dealt === p.total && <span style={{ color: SOFT, fontSize: 13 }}>empty</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {Array.from({ length: p.groups }, (_, g) => (
              <div key={g} style={{ ...box, borderRadius: 999, minWidth: 70, minHeight: 44 }}>
                {Array.from({ length: inPlate(g) }, (_, i) => (
                  <Thing key={i} obj={p.obj} style={p.state === 'deal' && !scratch ? anim((i * p.groups + g) * 220, true) : undefined} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'rings': {
      const ringed = scratch ? Math.min(taps, p.total) : p.state === 'start' ? 0 : p.state === 'one' ? p.size : p.total
      const groups = Math.ceil(ringed / p.size)
      return (
        <div {...tap} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'center', ...tap.style }}>
          {Array.from({ length: groups }, (_, g) => (
            <div key={`r${g}`} style={{ ...box, borderColor: ACCENT, borderRadius: 999, position: 'relative', ...anim(g * 600, p.motion && !scratch) }}>
              {Array.from({ length: Math.min(p.size, ringed - g * p.size) }, (_, i) => <Thing key={i} obj={p.obj} />)}
              {p.state === 'all' && !scratch && <b style={{ position: 'absolute', top: -10, right: -6, background: ACCENT, color: '#fff', borderRadius: 999, fontSize: 12, padding: '1px 7px' }}>{g + 1}</b>}
            </div>
          ))}
          {Array.from({ length: p.total - ringed }, (_, i) => <Thing key={`l${i}`} obj={p.obj} />)}
        </div>
      )
    }

    case 'triangle': {
      const node = (v: number | null): CSSProperties => ({ ...label, width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, background: v === null ? 'transparent' : CARD, border: `3px ${v === null ? 'dashed' : 'solid'} ${v === null ? ACCENT : INK}` })
      return (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '64px 40px 64px', gridTemplateRows: '64px 30px 64px', placeItems: 'center' }}>
            <div style={{ ...node(p.total), gridColumn: 2, gridRow: 1 }}>{p.total}</div>
            <div style={{ ...node(p.a), gridColumn: 1, gridRow: 3 }}>{p.a}</div>
            <div style={{ ...node(p.b), gridColumn: 3, gridRow: 3 }}>{p.b ?? '?'}</div>
          </div>
          {p.facts && p.b !== null && (
            <ul style={{ ...label, listStyle: 'none', padding: 0, margin: 0, fontSize: 20, lineHeight: 1.7 }}>
              <li>{p.a} × {p.b} = {p.total}</li><li>{p.b} × {p.a} = {p.total}</li>
              <li>{p.total} ÷ {p.a} = {p.b}</li><li>{p.total} ÷ {p.b} = {p.a}</li>
            </ul>
          )}
        </div>
      )
    }

    default:
      return <Diagram p={p} />
  }
}

/** An obviously unfair split (e.g. 12 → 6, 4, 2) that still adds up to the total. */
export function unevenSplit(total: number, groups: number): number[] {
  const w = Array.from({ length: groups }, (_, g) => groups - g)
  const sum = w.reduce((a, b) => a + b, 0)
  const out = w.map(x => Math.floor((x * total) / sum))
  out[0] += total - out.reduce((a, b) => a + b, 0)
  return out
}

export const pill: CSSProperties = {
  minHeight: 44, padding: '8px 14px', borderRadius: 14, border: `3px solid ${INK}`, background: CARD, boxShadow: `3px 3px 0 ${INK}`,
  fontWeight: 800, fontSize: 16, color: INK, cursor: 'pointer', whiteSpace: 'nowrap',
}

export const LESSON_KEYFRAMES = `
@keyframes lp-in { to { opacity: 1 } }
@keyframes lp-turn { to { transform: rotate(90deg) } }
@keyframes lp-pop { from { transform: scale(.85) rotate(var(--lp-tilt, 0deg)); opacity: 0 } to { transform: scale(1) rotate(var(--lp-tilt, 0deg)); opacity: 1 } }
@keyframes lp-nudge { 50% { transform: scale(1.06) } }
/* Anything going up on the board arrives the way a hand puts it there, never just by being present. */
/* WRITTEN: swept on left to right. Right for words, equations, tables, anything read in that order. */
@keyframes lp-write { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 -6px 0 0) } }
/* DRAWN: the outline traces itself and the colour arrives behind it. Right for a shape, a clock, a diagram.
 * The INK (fills and lettering) fades in here; the strokes are traced in LessonPlayer's Written wrapper, because a
 * real trace needs each path's own length and CSS cannot ask for it. A single fixed dash long enough for the
 * longest path covers a short one completely — which is why the first version only faded small shapes in. */
@keyframes lp-ink { from { fill-opacity: 0 } to { fill-opacity: 1 } }
.lp-draw svg :is(path, line, rect, circle, ellipse, polyline, polygon, text) { animation: lp-ink .9s ease-out backwards }
button:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #2a1c14 !important }
button:disabled { opacity: .5; box-shadow: none !important; cursor: default }
@media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; animation-delay: 0ms !important } }
`
