'use client'
/** /modules?grade=4 — the child's home: grade tabs, then that grade's modules, each with Learn (the topic path) and Practice. */
import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMyRole, signOut } from '@/data/repositories'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { ModuleHome } from '@/features/lessons/ModuleHome'
import { mustChangePassword } from '@/data/auth'

const noSubscribe = () => () => {}

/**
 * The account's role, remembered for this page load. Asking the server on every visit showed "← Switch" for a moment
 * before it turned into "Sign out" for a child; now the corner stays empty until the role is known, and a second visit
 * (back from a topic) is instant. Still re-asked each visit, so a different account signing in corrects it.
 */
let knownChild: boolean | undefined

export default function ModulesPage() {
  // useSearchParams needs a Suspense boundary on a static page (next docs: use-search-params → Prerendering).
  return <Suspense fallback={null}><Modules /></Suspense>
}

function Modules() {
  const grade = Number(useSearchParams().get('grade')) || 3
  const router = useRouter()
  // A child signed in as themselves has no dashboard to switch back to — they get Sign out instead.
  const [child, setChild] = useState(knownChild)
  useEffect(() => {
    getMyRole().then(r => r === 'learner').catch(() => false)   // cannot tell → the adult's button, as before
      .then(c => { knownChild = c; setChild(c) })
    // A child still on the temporary password from a class list (e.g. reopening the app) chooses their own first.
    mustChangePassword().then(m => { if (m) router.replace('/auth/new-password') }).catch(() => {})
  }, [router])
  // Client-only (progress lives in kv): null on the server, true once mounted.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  if (!mounted) return null
  const learner = getActiveLearner()
  return <ModuleHome key={grade} grade={grade} learnerId={learner?.id ?? null} lessonIds={learner?.lesson_ids} back={child === undefined ? undefined
    : child ? { label: 'Sign out', onClick: async () => { knownChild = undefined; await signOut(); router.replace('/auth') } }
    : { href: '/parent', label: '← Switch' }} />
}
