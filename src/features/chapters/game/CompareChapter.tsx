'use client'
/**
 * CompareChapter (6–8) — compare numbers (>, <, =) as the SeesawPark story mode.
 *
 * Same shape as Numbers100Chapter: keep the story portal mounted and render the
 * celebration over it. The pedagogy lives in the tilt-the-seesaw / pick-the-sign
 * experience (see story/SeesawPark.tsx — Balance Park / Fruit Market / Coral Reef).
 * Reuses skill `compareNumbers`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SeesawPark from '@/features/chapters/story/SeesawPark'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import CelebrationModal from '@/shared/ui/CelebrationModal'

export default function CompareChapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('compareNumbers', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#cfe6f7' }}>
      <SeesawPark key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
