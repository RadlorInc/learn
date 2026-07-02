'use client'
/**
 * TintedSprite — colour a GREYSCALE sprite (the `pat_*` pattern set: beads, buttons, gems,
 * flags, lanterns, toy duck/car/block) so it doesn't render grey. Technique (same as the
 * pattern/colour chapters): a solid-colour layer masked to the sprite's silhouette, with the
 * greyscale PNG multiplied on top so its shading/highlights are preserved — a natural, evenly
 * lit coloured object. Falls back to the emoji only if the PNG 404s.
 */
import React, { useState } from 'react'

export function TintedSprite({ src, size, hex, emoji }: { src: string; size: string; hex: string; emoji?: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji ?? '⬤'}</span>
  const mask: React.CSSProperties = {
    WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`,
    WebkitMaskSize: 'contain', maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center', maskPosition: 'center',
  }
  return (
    <div style={{ width: size, height: size, position: 'relative', isolation: 'isolate', display: 'block' }}>
      <div style={{ position: 'absolute', inset: 0, background: hex, ...mask }} />
      <img src={src} alt="" draggable={false} onError={() => setMissing(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
    </div>
  )
}
