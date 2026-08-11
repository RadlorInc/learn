'use client'
/**
 * ParabolaExplorer — an interactive concept "simulation" for the Field Lab (teen).
 *
 * The learner drags the a, b, c sliders for y = ax² + bx + c (a ≠ 0) and watches
 * the parabola, its vertex, its real roots, and the discriminant all update live
 * (PhET / Desmos style). Slider-driven (not free-drag) so it's touch-friendly,
 * accessible, and testable. Mature Field Lab look — an instrument, not a cartoon.
 * Reads theme from the ancestor data-band scope; colors/fonts via CSS variables only.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AgeBand, Pt } from '@/features/chapters/teen/types'
import CoordGrid from '@/features/chapters/teen/CoordGrid'
import SimLayout, { Slider } from '@/features/chapters/teen/sims/SimLayout'
import { disp } from '@/core/fmt'

export interface ParabolaExplorerProps {
  band: AgeBand
  /** Called once on mount so a host (lesson/explore step) can unlock "Continue". */
  onReady?: () => void
}

const RANGE = 10 // grid spans -10..10


/** y = ax² + bx + c as a tidy string. */
function eq(a: number, b: number, c: number): string {
  const aPart = a === 1 ? 'x²' : a === -1 ? '−x²' : `${a < 0 ? '−' : ''}${Math.abs(a)}x²`
  let s = aPart
  if (b !== 0) {
    const bAbs = Math.abs(b) === 1 ? 'x' : `${Math.abs(b)}x`
    s += ` ${b < 0 ? '−' : '+'} ${bAbs}`
  }
  if (c !== 0) s += ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
  return `y = ${s}`
}

/** round to 2dp for display, collapse −0 */
const r2 = (n: number) => {
  const v = Math.round(n * 100) / 100
  return v === 0 ? 0 : v
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}

export default function ParabolaExplorer({ band, onReady }: ParabolaExplorerProps) {
  const [a, setA] = useState(1)
  const [b, setB] = useState(-2)
  const [c, setC] = useState(-3)
  const readyRef = useRef(onReady)
  readyRef.current = onReady
  useEffect(() => { readyRef.current?.() }, [])

  const safeA = a === 0 ? 1 : a

  // vertex, discriminant, roots
  const { vertex, disc, roots, curveFn, rootPts, vertexPt } = useMemo(() => {
    const vx = -b / (2 * safeA)
    const vy = safeA * vx * vx + b * vx + c
    const d = b * b - 4 * safeA * c
    const rs: number[] = []
    if (d >= 0) {
      const sq = Math.sqrt(d)
      const r1 = (-b - sq) / (2 * safeA)
      const r2v = (-b + sq) / (2 * safeA)
      rs.push(r1)
      if (Math.abs(r1 - r2v) > 1e-9) rs.push(r2v)
    }
    rs.sort((p, q) => p - q)
    return {
      vertex: { x: vx, y: vy } as Pt,
      disc: d,
      roots: rs,
      curveFn: (x: number) => safeA * x * x + b * x + c,
      rootPts: rs.map((x) => ({ x, y: 0 })) as Pt[],
      vertexPt: { x: vx, y: vy } as Pt,
    }
  }, [safeA, b, c])

  const rootCount = disc > 1e-9 ? 2 : disc < -1e-9 ? 0 : 1
  const rootsText =
    rootCount === 0
      ? 'none (no real roots)'
      : rootCount === 1
        ? `1 (x = ${disp(r2(roots[0]))})`
        : `2 (x = ${disp(r2(roots[0]))}, ${disp(r2(roots[1]))})`

  // Show the vertex as a context point and roots as context points on the grid.
  const contextPoints: Pt[] = useMemo(
    () => [vertexPt, ...rootPts].filter((p) => Math.abs(p.x) <= RANGE && Math.abs(p.y) <= RANGE),
    [vertexPt, rootPts],
  )

  return (
    <SimLayout maxWidth={400} gap={16} align="center" visual={<>
      <div style={{ width: '100%' }}>
        <CoordGrid
          band={band}
          xRange={[-RANGE, RANGE]}
          yRange={[-RANGE, RANGE]}
          mode="read"
          curves={[{ kind: 'curve', fn: curveFn }]}
          points={contextPoints}
          highlight={Math.abs(vertexPt.x) <= RANGE && Math.abs(vertexPt.y) <= RANGE ? vertexPt : null}
        />
      </div>
    </>}>

      {/* Live equation readout */}
      <div style={{
        fontFamily: 'var(--font-numeric)', fontSize: 22, fontWeight: 600, color: 'var(--accent)',
        letterSpacing: '0.01em', minHeight: 30, textAlign: 'center',
      }}>
        {eq(safeA, b, c)}
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {/* a may never be 0 — at 0 it stops being a parabola. Step past it in the
            direction of travel rather than letting the slider rest there. */}
        <Slider labelW={88} label="a (opens / width)" value={a} min={-4} max={4}
                onChange={n => setA(n === 0 ? (a > 0 ? -1 : 1) : n)} />
        <Slider labelW={88} label="b (shift)" value={b} min={-8} max={8} onChange={setB} />
        <Slider labelW={88} label="c (y-intercept)" value={c} min={-8} max={8} onChange={setC} />
      </div>

      {/* Instrument readout panel: vertex · roots · discriminant */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px', width: '100%',
        background: 'var(--bg-2)', border: '1px solid var(--outline)', borderRadius: 12, padding: '12px 14px', boxSizing: 'border-box',
      }}>
        <Readout label="Opens" value={safeA > 0 ? 'upward (∪)' : 'downward (∩)'} />
        <Readout label="Vertex" value={`(${r2(vertex.x)}, ${r2(vertex.y)})`} />
        <Readout label="Discriminant b²−4ac" value={`${disp(r2(disc))}`} />
        <Readout label="Real roots" value={rootsText} />
      </div>

      {/* Plain-language read-out of what changed */}
      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        The <strong style={{ color: 'var(--ink)' }}>discriminant</strong> tells you the number of real roots:{' '}
        positive → 2, zero → 1 (the vertex sits on the x-axis), negative → 0 (the curve never crosses x).
      </p>
    </SimLayout>
  )
}
