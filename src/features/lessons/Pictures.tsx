'use client'
/**
 * The pictures a new-flow lesson draws. Code-drawn on purpose (one idea, one clear picture, no scene).
 * ponytail: objects are simple shapes per kind; swap in drawn art per Obj when the art exists.
 *
 * `scratch` turns a picture into the Screen 8 scratch pad: every tap adds one (fills the next slot,
 * deals to the next plate, rings the next object, makes the next jump). It never grades anything.
 */
import type { CSSProperties } from 'react'
import type { Obj, Picture } from './script'

export const INK = '#3d2516', SOFT = '#7a6450', ACCENT = '#F26B2C', GOOD = '#1F9D62', BAD = '#D1483A', CARD = '#FFFFFF', LINE = '#E7D6B8'

const OBJ: Record<Obj, CSSProperties> = {
  cookie:  { background: '#C98B4A', borderRadius: '50%' },
  muffin:  { background: '#8A5A3B', borderRadius: '45% 45% 20% 20%' },
  chair:   { background: '#5B7FD1', borderRadius: 4 },
  plant:   { background: '#3FA56B', borderRadius: '50% 50% 10% 10%' },
  dot:     { background: '#2F6FDB', borderRadius: '50%' },
  sock:    { background: '#D16BA5', borderRadius: '6px 6px 10px 10px', width: 14 },
  finger:  { background: '#E9B38A', borderRadius: 8, width: 10 },
  straw:   { background: '#E0A21B', borderRadius: 3, width: 5, height: 26 },
  wheel:   { background: '#2B2B2B', borderRadius: '50%', boxShadow: 'inset 0 0 0 5px #2B2B2B, inset 0 0 0 8px #9aa0a6' },
  apple:   { background: '#D6423A', borderRadius: '45% 45% 50% 50%' },
  sticker: { background: '#F2B33D', borderRadius: 5, transform: 'rotate(45deg)' },
  crayon:  { background: '#7B4FD1', borderRadius: 3, width: 8, height: 24 },
}

const anim = (delay: number, motion?: boolean): CSSProperties =>
  motion ? { opacity: 0, animation: `lp-in .35s ease-out ${delay}ms forwards` } : {}

function Thing({ obj, empty, n, style }: { obj: Obj; empty?: boolean; n?: number; style?: CSSProperties }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 20, height: 20, flexShrink: 0,
      ...(empty ? { border: `2px dashed ${LINE}`, borderRadius: '50%', background: 'transparent' } : OBJ[obj]), ...style }}>
      {n !== undefined && <b style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: INK }}>{n}</b>}
    </span>
  )
}

const box: CSSProperties = { background: CARD, border: `2px solid ${LINE}`, borderRadius: 14, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', justifyContent: 'center' }
const label: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, color: INK }

export interface Scratch { taps: number; onTap: () => void }

export function Pic({ p, scratch }: { p: Picture; scratch?: Scratch }) {
  const tap = scratch ? { onClick: scratch.onTap, role: 'button' as const, 'aria-label': 'Tap to use the picture', style: { cursor: 'pointer' } } : {}
  const taps = scratch?.taps ?? 0

  switch (p.kind) {
    case 'eq':
      return <div style={{ ...label, fontSize: 'clamp(26px, 5vw, 36px)', textAlign: 'center' }}>{p.text}</div>

    case 'cards':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[[p.wrong, false], [p.right, true]].map(([t, ok]) => (
            <div key={String(ok)} style={{ ...box, justifyContent: 'space-between', flexWrap: 'nowrap', padding: '14px 18px',
              borderColor: ok ? GOOD : BAD, background: ok ? '#E2F4EB' : '#FBE7E4' }}>
              <span style={{ ...label, fontSize: 22 }}>{t as string}</span>
              <span style={{ ...label, fontSize: 30, color: ok ? GOOD : BAD }} aria-label={ok ? 'right' : 'wrong'}>{ok ? '✓' : '✕'}</span>
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
              <div style={{ ...box, borderRadius: 999, minWidth: 64, paddingTop: p.show === 'count' ? 22 : 12,
                ...(p.show === 'rings' ? { borderColor: ACCENT, boxShadow: `0 0 0 3px ${ACCENT}33`, ...anim(g * 600, p.motion) } : {}) }}>
                {Array.from({ length: p.each }, () => {
                  const i = k++
                  return <Thing key={i} obj={p.obj} empty={!!scratch && i >= taps} n={p.show === 'count' ? i + 1 : undefined} />
                })}
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'scatter':
      return (
        <div style={{ position: 'relative', width: 220, height: 120, margin: '0 auto', ...box, display: 'block' }}>
          {Array.from({ length: p.n }, (_, i) => (
            <Thing key={i} obj={p.obj} style={{ position: 'absolute', left: `${(i * 37) % 86 + 4}%`, top: `${(i * 53) % 70 + 8}%`, transform: `rotate(${(i * 47) % 60 - 30}deg)` }} />
          ))}
        </div>
      )

    case 'array': {
      const cells = p.rows * p.cols
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div {...(p.turn ? {} : tap)} style={{ ...box, display: 'grid', gridTemplateColumns: `${p.show === 'rows' ? 'auto ' : ''}repeat(${p.cols}, 22px)${p.show === 'running' ? ' auto' : ''}`,
            gap: 6, alignItems: 'center', justifyItems: 'center',
            // A rotation does not change layout size: reserve the height the turned tray will need (28px per item).
            ...(p.turn ? { margin: `${Math.max(0, (p.cols - p.rows) * 14)}px 0` } : {}),
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
      const W = 420, x0 = 18, span = W - 36, y = 78, px = (v: number) => x0 + (v / p.max) * span
      const jumps = scratch ? taps : p.jumps
      return (
        <div {...tap} style={{ overflowX: 'auto', ...tap.style }}>
          <svg viewBox={`0 0 ${W} 120`} style={{ width: '100%', minWidth: 300, height: 'auto', display: 'block' }} role="img" aria-label={`Number line from 0 to ${p.max}`}>
            <line x1={x0} y1={y} x2={x0 + span} y2={y} stroke={INK} strokeWidth={3} />
            {Array.from({ length: Math.floor(p.max / p.step) + 1 }, (_, k) => k * p.step).map(v => (
              <g key={v}>
                <line x1={px(v)} y1={y - 8} x2={px(v)} y2={y + 8} stroke={INK} strokeWidth={2} />
                <text x={px(v)} y={y + 30} textAnchor="middle" fontSize={p.max / p.step > 10 ? 14 : 19} fontWeight={700} fill={INK}>{v}</text>
              </g>
            ))}
            {Array.from({ length: Math.min(jumps, Math.floor(p.max / p.step)) }, (_, k) => {
              const a = px(k * p.step), b = px((k + 1) * p.step), m = (a + b) / 2
              return (
                <g key={k} style={p.motion && !scratch ? { opacity: 0, animation: `lp-in .35s ease-out ${k * 600}ms forwards` } : undefined}>
                  <path d={`M ${a} ${y - 4} Q ${m} ${y - 50} ${b} ${y - 4}`} fill="none" stroke={ACCENT} strokeWidth={4} />
                  {p.show === 'count' && <text x={m} y={y - 36} textAnchor="middle" fontSize={18} fontWeight={800} fill={ACCENT}>{k + 1}</text>}
                </g>
              )
            })}
          </svg>
          {scratch && <p style={{ margin: 0, fontSize: 13, color: SOFT, textAlign: 'center' }}>Tap to make a jump.</p>}
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
  minHeight: 44, padding: '8px 16px', borderRadius: 999, border: `2px solid ${LINE}`, background: CARD,
  fontWeight: 800, color: INK, cursor: 'pointer',
}

export const LESSON_KEYFRAMES = `
@keyframes lp-in { to { opacity: 1 } }
@keyframes lp-turn { to { transform: rotate(90deg) } }
@media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; animation-delay: 0ms !important } }
`
