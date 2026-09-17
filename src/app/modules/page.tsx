'use client'
/** /modules?grade=4 — the child's home: grade tabs, then that grade's modules, each with Learn (the topic path) and Practice. */
import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMyRole, signOut } from '@/data/repositories'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { ModuleHome } from '@/features/lessons/ModuleHome'

const noSubscribe = () => () => {}

export default function ModulesPage() {
  // useSearchParams needs a Suspense boundary on a static page (next docs: use-search-params → Prerendering).
  return <Suspense fallback={null}><Modules /></Suspense>
}

function Modules() {
  const grade = Number(useSearchParams().get('grade')) || 3
  const router = useRouter()
  // A child signed in as themselves has no dashboard to switch back to — they get Sign out instead.
  const [child, setChild] = useState(false)
  useEffect(() => { getMyRole().then(r => setChild(r === 'learner')).catch(() => {}) }, [])
  // Client-only (progress lives in kv): null on the server, true once mounted.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  if (!mounted) return null
  const learner = getActiveLearner()
  return <ModuleHome key={grade} grade={grade} learnerId={learner?.id ?? null} lessonIds={learner?.lesson_ids} back={child ? { label: 'Sign out', onClick: async () => { await signOut(); router.replace('/auth') } } : { href: '/parent', label: '← Switch' }} />
}
