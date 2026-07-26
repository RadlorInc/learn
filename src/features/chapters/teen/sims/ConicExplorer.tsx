'use client'
/**
 * ConicExplorer — the play-with-it-first sim for the Conic Sections chapter
 * (17–18, "Torch on the Wall"). Stretch the vertical radius and watch a circle
 * become an ellipse.
 *
 * Extracted verbatim (behaviour unchanged) from the old ConicSectionsChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there, so
 * it would have been deleted with the wrapper.
 */
import { useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import CoordGrid from '@/features/chapters/teen/CoordGrid'
import SimLayout from '@/features/chapters/teen/sims/SimLayout'

export default function ConicExplorer({ band }: { band: AgeBand }) {
  const a = 4
  const [b, setB] = useState(4)
  const span = 7
  const upper = (x: number) => {
    const t = 1 - (x / a) ** 2
    return t < 0 ? NaN : b * Math.sqrt(t)
  }
  const lower = (x: number) => {
    const t = 1 - (x / a) ** 2
    return t < 0 ? NaN : -b * Math.sqrt(t)
  }
  const isCircle = Math.abs(b - a) < 0.001
  return (
    <SimLayout maxWidth={340} gap={14} align="center" visual={<>
      <div style={{ width: '100%' }}>
        <CoordGrid
          band={band}
          xRange={[-span, span]}
          yRange={[-span, span]}
          mode="read"
          curves={[{ kind: 'curve', fn: upper }, { kind: 'curve', fn: lower }]}
          points={[{ x: 0, y: 0 }]}
        />
      </div>
    </>}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="conic-b" style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-numeric)', fontSize: 14, color: 'var(--ink-soft)' }}>
          <span>vertical radius b</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{b}</span>
        </label>
        <input
          id="conic-b"
          type="range"
          min={1}
          max={6}
          step={1}
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>
      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        x²/{a * a} + y²/{b * b} = 1 — {isCircle ? 'when b equals a it is a circle.' : 'stretch b away from a and the circle becomes an ellipse.'}
      </p>
    </SimLayout>
  )
}
