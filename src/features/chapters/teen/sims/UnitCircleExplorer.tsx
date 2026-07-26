'use client'
/**
 * UnitCircleExplorer — the play-with-it-first sim for the Unit Circle & Trig
 * chapter (17–18, "The Big Wheel"). Spin the angle and watch the point trace the
 * circle: its x-coordinate is cos θ, its y-coordinate is sin θ.
 *
 * Extracted verbatim (behaviour unchanged) from the old UnitCircleTrigChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there, so
 * it would have been deleted with the wrapper. `band` is accepted (every sim gets
 * it from the portal) and unused — this one is styled from the band's CSS vars.
 */
import { useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'

export default function UnitCircleExplorer(_props: { band: AgeBand }) {
  const [deg, setDeg] = useState(45)
  const R = 100
  const cx = 130
  const cy = 130
  const rad = (deg * Math.PI) / 180
  const px = cx + R * Math.cos(rad)
  const py = cy - R * Math.sin(rad)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const f2 = (n: number) => (Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2))
  const piMul = deg / 180
  const radLabel = piMul === 0 ? '0' : `${piMul.toFixed(2)}π`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 380 }}>
      <svg viewBox="0 0 260 260" role="img" aria-label={`Unit circle, angle ${deg} degrees`}
        style={{ display: 'block', width: '100%', height: 'auto', border: '1px solid var(--outline)', borderRadius: 8, background: 'var(--paper)' }}>
        {/* axes */}
        <line x1={cx - R - 16} y1={cy} x2={cx + R + 16} y2={cy} stroke="var(--outline)" strokeWidth={1} />
        <line x1={cx} y1={cy - R - 16} x2={cx} y2={cy + R + 16} stroke="var(--outline)" strokeWidth={1} />
        {/* unit circle */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--ink-soft)" strokeWidth={1.5} />
        {/* cos / sin projections */}
        <line x1={px} y1={py} x2={px} y2={cy} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="3 3" />
        <line x1={px} y1={py} x2={cx} y2={py} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="3 3" />
        {/* radius */}
        <line x1={cx} y1={cy} x2={px} y2={py} stroke="var(--accent)" strokeWidth={2.5} />
        <circle cx={px} cy={py} r={5} fill="var(--accent)" />
        <text x={cx + R + 6} y={cy - 6} style={{ fontFamily: 'var(--font-numeric)', fontSize: 11, fill: 'var(--ink-muted)' }}>x</text>
        <text x={cx + 6} y={cy - R - 6} style={{ fontFamily: 'var(--font-numeric)', fontSize: 11, fill: 'var(--ink-muted)' }}>y</text>
      </svg>

      {/* live readout */}
      <div style={{ display: 'flex', width: '100%', gap: 8, padding: '4px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-muted)' }}>angle</span>
          <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{deg}° · {radLabel}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-muted)' }}>(cos θ, sin θ)</span>
          <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>({f2(cos)}, {f2(sin)})</span>
        </div>
      </div>

      {/* slider */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', fontFamily: 'var(--font-body)' }}>
        <span style={{ width: 56, fontSize: 14, color: 'var(--ink-soft)' }}>angle θ</span>
        <input type="range" min={0} max={360} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }} aria-label="angle θ" />
        <span style={{ width: 48, textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>{deg}°</span>
      </label>

      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        Spin θ around and watch the point trace the circle: its
        {' '}<strong style={{ color: 'var(--ink)' }}>x-coordinate is cos θ</strong> and its
        {' '}<strong style={{ color: 'var(--ink)' }}>y-coordinate is sin θ</strong>. Both live between −1 and 1.
      </p>
    </div>
  )
}
