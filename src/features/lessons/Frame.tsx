'use client'
/**
 * The screen frame every new-flow screen uses — the founder's SampleUI template:
 *   coral top bar · title (top left) · picture + words (side by side in landscape, stacked in portrait) ·
 *   footer: progress dots in the centre, the button bottom right.
 * `stack` puts the picture above the words at every size (the "One thing not to do" cards read that way).
 */
import type { CSSProperties, ReactNode } from 'react'
import { pill, INK, TEAL, GOOD, LESSON_KEYFRAMES, PAGE_BG, shell, topBar } from './Pictures'

export const LANDSCAPE = '(orientation: landscape) and (min-width: 700px)'

export function Frame({ crumb, exit, progress, title, picture, words, action, back, at, total, stack }: {
  crumb: string
  exit: { label: string; onClick: () => void }
  /** How far through this screen she is, 0–1: the bar under the top bar. Undefined on a screen that does not play itself. */
  progress?: number
  title: ReactNode; picture: ReactNode; words: ReactNode; action: ReactNode; back?: ReactNode
  at: number; total: number; stack?: boolean
}) {
  return (
    <div className="lp-page" style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{LESSON_KEYFRAMES + LAYOUT}</style>
      <div className="lp-wrap" style={{ ...shell, minHeight: 'clamp(520px, calc(100dvh - 48px), 900px)' }}>
        <div style={topBar}>
          <button type="button" style={barBtn} onClick={exit.onClick}>{exit.label}</button>
          <span style={{ fontSize: 'clamp(14px, 3.6vw, 18px)', fontWeight: 800, textAlign: 'center' }}>{crumb}</span>
          <span />
        </div>
        {progress !== undefined && (
          // Founder, 2026-09-20: a screen that moves on by itself has to show how far along it is.
          <div aria-hidden style={{ height: 10, background: '#fff', borderBottom: `4px solid ${INK}` }}>
            <div style={{ height: '100%', width: `${Math.round(Math.min(1, progress) * 100)}%`, background: TEAL, transition: 'width .45s linear' }} />
          </div>
        )}
        <main style={{ flex: 1, padding: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={h1}>{title}</h1>
          <div className={stack ? 'lp-row lp-stack' : 'lp-row'}>
            <div className="lp-pic">{picture}</div>
            <div className="lp-words">{words}</div>
          </div>
          <div className="lp-foot">
            <div className="lp-back">{back}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }} aria-hidden>
              {Array.from({ length: total }, (_, k) => <i key={k} style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${INK}`, background: k <= at ? TEAL : '#fff' }} />)}
            </div>
            <div className="lp-action">{action}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

const barBtn: CSSProperties = { ...pill, fontSize: 'clamp(13px, 3.5vw, 16px)', padding: '6px 10px' }
const h1: CSSProperties = { margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(28px, 4.5vw, 40px)', color: INK, lineHeight: 1.1, textAlign: 'left' }

// ── Shared pieces a screen fills the frame with ───────────────────────────────────────────────
// The picture sits on a white "stage". --lp-u (set by the layout) sizes every object in it.
// minWidth 0: in a row the stage would otherwise grow to its widest picture and the frame would cut the rest off.
export const stage: CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, minHeight: 200, padding: 14,
  background: '#fff', border: `4px solid ${INK}`, borderRadius: 22 }
export const bubble: CSSProperties = { margin: 0, background: '#fff', border: `4px solid ${INK}`, borderRadius: 22, padding: '14px 18px',
  fontSize: 'clamp(20px, 2.6vw, 25px)', lineHeight: 1.3, color: INK, boxShadow: `5px 5px 0 ${INK}` }
export const primary: CSSProperties = { minHeight: 56, padding: '12px 24px', borderRadius: 16, border: `4px solid ${INK}`, background: TEAL, color: '#fff',
  fontWeight: 800, fontSize: 20, cursor: 'pointer', boxShadow: `4px 4px 0 ${INK}`, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
// A hint is warm yellow, never red: a wrong answer is not marked wrong.
export const hint: CSSProperties = { margin: 0, background: '#fff1c9', border: `4px solid ${INK}`, borderRadius: 16, padding: '12px 16px', fontSize: 20, fontWeight: 700, color: INK }
export const idea: CSSProperties = { margin: 0, background: '#ffd166', border: `4px solid ${INK}`, borderRadius: 22, padding: '16px 18px', fontSize: 'clamp(21px, 2.8vw, 28px)', fontWeight: 800, textAlign: 'center', color: INK }
export const cue: CSSProperties = { alignSelf: 'center', margin: 0, padding: '6px 16px', borderRadius: 999, background: '#ffd166', border: `3px solid ${INK}`, color: INK, fontWeight: 800, fontSize: 17 }
export const tick: CSSProperties = { width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: GOOD, border: `3px solid ${INK}`, color: '#fff', fontWeight: 900, fontSize: 18 }
export const right: CSSProperties = { ...hint, display: 'flex', alignItems: 'center', gap: 12, background: '#b7f0c6', fontWeight: 800, animation: 'lp-pop .3s ease-out' }
export const answerInput: CSSProperties = { width: 110, height: 60, fontSize: 30, fontWeight: 800, textAlign: 'center', borderRadius: 12, border: `4px solid ${INK}`, color: INK, background: '#fff' }

// Portrait: everything stacks. Landscape (tablet sideways, laptop, desktop): picture left, words right, like the template.
// Footer is three slots — Back left, dots centred, the button right; in portrait the dots take their own row above Back + the button.
const LAYOUT = `
.lp-wrap { max-width: 760px }
.lp-row { flex: 1; display: flex; flex-direction: column; gap: 16px; --lp-u: clamp(20px, 5.5vw, 44px) }
.lp-pic { flex: 1; display: flex }
.lp-words { display: flex; flex-direction: column; gap: 14px }
.lp-stack .lp-pic { flex: none }
.lp-foot { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px }
.lp-action { justify-self: end; display: flex }
@media not all and ${LANDSCAPE} {
  .lp-foot { grid-template-columns: auto 1fr; grid-template-areas: 'dots dots' 'back act' }
  .lp-foot > :nth-child(2) { grid-area: dots }
  .lp-back { grid-area: back }
  .lp-action { grid-area: act; justify-self: stretch }
  .lp-back:empty { display: none }
  .lp-back:empty ~ .lp-action { grid-column: 1 / -1 }
  .lp-action > * { flex: 1; max-width: none !important }
}
@media ${LANDSCAPE} {
  .lp-wrap { max-width: 1180px }
  .lp-row:not(.lp-stack) { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 24px; align-items: stretch; --lp-u: clamp(22px, 2.3vw, 40px) }
  .lp-row:not(.lp-stack) .lp-pic { min-height: min(540px, 58vh) }
  .lp-row:not(.lp-stack) .lp-words { justify-content: center }
  .lp-stack { gap: 24px }
}
/* A phone turned sideways is short: tighten so the button stays on screen. */
@media ${LANDSCAPE} and (max-height: 500px) {
  .lp-wrap { min-height: 0 !important }
  .lp-wrap main { padding: 10px 14px !important; gap: 8px !important }
  .lp-wrap h1 { font-size: 24px !important }
  .lp-row:not(.lp-stack) .lp-pic { min-height: 0 }
  .lp-row { --lp-u: 18px !important }
  .lp-page { padding: 6px 12px 10px !important }
  .lp-wrap > div:first-child { padding: 4px 10px !important }
  .lp-wrap > div:first-child button { min-height: 36px !important }
  .lp-action > * { min-height: 44px !important; padding: 6px 16px !important; font-size: 17px !important }
}`
