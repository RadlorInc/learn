'use client'
/**
 * "Turn your phone sideways" — the 3–5 chapters are built landscape-first: the scenes are painted
 * wide, and a journey across the screen (a family walking into line, a bird crossing to a nest)
 * has nowhere to go in a portrait column.
 *
 * Chapter 1 has had this gate since the counting parade shipped; it was simply never carried over
 * to the chapters written after it, so on a phone held upright they laid out into a squeeze rather
 * than asking to be turned. Shared here so the next chapter gets it by importing one thing.
 *
 * The width test matters as much as the orientation one: a tablet in portrait is 768–1024 wide and
 * has plenty of room, so it is NOT sent away — only genuinely narrow, upright screens are.
 */
import React from 'react'
import { useViewport } from '@/shared/hooks/useViewport'

/**
 * ⚠️ THIS IS DERIVED, NOT STORED IN AN EFFECT, AND THAT IS A BUG FIX RATHER THAN TIDYING.
 * Held in `useState(false)` and corrected by an effect, the hook reported "no rotate needed" for
 * ONE FRAME on every mount — so a portrait phone painted the chapter squeezed before being told to
 * turn. That frame is the one the C7 gate tripped over: 21 chapters passed against the dev server
 * (which caught the pre-effect frame) and failed against production (which caught the settled one),
 * and the fix at the time was to make the gate wait rather than to remove the instant.
 * `useViewport`'s lazy initializer reads the real viewport during the first CLIENT render, so there
 * is no longer an instant at which this can be wrong. It is also rAF-throttled with an
 * unchanged-size guard, which the two hand-rolled listeners were not.
 */
export function useNeedsRotate(): boolean {
  const { w, h } = useViewport()
  return h > w && w < 820
}

/** Matches chapter 1's wording and look, so a child moving between chapters sees the same screen. */
export function RotateGate({ line }: { line: string }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18, background: 'linear-gradient(180deg,#bfe6f7,#d6efc0)', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64, animation: 'rg_pop .6s ease both' }}>🔄</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: 'var(--ink)' }}>Turn your phone sideways</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-soft)' }}>{line}</div>
      <style>{'@keyframes rg_pop { 0%{transform:scale(.6);opacity:0} 100%{transform:scale(1);opacity:1} }'}</style>
    </div>
  )
}
