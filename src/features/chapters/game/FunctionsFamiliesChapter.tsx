'use client'
/**
 * FunctionsFamiliesChapter (15–16) — "Going Viral".
 *
 * Migrated onto the shared 12–14 GameShell so the experience matches the younger
 * band exactly: an OPTIONAL play-with-it Explore sim first (kept per founder), then
 * the game — start card → overview read-along (on the chalkboard) → baby-step
 * walkthrough → guided round → scored play → MasteryState. The vetted math is
 * reused from the lesson's makeRound (see GoingViral.tsx). data-band="15-16"
 * scopes the studio skin.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { stopSpeech } from '@/infra/useMiloSpeaker'
import type { AgeBand } from '@/features/chapters/teen/types'
import MasteryState from '@/features/chapters/teen/MasteryState'
import ExploreStep from '@/features/chapters/teen/ExploreStep'
import GrowthExplorer from '@/features/chapters/teen/sims/GrowthExplorer'
import GoingViral from '@/features/chapters/teen/games/GoingViral'

const BAND: AgeBand = '15-16'

type Props = { onComplete: (correct: number, wrong: number) => void; childName: string }

function FunctionsWorld({
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
        title="Linear vs exponential growth"
        intro="Slide the rates and watch a straight line (adding each step) race a curve (multiplying each step) — see where the curve overtakes. Then play, or skip straight to the game."
        continueLabel="Skip to the game"
        onContinue={() => setPhase('game')}
      >
        <GrowthExplorer band={BAND} />
      </ExploreStep>
    )
  }

  if (phase === 'done') {
    return (
      <Centered>
        <MasteryState
          band={BAND}
          conceptsConfirmed={[
            'Function notation & evaluating f(x)',
            'Domain, range & intercepts from a graph',
            'Linear vs exponential growth',
            'Growth/decay & geometric sequences',
          ]}
          nextPointer="Next: systems of equations."
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </Centered>
    )
  }

  return (
    <GoingViral
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
export default function FunctionsFamiliesChapter(_props: Props) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body); return () => stopSpeech() }, [])

  const finish = useCallback((c: number, w: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('functionsFamilies', c, w, 'practice', mastered)
  }, [finishAndSync])

  const replay = useCallback(() => { doneRef.current = false; setRunKey((k) => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div data-band={BAND} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <FunctionsWorld
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
