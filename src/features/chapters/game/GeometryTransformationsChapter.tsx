'use client'
/**
 * GeometryTransformationsChapter (15–16) — "Map Maker".
 *
 * Migrated onto the shared 12–14 GameShell so the experience matches the younger
 * band exactly: an OPTIONAL play-with-it Explore sim first (kept per founder), then
 * the game — start card → overview read-along (on the chalkboard) → baby-step
 * walkthrough → guided round → scored play → MasteryState. The vetted math is reused
 * from the lesson's makeRound (see MapMaker.tsx). Measurements are dialled (SlideValue,
 * tolerance-graded decimals), transformed points are built (PartsBuilder → integer
 * (x, y)). data-band="15-16" scopes the studio skin.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { stopSpeech } from '@/infra/useMiloSpeaker'
import type { AgeBand } from '@/features/chapters/teen/types'
import MasteryState from '@/features/chapters/teen/MasteryState'
import ExploreStep from '@/features/chapters/teen/ExploreStep'
import TransformExplorer from '@/features/chapters/teen/sims/TransformExplorer'
import MapMaker from '@/features/chapters/teen/games/MapMaker'

const BAND: AgeBand = '15-16'

type Props = { onComplete: (correct: number, wrong: number) => void; childName: string }

function GeometryTransformationsWorld({
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
        title="Move, flip, and scale a shape"
        intro="Slide the translate and scale controls and pick a reflect axis — watch the image triangle and its rule update together. Have a play, or skip straight to the game."
        continueLabel="Skip to the game"
        onContinue={() => setPhase('game')}
      >
        <TransformExplorer band={BAND} />
      </ExploreStep>
    )
  }

  if (phase === 'done') {
    return (
      <Centered>
        <MasteryState
          band={BAND}
          conceptsConfirmed={[
            'Circumference, area, arc & sector',
            'Surface area & volume of solids',
            'Translate, reflect & dilate on the grid',
            'Identify the rule & find the midpoint',
          ]}
          nextPointer="Next: triangles, proof & right-triangle trig."
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </Centered>
    )
  }

  return (
    <MapMaker
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

export default function GeometryTransformationsChapter(_props: Props) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body); return () => stopSpeech() }, [])

  const finish = useCallback((c: number, w: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('geometryTransformations', c, w, 'practice', mastered)
  }, [finishAndSync])

  const replay = useCallback(() => { doneRef.current = false; setRunKey((k) => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div data-band={BAND} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <GeometryTransformationsWorld
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
