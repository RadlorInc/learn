'use client'
/**
 * Answer feedback and the set's dots on the practice screens (Review 1 Q1 + Q2, founder 2026-09-24). Shared by a topic's
 * practice and a module's mixed practice. Every line lives in sessionCopy.ts, so childWords.test.ts reads it.
 */
import type { ReactNode } from 'react'
import { INK, GOOD } from './Pictures'
import { idea, right, tick } from './Frame'
import { C } from './sessionCopy'
import { CHECKPOINT } from './adaptive'

/**
 * Where the child is in the current set of five (Review 1, founder 2026-09-24): five dots that fill, reset at each
 * checkpoint. Never a count of a total, never a percentage. Filled vs hollow is the signal, not colour alone.
 */
export function SetDots({ n }: { n: number }) {
  return (
    <span role="img" aria-label={C.setDots(n)} data-testid="set-dots" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      {Array.from({ length: CHECKPOINT }, (_, i) => (
        <span key={i} data-filled={i < n || undefined} style={{ width: 20, height: 20, borderRadius: '50%', border: `3px solid ${INK}`,
          background: i < n ? GOOD : '#fff', transition: 'background .3s' }} />
      ))}
    </span>
  )
}

/** A right answer: green, a ✓ and a short cheer. `k` picks the cheer, so it changes from one problem to the next. */
export const Cheer = ({ k }: { k: number }) =>
  <p role="status" style={right}><span style={tick} aria-hidden>✓</span>{C.cheers[k % C.cheers.length]}</p>

/** Not right yet: warm yellow, never red, with a ↻ and words — never colour alone. The big idea, as before, under it. */
export const TryAgain = ({ children }: { children: ReactNode }) => (
  <div role="status" style={{ ...idea, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <span aria-hidden style={{ ...tick, background: '#fff', color: INK }}>↻</span>{C.tryAgain}
    </span>
    <span style={{ fontWeight: 700 }}>{children}</span>
  </div>
)
