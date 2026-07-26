'use client'
/**
 * WaveExplorer — the play-with-it-first sim for the Trig Graphs & Identities
 * chapter (17–18, "Daylight Hours"). Drag amplitude and the period factor and
 * watch the wave stretch and squeeze.
 *
 * Extracted verbatim (behaviour unchanged) from the old TrigGraphsIdentitiesChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there, so
 * it would have been deleted with the wrapper.
 */
import React, { useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import CoordGrid from '@/features/chapters/teen/CoordGrid'
import SimLayout from '@/features/chapters/teen/sims/SimLayout'

export default function WaveExplorer({ band }: { band: AgeBand }) {
  const [A, setA] = useState(3)
  const [B, setB] = useState(1)
  const periodStr = (b: number) => (b === 1 ? '2π' : b === 2 ? 'π' : b === 3 ? '2π/3' : b === 4 ? 'π/2' : `2π/${b}`)
  const yr = Math.max(4, Math.abs(A) + 1)
  const sliderStyle: React.CSSProperties = { width: '100%', accentColor: 'var(--accent)' }
  const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-numeric)', fontSize: 13, color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }
  return (
    <SimLayout maxWidth={380} gap={14} visual={<>
      <CoordGrid
        band={band}
        xRange={[-6, 6]}
        yRange={[-yr, yr]}
        mode="read"
        curves={[{ kind: 'curve', fn: (x) => A * Math.sin(B * x) }]}
        lines={[{ kind: 'line', m: 0, b: 0 }]}
      />
    </>}>
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-numeric)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
        y = {A}·sin({B}x)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={labelStyle}><span>Amplitude A</span><span>{A}</span></div>
        <input type="range" min={1} max={5} step={1} value={A} onChange={(e) => setA(Number(e.target.value))} style={sliderStyle} aria-label="Amplitude" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={labelStyle}><span>Period factor B</span><span>{B}</span></div>
        <input type="range" min={1} max={4} step={1} value={B} onChange={(e) => setB(Number(e.target.value))} style={sliderStyle} aria-label="Period factor" />
      </div>
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-numeric)', fontSize: 14, color: 'var(--ink-muted)' }}>
        amplitude {A} · period {periodStr(B)}
      </div>
    </SimLayout>
  )
}
