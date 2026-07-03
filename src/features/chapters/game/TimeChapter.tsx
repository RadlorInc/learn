'use client'
/**
 * TimeChapter (6–8) — telling time as the TickTock story mode.
 *
 * Same shape as the other 6–8 story wrappers: keep the story portal mounted and render the
 * celebration over it. The pedagogy lives in the read-the-clock experience (see story/TickTock.tsx
 * — Morning / Afternoon / Nighttime; o'clock → half past → quarter past/to). Reuses skill `time`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TickTock from '@/features/chapters/story/TickTock'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import CelebrationModal from '@/shared/ui/CelebrationModal'

export default function TimeChapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('time', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#f3ead8' }}>
      <TickTock key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
