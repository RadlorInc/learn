'use client'
/**
 * PercentagesChapter (12–14) — "Sale Day", the PLAYABLE-GAME chapter shape.
 *
 * No slides: the whole chapter is ONE continuous shop scene (ShopRush). Milo
 * demos the first order in-scene, then the kid runs the counter — order tickets
 * slide in, they set the price on a dial (or tap the right tag) and SELL.
 * Teaching, hints, and reteach all happen inside the game. Same engine
 * underneath: useAdaptive L1/L2/L3 (invisible), makeDistinct, mastery
 * early-exit, finishAndSync. This is the template for making the whole
 * 12–14 band playable.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { stopSpeech } from '@/infra/useMiloSpeaker'
import type { AgeBand } from '@/features/chapters/teen/types'
import MasteryState from '@/features/chapters/teen/MasteryState'
import ShopRush from '@/features/chapters/teen/games/ShopRush'

const BAND: AgeBand = '12-14'

type Props = { onComplete: (correct: number, wrong: number) => void; childName: string }

function PercentagesWorld({
  childName, onFinish, onExit, onReplay,
}: {
  childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void; onReplay: () => void
}) {
  const [phase, setPhase] = useState<'game' | 'done'>('game')

  if (phase === 'done') {
    return (
      <div className="milo-lesson" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 18px', background: 'var(--bg-page)', color: 'var(--ink)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}>
        <MasteryState
          band={BAND}
          conceptsConfirmed={['Percent ↔ fraction ↔ decimal', 'Percent of a price', 'Finding the percent', 'Increase, discount & reverse']}
          nextPointer="Next: exponents, roots & scientific notation."
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </div>
    )
  }

  return (
    <ShopRush
      childName={childName}
      onExit={onExit}
      onFinish={(c, w, mastered) => { onFinish(c, w, mastered); setPhase('done') }}
    />
  )
}

// ── Portal wrapper (the dispatched chapter component) ───────────────────────
export default function PercentagesChapter(_props: Props) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body); return () => stopSpeech() }, [])

  const finish = useCallback((c: number, w: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('percentages', c, w, 'practice', mastered)
  }, [finishAndSync])

  const replay = useCallback(() => { doneRef.current = false; setRunKey((k) => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div data-band={BAND} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <PercentagesWorld
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
