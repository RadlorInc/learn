'use client'
import { useEffect, useState } from 'react'

/** Viewport size, rAF-throttled, with an unchanged-dimension guard so a height-only or
 *  duplicate resize event does not allocate a new object or trigger a re-render. */
export function useViewport(): { w: number; h: number } {
  // Lazy initializer reads the real viewport on the first client render (these are client-only
  // components), so there's no first-paint-at-zero flash before the effect runs. Falls back to a
  // sensible size during SSR/prerender where `window` is absent.
  const [vp, setVp] = useState(() =>
    typeof window === 'undefined'
      ? { w: 1000, h: 700 }
      : { w: window.innerWidth, h: window.innerHeight },
  )
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const w = window.innerWidth, h = window.innerHeight
      setVp(prev => (prev.w === w && prev.h === h ? prev : { w, h }))
    }
    const onResize = () => { if (!raf) raf = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', onResize) }
  }, [])
  return vp
}
