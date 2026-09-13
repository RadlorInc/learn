'use client'
/** /modules — the child's home: Grade 3 modules, each with Learn (the topic path) and Practice (mixed problems). */
import { useSyncExternalStore } from 'react'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { ModuleHome } from '@/features/lessons/ModuleHome'

const noSubscribe = () => () => {}

export default function ModulesPage() {
  // Client-only (progress lives in kv): null on the server, true once mounted.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  if (!mounted) return null
  return <ModuleHome learnerId={getActiveLearner()?.id ?? null} back={{ href: '/parent', label: '← Switch' }} />
}
