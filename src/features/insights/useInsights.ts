'use client'

/**
 * Insights data-orchestration hook. Owns the load state machine and wires the
 * repositories + auth adapter to the pure metric functions. The page consumes
 * `{ state, metrics, reload }` and renders — no data access in the UI.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/data/auth'
import { getMyLearners, getInsightsRollup, getInsightsRawRows } from '@/data/repositories'
import { DAY, WINDOW_DAYS, computeMetrics, computeMetricsFromRollup, type Metrics, type Sess, type Evt } from '@/features/insights/metrics'

export type InsightsState = 'loading' | 'ready' | 'no-auth' | 'error'

export function useInsights() {
  const router = useRouter()
  const [state, setState] = useState<InsightsState>('loading')
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  async function load() {
    try {
      // Local session read (no auth-server round trip) — RLS still guards the RPC/reads below.
      const session = await getCurrentSession()
      if (!session?.user) { setState('no-auth'); return }
      const ls = await getMyLearners()
      const ids = ls.map(l => l.id)
      const since = new Date(Date.now() - WINDOW_DAYS * DAY).toISOString()

      if (!ids.length) { setMetrics(computeMetrics(ls, [], [])); setState('ready'); return }

      // Fast path: one RPC returns pre-aggregated rollups (no raw rows). Falls back to the legacy
      // client-side aggregation if the RPC is unavailable, so the page never hard-fails on rollout.
      const rollup = await getInsightsRollup(since)
      if (rollup) {
        setMetrics(computeMetricsFromRollup(ls, rollup))
      } else {
        const { sessions, events } = await getInsightsRawRows(ids, since)
        setMetrics(computeMetrics(ls, sessions as Sess[], events as Evt[]))
      }
      setState('ready')
    } catch (err) {
      console.warn('[insights] load failed:', err)
      setState('error')
    }
  }

  useEffect(() => { load() }, [])                                             // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (state === 'no-auth') router.replace('/auth') }, [state, router])

  const reload = () => { setState('loading'); load() }
  return { state, metrics, reload }
}
