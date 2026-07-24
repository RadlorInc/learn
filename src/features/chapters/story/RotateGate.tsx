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
import React, { useState, useEffect } from 'react'

export function useNeedsRotate(): boolean {
  const [need, setNeed] = useState(false)
  useEffect(() => {
    const check = () => setNeed(window.innerHeight > window.innerWidth && window.innerWidth < 820)
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => { window.removeEventListener('resize', check); window.removeEventListener('orientationchange', check) }
  }, [])
  return need
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
