'use client'
/**
 * SequenceExplorer — the play-with-it-first sim for the Sequences & Series chapter
 * (17–18, "The Training Block"). Switch between adding a fixed step (arithmetic)
 * and multiplying by a fixed factor (geometric), slide the step, and watch the
 * terms climb the graph.
 *
 * Extracted verbatim (behaviour unchanged) from the old SequencesSeriesChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there, so
 * it would have been deleted with the wrapper.
 */
import { useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import CoordGrid from '@/features/chapters/teen/CoordGrid'

export default function SequenceExplorer({ band }: { band: AgeBand }) {
  const [mode, setMode] = useState<'arith' | 'geo'>('arith')
  const [step, setStep] = useState(3) // common difference (arith) or ratio (geo)
  const a1 = 2
  const N = 6
  const terms = Array.from({ length: N }, (_, i) =>
    mode === 'arith' ? a1 + i * step : a1 * step ** i,
  )
  const points = terms.map((t, i) => ({ x: i + 1, y: t }))
  const yMax = Math.max(4, ...terms)
  // Tidy y-range so the grid stays readable across a wide value spread.
  const s = Math.max(1, Math.ceil(yMax / 8))
  const yHi = Math.ceil(yMax / s) * s

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 340 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['arith', 'geo'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setStep(m === 'arith' ? 3 : 2) }}
            style={{
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? 'var(--fg-on-color)' : 'var(--ink-soft)',
              border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--outline)'}`,
            }}
          >
            {m === 'arith' ? 'Arithmetic (+d)' : 'Geometric (×r)'}
          </button>
        ))}
      </div>

      <div style={{ width: '100%' }}>
        <CoordGrid
          band={band}
          xRange={[0, N + 1]}
          yRange={[0, yHi]}
          mode="read"
          points={points}
        />
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
          <span>{mode === 'arith' ? 'Common difference d' : 'Common ratio r'}</span>
          <span style={{ fontFamily: 'var(--font-numeric)', color: 'var(--accent)' }}>{step}</span>
        </label>
        <input
          type="range"
          min={mode === 'arith' ? -3 : 2}
          max={mode === 'arith' ? 6 : 4}
          step={1}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>

      <p style={{ margin: 0, fontFamily: 'var(--font-numeric)', fontSize: 14, color: 'var(--ink)', textAlign: 'center' }}>
        {terms.map((t) => (t < 0 ? `−${Math.abs(t)}` : t)).join(',  ')}, …
      </p>
    </div>
  )
}
