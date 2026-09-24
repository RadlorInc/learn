'use client'
/**
 * The practice screen, laid out like the founder's SampleUI practice screen — shared by a lesson's 5 practice problems
 * and a module's mixed practice:
 *   coral bar (where you are) · "Problem 1 of 8" + Exit practice · left: the problem (children) · right: a scratch pad.
 * Also used by a lesson's Screen 8 ("Now you try"). `pad={false}` drops the pad (the finish screen).
 */
import { useState, type CSSProperties, type ReactNode } from 'react'
import { pill, INK, PAGE_BG, shell, topBar, LESSON_KEYFRAMES } from './Pictures'
import { LANDSCAPE } from './Frame'
import { ScratchPad } from './ScratchPad'
import { VerticalNumberLine, verticalLineFor } from './VerticalNumberLine'
import { C } from './sessionCopy'

export function PracticeLayout({ corner, crumb, title, onExit, exitLabel = 'Exit practice', pad, padKey, feedback, topic, children }: {
  corner: string; crumb: string; feedback?: ReactNode; title: string; onExit: () => void; exitLabel?: string
  pad: boolean; padKey: string | number; children: ReactNode
  /** The topic the problem on screen comes from: on the signed-number topics it offers the vertical number line. */
  topic?: string
}) {
  const [lineOpen, setLineOpen] = useState(false)
  const line = pad && verticalLineFor(topic)
  return (
    <div className="pr-page" style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', justifyContent: 'center' }}>
      <style>{LESSON_KEYFRAMES + LAYOUT}</style>
      <div style={{ ...shell, maxWidth: 1180, alignSelf: 'flex-start', minHeight: 'clamp(520px, calc(100dvh - 48px), 900px)' }}>
        <div style={topBar}>
          <span style={{ fontSize: 'clamp(14px, 3.4vw, 18px)' }}>{corner}</span>
          <span style={{ fontSize: 'clamp(14px, 3.6vw, 18px)', textAlign: 'center' }}>{crumb}</span>
          {feedback ?? <span />}
        </div>
        <main style={{ flex: 1, padding: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(28px, 4.5vw, 40px)', color: INK, lineHeight: 1.1 }}>{title}</h1>
            <button type="button" style={{ ...pill, fontSize: 'clamp(16px, 2vw, 20px)', padding: '10px 18px' }} onClick={onExit}>{exitLabel}</button>
          </div>
          <div className={pad ? 'pr-row' : 'pr-row pr-solo'}>
            <div className="pr-left">{children}</div>
            {pad && <div className="pr-pad">
              {line && <button type="button" aria-expanded={lineOpen} aria-controls="pr-vline" onClick={() => setLineOpen(o => !o)}
                style={{ ...pill, alignSelf: 'flex-start', marginBottom: 10, background: lineOpen ? '#ffd166' : '#fff' }}>↕ {lineOpen ? C.hideLine : C.showLine}</button>}
              <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>
                {line && lineOpen && <div id="pr-vline" style={{ flexShrink: 0, width: 96 }}><VerticalNumberLine clearKey={padKey} /></div>}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}><ScratchPad clearKey={padKey} /></div>
              </div>
            </div>}
          </div>
        </main>
      </div>
    </div>
  )
}

/** Hint, bottom left — as big as Check, but white. */
/** A right practice answer: the green "Right!" stays this long, then the next problem comes by itself (founder,
 * 2026-09-24: no "Next problem" tap needed). Both practice screens use it. */
export const RIGHT_MS = 1400

export const hintBtn: CSSProperties = { ...pill, minHeight: 56, padding: '12px 24px', fontSize: 20, borderWidth: 4, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}` }

// Landscape: problem on the left, scratch pad on the right (the template's 1.1 : 0.9). Portrait: problem, then the pad.
const LAYOUT = `
.pr-row { flex: 1; display: flex; flex-direction: column; gap: 20px; --lp-u: clamp(20px, 5vw, 36px) }
.pr-left { display: flex; flex-direction: column; gap: 14px }
.pr-pad { min-height: 320px; display: flex; flex-direction: column }
.pr-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: auto; flex-wrap: wrap }
@media ${LANDSCAPE} {
  .pr-row:not(.pr-solo) { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); align-items: stretch; --lp-u: clamp(18px, 2vw, 32px) }
  .pr-pad { min-height: 0 }
}
@media ${LANDSCAPE} and (max-height: 500px) {
  .pr-page { padding: 6px 12px 10px !important }
  .pr-row { --lp-u: 16px !important }
}`
