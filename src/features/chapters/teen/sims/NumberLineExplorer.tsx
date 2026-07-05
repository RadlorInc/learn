'use client'
/**
 * NumberLineExplorer — an interactive concept "simulation" for the Field Lab (teen).
 *
 * Scenario skin: TEMPERATURE ABOVE / BELOW FREEZING. The learner drags ONE slider
 * to set a temperature on a thermometer (−10..10 °C) and watches, on the number
 * line below, its distance from zero (how many degrees from freezing — the
 * absolute value) and its opposite (−v) update live. The thermometer is the real
 * hook; the number line underneath is the concept it stands for (the same line
 * measures a diver's depth or a bank balance). Slider-driven so it's touch-friendly,
 * accessible, and testable. Mature Field Lab look — an instrument, not a cartoon.
 */
import { useEffect, useRef, useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import NumberLine from '@/features/chapters/teen/NumberLine'

export interface NumberLineExplorerProps {
  band: AgeBand
  /** Called once on mount so a host (lesson/explore step) can unlock "Continue". */
  onReady?: () => void
}

const RANGE = 10 // line spans -10..10

// Format an integer with a true minus glyph for negatives.
function fmt(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : String(n)
}

// A compact vertical thermometer whose mercury fills to `v` on a −10..10 scale.
function Thermometer({ v }: { v: number }) {
  // SVG: tube from y=14 (top, +10) to y=150 (bottom, −10); bulb below.
  const TOP = 14
  const BOT = 150
  const yFor = (t: number) => BOT - ((t + RANGE) / (2 * RANGE)) * (BOT - TOP)
  const zeroY = yFor(0)
  const vY = yFor(v)
  const warm = v >= 0
  const fillColor = warm ? '#e0483f' : '#3d7fd6'
  // Mercury column runs from the bulb up to the current reading.
  const colTop = Math.min(vY, BOT)
  return (
    <svg viewBox="0 0 120 176" style={{ width: 108, height: 158, flex: '0 0 auto' }} role="img" aria-label={`Thermometer reading ${fmt(v)} degrees`}>
      {/* tube outline */}
      <rect x={46} y={TOP - 4} width={16} height={BOT - TOP + 8} rx={8} fill="var(--bg-2)" stroke="var(--outline)" strokeWidth={1.5} />
      {/* mercury column */}
      <rect x={49} y={colTop} width={10} height={BOT - colTop + 2} fill={fillColor} style={{ transition: 'y 120ms ease-out, height 120ms ease-out' }} />
      {/* bulb */}
      <circle cx={54} cy={160} r={13} fill={fillColor} stroke="var(--outline)" strokeWidth={1.5} />
      {/* scale ticks + labels at 10, 0, -10 */}
      {[10, 0, -10].map((t) => (
        <g key={t}>
          <line x1={64} y1={yFor(t)} x2={72} y2={yFor(t)} stroke="var(--outline)" strokeWidth={1} />
          <text x={76} y={yFor(t) + 4} fontFamily="var(--font-numeric)" fontSize={11} fill="var(--ink-muted)">{fmt(t)}°</text>
        </g>
      ))}
      {/* freezing line */}
      <line x1={30} y1={zeroY} x2={64} y2={zeroY} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="2 2" />
      <text x={2} y={zeroY - 3} fontFamily="var(--font-body)" fontSize={8.5} fill="var(--ink-muted)">freezing</text>
      {/* current reading pointer */}
      <text x={2} y={vY + 4} fontFamily="var(--font-numeric)" fontWeight={700} fontSize={13} fill={fillColor}>{fmt(v)}°</text>
    </svg>
  )
}

function Slider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (n: number) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', fontFamily: 'var(--font-body)' }}>
      <span style={{ width: 88, fontSize: 14, color: 'var(--ink-soft)' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
        aria-label={label}
      />
      <span style={{ width: 44, textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
        {fmt(value)}°
      </span>
    </label>
  )
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 108 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 24, fontWeight: 600, color: 'var(--accent)' }}>{value}</span>
    </div>
  )
}

export default function NumberLineExplorer({ band, onReady }: NumberLineExplorerProps) {
  const [v, setV] = useState(6)
  const readyRef = useRef(onReady)
  readyRef.current = onReady
  useEffect(() => { readyRef.current?.() }, [])

  const opp = -v
  const dist = Math.abs(v)
  // Both the point and its opposite are drawn (0 marked when v is 0).
  const marked = v === 0 ? [0] : [v, opp]

  const distText = v === 0
    ? 'is right at freezing, so it is 0 degrees from zero'
    : `is ${dist} ${dist === 1 ? 'degree' : 'degrees'} ${v < 0 ? 'below' : 'above'} freezing — that distance from 0 is its absolute value`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 440 }}>
      {/* Thermometer (scenario) + readouts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, width: '100%', flexWrap: 'wrap' }}>
        <Thermometer v={v} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Readout label="temperature" value={`${fmt(v)}°`} />
          <Readout label="degrees from 0" value={String(dist)} />
          <Readout label="opposite  −v" value={`${fmt(opp)}°`} />
        </div>
      </div>

      {/* The number line the thermometer stands for */}
      <div style={{ width: '100%' }}>
        <NumberLine band={band} min={-RANGE} max={RANGE} mode="read" marked={marked} />
      </div>

      {/* Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
        <Slider label="temperature" value={v} min={-RANGE} max={RANGE} onChange={setV} />
      </div>

      {/* Plain-language read-out of what's shown */}
      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        <strong style={{ color: 'var(--ink)' }}>{fmt(v)}°</strong> {distText}.<br />
        Its <strong style={{ color: 'var(--ink)' }}>opposite</strong> is <strong style={{ color: 'var(--ink)' }}>{fmt(opp)}°</strong> — the same distance from freezing, on the other side.
      </p>
    </div>
  )
}
