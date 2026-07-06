'use client'

/** Orchestration hook for the class triage view — mirrors features/insights/useInsights.ts:
 *  a small load state machine that fetches the grade's learners + their latest root
 *  gaps and groups them by shared need. */
import { useState, useEffect, useCallback } from 'react'
import { getGradeTriage } from '@/data/repositories/grades'
import { groupByRootGap, type TriageGroup } from './groupByRootGap'

type TriageState = 'loading' | 'ready' | 'error'

export interface UseGradeTriage {
  state: TriageState
  gradeName: string
  groups: TriageGroup[]
  total: number          // learners in the grade
  checked: number        // learners with a completed diagnostic
  reload: () => void
}

export function useGradeTriage(gradeId: string): UseGradeTriage {
  const [state, setState] = useState<TriageState>('loading')
  const [gradeName, setGradeName] = useState('')
  const [groups, setGroups] = useState<TriageGroup[]>([])
  const [total, setTotal] = useState(0)
  const [checked, setChecked] = useState(0)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const data = await getGradeTriage(gradeId)
      if (!data) { setState('error'); return }
      setGradeName(data.grade.name)
      setTotal(data.learners.length)
      setChecked(data.learners.filter(l => l.checked).length)
      setGroups(groupByRootGap(data.learners))
      setState('ready')
    } catch {
      setState('error')
    }
  }, [gradeId])

  useEffect(() => { load() }, [load])

  return { state, gradeName, groups, total, checked, reload: load }
}
