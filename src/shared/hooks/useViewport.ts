'use client'
import { useEffect, useState } from 'react'

/** The size assumed when the real one is not knowable — landscape, matching what SSR renders at. */
export const FALLBACK = { w: 1000, h: 700 } as const

/**
 * ⚠️ A ZERO IS NOT A MEASUREMENT, AND `window.innerWidth` REALLY DOES READ 0 — in a frame that has
 * not been laid out yet: a backgrounded tab, a hidden iframe, the first tick of a headless drive.
 * Measured live on this repo's own preview pane. Passed through raw it becomes a real size to all
 * 29 consumers, and every aspect test built on it silently flips — `w / h >= 1.25` becomes
 * `0 >= 1.25`, so a landscape laptop draws its PORTRAIT layout until something corrects it. Same
 * class as the ResizeObserver freeze chapter-craft records for `FitSlot`.
 *
 * Returns null rather than a default so the caller can decide: the initializer substitutes
 * FALLBACK, the effect keeps whatever real size it already had.
 */
export function safeSize(w: number, h: number): { w: number; h: number } | null {
  return w > 0 && h > 0 ? { w, h } : null
}

/** Viewport size, rAF-throttled, with an unchanged-dimension guard so a height-only or
 *  duplicate resize event does not allocate a new object or trigger a re-render. */
export function useViewport(): { w: number; h: number } {
  // Lazy initializer reads the real viewport on the first client render (these are client-only
  // components), so there's no first-paint-at-zero flash before the effect runs. Falls back to a
  // sensible size during SSR/prerender where `window` is absent.
  const [vp, setVp] = useState(() =>
    typeof window === 'undefined' ? FALLBACK : safeSize(window.innerWidth, window.innerHeight) ?? FALLBACK,
  )
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const next = safeSize(window.innerWidth, window.innerHeight)
      if (!next) return                       // not laid out — keep the last real size
      setVp(prev => (prev.w === next.w && prev.h === next.h ? prev : next))
    }
    const onResize = () => { if (!raf) raf = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', onResize) }
  }, [])
  return vp
}
