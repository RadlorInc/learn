'use client'
/**
 * MultiplicationChapter (6–8) — intro multiplication as the MarketDay story mode.
 *
 * Same shape as the other 6–8 story wrappers: keep the story portal mounted and render
 * the celebration over it. The pedagogy lives in the equal-groups / skip-count / tap-the-
 * total experience (see story/MarketDay.tsx — Bakery / Flower Garden / Space Station;
 * groups & array views; Bakery / Flower Garden / Craft Table). Reuses skill `multiplication`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MarketDay from '@/features/chapters/story/MarketDay'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import CelebrationModal from '@/shared/ui/CelebrationModal'

export default function MultiplicationChapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('multiplication', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#f3ead8' }}>
      <MarketDay key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
