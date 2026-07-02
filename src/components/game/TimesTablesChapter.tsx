'use client'
/**
 * TimesTablesChapter (9–11) — multiplication fluency + 2-digit × 1-digit, as the TimesGrid story
 * mode.
 *
 * Same shape as the other story wrappers: keep the story portal mounted and render the celebration
 * over it. The pedagogy lives in the rows×columns experience (see story/TimesGrid.tsx — Car Park /
 * City Windows / Garden Beds; array skip-count for facts, area-model tens+ones split for 2-digit).
 * Reuses skill `timesTables`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TimesGrid from '@/components/story/TimesGrid'
import { useChapterSync } from '@/lib/supabase/useChapterSync'
import CelebrationModal from '@/components/ui/CelebrationModal'

export default function TimesTablesChapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('timesTables', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#0a1026' }}>
      <TimesGrid key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
