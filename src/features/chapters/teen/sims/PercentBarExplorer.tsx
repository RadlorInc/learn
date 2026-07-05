'use client'
/**
 * PercentBarExplorer — an interactive concept "simulation" for the Field Lab (teen).
 *
 * Scenario skin: THE SALE TAG. The learner drags a "% OFF" slider (0..100) and a
 * price slider ($10..$200) and watches a price tag update live — original price,
 * the amount saved (the shaded share), and what you actually pay. Same underlying
 * idea as "p% of a total"; the sale framing is what makes it click (and the same
 * math powers a tip or a tax — noted below the tag). Slider-driven so it's
 * touch-friendly, accessible, and testable. Mature Field Lab look — an instrument,
 * not a cartoon. Reads theme from the ancestor data-band scope; CSS-variable colors.
 */
import { useEffect, useRef, useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'

export interface PercentBarExplorerProps {
  band: AgeBand
  /** Called once on mount so a host (lesson/explore step) can unlock "Continue". */
  onReady?: () => void
}

const tidy = (n: number) => Math.round(n * 100) / 100
const money = (n: number) => `$${tidy(n).toFixed(tidy(n) % 1 === 0 ? 0 : 2)}`

function Slider({ label, value, min, max, step, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (n: number) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', fontFamily: 'var(--font-body)' }}>
      <span style={{ width: 64, fontSize: 14, color: 'var(--ink-soft)' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
        aria-label={label}
      />
      <span style={{ width: 56, textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
        {value}{suffix ?? ''}
      </span>
    </label>
  )
}

export default function PercentBarExplorer({ band, onReady }: PercentBarExplorerProps) {
  const [percent, setPercent] = useState(25)
  const [price, setPrice] = useState(80)
  const readyRef = useRef(onReady)
  readyRef.current = onReady
  useEffect(() => { readyRef.current?.() }, [])

  const saved = tidy((percent / 100) * price)
  const pay = tidy(price - saved)

  // Bar geometry (inline SVG): a track from x=8..292 (width 284), height 34.
  const TRACK_X = 8
  const TRACK_W = 284
  const saveW = (percent / 100) * TRACK_W
  const payW = TRACK_W - saveW
  void band

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 380 }}>
      {/* The price tag */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 320,
        background: 'var(--paper)', border: '1px solid var(--outline)', borderRadius: 12,
        padding: '14px 16px 16px', boxSizing: 'border-box',
      }}>
        {/* tag header: was → now */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 18, color: 'var(--ink-muted)', textDecoration: 'line-through' }}>{money(price)}</span>
          <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 30, fontWeight: 700, color: 'var(--accent)' }}>{money(pay)}</span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--fg-on-color)',
            background: 'var(--accent)', borderRadius: 6, padding: '2px 7px',
          }}>−{percent}%</span>
        </div>

        {/* the price bar: saved (accent) + pay (track) */}
        <svg viewBox="0 0 300 44" style={{ width: '100%' }} role="img" aria-label={`${percent} percent off ${money(price)}`}>
          <rect x={TRACK_X} y={8} width={TRACK_W} height={28} rx={7} fill="var(--bg-2)" stroke="var(--outline)" strokeWidth={1} />
          <rect x={TRACK_X} y={8} width={saveW} height={28} rx={7} fill="var(--accent)" style={{ transition: 'width 120ms ease-out' }} />
          {/* pay label sits on the unshaded remainder when there's room */}
          {payW > 60 && (
            <text x={TRACK_X + saveW + payW / 2} y={26} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={13} fontWeight={600} fill="var(--ink-soft)">
              pay {money(pay)}
            </text>
          )}
          {saveW > 60 && (
            <text x={TRACK_X + saveW / 2} y={26} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={13} fontWeight={700} fill="var(--fg-on-color)">
              save {money(saved)}
            </text>
          )}
        </svg>
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
        <Slider label="% off" value={percent} min={0} max={100} step={5} suffix="%" onChange={setPercent} />
        <Slider label="price" value={price} min={10} max={200} step={10} suffix="$" onChange={setPrice} />
      </div>

      {/* Plain-language read-out of what's happening */}
      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        <strong style={{ color: 'var(--ink)' }}>{percent}% off</strong> means you save {percent} out of every 100 —{' '}
        <strong style={{ color: 'var(--ink)' }}>{money(saved)}</strong> off {money(price)}, so you pay{' '}
        <strong style={{ color: 'var(--ink)' }}>{money(pay)}</strong>. The same move finds a tip or a tax — just add it on instead.
      </p>
    </div>
  )
}
