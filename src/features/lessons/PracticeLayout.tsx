'use client'
/**
 * The practice screen, laid out like the founder's SampleUI practice screen — shared by a lesson's 5 practice problems
 * and a module's mixed practice:
 *   coral bar (where you are) · "Problem 1 of 8" + Exit practice · left: the problem (children) · right: a scratch pad.
 * Also used by a lesson's Screen 8 ("Now you try"). `pad={false}` drops the pad (the finish screen).
 */
import type { CSSProperties, ReactNode } from 'react'
import { pill, INK, PAGE_BG, shell, topBar, LESSON_KEYFRAMES } from './Pictures'
import { LANDSCAPE } from './Frame'
import { ScratchPad } from './ScratchPad'

export function PracticeLayout({ corner, crumb, title, onExit, exitLabel = 'Exit practice', audio, pad, padKey, children }: {
  corner: string; crumb: string; title: string; onExit: () => void; exitLabel?: string
  audio?: { on: boolean; toggle: () => void }
  pad: boolean; padKey: string | number; children: ReactNode
}) {
  return (
    <div className="pr-page" style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', justifyContent: 'center' }}>
      <style>{LESSON_KEYFRAMES + LAYOUT}</style>
      <div style={{ ...shell, maxWidth: 1180, alignSelf: 'flex-start', minHeight: 'clamp(520px, calc(100dvh - 48px), 900px)' }}>
        <div style={topBar}>
          <span style={{ fontSize: 'clamp(14px, 3.4vw, 18px)' }}>{corner}</span>
          <span style={{ fontSize: 'clamp(14px, 3.6vw, 18px)', textAlign: 'center' }}>{crumb}</span>
          {audio
            ? <button type="button" style={{ ...pill, fontSize: 'clamp(13px, 3.5vw, 16px)', padding: '6px 10px', background: audio.on ? '#ffd166' : '#fff' }}
                aria-pressed={audio.on} onClick={audio.toggle}>{audio.on ? '🔊 Reading aloud' : '🔈 Read it to me'}</button>
            : <span />}
        </div>
        <main style={{ flex: 1, padding: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(28px, 4.5vw, 40px)', color: INK, lineHeight: 1.1 }}>{title}</h1>
            <button type="button" style={{ ...pill, fontSize: 'clamp(16px, 2vw, 20px)', padding: '10px 18px' }} onClick={onExit}>{exitLabel}</button>
          </div>
          <div className={pad ? 'pr-row' : 'pr-row pr-solo'}>
            <div className="pr-left">{children}</div>
            {pad && <div className="pr-pad"><ScratchPad clearKey={padKey} /></div>}
          </div>
        </main>
      </div>
    </div>
  )
}

/** Hint, bottom left — as big as Check, but white. */
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
