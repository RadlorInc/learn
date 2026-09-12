'use client'

/**
 * The teacher's set work, on a child's screen.
 *
 * Rendered in both of the child's two modes: as a card at the top of the ordinary home screen for a
 * subscribed child, and as the entire screen for a child whose family has not subscribed.
 *
 * ⚠️ AN EXERCISE IS NOT A NEW KIND OF PLAY. It launches the ordinary chapter through the ordinary
 * path — the only thing it changes is the difficulty tier, and it changes that through the SAME
 * per-chapter tier store the adaptive loop already resumes from. There is no second player, no
 * second question generator and no second completion path.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHAPTER_NAMES, CHAPTER_EMOJIS, type ChapterType } from '@/core/chapters'
import { getLearnerExercises } from '@/data/repositories'
import { setChapterLevel } from '@/infra/storage/chapterLevel'
import { setPendingExercise } from '@/infra/storage/pendingExercise'
import { useMiloStore } from '@/state/store'
import type { Exercise } from '@/data/supabase/types'

export function ExerciseList({ learnerId, gradeId, only }: {
  learnerId: string
  gradeId: string | null
  /** True when this IS the screen rather than a card on it. */
  only?: boolean
}) {
  const router = useRouter()
  const startChapter = useMiloStore(s => s.startChapter)
  const [items, setItems] = useState<{ exercise: Exercise; done: boolean }[] | null>(null)

  useEffect(() => {
    let cancelled = false
    getLearnerExercises(learnerId, gradeId)
      .then(rows => { if (!cancelled) setItems(rows) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [learnerId, gradeId])

  function start(ex: Exercise) {
    // ⚠️ THE TEACHER'S DIFFICULTY, APPLIED THROUGH THE EXISTING TIER STORE. Every band resumes at
    // the tier it finds here, so writing it before navigating is the whole of "set the difficulty"
    // — no chapter had to change to support it.
    setChapterLevel(learnerId, ex.topic, ex.difficulty)
    setPendingExercise(ex.id)
    startChapter(ex.topic)
    router.push('/game')
  }

  if (items === null) return null                       // one frame, not a spinner
  if (!items.length) {
    if (!only) return null                              // no set work → no card at all
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px', color: '#57524B' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🌱</div>
        <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: '#1a1a1a' }}>Nothing to do yet</p>
        <p style={{ fontSize: 14.5, margin: 0, lineHeight: 1.5 }}>
          When your teacher sets some work it will show up right here.
        </p>
      </div>
    )
  }

  return (
    <section style={{ margin: only ? '0' : '0 0 18px' }}>
      <h2 style={{ fontSize: only ? 20 : 15, fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px' }}>
        {only ? 'Your work' : 'From your teacher'}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(({ exercise, done }) => (
          <button key={exercise.id} onClick={() => start(exercise)} style={{
            display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', width: '100%',
            padding: '13px 15px', borderRadius: 16, cursor: 'pointer',
            background: done ? '#F3F4F6' : '#FFF4D6',
            border: done ? '2px solid #E5E7EB' : '2px solid #F26B2C',
          }}>
            <span aria-hidden style={{ fontSize: 26 }}>{CHAPTER_EMOJIS[exercise.topic] ?? '📘'}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: '#1a1a1a' }}>
                {CHAPTER_NAMES[exercise.topic] ?? exercise.topic}
              </span>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#57524B', marginTop: 2 }}>
                {exercise.question_count} questions · {['Easy', 'Medium', 'Hard'][exercise.difficulty - 1]}
              </span>
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: done ? '#2F6F4F' : '#F26B2C', whiteSpace: 'nowrap' }}>
              {done ? 'Done ✓' : 'Start →'}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** The chapter ids the child may reach in exercises-only mode — nothing else opens. */
export function exerciseTopics(items: { exercise: Exercise }[]): ChapterType[] {
  return items.map(i => i.exercise.topic)
}
