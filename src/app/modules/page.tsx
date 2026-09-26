'use client'
/** /modules?grade=4 — the child's home: grade tabs, then that grade's modules, each with Learn (the topic path) and Practice. */
import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getMyRole, signOut, getMyLearners, getClassMode, type ClassMode } from '@/data/repositories'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { ModuleHome } from '@/features/lessons/ModuleHome'
import { mustChangePassword } from '@/data/auth'

const noSubscribe = () => () => {}
// Only a free teacher's student needs it, and it carries every question ladder — keep it off everyone else's home.
const ExerciseHome = dynamic(() => import('@/features/classes/ExerciseHome').then(m => m.ExerciseHome), { ssr: false })

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
  // `grade=0` is KG, so `|| 3` would send KG to Grade 3; only a missing or unreadable value means the default.
  const asked = Number(useSearchParams().get('grade') ?? 3)
  const grade = Number.isInteger(asked) && asked >= 0 && asked <= 8 ? asked : 3
  const router = useRouter()
  // A child signed in as themselves has no dashboard to switch back to — they get Sign out instead.
  const [child, setChild] = useState(knownChild)
  useEffect(() => {
    getMyRole().then(r => r === 'learner').catch(() => false)   // cannot tell → the adult's button, as before
      .then(c => { knownChild = c; setChild(c) })
    // A child still on the temporary password from a class list (e.g. reopening the app) chooses their own first.
    mustChangePassword().then(m => { if (m) router.replace('/auth/new-password') }).catch(() => {})
  }, [router])
  // A child in a free teacher's class gets that class's exercises instead of lessons (features/classes). Asked fresh,
  // since a teacher may have put them in a class after they signed in; a child in no class never waits on it.
  const [mode, setMode] = useState<ClassMode | null>(null)
  const [showExercises, setShowExercises] = useState(false)   // a paid class's child, looking at the class's exercises
  useEffect(() => {
    const a = getActiveLearner()
    ;(a ? getMyLearners().then(all => all.find(l => l.id === a.id) ?? a).catch(() => a) : Promise.resolve(null))
      .then(me => me?.grade_id ? getClassMode(me) : { mode: 'lessons' as const })
      .then(setMode).catch(() => setMode({ mode: 'lessons' }))
  }, [])
  // A teacher opens an exercise when it is test time: a child in a class sees it within 20 seconds, without reloading.
  const classId = mode?.mode === 'exercises' ? mode.classId : mode?.classId
  useEffect(() => {
    const a = getActiveLearner()
    if (!classId || !a?.created_by) return
    const t = setInterval(() => {
      getClassMode({ grade_id: classId, created_by: a.created_by }).then(m => { if (m.mode !== 'lessons' || m.classId) setMode(m) }).catch(() => {})
    }, 20_000)
    return () => clearInterval(t)
  }, [classId])
  // Client-only (progress lives in kv): null on the server, true once mounted.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  if (!mounted || !mode) return null
  const learner = getActiveLearner()
  const signOutBtn = { label: 'Sign out', onClick: async () => { knownChild = undefined; await signOut(); router.replace('/auth') } }
  if (mode.mode === 'exercises') return <ExerciseHome learnerId={learner?.id ?? null} classId={mode.classId} className={mode.className} exercises={mode.exercises}
    back={child ? signOutBtn : undefined} />
  if (showExercises && mode.exercises) return <ExerciseHome learnerId={learner?.id ?? null} classId={mode.classId ?? null} className={mode.className ?? ''} exercises={mode.exercises}
    back={{ label: '← Lessons', onClick: () => setShowExercises(false) }} />
  return <ModuleHome key={grade} grade={grade}
    exercises={mode.exercises?.length ? { count: mode.exercises.length, onOpen: () => setShowExercises(true) } : undefined} learnerId={learner?.id ?? null} lessonIds={learner?.lesson_ids} back={child === undefined ? undefined
    : child ? signOutBtn
    : { href: '/parent', label: '← Switch' }} />
}
