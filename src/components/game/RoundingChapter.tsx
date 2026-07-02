'use client'
/**
 * RoundingChapter (9–11) — round to the nearest 10/100 and estimate sums, as the RoundingTrail
 * story mode.
 *
 * Same shape as the other story wrappers: keep the story portal mounted and render the celebration
 * over it. The pedagogy lives in the number-line-as-a-route experience (see story/RoundingTrail.tsx
 * — Mountain Trail / Railway Line / Island Hopper; round to the nearer stop · estimate a sum by
 * rounding each first). Reuses skill `rounding`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import RoundingTrail from '@/components/story/RoundingTrail'
import { useChapterSync } from '@/lib/supabase/useChapterSync'
import CelebrationModal from '@/components/ui/CelebrationModal'

export default function RoundingChapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('rounding', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#0a1026' }}>
      <RoundingTrail key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
