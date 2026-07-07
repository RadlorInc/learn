'use client'
/**
 * RadicalsPythagoreanChapter (15–16) — "Screen Distance".
 *
 * Migrated onto the shared 12–14 GameShell: an OPTIONAL play-with-it Explore sim
 * first (PythagorasExplorer, kept per founder), then the game — start card →
 * overview read-along (on the chalkboard) → baby-step walkthrough → guided → scored
 * play → MasteryState. Radicals & Pythagoras is a construct-the-value skill, so the
 * answer is DIALLED (whole-number sides) or BUILT (a√b radicals), not picked from
 * four. data-band="15-16".
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { stopSpeech } from '@/infra/useMiloSpeaker'
import type { AgeBand } from '@/features/chapters/teen/types'
import MasteryState from '@/features/chapters/teen/MasteryState'
import ExploreStep from '@/features/chapters/teen/ExploreStep'
import PythagorasExplorer from '@/features/chapters/teen/sims/PythagorasExplorer'
import ScreenDistance from '@/features/chapters/teen/games/ScreenDistance'

const BAND: AgeBand = '15-16'

type Props = { onComplete: (correct: number, wrong: number) => void; childName: string }

function RadicalsWorld({
  childName, onFinish, onExit, onReplay,
}: {
  childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void; onReplay: () => void
}) {
  const [phase, setPhase] = useState<'explore' | 'game' | 'done'>('explore')

  if (phase === 'explore') {
    return (
      <ExploreStep
        band={BAND}
        title="Squares on the sides"
        intro="Drag the two legs and watch the square on each side. The two small squares always add up to the square on the slanted side — that is the whole theorem. Have a play, or skip straight to the game."
        continueLabel="Skip to the game"
        onContinue={() => setPhase('game')}
      >
        <PythagorasExplorer band={BAND} />
      </ExploreStep>
    )
  }

  if (phase === 'done') {
    return (
      <Centered>
        <MasteryState
          band={BAND}
          conceptsConfirmed={['Square roots & perfect squares', 'Simplifying radicals (a√b)', 'Adding like radicals', 'Pythagorean theorem & diagonals']}
          nextPointer="Next: factoring."
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </Centered>
    )
  }

  return (
    <ScreenDistance
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
export default function RadicalsPythagoreanChapter(_props: Props) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body); return () => stopSpeech() }, [])

  const finish = useCallback((c: number, w: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('radicalsPythagorean', c, w, 'practice', mastered)
  }, [finishAndSync])

  const replay = useCallback(() => { doneRef.current = false; setRunKey((k) => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div data-band={BAND} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <RadicalsWorld
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
