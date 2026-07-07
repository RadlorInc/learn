'use client'
/**
 * SignedNumberFluencyChapter (15–16) — "Leaderboard".
 *
 * Migrated onto the shared 12–14 GameShell so the experience matches the younger
 * band exactly: an OPTIONAL play-with-it Explore sim first (kept per founder), then
 * the game — start card → overview read-along (on the chalkboard) → baby-step
 * walkthrough → guided round → scored play → MasteryState. Signed arithmetic is a
 * PRODUCE-the-answer skill, so the answer is set on a leaderboard score meter
 * (ElevatorShaft) or sorted into a bin (rational vs irrational), never picked from
 * four. The vetted math mirrors the lesson's makeRound. data-band="15-16".
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { stopSpeech } from '@/infra/useMiloSpeaker'
import type { AgeBand } from '@/features/chapters/teen/types'
import MasteryState from '@/features/chapters/teen/MasteryState'
import ExploreStep from '@/features/chapters/teen/ExploreStep'
import SignedJumpExplorer from '@/features/chapters/teen/sims/SignedJumpExplorer'
import Leaderboard from '@/features/chapters/teen/games/Leaderboard'

const BAND: AgeBand = '15-16'

type Props = { onComplete: (correct: number, wrong: number) => void; childName: string }

// ── The chapter "world": explore → game → done ──────────────────────────────
function SignedWorld({
  childName, onFinish, onExit, onReplay,
}: {
  childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void; onReplay: () => void
}) {
  // Optional pre-game beat: poke at the idea, then play the game. Skippable.
  const [phase, setPhase] = useState<'explore' | 'game' | 'done'>('explore')

  if (phase === 'explore') {
    return (
      <ExploreStep
        band={BAND}
        title="Add a positive and a negative"
        intro="Set a start and a jump, then watch where you land — adding a negative slides you left, adding a positive slides you right. Have a play, or skip straight to the game."
        continueLabel="Skip to the game"
        onContinue={() => setPhase('game')}
      >
        <SignedJumpExplorer band={BAND} />
      </ExploreStep>
    )
  }

  if (phase === 'done') {
    return (
      <Centered>
        <MasteryState
          band={BAND}
          conceptsConfirmed={['Adding & subtracting signed numbers', 'Multiplying & dividing signs', 'Order of operations with negatives & exponents', 'Rational vs irrational']}
          nextPointer="Next: expressions & variables."
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </Centered>
    )
  }

  return (
    <Leaderboard
      childName={childName}
      onExit={onExit}
      onFinish={(c, w, mastered) => { onFinish(c, w, mastered); setPhase('done') }}
    />
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="milo-lesson" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 18px', background: 'var(--bg-page)', color: 'var(--ink)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}>
      {children}
    </div>
  )
}

// ── Portal wrapper (the dispatched chapter component) ───────────────────────
export default function SignedNumberFluencyChapter(_props: Props) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body); return () => stopSpeech() }, [])

  const finish = useCallback((c: number, w: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('signedNumberFluency', c, w, 'practice', mastered)
  }, [finishAndSync])

  const replay = useCallback(() => { doneRef.current = false; setRunKey((k) => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div data-band={BAND} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <SignedWorld
        key={runKey}
        childName={_props.childName}
        onFinish={finish}
        onExit={() => { stopSpeech(); router.push('/menu') }}
        onReplay={replay}
      />
    </div>,
    body,
  )
}
