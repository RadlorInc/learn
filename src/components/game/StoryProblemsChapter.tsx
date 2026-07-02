'use client'
/**
 * StoryProblemsChapter (6–8) — word problems as the StoryTime story mode.
 *
 * Same shape as the other 6–8 story wrappers: keep the story portal mounted and render
 * the celebration over it. The pedagogy lives in the hear-a-story / watch-it-happen /
 * tap-the-answer experience (see story/StoryTime.tsx — Picnic Meadow / Coral Reef /
 * Fun Fair; add · take-away · how-many-more). Reuses skill `storyProblems`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StoryTime from '@/components/story/StoryTime'
import { useChapterSync } from '@/lib/supabase/useChapterSync'
import CelebrationModal from '@/components/ui/CelebrationModal'

export default function StoryProblemsChapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('storyProblems', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#f3ead8' }}>
      <StoryTime key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
