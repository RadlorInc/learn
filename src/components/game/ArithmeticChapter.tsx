'use client'
/**
 * ArithmeticChapter (6–8) — two-digit add/subtract to 100 as the BlockYard story mode.
 *
 * One parameterized story wrapper; AdditionTo100Chapter / SubtractionTo100Chapter pass the operation.
 * Same shape as the other 6–8 story wrappers: keep the story portal mounted and render the
 * celebration over it. The pedagogy lives in the base-ten "tens then ones" experience (see
 * story/BlockYard.tsx). Reuses skills `additionTo100` / `subtractionTo100`.
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BlockYard from '@/components/story/BlockYard'
import type { Op } from '@/components/lessons/ArithmeticLesson'
import { useChapterSync } from '@/lib/supabase/useChapterSync'
import CelebrationModal from '@/components/ui/CelebrationModal'

interface Props { onComplete: (correct: number, wrong: number) => void; childName: string }

function ArithStory({ op, skill }: { op: Op; skill: 'additionTo100' | 'subtractionTo100' }) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body) }, [])

  const finish = useCallback((correct: number, wrong: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync(skill, correct, wrong, 'practice', mastered)
  }, [finishAndSync, skill])

  const restart = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#dbe8ef' }}>
      <BlockYard key={runKey} op={op} onFinish={finish} onExit={() => router.push('/menu')} />
      <CelebrationModal onExit={() => router.push('/menu')} onPlayAgain={restart} />
    </div>,
    body,
  )
}

export function AdditionTo100Chapter(_p: Props) { return <ArithStory op="+" skill="additionTo100" /> }
export function SubtractionTo100Chapter(_p: Props) { return <ArithStory op="-" skill="subtractionTo100" /> }
