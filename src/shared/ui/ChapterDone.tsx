'use client'
import { useEffect, useRef } from 'react'
import { useMiloSpeaker } from '@/infra/useMiloSpeaker'

/**
 * The card a 3–8 story chapter ends on.
 *
 * ⚠️ IT REPLACES `CelebrationModal`, WHICH WAS DELETED WITH THE STAR / XP / COIN ECONOMY on
 * 2026-09-20 (founder's call). Deleting that component outright would have left every chapter with
 * NO ENDING — the child finishes and nothing happens — which is the dead-code trap this repo has
 * paid for before: removing the thing that reads a value also removes the screen around it.
 *
 * So what went is the SCORE, not the moment. No stars, no XP, no coins, no "next chapter" (the
 * plan card on `/menu` decides what comes next now). What stays is: it is over, well done, and the
 * two ways out. Points are earned silently in the database, like a topic's.
 *
 * ⚠️ PROPS, NOT A STORE. The old one read `celebration` out of zustand — which is why it could not
 * be rendered anywhere the store was not, and why it went when the store did.
 */
export default function ChapterDone({ open, childName, onPlayAgain, onExit, exitLabel = 'Back to menu' }: {
  open: boolean
  childName?: string
  onPlayAgain: () => void
  onExit: () => void
  exitLabel?: string
}) {
  const { speak } = useMiloSpeaker()
  const spoken = useRef(false)

  useEffect(() => {
    if (!open) { spoken.current = false; return }
    if (spoken.current) return
    spoken.current = true
    speak(childName ? `All done, ${childName}! Nice work.` : 'All done! Nice work.')
  }, [open, childName, speak])

  if (!open) return null

  return (
    // ⚠️ `flex-start` + `margin: auto`, not `align-items: center`. Centring CLIPS an overflowing
    // card at the top with no way to scroll back to it — measured at 640×320, the short-landscape
    // phone this band is played on, where the old card lost its top 189px.
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(61,37,22,0.7)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflowY: 'auto', overscrollBehavior: 'contain', padding: 'min(24px, 2vh)',
    }}>
      <div style={{
        background: 'var(--paper)', border: '4px solid var(--outline)', borderRadius: 32,
        padding: 'min(32px, 5vh) 28px 28px', maxWidth: 360, width: '100%', textAlign: 'center',
        margin: 'auto', boxShadow: '0 8px 0 var(--outline)',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-h1)', color: 'var(--ink)', margin: '0 0 4px' }}>
          🎉 All done!
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-body-lg)', color: 'var(--ink-soft)', margin: '0 0 20px' }}>
          Nice work — that one is finished.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onPlayAgain} style={btn('#F26B2C', '#fff')}>▶ Play again</button>
          <button onClick={onExit} style={btn('transparent', 'var(--ink-soft)')}>{exitLabel}</button>
        </div>
      </div>
    </div>
  )
}

const btn = (background: string, color: string) => ({
  background, color, minHeight: 52, padding: '13px 22px', borderRadius: 50,
  border: background === 'transparent' ? '2px solid var(--ink-mute, #bbb)' : 'none',
  fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 17, cursor: 'pointer',
} as const)
