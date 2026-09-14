'use client'
/** /modules?grade=4 — the child's home: grade tabs, then that grade's modules, each with Learn (the topic path) and Practice. */
import { Suspense, useSyncExternalStore } from 'react'
import { useSearchParams } from 'next/navigation'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { ModuleHome } from '@/features/lessons/ModuleHome'

const noSubscribe = () => () => {}

export default function ModulesPage() {
  // useSearchParams needs a Suspense boundary on a static page (next docs: use-search-params → Prerendering).
  return <Suspense fallback={null}><Modules /></Suspense>
}

function Modules() {
  const grade = Number(useSearchParams().get('grade')) || 3
  // Client-only (progress lives in kv): null on the server, true once mounted.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  if (!mounted) return null
  const learner = getActiveLearner()
  return <ModuleHome key={grade} grade={grade} learnerId={learner?.id ?? null} lessonIds={learner?.lesson_ids} back={{ href: '/parent', label: '← Switch' }} />
}
