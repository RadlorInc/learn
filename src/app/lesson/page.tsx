'use client'
/** /lesson?id=g3m1-t1 plays one new-flow lesson; /lesson?module=g3m2 shows that module's topic path (Module 1 without either). */
import { Suspense, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { findLesson, chosenModules } from '@/features/lessons/modules'
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
  const params = useSearchParams(), id = params.get('id'), moduleId = params.get('module')
  // Progress lives in kv, which only exists in the browser.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  if (!mounted) return null

  const learner = getActiveLearner(), learnerId = learner?.id ?? null
  const found = findLesson(id)
  if (!found) {
    // The topic path shows only the topics the parent chose (all of them when no choice was made).
    const mods = chosenModules(learner?.lesson_ids)
    const module = mods.find(x => x.id === moduleId && x.lessons.length > 0) ?? mods.find(x => x.lessons.length > 0)!
    return <LessonList module={module} learnerId={learnerId} back={{ href: `/modules?grade=${module.grade}`, label: '← Modules' }} />
  }
  const { lesson, module } = found

  return (
    <LessonPlayer
      key={lesson.id}
      lesson={lesson}
      learnerId={learnerId}
      earlier={module.lessons.slice(0, module.lessons.indexOf(lesson)).map(l => l.id)}
      onFinish={() => markLessonDone(learnerId, lesson.id)}
      onExit={() => router.push(`/lesson?module=${module.id}`)}
    />
  )
}
