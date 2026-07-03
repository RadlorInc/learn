'use client'
/**
 * AreaPerimeterChapter (9–11) — find the area (count squares / l × w) or perimeter (add the
 * sides) of a rectangle — as the GridPlotter pre-teen "Number Lab" experience (see
 * story/GridPlotter.tsx + story/preteen/kit.tsx). A more grown-up shell than the 3–8
 * storybook chapters: crisp cool console, mono numerals, HUD chrome, Milo the explorer.
 * Reuses skill `areaPerimeter`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import GridPlotter from '@/features/chapters/story/GridPlotter'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import CelebrationModal from '@/shared/ui/CelebrationModal'

export default function AreaPerimeterChapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('areaPerimeter', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#0a1026' }}>
      <GridPlotter key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
