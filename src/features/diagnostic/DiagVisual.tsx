'use client'
/**
 * The picture above a diagnostic probe question. Draws the declarative `DiagVisual` a generator in
 * core/diagnosticItems returns — pure SVG in the pre-teen HUD palette, so there is no asset to 404
 * and nothing to load: a probe question can never end up unanswerable because a picture failed.
 * Height is capped (tighter on short frames) so the card still clears the answer tiles.
 */
import { PT, type Accent } from '@/features/chapters/story/preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import type { DiagVisual } from '@/core/diagnosticItems'

const MONO = { fontFamily: PT.mono, fontWeight: 700 } as const

export function DiagVisualView({ v, accent }: { v: DiagVisual; accent: Accent }) {
  // The height budget is measured here rather than passed in, so both probe screens (the checkup and
  // the re-check) get the same clearance over the answer tiles without each tracking the viewport.
  const vp = useViewport()
  const short = vp.h < 470
  const h = Math.min(short ? 76 : 132, vp.h * 0.24)
  // Under ~400px tall (phone landscape) the prompt plus two rows of answer tiles already fill the
  // screen, so the picture stands down — every prompt states its own numbers. The bar chart is the
  // one exception: it IS the data, so it is never dropped (its answers are short, one tile row).
  if (vp.h < 400 && v.t !== 'bars') return null
  // `hf` buys extra height for a near-square drawing — width is capped, so a square viewBox scaled to
  // the default height renders half the width of the wide ones. overflow stays hidden: a stray ray
  // escaping the box would draw over the question text.
  const box = (vb: string, kids: React.ReactNode, hf = 1) => (
    <svg viewBox={vb} style={{ width: '100%', maxWidth: short ? 300 : 380, height: h * hf, display: 'block' }}>{kids}</svg>
  )
  const A = accent.base

  switch (v.t) {
    // ── a bar chart to read ────────────────────────────────────────────────────────────
    case 'bars': {
      const max = Math.max(...v.vals, 1), w = 34, gap = 14
      return box(`0 0 ${v.labels.length * (w + gap)} 108`, <>
        <line x1={0} y1={84} x2={v.labels.length * (w + gap)} y2={84} stroke={PT.lineStrong} strokeWidth={1.5} />
        {v.labels.map((l, i) => {
          const bh = (v.vals[i] / max) * 66, x = i * (w + gap) + gap / 2
          return <g key={l}>
            <rect x={x} y={84 - bh} width={w} height={bh} rx={3} fill={A} opacity={0.85} />
            <text x={x + w / 2} y={78 - bh} textAnchor="middle" fill={PT.ink} fontSize={13} {...MONO}>{v.vals[i]}</text>
            <text x={x + w / 2} y={100} textAnchor="middle" fill={PT.inkSoft} fontSize={12} {...MONO}>{l}</text>
          </g>
        })}
      </>)
    }

    // ── a point on the coordinate plane ───────────────────────────────────────────────
    case 'point': {
      const u = 11, r = 7 * u, px = v.x * u, py = -v.y * u
      return box(`${-r - 14} ${-r - 14} ${2 * r + 28} ${2 * r + 28}`, <>
        {Array.from({ length: 15 }, (_, i) => i - 7).map(i => <g key={i}>
          <line x1={i * u} y1={-r} x2={i * u} y2={r} stroke={PT.line} strokeWidth={0.5} />
          <line x1={-r} y1={i * u} x2={r} y2={i * u} stroke={PT.line} strokeWidth={0.5} />
        </g>)}
        <line x1={-r} y1={0} x2={r} y2={0} stroke={PT.lineStrong} strokeWidth={1.5} />
        <line x1={0} y1={-r} x2={0} y2={r} stroke={PT.lineStrong} strokeWidth={1.5} />
        <line x1={px} y1={0} x2={px} y2={py} stroke={A} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
        <line x1={0} y1={py} x2={px} y2={py} stroke={A} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
        <circle cx={px} cy={py} r={5.5} fill={A} />
        <text x={px + (v.x > 0 ? 9 : -9)} y={py + (v.y > 0 ? -9 : 16)} textAnchor={v.x > 0 ? 'start' : 'end'} fill={PT.ink} fontSize={12} {...MONO}>{`(${v.x}, ${v.y})`}</text>
      </>, 1.5)
    }

    // ── rise over run ─────────────────────────────────────────────────────────────────
    case 'slope': {
      // drawn TO SCALE (a steep slope looks steep) — so the unit is whichever of rise/run binds.
      const u = Math.min(120 / v.run, 108 / v.rise), x0 = 30, y0 = 128
      const x1 = x0 + v.run * u, y1 = y0 - v.rise * u
      return box('0 0 200 150', <>
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={A} strokeWidth={3} strokeLinecap="round" />
        <line x1={x0} y1={y0} x2={x1} y2={y0} stroke={PT.inkSoft} strokeWidth={1.5} strokeDasharray="4 3" />
        <line x1={x1} y1={y0} x2={x1} y2={y1} stroke={PT.inkSoft} strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={(x0 + x1) / 2} y={y0 + 15} textAnchor="middle" fill={PT.inkSoft} fontSize={12} {...MONO}>{`${v.run} across`}</text>
        <text x={x1 + 7} y={(y0 + y1) / 2 + 4} fill={PT.ink} fontSize={12} {...MONO}>{`up ${v.rise}`}</text>
      </>, 1.3)
    }

    // ── fraction bars ─────────────────────────────────────────────────────────────────
    case 'frac': {
      const bw = 176, bh = 26, gap = 16
      return box(`0 0 ${bw + 40} ${v.parts.length * (bh + gap)}`, <>
        {v.parts.map(([num, den], r) => {
          const y = r * (bh + gap), seg = bw / den
          return <g key={r}>
            {Array.from({ length: den }, (_, i) =>
              <rect key={i} x={i * seg} y={y} width={seg} height={bh} fill={i < num ? A : 'transparent'} opacity={i < num ? 0.8 : 1} stroke={PT.lineStrong} strokeWidth={1.2} />)}
            <text x={bw + 8} y={y + bh - 7} fill={PT.ink} fontSize={14} {...MONO}>{`${num}/${den}`}</text>
          </g>
        })}
      </>)
    }

    // ── rows × cols of unit squares ───────────────────────────────────────────────────
    case 'array': {
      const c = Math.min(150 / v.cols, 82 / v.rows, 17)
      return box(`-2 -2 ${v.cols * c + 4} ${v.rows * c + 4}`,
        Array.from({ length: v.rows }, (_, r) => Array.from({ length: v.cols }, (_, k) =>
          <rect key={`${r}-${k}`} x={k * c} y={r * c} width={c - 1.5} height={c - 1.5} rx={2} fill={A} opacity={0.75} />)))
    }

    // ── an angle ──────────────────────────────────────────────────────────────────────
    case 'angle': {
      const x0 = 22, y0 = 112, len = 108, rad = (v.deg * Math.PI) / 180   // len ≤ y0 → the ray stays inside the box at 90°
      const ax = x0 + len * Math.cos(rad), ay = y0 - len * Math.sin(rad), ar = 34
      return box('0 0 200 124', <>
        <line x1={x0} y1={y0} x2={x0 + len} y2={y0} stroke={PT.inkSoft} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={x0} y1={y0} x2={ax} y2={ay} stroke={A} strokeWidth={2.5} strokeLinecap="round" />
        <path d={`M ${x0 + ar} ${y0} A ${ar} ${ar} 0 0 0 ${x0 + ar * Math.cos(rad)} ${y0 - ar * Math.sin(rad)}`} fill="none" stroke={A} strokeWidth={1.5} opacity={0.8} />
        <text x={x0 + ar + 8} y={y0 - 12} fill={PT.ink} fontSize={13} {...MONO}>{`${v.deg}°`}</text>
      </>)
    }

    // ── a right triangle ──────────────────────────────────────────────────────────────
    case 'rtri': {
      const u = Math.min(120 / v.a, 76 / v.b), w = v.a * u, ht = v.b * u, x0 = 42, y0 = 94
      const [lb, lh, lhyp] = v.labels
      return box('0 0 200 116', <>
        <path d={`M ${x0} ${y0} L ${x0 + w} ${y0} L ${x0} ${y0 - ht} Z`} fill={A} fillOpacity={0.16} stroke={A} strokeWidth={2.5} strokeLinejoin="round" />
        {/* the right-angle marker shrinks with a sliver triangle (7-24-25) or it crosses the hypotenuse */}
        {(() => { const m = Math.min(12, w / 3, ht / 3); return <path d={`M ${x0 + m} ${y0} L ${x0 + m} ${y0 - m} L ${x0} ${y0 - m}`} fill="none" stroke={PT.inkSoft} strokeWidth={1.4} /> })()}
        {lb && <text x={x0 + w / 2} y={y0 + 16} textAnchor="middle" fill={PT.ink} fontSize={13} {...MONO}>{lb}</text>}
        {lh && <text x={x0 - 8} y={y0 - ht / 2 + 4} textAnchor="end" fill={PT.ink} fontSize={13} {...MONO}>{lh}</text>}
        {lhyp && <text x={x0 + w / 2 + 10} y={y0 - ht / 2 - 2} fill={PT.ink} fontSize={13} {...MONO}>{lhyp}</text>}
      </>, 1.3)
    }

    // ── a value between two landmarks ─────────────────────────────────────────────────
    case 'numline': {
      const span = v.hi - v.lo, W = 180, at = (n: number) => ((n - v.lo) / span) * W
      return box('-12 0 204 62', <>
        <line x1={0} y1={34} x2={W} y2={34} stroke={PT.lineStrong} strokeWidth={2} />
        {Array.from({ length: span + 1 }, (_, i) => <line key={i} x1={at(v.lo + i) } y1={34} x2={at(v.lo + i)} y2={i === 0 || i === span ? 44 : i * 2 === span ? 42 : 39} stroke={i * 2 === span ? A : PT.lineStrong} strokeWidth={i % span === 0 ? 2 : 1} opacity={i % span === 0 || i * 2 === span ? 1 : 0.5} />)}
        <text x={0} y={58} textAnchor="middle" fill={PT.inkSoft} fontSize={12} {...MONO}>{v.lo}</text>
        <text x={W} y={58} textAnchor="middle" fill={PT.inkSoft} fontSize={12} {...MONO}>{v.hi}</text>
        <circle cx={at(v.mark)} cy={34} r={6} fill={A} />
        <text x={at(v.mark)} y={20} textAnchor="middle" fill={PT.ink} fontSize={14} {...MONO}>{v.mark}</text>
      </>)
    }
  }
}
