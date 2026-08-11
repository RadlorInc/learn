'use client'
/**
 * SignedJumpExplorer — an interactive concept "simulation" for the Field Lab (teen).
 *
 * The learner sets a (start) and b (jump) with two sliders and watches a number
 * line: a marker at the start, an arrow jumping right (for +b) or left (for −b),
 * and the landing point at a + b. The sum equation and a plain-language sentence
 * about the direction of the jump update live (PhET / Desmos style).
 * Slider-driven (not free-drag) so it's touch-friendly, accessible, and testable.
 * Mature Field Lab look — an instrument, not a cartoon. Reads theme from the
 * ancestor data-band scope; colors/fonts via CSS variables only.
 */
import { useEffect, useRef, useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import NumberLine from '@/features/chapters/teen/NumberLine'
import SimLayout, { Slider } from '@/features/chapters/teen/sims/SimLayout'
import { disp } from '@/core/fmt'

export interface SignedJumpExplorerProps {
  band: AgeBand
  /** Called once on mount so a host (lesson/explore step) can unlock "Continue". */
  onReady?: () => void
}

// Number-line domain (the drawn axis + the arrow's coordinate space).
const MIN = -9
const MAX = 9
// Per-slider ranges chosen so the worst-case sum (a + b) always lands inside
// [MIN, MAX] — the marker, arrow, and equation stay on-line at every extreme.
const A_MIN = -4
const A_MAX = 4
const B_MIN = -5
const B_MAX = 5


/** "a + b" or "a − |b|" so the expression reads like a sum. */
function expr(a: number, b: number): string {
  return `${disp(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`
}

/**
 * The jump arrow — an inline SVG strip whose x-scale matches the NumberLine
 * below it (same MIN..MAX domain, same horizontal padding), so the arrow lands
 * exactly above the start/end ticks.
 */
function JumpArrow({ a, b }: { a: number; b: number }) {
  const VW = 720
  const VH = 44
  const padX = 36
  const xOf = (n: number) => padX + ((n - MIN) / (MAX - MIN)) * (VW - 2 * padX)
  const x0 = xOf(a)
  const x1 = xOf(a + b)
  const baseY = VH - 6
  const arcTop = 8
  const right = b > 0
  const flat = b === 0
  // A shallow arc from start to landing, apex midway.
  const xMid = (x0 + x1) / 2
  const d = `M ${x0} ${baseY} Q ${xMid} ${arcTop} ${x1} ${baseY}`
  const head = 7
  // Arrowhead orientation follows the travel direction.
  const tip = flat
    ? null
    : right
      ? `${x1} ${baseY} ${x1 - head} ${baseY - head} ${x1 - head} ${baseY + head}`
      : `${x1} ${baseY} ${x1 + head} ${baseY - head} ${x1 + head} ${baseY + head}`

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" role="img" aria-label="jump arrow" style={{ display: 'block' }}>
      {flat ? (
        <circle cx={x0} cy={baseY} r={4} fill="var(--ink-muted)" />
      ) : (
        <>
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" />
          {tip && <polygon points={tip} fill="var(--accent)" />}
        </>
      )}
    </svg>
  )
}

export default function SignedJumpExplorer({ band, onReady }: SignedJumpExplorerProps) {
  const [a, setA] = useState(3)
  const [b, setB] = useState(-5)
  const readyRef = useRef(onReady)
  readyRef.current = onReady
  useEffect(() => { readyRef.current?.() }, [])

  const sum = a + b
  const dir = b === 0
    ? 'no jump — you stay put'
    : `jump ${Math.abs(b)} ${b > 0 ? 'right' : 'left'} (because ${b > 0 ? 'adding a positive' : 'adding a negative'})`

  // Keep marked points clean even when start and landing coincide.
  const marked = a === sum ? [a] : [a, sum]

  return (
    <SimLayout maxWidth={420} gap={16} align="center" visual={<>
      <div style={{ width: '100%' }}>
        <JumpArrow a={a} b={b} />
        <NumberLine band={band} min={MIN} max={MAX} mode="read" marked={marked} />
      </div>
    </>}>

      {/* Live sum readout */}
      <div style={{
        fontFamily: 'var(--font-numeric)', fontSize: 26, fontWeight: 600, color: 'var(--accent)',
        letterSpacing: '0.01em', minHeight: 34,
      }}>
        {expr(a, b)} = {disp(sum)}
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
        <Slider labelW={96} label="start (a)" value={a} min={A_MIN} max={A_MAX} onChange={setA} />
        <Slider labelW={96} label="jump (b)" value={b} min={B_MIN} max={B_MAX} onChange={setB} />
      </div>

      {/* Plain-language read-out of what changed */}
      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        Start at <strong style={{ color: 'var(--ink)' }}>{disp(a)}</strong>, then {dir}.<br />
        You land on <strong style={{ color: 'var(--ink)' }}>{disp(sum)}</strong>.
      </p>
    </SimLayout>
  )
}
