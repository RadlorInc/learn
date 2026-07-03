'use client'
/**
 * Numbers100Chapter (6–8) — numbers to 100 as the NumberTown story mode.
 *
 * Same shape as AdditionChapter: keep the story portal mounted and render the
 * celebration over it. The pedagogy lives in the hear-a-number / tap-the-match
 * experience (see story/NumberTown.tsx — Number Town / Train Yard / Space Station).
 * Reuses skill `numbersTo100`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NumberTown from '@/features/chapters/story/NumberTown'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import CelebrationModal from '@/shared/ui/CelebrationModal'

export default function Numbers100Chapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('numbersTo100', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#cfe6f7' }}>
      <NumberTown key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
