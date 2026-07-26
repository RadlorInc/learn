'use client'
/**
 * SecantExplorer — the play-with-it-first sim for the Intro to Calculus chapter
 * (17–18, "Pace"). Slide the second point Q toward the fixed point P and watch the
 * secant slope close in on the tangent slope: the value it approaches is the
 * derivative.
 *
 * Extracted verbatim (behaviour unchanged) from the old IntroCalculusChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there — and
 * was very nearly deleted with it, which is why the plan's §6 says extract BEFORE
 * you delete.
 */
import { useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'

// Both lifted from the deleted IntroCalculusTeenLesson, which owned them.
// ── SecantTangent: a lightweight inline secant→tangent visual (SVG) ─────────
// Plots y = x² with a fixed point P; a driver `t` (0→1) slides Q toward P, and
// the secant line PQ rotates toward the tangent. Used by the Explore sim (live,
// slider-driven) and by CalcWatch (auto-animated for the re-teach).
function SecantTangent({ t, px = 2 }: { t: number; px?: number }) {
  // World window.
  const XLO = -1, XHI = 4, YLO = -1, YHI = 10
  const VW = 320, VH = 300, pad = 26
  const plotW = VW - pad * 2, plotH = VH - pad * 2
  const sx = (x: number) => pad + ((x - XLO) / (XHI - XLO)) * plotW
  const sy = (y: number) => pad + (1 - (y - YLO) / (YHI - YLO)) * plotH
  const f = (x: number) => x * x

  // Q slides from an offset toward P as t: 0 → 1.
  const h = 1.6 * (1 - t) + 0.001
  const qx = px + h
  const py = f(px), qy = f(qx)
  const secSlope = (qy - py) / (qx - px)     // → 2·px as h → 0
  const tanSlope = 2 * px

  // Sampled parabola polyline.
  const pts: string[] = []
  for (let i = 0; i <= 80; i++) {
    const x = XLO + (i / 80) * (XHI - XLO)
    pts.push(`${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`)
  }

  // Extend the secant across the window for a clean line.
  const lineAt = (x: number) => py + secSlope * (x - px)

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block', maxWidth: VW, fontFamily: 'var(--font-numeric)' }} role="img" aria-label="Secant line approaching the tangent on a parabola">
      {/* axes */}
      <line x1={pad} y1={sy(0)} x2={VW - pad} y2={sy(0)} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <line x1={sx(0)} y1={pad} x2={sx(0)} y2={VH - pad} stroke="var(--ink-soft)" strokeWidth={1.5} />
      {/* parabola */}
      <polyline points={pts.join(' ')} fill="none" stroke="var(--ink-soft)" strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
      {/* tangent at P (faint reference) */}
      <line x1={sx(XLO)} y1={sy(py + tanSlope * (XLO - px))} x2={sx(XHI)} y2={sy(py + tanSlope * (XHI - px))} stroke="var(--garden-green)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
      {/* secant PQ */}
      <line x1={sx(XLO)} y1={sy(lineAt(XLO))} x2={sx(XHI)} y2={sy(lineAt(XHI))} stroke="var(--accent)" strokeWidth={2} />
      {/* P and Q */}
      <circle cx={sx(px)} cy={sy(py)} r={5} fill="var(--accent)" stroke="var(--paper)" strokeWidth={1.5} />
      <text x={sx(px) - 8} y={sy(py) + 16} textAnchor="end" fontSize={12} fontWeight={700} fill="var(--accent)">P</text>
      <circle cx={sx(qx)} cy={sy(qy)} r={5} fill="var(--note-amber)" stroke="var(--paper)" strokeWidth={1.5} />
      <text x={sx(qx) + 8} y={sy(qy) - 6} textAnchor="start" fontSize={12} fontWeight={700} fill="var(--note-amber)">Q</text>
    </svg>
  )
}

/** Exported so the Explore step can drive it with a live slider. */

// Helper the Explore step uses to display the closing slope numbers.
function secantSlopeInfo(t: number, px = 2) {
  const h = 1.6 * (1 - t) + 0.001
  const secSlope = (h + 2 * px)       // (f(px+h)-f(px))/h = 2px + h
  return { h, secSlope, tanSlope: 2 * px }
}

export default function SecantExplorer({ band }: { band: AgeBand }) {
  const [t, setT] = useState(0)
  const { h, secSlope, tanSlope } = secantSlopeInfo(t)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 340 }}>
      <SecantTangent t={t} />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={t}
        onChange={(e) => setT(Number(e.target.value))}
        aria-label="Slide Q toward P"
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          gap h = <span style={{ color: 'var(--note-amber)', fontWeight: 700 }}>{h.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--ink)' }}>
          secant slope = <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{secSlope.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--garden-green)', fontWeight: 700 }}>
          tangent slope (derivative) = {tanSlope}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, textAlign: 'center', color: 'var(--ink-muted)', maxWidth: 300 }}>
        Slide Q toward P. As the gap h shrinks to zero, the secant slope closes in on the tangent slope — that limit is the derivative.
      </p>
    </div>
  )
}
