'use client'

/**
 * Read models for the parent dashboard (one round trip) and the legacy `sessions` rows.
 */
import { db } from '@/data/repositories/_shared'
import type { LearnerWithRole } from '@/data/repositories/learners'
import type { Learner, Session } from '@/data/supabase/types'

export async function getRecentSessions(learnerId: string, limit = 5): Promise<Session[]> {
  const supabase = db()
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('learner_id', learnerId)
    // ⚠️ completed_at, not started_at: the latter is nullable and a NULL sorts a brand-new
    // session to the wrong end. It was never an activity time. See fbf193280:docs/data-inventory.md.
    .order('completed_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as Session[]
}

// ─── Parent dashboard (single round trip) ─────────────────────

export interface DashboardEntry {
  learner:    LearnerWithRole
  sessions:   Session[]
}

/**
 * The whole parent dashboard in ONE RPC round trip (was 4 queries per learner). Returns:
 *  - the entries on success (empty array = signed in, no learners),
 *  - `null` to signal the caller should fall back to the per-learner path (RPC missing/errored).
 */
export async function getParentDashboard(): Promise<DashboardEntry[] | null> {
  const supabase = db()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase.rpc('get_parent_dashboard')
  if (error) { console.warn('[getParentDashboard] rpc failed, falling back:', error.message); return null }

  const rows = (data ?? []) as { learner: Learner; role: 'owner' | 'viewer'; sessions: Session[] | null }[]
  return rows.map(r => ({
    learner:  { ...r.learner, accessRole: r.role },
    sessions: r.sessions ?? [],
  }))
}
