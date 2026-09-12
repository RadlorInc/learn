'use client'
/**
 * Pre-teen "Mission HUD" design kit (ages 9–11) — a bold, vivid game/mission look: a deep-navy space
 * backdrop with a faint grid + starfield, neon accents that glow, dark-glass panels, monospace
 * numerals, and Milo as an explorer. Deliberately more grown-up and energetic than the 3–8 storybook
 * worlds, and more playful/vivid than the muted teen "Field Lab" dark theme. Code-drawn backdrops
 * (no photographic scenes → the background-reuse rule is moot). Shared by the 9–11 chapters that opt
 * into the pre-teen look.
 */
import React, { useState } from 'react'

export const PT = {
  bg0: '#0a1026', bg1: '#111a3c',
  panel: 'rgba(21,31,64,0.72)', panelSolid: '#141d3e', panelSoft: 'rgba(120,150,220,0.12)',
  ink: '#eaf1ff', inkSoft: '#a9b8d6', inkMute: '#6f80a6',
  line: 'rgba(120,150,220,0.30)', lineStrong: 'rgba(150,180,240,0.55)',
  ok: '#2ee6a6', okDeep: '#12b384', warn: '#ff5d7a', warnDeep: '#e03a5c',
  /**
   * ⚠️ THE FAMILY COMES FROM THE VARIABLE, NOT ITS NAME. The fonts are self-hosted by
   * `next/font/google`, which generates a hashed family (`__IBM_Plex_Sans_<hash>`) — so a literal
   * `'IBM Plex Sans'` here matches nothing and falls back to a system font, silently, on the one
   * band whose whole look is the mono numerals. The system stack stays as the fallback.
   */
  mono: "var(--f-plex-mono),ui-monospace,'SF Mono',Menlo,monospace",
  sans: "var(--f-plex-sans),system-ui,-apple-system,'Segoe UI',sans-serif",
}
export type Accent = { base: string; deep: string; soft: string }
export const ACCENTS: Record<string, Accent> = {
  teal: { base: '#22e0c8', deep: '#0fbfa8', soft: 'rgba(34,224,200,0.16)' },
  indigo: { base: '#6b7bff', deep: '#4a5bef', soft: 'rgba(107,123,255,0.18)' },
  magenta: { base: '#ff5cc8', deep: '#e23ba8', soft: 'rgba(255,92,200,0.16)' },
  lime: { base: '#9be21f', deep: '#78bc0f', soft: 'rgba(155,226,31,0.16)' },
  amber: { base: '#ffb020', deep: '#e0900c', soft: 'rgba(255,176,32,0.16)' },
  cyan: { base: '#25c2ff', deep: '#12a0e0', soft: 'rgba(37,194,255,0.16)' },
  violet: { base: '#a06bff', deep: '#7f47ef', soft: 'rgba(160,107,255,0.18)' },
  rose: { base: '#ff7a9c', deep: '#e85578', soft: 'rgba(255,122,156,0.16)' },
  gold: { base: '#ffce38', deep: '#e0aa10', soft: 'rgba(255,206,56,0.16)' },
  sky: { base: '#4a9dff', deep: '#2f7de0', soft: 'rgba(74,157,255,0.16)' },
  coral: { base: '#ff7a52', deep: '#e8562f', soft: 'rgba(255,122,82,0.16)' },
  orchid: { base: '#cf5cff', deep: '#ac3bef', soft: 'rgba(207,92,255,0.16)' },
}

/**
 * Card width. A hard px cap (`min(94vw, 520px)`) is a PHONE size that never grows, so on a laptop
 * the chapter renders at ~21% of the screen with 380px of dead navy either side and Milo/Continue
 * stranded in opposite corners. The teen band fixed this in July with a vw term; the fix never
 * reached this kit. `min(<vw guard>, clamp(<old cap>, <vw>, <max>))` keeps small frames BYTE-IDENTICAL
 * (the old cap is the clamp floor) and only lets a roomy frame use the room it has.
 */
export const CARD_W = 'min(92vw, clamp(460px, 42vw, 700px))'

export const PT_CSS = `@keyframes pt_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes pt_pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes pt_blink{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes pt_twinkle{0%,100%{opacity:.25}50%{opacity:.8}}`

// A handful of faint stars, deterministic (no Math.random at module scope for SSR stability).
const STARS = [[8, 18], [22, 9], [37, 26], [61, 12], [78, 22], [90, 8], [15, 44], [46, 6], [69, 38], [84, 48], [5, 62], [33, 55], [55, 30], [72, 60], [93, 34]]
export function LabBackdrop({ accent }: { accent: Accent }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: `radial-gradient(125% 90% at 50% -10%, ${PT.bg1}, ${PT.bg0} 70%)` }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${PT.line} 1px,transparent 1px),linear-gradient(90deg,${PT.line} 1px,transparent 1px)`, backgroundSize: '40px 40px', WebkitMaskImage: 'radial-gradient(120% 95% at 50% 26%, #000 45%, transparent 100%)', maskImage: 'radial-gradient(120% 95% at 50% 26%, #000 45%, transparent 100%)', opacity: 0.6 }} />
      {STARS.map(([x, y], i) => <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3, borderRadius: '50%', background: '#dce8ff', animation: `pt_twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite` }} />)}
      <div style={{ position: 'absolute', top: '-26%', left: '50%', transform: 'translateX(-50%)', width: '86vw', height: '60vh', borderRadius: '50%', background: accent.base, opacity: 0.22, filter: 'blur(90px)' }} />
    </div>
  )
}

export function BackChip({ onExit }: { onExit: () => void }) {
  return <button onClick={onExit} style={{ position: 'absolute', top: 'calc(14px + env(safe-area-inset-top))', left: 16, zIndex: 55, padding: '7px 15px', minHeight: 44, borderRadius: 10, background: PT.panel, border: `1px solid ${PT.line}`, color: PT.inkSoft, fontFamily: PT.sans, fontWeight: 600, fontSize: 13, letterSpacing: .3, cursor: 'pointer', backdropFilter: 'blur(6px)' }}>‹ Menu</button>
}

// Neon corner brackets (HUD flourish) around a panel.
export function Brackets({ color, gap = -6 }: { color: string; gap?: number }) {
  const s: React.CSSProperties = { position: 'absolute', width: 16, height: 16, borderColor: color, borderStyle: 'solid', borderWidth: 0 }
  return (<>
    <span aria-hidden style={{ ...s, top: gap, left: gap, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 5 }} />
    <span aria-hidden style={{ ...s, top: gap, right: gap, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 5 }} />
    <span aria-hidden style={{ ...s, bottom: gap, left: gap, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 5 }} />
    <span aria-hidden style={{ ...s, bottom: gap, right: gap, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 5 }} />
  </>)
}


// ─── Answer chip (mono) ────────────────────────────────────────────────────────────────
export type ChoiceState = 'idle' | 'right' | 'wrong' | 'dim'
export function ChoiceButton({ label, accent, state, size, onClick, disabled }: { label: string; accent: Accent; state: ChoiceState; size: number; onClick: () => void; disabled?: boolean }) {
  const isR = state === 'right', isW = state === 'wrong'
  const border = isR ? PT.ok : isW ? PT.warn : PT.lineStrong
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: size, height: size, padding: '0 16px', borderRadius: 15,
      background: isR ? PT.ok : PT.panel, backdropFilter: 'blur(6px)', border: `2px solid ${border}`,
      boxShadow: isR ? `0 0 22px ${PT.ok}, 0 0 0 4px ${PT.ok}33` : isW ? `0 0 16px ${PT.warn}88` : `0 0 12px ${accent.base}22, 0 6px 16px rgba(0,0,0,0.35)`,
      fontFamily: PT.mono, fontWeight: 700, fontSize: Math.round(size * (label.length > 3 ? 0.3 : 0.42)), color: isR ? '#04231a' : PT.ink, whiteSpace: 'nowrap',
      cursor: disabled ? 'default' : 'pointer', opacity: state === 'dim' ? 0.4 : 1,
      transform: isR ? 'translateY(-3px) scale(1.05)' : 'none', transition: 'all .16s cubic-bezier(.34,1.56,.64,1)',
    }}>{label}</button>
  )
}

// ─── Milo the explorer (bottom-left guide) ─────────────────────────────────────────────
export function PtMilo({ left = 9 }: { left?: number }) {
  const [missing, setMissing] = useState(false)
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(20vh,160px)', height: 'min(20vh,160px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'pt_float 3.6s ease-in-out infinite' }}>
        {missing
          ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}><span style={{ fontSize: 58, filter: 'drop-shadow(0 0 10px rgba(120,160,255,.6))' }}>🦊</span></div>
          : <img src="/assets/characters/milo_explorer.png" alt="Milo" draggable={false} decoding="async" loading="lazy" onError={() => setMissing(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.5))' }} />}
      </div>
    </div>
  )
}


// ─── Intro splash ──────────────────────────────────────────────────────────────────────
/**
 * `alt` is an OPTIONAL second way in, offered beside the main one — an AR chapter uses it to offer
 * taps instead of the camera. Deliberately quiet (no fill, muted ink) so it reads as the other door
 * rather than as a way to skip the chapter, and a caller that passes none renders exactly as before.
 */
export function IntroCard({ title, body, accent, cta = 'Start', onStart, short, alt }: { title: string; body: string; accent: Accent; cta?: string; onStart: () => void; short?: boolean; alt?: { label: string; onPick: () => void } }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '0 6vw' }}>
      <div style={{ position: 'relative', width: CARD_W, background: PT.panel, backdropFilter: 'blur(8px)', border: `1px solid ${accent.base}55`, borderRadius: 18, padding: '20px 24px 24px', boxShadow: `0 0 30px ${accent.base}22, 0 16px 40px rgba(0,0,0,0.5)`, textAlign: 'center' }}>
        <Brackets color={accent.base} />
        <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2, color: accent.base, textTransform: 'uppercase', marginBottom: 8 }}>Briefing</div>
        <h2 style={{ margin: '0 0 8px', fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 19 : 23, color: PT.ink }}>{title}</h2>
        <p style={{ margin: 0, fontFamily: PT.sans, fontWeight: 400, fontSize: short ? 14 : 16, lineHeight: 1.5, color: PT.inkSoft }}>{body}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <button onClick={onStart} style={{ padding: '13px 40px', borderRadius: 14, border: `1px solid ${accent.base}`, cursor: 'pointer', background: accent.base, color: '#06121f', fontFamily: PT.sans, fontWeight: 700, fontSize: 19, boxShadow: `0 0 26px ${accent.base}88`, letterSpacing: .3 }}>{cta} →</button>
        {alt && (
          <button onClick={alt.onPick} style={{ padding: '10px 26px', borderRadius: 999, border: `1px solid ${PT.lineStrong}`, cursor: 'pointer', background: 'transparent', color: PT.inkMute, fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 14 : 15,
          // 44px tap floor — it measured 40. This prop had no user until the diagnostic's "start
          // fresh" (2026-08-24), and that one is an ESCAPE from a resumed run: the control a
          // returning parent needs when the offer is not what they wanted.
          minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{alt.label}</button>
        )}
      </div>
    </div>
  )
}
