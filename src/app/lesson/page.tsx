'use client'
/** /lesson?id=g3m1-t1 — plays one new-flow lesson. Without a valid id, shows the topic list. */
import { useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { GRADE3_MODULE1 } from '@/features/lessons/grade3Module1'
import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { LessonList } from '@/features/lessons/LessonList'
import { markLessonDone } from '@/infra/storage/lessonProgress'

const noSubscribe = () => () => {}

export default function LessonPage() {
  const router = useRouter()
  // A static page has no search params at build time: null on the server, the real query on the client.
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => null)
  if (search === null) return null

  const learnerId = getActiveLearner()?.id ?? null
  const lesson = GRADE3_MODULE1.find(l => l.id === new URLSearchParams(search).get('id'))
  if (!lesson) return <LessonList learnerId={learnerId} back={{ href: '/menu', label: '← Menu' }} />

  return (
    <LessonPlayer
      key={lesson.id}
      lesson={lesson}
      onFinish={() => markLessonDone(learnerId, lesson.id)}
      onExit={() => router.push('/menu')}
    />
  )
}
