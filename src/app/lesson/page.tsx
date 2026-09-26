'use client'
/** /lesson?id=g3m1-t1 plays one new-flow lesson (`&practice=1`: straight into its practice); /lesson?module=g3m2 shows that
 *  module's topic path (Module 1 without either), and `&summary=1` its summary once every topic the child has is done. */
import { Suspense, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { CATALOGUE, chooseFrom, moduleIdOf, useModule, ladderOf } from '@/features/lessons/catalogue'
import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { LessonList } from '@/features/lessons/LessonList'
import { ModuleSummary } from '@/features/lessons/ModuleSummary'
import { markLessonDone, lessonDone } from '@/infra/storage/lessonProgress'
import { syncLesson } from '@/infra/storage/lessonSync'
import { loadStanding } from '@/infra/storage/lessonStanding'
import { loadRun } from '@/infra/storage/lessonRun'
import { nudgeShownToday } from '@/infra/storage/nudgeSeen'
import { nudgeFor } from '@/features/lessons/nudge'

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
  const practiceFirst = params.get('practice') === '1', summary = params.get('summary') === '1'
  // Progress lives in kv, which only exists in the browser.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const learner = mounted ? getActiveLearner() : null, learnerId = learner?.id ?? null
  // Which module this screen needs, from the light catalogue: the topic's own, else the topic path's — only the topics
  // the parent chose (all of them when no choice was made). Then only THAT module is loaded (PERF-01).
  const lessonModule = moduleIdOf(id)
  const chosen = chooseFrom(CATALOGUE, learner?.lesson_ids)
  const pathModule = chosen.find(x => x.id === moduleId && x.lessons.length > 0) ?? chosen.find(x => x.lessons.length > 0)!
  const whole = useModule(mounted ? lessonModule ?? pathModule.id : undefined)
  if (!mounted || !whole) return null

  const lesson = whole.lessons.find(l => l.id === id)
  if (!lesson) {
    const path = chooseFrom([whole], learner?.lesson_ids)[0]
    // The summary only for a module that is really complete; otherwise the topic path (a stale or typed link).
    if (summary && path.lessons.every(l => lessonDone(learnerId, l.id))) {
      return <ModuleSummary module={whole} lessons={path.lessons} learnerId={learnerId} />
    }
    return <LessonList module={path} learnerId={learnerId} due={learner?.lesson_due} back={{ href: `/modules?grade=${path.grade}`, label: '← Modules' }} />
  }

  return (
    <LessonPlayer
      key={lesson.id}
      lesson={lesson}
      learnerId={learnerId}
      earlier={whole.lessons.slice(0, whole.lessons.indexOf(lesson)).map(l => l.id)}
      // The module is done when every topic of it this child HAS (their chosen ones) is finished; this one counts, it is ending.
      moduleDone={() => (chooseFrom([whole], learner?.lesson_ids)[0]?.lessons ?? whole.lessons)
        .every(l => l.id === lesson.id || lessonDone(learnerId, l.id))}
      onFinish={() => { markLessonDone(learnerId, lesson.id); syncLesson(learnerId, lesson.id) }}
      onExit={() => router.push(`/lesson?module=${whole.id}`)}
      // Signed-in children only: the nudge reads the child's own standing on the previous topic.
      nudge={learnerId && !practiceFirst ? nudgeFor(lesson, whole, {
        lessonIds: learner?.lesson_ids, due: learner?.lesson_due, standingOf: x => loadStanding(learnerId, x), levelsOf: x => ladderOf(x)?.length,
        started: !!loadRun(learnerId, lesson.id), shownToday: nudgeShownToday(learnerId, lesson.id),
      }) : null}
      onPractise={prev => router.push(`/lesson?id=${prev}`)}
      practiceFirst={practiceFirst}
      onModuleComplete={() => router.push(`/lesson?module=${whole.id}&summary=1`)}
    />
  )
}
