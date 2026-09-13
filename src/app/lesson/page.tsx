'use client'
/** /lesson?id=g3m1-t1 — plays one new-flow lesson. Without a valid id, shows the topic list. */
import { Suspense, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { GRADE3_MODULE1 } from '@/features/lessons/grade3Module1'
import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { LessonList } from '@/features/lessons/LessonList'
import { markLessonDone } from '@/infra/storage/lessonProgress'

const noSubscribe = () => () => {}

export default function LessonPage() {
  // useSearchParams needs a Suspense boundary on a static page (next docs: use-search-params → Prerendering).
  return <Suspense fallback={null}><Lesson /></Suspense>
}

function Lesson() {
  const router = useRouter()
  // NOT window.location: on an in-app navigation that is read before the URL changes, so arriving from another page
  // showed the wrong screen. useSearchParams is the router's own value.
  const id = useSearchParams().get('id')
  // Progress lives in kv, which only exists in the browser.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  if (!mounted) return null

  const learnerId = getActiveLearner()?.id ?? null
  const lesson = GRADE3_MODULE1.find(l => l.id === id)
  if (!lesson) return <LessonList learnerId={learnerId} back={{ href: '/modules', label: '← Modules' }} />

  return (
    <LessonPlayer
      key={lesson.id}
      lesson={lesson}
      onFinish={() => markLessonDone(learnerId, lesson.id)}
      onExit={() => router.push('/lesson')}
    />
  )
}
