'use client'
/** /practice?module=g3m1 — mixed practice across every topic of one module. Without a built module, back to /modules. */
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATALOGUE, chooseFrom, useModule } from '@/features/lessons/catalogue'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { ModulePractice } from '@/features/lessons/ModulePractice'

export default function PracticePage() {
  // useSearchParams needs a Suspense boundary on a static page (next docs: use-search-params → Prerendering).
  return <Suspense fallback={null}><Practice /></Suspense>
}

function Practice() {
  const router = useRouter()
  // NOT window.location: on an in-app navigation it is read before the URL changes, which sent every Practice tap
  // straight back to /modules. useSearchParams is the router's own value.
  const id = useSearchParams().get('module')
  const ids = getActiveLearner()?.lesson_ids
  // Whether this module is one the child has, from the light catalogue; then only that module is loaded (PERF-01).
  const has = chooseFrom(CATALOGUE, ids).some(m => m.id === id && m.lessons.length > 0)
  useEffect(() => { if (!has) router.replace('/modules') }, [has, router])
  const whole = useModule(has ? id! : undefined)

  if (!has || !whole) return null
  const picked = chooseFrom([whole], ids)[0]
  return <ModulePractice module={picked} learnerId={getActiveLearner()?.id ?? null} onExit={() => router.push(`/modules?grade=${picked.grade}`)} />
}
