'use client'
/**
 * RationalExplorer — the play-with-it-first sim for the Rational Functions chapter
 * (17–18, "Share the Wifi"). Plot y = 1/(x − a) and slide a; the curve tears apart
 * at the dashed vertical asymptote — the one input the function forbids.
 *
 * Extracted verbatim (behaviour unchanged) from the old RationalFunctionsChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there, so
 * it would have been deleted with the wrapper.
 */
import { useMemo, useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import CoordGrid from '@/features/chapters/teen/CoordGrid'
import SimLayout from '@/features/chapters/teen/sims/SimLayout'

export default function RationalExplorer({ band }: { band: AgeBand }) {
  const [a, setA] = useState(2)
  const RANGE = 6
  const fn = useMemo(() => (x: number) => 1 / (x - a), [a])

  // CoordGrid's SVG geometry (must match CoordGrid.tsx so the overlay lines up).
  const VW = 480, PAD = 28, PLOT = VW - PAD * 2
  const span = RANGE * 2
  const ax = PAD + ((a - -RANGE) / span) * PLOT

  return (
    <SimLayout maxWidth={380} gap={16} align="center" visual={<>
      <div style={{ position: 'relative', width: '100%' }}>
        <CoordGrid band={band} xRange={[-RANGE, RANGE]} yRange={[-RANGE, RANGE]} mode="read" curves={[{ kind: 'curve', fn }]} />
        <svg
          viewBox={`0 0 ${VW} ${VW}`}
          width="100%"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none', overflow: 'visible' }}
        >
          <line x1={ax} y1={PAD} x2={ax} y2={VW - PAD} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" opacity={0.85} />
        </svg>
      </div>
    </>}>

      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 18, fontWeight: 600, color: 'var(--accent)', textAlign: 'center', lineHeight: 1.4 }}>
        f(x) = 1 / (x {a >= 0 ? `− ${a}` : `+ ${Math.abs(a)}`}) &nbsp;·&nbsp; asymptote at x = {a < 0 ? `−${Math.abs(a)}` : a}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', fontFamily: 'var(--font-body)' }}>
        <span style={{ width: 80, fontSize: 14, color: 'var(--ink-soft)' }}>shift a</span>
        <input
          type="range" min={-5} max={5} step={1} value={a}
          onChange={(e) => setA(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
          aria-label="shift a"
        />
        <span style={{ width: 40, textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
          {a < 0 ? `−${Math.abs(a)}` : a}
        </span>
      </label>

      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        Slide <strong style={{ color: 'var(--ink)' }}>a</strong> and watch the curve break at the dashed <strong style={{ color: 'var(--ink)' }}>vertical asymptote</strong> x = a — the one input the function can’t take.
      </p>
    </SimLayout>
  )
}
