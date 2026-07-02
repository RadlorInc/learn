'use client'
/**
 * Shapes2D3DChapter (6–8) — name shapes / count sides (2D SVG + real 3D solids) as the ShapeStudio
 * story mode. Same shape as the other 6–8 story wrappers: keep the story portal mounted and render
 * the celebration over it. The pedagogy lives in the tap-the-shape / how-many-sides experience
 * (see story/ShapeStudio.tsx — Art Studio / Build Site / Playroom). Reuses skill `shapes2d3d`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ShapeStudio from '@/components/story/ShapeStudio'
import { useChapterSync } from '@/lib/supabase/useChapterSync'
import CelebrationModal from '@/components/ui/CelebrationModal'

export default function Shapes2D3DChapter(_props: { onComplete: (correct: number, wrong: number) => void; childName: string }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('shapes2d3d', correct, wrong, 'practice', mastered)
  }, [finishAndSync])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#efe6d8' }}>
      <ShapeStudio key={runKey} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}
