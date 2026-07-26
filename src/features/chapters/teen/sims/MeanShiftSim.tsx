'use client'
/**
 * MeanShiftSim — the play-with-it-first sim for the Statistics & Inference
 * chapter (17–18, "The Reviews"). Drag one added value far out and watch the
 * mean chase it: why an outlier makes the mean a poor summary.
 *
 * Extracted verbatim (behaviour unchanged) from the old StatsInferenceChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there, so
 * it would have been deleted with the wrapper. `band` is accepted (every sim gets
 * it from the portal) and unused — this one is styled from the band's CSS vars.
 */
import { useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import SimLayout from '@/features/chapters/teen/sims/SimLayout'

export default function MeanShiftSim(_props: { band: AgeBand }) {
  const base = [4, 5, 6, 7, 8]
  const [extra, setExtra] = useState(8)
  const data = [...base, extra]
  const max = Math.max(...data, 12)
  const meanBase = base.reduce((s, v) => s + v, 0) / base.length
  const meanNow = data.reduce((s, v) => s + v, 0) / data.length
  const round1 = (n: number) => Math.round(n * 10) / 10

  return (
    <SimLayout visual={
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, height: 140, padding: '10px 8px', background: 'var(--bg-1)', border: '1px solid var(--outline)', borderRadius: 12, position: 'relative' }}>
        {data.map((v, i) => {
          const isExtra = i === data.length - 1
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 24, height: `${Math.max(8, (v / max) * 96)}px`, background: isExtra ? 'var(--note-amber)' : 'var(--accent)', borderRadius: '4px 4px 0 0', transition: 'height 150ms var(--ease-smooth)' }} />
              <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 11, color: isExtra ? 'var(--note-amber)' : 'var(--ink-soft)' }}>{v}</span>
            </div>
          )
        })}
      </div>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="mean-shift" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)' }}>
          Drag the added value (amber bar): <span style={{ fontFamily: 'var(--font-numeric)', color: 'var(--note-amber)', fontWeight: 600 }}>{extra}</span>
        </label>
        <input
          id="mean-shift"
          type="range"
          min={1}
          max={30}
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontFamily: 'var(--font-numeric)', fontSize: 15 }}>
        <span style={{ color: 'var(--ink-muted)' }}>Mean of five: <strong style={{ color: 'var(--ink)' }}>{round1(meanBase)}</strong></span>
        <span style={{ color: 'var(--ink-muted)' }}>With the added value: <strong style={{ color: 'var(--accent)' }}>{round1(meanNow)}</strong></span>
      </div>
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        Push the amber value far out and watch the mean chase it — that pull is why an outlier makes the mean a poor summary.
      </p>
    </SimLayout>
  )
}
