'use client'
/**
 * ComplexPlaneExplorer — the play-with-it-first sim for the Complex Numbers
 * chapter (17–18, "The Walk Home"). Slide the real and imaginary parts; the point
 * moves on the complex plane and its modulus — the straight-line distance from the
 * origin — updates with it.
 *
 * Extracted verbatim (behaviour unchanged) from the old ComplexNumbersChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there, so
 * it would have been deleted with the wrapper. `fmtInt` came from the lesson file
 * that went with it and is now local.
 *
 * Slider-driven, not free-drag: touch-friendly, accessible and deterministic.
 * Theme comes from the ancestor data-band scope; colours/fonts via CSS vars only.
 */
import { useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import CoordGrid from '@/features/chapters/teen/CoordGrid'

/** Pretty integer: a real minus sign for negatives. */
const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))

function Slider({ text, value, onChange }: { text: string; value: number; onChange: (n: number) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', fontFamily: 'var(--font-body)' }}>
      <span style={{ width: 92, fontSize: 14, color: 'var(--ink-soft)' }}>{text}</span>
      <input
        type="range" min={-6} max={6} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
        aria-label={text}
      />
      <span style={{ width: 40, textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
        {fmtInt(value)}
      </span>
    </label>
  )
}

export default function ComplexPlaneExplorer({ band }: { band: AgeBand }) {
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)
  const mod = Math.round(Math.sqrt(a * a + b * b) * 100) / 100
  const clean = Number.isInteger(mod)
  const range = Math.max(Math.abs(a), Math.abs(b), 2) + 2
  const label = b === 0
    ? fmtInt(a)
    : a === 0
      ? `${b === 1 ? '' : b === -1 ? '−' : fmtInt(b)}i`
      : `${fmtInt(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? 'i' : `${Math.abs(b)}i`}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 420 }}>
      <div style={{ width: '100%', maxWidth: 320 }}>
        <CoordGrid band={band} xRange={[-range, range]} yRange={[-range, range]} mode="read" variant="complex" points={[{ x: a, y: b }]} highlight={{ x: a, y: b }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        <Slider text="real (a)" value={a} onChange={setA} />
        <Slider text="imaginary (b)" value={b} onChange={setB} />
      </div>

      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
        The point <strong style={{ color: 'var(--ink)', fontFamily: 'var(--font-numeric)' }}>{label}</strong> sits at <strong style={{ color: 'var(--ink)', fontFamily: 'var(--font-numeric)' }}>({fmtInt(a)}, {fmtInt(b)})</strong> on the plane.<br />
        Its <strong style={{ color: 'var(--ink)' }}>modulus</strong> is <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-numeric)' }}>√({a * a} + {b * b}) = {clean ? mod : `√${a * a + b * b} ≈ ${mod}`}</strong> — its distance from the origin.
      </p>
    </div>
  )
}
