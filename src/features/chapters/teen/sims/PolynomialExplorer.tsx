'use client'
/**
 * PolynomialExplorer — the play-with-it-first sim for the Polynomial Functions
 * chapter (17–18, "Cold Snap"). Flip the leading sign and switch between odd and
 * even degree; the ends of the curve swing to match.
 *
 * Extracted verbatim (behaviour unchanged) from the old PolynomialFunctionsChapter
 * wrapper when that chapter moved onto GameShell. It was defined inline there, so
 * it would have been deleted with the wrapper.
 */
import { useState } from 'react'
import type { AgeBand } from '@/features/chapters/teen/types'
import CoordGrid from '@/features/chapters/teen/CoordGrid'
import SimLayout from '@/features/chapters/teen/sims/SimLayout'

export default function PolynomialExplorer({ band }: { band: AgeBand }) {
  const [sign, setSign] = useState(1)   // +1 or −1 leading coefficient
  const [even, setEven] = useState(false) // quartic (even) vs cubic (odd)
  const fn = even
    ? (x: number) => sign * (x * x * x * x - 4 * x * x)
    : (x: number) => sign * (x * x * x - 3 * x)
  const ends = even
    ? sign > 0 ? 'Up on both ends' : 'Down on both ends'
    : sign > 0 ? 'Down-left, up-right' : 'Up-left, down-right'
  return (
    <SimLayout maxWidth={340} gap={14} align="center" visual={<>
      <CoordGrid
        band={band}
        xRange={[-3, 3]}
        yRange={[-9, 9]}
        mode="read"
        curves={[{ kind: 'curve', fn }]}
      />
    </>}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
        {sign > 0 ? '' : '−'}x{even ? '⁴' : '³'} · degree {even ? 4 : 3} · {ends}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <button
          type="button"
          onClick={() => setSign((s) => -s)}
          style={{ flex: 1, minWidth: 130, padding: '10px 14px', borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--outline)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          Flip leading sign
        </button>
        <button
          type="button"
          onClick={() => setEven((e) => !e)}
          style={{ flex: 1, minWidth: 130, padding: '10px 14px', borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--outline)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          {even ? 'Try odd degree' : 'Try even degree'}
        </button>
      </div>
    </SimLayout>
  )
}
