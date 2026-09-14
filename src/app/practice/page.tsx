'use client'
/** /practice?module=g3m1 — mixed practice across every topic of one module. Without a built module, back to /modules. */
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { chosenModules } from '@/features/lessons/modules'
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
  const picked = chosenModules(getActiveLearner()?.lesson_ids).find(m => m.id === id && m.lessons.length > 0)
  useEffect(() => { if (!picked) router.replace('/modules') }, [picked, router])

  if (!picked) return null
  return <ModulePractice module={picked} onExit={() => router.push(`/modules?grade=${picked.grade}`)} />
}
