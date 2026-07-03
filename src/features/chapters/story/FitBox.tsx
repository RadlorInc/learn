'use client'
/**
 * FitBox — render children at their natural (base) size, then uniformly scale them to fill a given
 * available box. Solves the "fixed-px canvas looks fine in a small preview but tiny in a big Chrome
 * window" problem: the content is measured with offsetWidth/offsetHeight (layout size, unaffected by
 * the CSS transform) and scaled by `min(availW/natW, availH/natH, max)` so it's always as big as it
 * can be on ANY viewport without overflowing the reserved zone.
 *
 * Flow-safe: the OUTER wrapper takes the *scaled* dimensions as its real layout box, so when a FitBox
 * has flow siblings (e.g. answer buttons stacked below it in a column) they are pushed by the visible
 * size, not the small natural size — no overlap. Centres its content, so a flex-centred FitBox stays
 * centred at any scale.
 *
 * Usage: give it the width/height of the band the canvas may occupy (viewport minus the top banner
 * and the bottom answer buttons); pass the card as children.
 */
import { useLayoutEffect, useEffect, useRef, useState } from 'react'

const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function FitBox({ availW, availH, max = 3, min = 0.2, children }: {
  availW: number; availH: number; max?: number; min?: number; children: React.ReactNode
}) {
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  useIso(() => {
    const el = inner.current
    if (!el) return
    const measure = () => {
      const nw = el.offsetWidth, nh = el.offsetHeight
      if (!nw || !nh || availW <= 0 || availH <= 0) return
      const s = Math.max(min, Math.min(availW / nw, availH / nh, max))
      setScale(s)
      setDims({ w: nw * s, h: nh * s })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [availW, availH, max, min])
  return (
    <div style={{ width: dims.w || undefined, height: dims.h || undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {/* No permanent `will-change: transform`: the scale is applied once on measure and rarely
          changes, so holding a dedicated compositor layer for every FitBox on screen just costs
          GPU memory on low-end devices. The one-off repaint on a scale change is cheap. */}
      <div ref={inner} style={{ flex: 'none', transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        {children}
      </div>
    </div>
  )
}
