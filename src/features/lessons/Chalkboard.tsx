'use client'
/**
 * The chalkboard a teaching screen draws on (see ./chalk.ts for the marks and their timing). Marks of the beats
 * already said are up; the current beat's marks are drawn as she says them, each at its word, one after another:
 * a line is traced over its own length, writing goes on letter by letter (outline, then chalk fills it), a wash fades in.
 */
import { useLayoutEffect, useRef } from 'react'
import { CHALK, wordMs, type ChalkMark } from './chalk'

/** `still`: no drawing, everything already up (the preview page). */
export function Chalkboard({ marks, says, shown, label, still }: { marks: ChalkMark[]; says: string[]; shown: number; label: string; still?: boolean }) {
  const svg = useRef<SVGSVGElement>(null)
  const beat = shown - 1

  // Before paint: a mark of the current beat must be hidden before the frame it would otherwise flash up in.
  useLayoutEffect(() => {
    const root = svg.current
    if (!root || still || typeof root.animate !== 'function') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let free = 0   // when the hand is free again
    root.querySelectorAll<SVGGraphicsElement>(`[data-beat="${beat}"]`).forEach(el => {
      const start = Math.max(free, Number(el.dataset.at) || 0), quick = el.dataset.quick !== undefined
      if (el.tagName === 'text') {
        const ls = [...el.querySelectorAll('tspan')], stroke = el.getAttribute('fill') ?? CHALK.w
        ls.forEach((l, i) => l.animate([
          { stroke, strokeWidth: '1.2', strokeDasharray: '120', strokeDashoffset: '120', fillOpacity: 0 },
          { stroke, strokeWidth: '1.2', strokeDasharray: '120', strokeDashoffset: '0', fillOpacity: 0, offset: 0.55 },
          { stroke, strokeWidth: '1.2', strokeDasharray: '120', strokeDashoffset: '0', fillOpacity: 1 },
        ], { duration: 380, delay: start + i * 60, easing: 'ease-out', fill: 'backwards' }))
        free = start + ls.length * 60 + 120   // the next mark starts while the last letter fills in
      } else if (el.dataset.wash) {
        el.animate([{ opacity: 0 }, { opacity: 0.22 }], { duration: 600, delay: start, easing: 'ease-out', fill: 'backwards' })
        free = start + 300
      } else {
        const len = (el as SVGGeometryElement).getTotalLength?.() || 300
        const dur = Math.max(300, Math.min(1500, len * 2.2))
        el.animate([{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }],
          { duration: dur, delay: start, easing: 'ease-in-out', fill: 'backwards' })
        free = start + dur
      }
      if (quick) free = start + 90
    })
  }, [beat, still])

  return (
    // Fills the picture column, and the frame hugs the board rather than stretching to the column's height.
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
    <div style={{ width: '100%', background: 'linear-gradient(180deg, #6A4F3B, #4A3527)', borderRadius: 14, padding: 10, boxShadow: '0 10px 24px -12px rgba(40,28,18,.7)' }}>
      <svg ref={svg} viewBox="0 0 600 400" role="img" aria-label={label}
        style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 6, background: 'radial-gradient(520px 320px at 30% 25%, #2B3E38, #22322D 72%)' }}>
        <defs>
          <filter id="chalk-dust" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="11" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.94  0 0 0 0 0.92  0 0 0 0 0.85  0 0 0 0.06 0" />
          </filter>
        </defs>
        {marks.map((m, i) => {
          if (m.beat >= shown) return null
          const c = CHALK[m.c ?? 'w'], data = { 'data-beat': m.beat, 'data-at': wordMs(says[m.beat] ?? '', m.at), ...(m.quick ? { 'data-quick': '' } : {}) }
          if (m.t !== undefined) return (
            <text key={i} {...data} x={m.x} y={m.y} fontSize={m.s ?? 30} fill={c} textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-chalk)', fontWeight: 700 }}>{chalkLetters(m.t)}</text>
          )
          if (m.wash) return <path key={i} {...data} data-wash="1" d={m.d} fill={c} opacity={0.22} />
          return <path key={i} {...data} d={m.d} fill="none" stroke={c} strokeWidth={m.w ?? 3.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.94} />
        })}
        <rect width="600" height="400" filter="url(#chalk-dust)" pointerEvents="none" opacity={0.5} />
      </svg>
    </div>
    </div>
  )
}

/** One tspan per letter (the pen writes them in turn). The maths signs come from the display font, because the chalk
 *  face misdraws two of them on a board: its ÷ has dots so small it reads as + ("3,000 + 1,000 = 3"), and its > is
 *  a curve that reads as ) ("207 ) 184"). Both are wrong statements on a maths board, not just ugly ones. */
const SIGNS = new Set(['÷', '×', '>', '<'])
const chalkLetters = (t: string) =>
  [...t].map((ch, i) => <tspan key={i} data-c="" style={SIGNS.has(ch) ? { fontFamily: 'var(--font-display)' } : undefined}>{ch}</tspan>)
