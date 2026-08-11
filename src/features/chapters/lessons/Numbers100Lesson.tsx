'use client'
/**
 * TensOnes — a two-digit number drawn as ten-rods + loose ones, with each part
 * revealable independently so a demo can build it up. Shared by NumberTown and
 * BlockYard; it is all that survives of the pre-story-rebuild Numbers-to-100 lesson.
 */
import React from 'react'

// ─── A two-digit number drawn as ten-rods + ones ─────────────
export function TensOnes({ n, revealTens, revealOnes }: { n: number; revealTens: number; revealOnes: number }) {
  const t = Math.floor(n / 10), o = n % 10
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, justifyContent: 'center', minHeight: 96 }}>
      {/* ten-rods */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: t }).map((_, i) => (
          <div key={i} style={{
            width: 26, height: 84, borderRadius: 7, border: '3px solid var(--sky-blue-deep)',
            background: 'var(--sky-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 13,
            opacity: i < revealTens ? 1 : 0.12,
            transform: i < revealTens ? 'scale(1)' : 'scale(0.7)',
            transition: 'all 0.35s cubic-bezier(.34,1.56,.64,1)',
          }}>10</div>
        ))}
      </div>
      {t > 0 && o > 0 && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, color: 'var(--milo-orange)', paddingBottom: 28 }}>+</div>}
      {/* ones */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 120, alignContent: 'flex-end' }}>
        {Array.from({ length: o }).map((_, i) => (
          <div key={i} style={{
            width: 22, height: 22, borderRadius: '50%', border: '3px solid var(--garden-green-deep)',
            background: 'var(--garden-green)',
            opacity: i < revealOnes ? 1 : 0.12,
            transform: i < revealOnes ? 'scale(1)' : 'scale(0.6)',
            transition: 'all 0.3s cubic-bezier(.34,1.56,.64,1)',
          }} />
        ))}
      </div>
    </div>
  )
}
