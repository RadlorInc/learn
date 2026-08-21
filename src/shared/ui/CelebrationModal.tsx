'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMiloStore } from '@/state/store'
import { CHAPTER_ORDER, CHAPTER_NAMES } from '@/core/chapters'
import { useMiloSpeaker } from '@/infra/useMiloSpeaker'

// The 1- and 2-star lines sit under a heading ("🌟 Great job!" / "💪 Good try!"), so neither may
// repeat its own heading's word — the 3-star pair used to read "Amazing! / Amazing! You are a
// star!". Three stars now has no heading at all: this line is the whole announcement.
const STAR_MSGS = ['', 'Keep practising — you can do it!', 'Well done! You are getting there!', 'Activity Completed! Wow! You\'re doing great!']

interface Props {
  onPlayAgain?: () => void   // override the default "play again" (chapter restart)
  onExit?: () => void        // override the default "back to menu"
  exitLabel?: string         // label for the exit button
  hideNext?: boolean         // hide the "next chapter" button (e.g. AR activities)
}

export default function CelebrationModal({ onPlayAgain, onExit, exitLabel, hideNext }: Props = {}) {
  const router = useRouter()
  const { celebration, dismissCelebration, startChapter } = useMiloStore()
  const { speak } = useMiloSpeaker()
  const spoken = useRef(false)

  useEffect(() => {
    if (celebration && !spoken.current) {
      spoken.current = true
      const msg = celebration.stars === 3
        ? `Woohoo! Three stars! You are amazing, ${celebration.childName}!`
        : celebration.stars === 2
        ? `Great job! Two stars! You did really well!`
        : `Good try! Keep practising and you will get three stars!`
      speak(msg)
    }
    if (!celebration) spoken.current = false
  }, [celebration, speak])

  if (!celebration) return null

  const { stars, xpGained, coinsGained, completedChapter } = celebration
  const nextChapterIdx = CHAPTER_ORDER.indexOf(completedChapter) + 1
  const nextChapter    = CHAPTER_ORDER[nextChapterIdx] ?? null

  function handleMenu() {
    dismissCelebration()
    if (onExit) onExit(); else router.push('/menu')
  }

  function handlePlayAgain() {
    dismissCelebration()
    if (onPlayAgain) onPlayAgain(); else startChapter(completedChapter)
  }

  function handleNextChapter() {
    if (!nextChapter) return
    dismissCelebration()
    startChapter(nextChapter)
  }

  return (
    // ⚠️ `align-items: center` CLIPS AN OVERFLOWING CHILD AT THE TOP, and there is no scrolling
    // back to it. Measured at 640x320 — a short-landscape phone, which is what this band is played
    // on — the card is 697px tall and its top 189px, Milo and the whole message, were simply off
    // the screen and unreachable. `margin: auto` centres the same card without clipping, so the
    // overflow becomes scrollable instead of lost. The shrinking below keeps the scroll short; it
    // cannot remove it, because three buttons plus the stars are ~500px on any frame.
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(61,37,22,0.7)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflowY: 'auto', overscrollBehavior: 'contain',
      // `min(24px, 2vh)`: the card is 684px tall, so a flat 24px each side pushed it 12px past a
      // 720-tall laptop and made a celebration scroll for the sake of its own margin. Below ~800
      // the margin is the cheapest thing in the layout to give back, and on a short frame the
      // overlay scrolls anyway so nothing is lost there either.
      padding: 'min(24px, 2vh)',
    }}>
      {/* Confetti */}
      {[...Array(18)].map((_, i) => (
        // `fixed`, not `absolute`: once the overlay scrolls, an absolute % top is a share of the
        // CONTENT height, so the confetti stretched out down the whole card instead of falling
        // across the screen.
        <div key={i} style={{
          position: 'fixed',
          top: `${(i * 17) % 80}%`,
          left: `${(i * 23) % 100}%`,
          width: 14, height: 14,
          borderRadius: i % 2 === 0 ? '50%' : '3px',
          background: ['#F26B2C','#FFC933','#6FBE3F','#5BC3F0','#9362D8','#E64545'][i % 6],
          animation: `confettiFall ${1.2 + (i % 3) * 0.3}s ease-in ${(i % 5) * 0.1}s both`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{
        background: 'var(--paper)', border: '4px solid var(--outline)',
        borderRadius: 32, padding: 'min(36px, 6vh) 28px 28px',
        maxWidth: 360, width: '100%', textAlign: 'center', margin: 'auto',
        boxShadow: '0 8px 0 var(--outline)', position: 'relative', zIndex: 1,
      }}>
        {/* The two purely decorative things are what a short frame buys its room from — never the
            buttons, which are what a finger has to hit, and never the words. Plain CSS rather than
            a viewport hook: no hook means no re-render and it holds at every size, not the ones
            somebody remembered to branch on. */}
        <Image src="/assets/characters/milo-happy.png" alt="Milo" width={110} height={110}
          style={{ objectFit: 'contain', marginBottom: 4, height: 'min(110px, 22vh)', width: 'auto' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />

        {/* No heading on three stars: the line below is the whole announcement there, and a heading
            above it only repeated the celebration a second time. Two stars and one still get one —
            those lines are encouragement, and encouragement wants something to sit under. */}
        {stars < 3 && (
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-h1)', color: 'var(--ink)', margin: '0 0 4px' }}>
            {stars === 2 ? '🌟 Great job!' : '💪 Good try!'}
          </h2>
        )}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-body-lg)', color: 'var(--ink-soft)', margin: '0 0 20px' }}>
          {STAR_MSGS[stars]}
        </p>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1,2,3].map(n => (
            <span key={n} style={{ fontSize: 'min(44px, 12vh)', lineHeight: 1, opacity: n <= stars ? 1 : 0.18 }}>⭐</span>
          ))}
        </div>

        {/* Progress — XP is the competence/growth signal and stays the headline.
            Coins are DEMOTED to a quiet wallet top-up (not a co-equal reward
            trophy): they're cosmetic shop currency for self-expression, never the
            headline reward for answering. Keeps coins from becoming an
            extrinsic-only motivator (overjustification). See ux-design.md §6.1 /
            ux-invariants.md #14. */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: coinsGained > 0 ? 10 : 24 }}>
          <div style={{
            background: 'var(--sky-blue-soft)', border: '3px solid var(--sky-blue)',
            borderRadius: 14, padding: '8px 18px',
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 18, color: 'var(--ink)',
            boxShadow: '0 3px 0 rgba(61,37,22,.10)',
          }}>
            +{xpGained} XP
          </div>
        </div>
        {coinsGained > 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 22px', opacity: 0.85 }}>
            🪙 +{coinsGained} in your wallet — for the Shop
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Next chapter — primary if available (hidden for AR activities) */}
          {!hideNext && nextChapter && (
            <button className="milo-btn tone-green size-lg" onClick={handleNextChapter}
              style={{ width: '100%' }}>
              Next: {CHAPTER_NAMES[nextChapter]} →
            </button>
          )}

          {/* Play again */}
          <button className="milo-btn tone-blue size-lg" onClick={handlePlayAgain}
            style={{ width: '100%' }}>
            🔁 Play again
          </button>

          {/* Back to menu (or custom exit) */}
          <button className="milo-btn tone-cream" onClick={handleMenu}
            style={{ width: '100%', fontSize: 15 }}>
            {exitLabel ?? '← Back to menu'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          from { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          to   { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}