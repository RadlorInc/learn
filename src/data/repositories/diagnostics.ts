'use client'

/** Diagnostic + week-N re-check persistence and the guarantee-loop read models. */
import { db, classifySyncError, type SyncOutcome } from '@/data/repositories/_shared'

export interface DiagnosticPayload {
  learnerId:    string
  band:         string
  rootGap:      string | null
  secondGap:    string | null
  blocked:      string[]
  strengths:    string[]
  workingLevel: string
  planSkills:   string[]
  planChapters: string[]
  items:        { skill: string; correct: boolean }[]
  clientId:     string   // dedupe key — the same value on a queue re-flush makes the RPC idempotent
}

/**
 * Persist a completed diagnosis (session + items + plan) via the SECURITY DEFINER
 * `sync_diagnostic` RPC, which checks learner_access ownership server-side (mirrors syncSession).
 * Returns a SyncOutcome so the offline queue (useOfflineSync) can keep-and-retry a transient failure
 * instead of dropping the diagnosis — the row is load-bearing for the whole guarantee/re-check loop.
 *  - 'ok'    — saved (or already saved via client_id dedupe); drop from the queue
 *  - 'retry' — signed out now / network hiccup; keep queued, try again on next flush
 *  - 'drop'  — permanently rejected (learner gone / not owned); discard so it can't loop forever
 */
export async function saveDiagnostic(p: DiagnosticPayload): Promise<SyncOutcome> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'retry'   // session not resolved yet — keep it queued, don't lose it
  const { error } = await supabase.rpc('sync_diagnostic', {
    p_learner_id:    p.learnerId,
    p_band:          p.band,
    p_root_gap:      p.rootGap,
    p_second_gap:    p.secondGap,
    p_blocked:       p.blocked,
    p_strengths:     p.strengths,
    p_working_level: p.workingLevel,
    p_plan_skills:   p.planSkills,
    p_plan_chapters: p.planChapters,
    p_items:         p.items,
    p_client_id:     p.clientId,
  })
  if (error) {
    const outcome = classifySyncError(error)
    console.error(`[saveDiagnostic] rpc failed (${outcome === 'drop' ? 'permanent — discarding' : 'will retry'}):`, error.message)
    return outcome
  }
  return 'ok'
}

/** Step 8 — persist a week-N re-check result (did the root gap close?) via the sync_recheck RPC.
 *  Best-effort: returns false (never throws) if signed out or the RPC isn't deployed yet. The
 *  clientId makes the RPC idempotent against a double-fire / retry. */
export async function saveRecheck(p: { learnerId: string; week: number; skill: string; gapClosed: boolean; clientId: string }): Promise<boolean> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase.rpc('sync_recheck', {
    p_learner_id: p.learnerId, p_week: p.week, p_skill: p.skill, p_gap_closed: p.gapClosed, p_client_id: p.clientId,
  })
  if (error) { console.error('[saveRecheck] rpc failed:', error.message); return false }
  return true
}

/** The learner's most recent diagnosis (band + root gap) — powers the "re-check the gap" trigger. */
export async function getLatestGap(learnerId: string): Promise<{ band: string; rootGap: string | null } | null> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .select('band, root_gap_skill')
    .eq('learner_id', learnerId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return { band: data.band as string, rootGap: (data.root_gap_skill as string | null) ?? null }
}

/** Week-N re-check status for the guarantee loop: is a re-check DUE (a real gap, diagnosed ≥6 weeks
 *  ago, and not already closed by a later re-check)? Powers the in-app nudge on the parent dashboard. */
export async function getCheckupStatus(learnerId: string): Promise<
  { rootGap: string | null; band: string; weeksSince: number; recheckDue: boolean } | null
> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: sess } = await supabase
    .from('diagnostic_sessions')
    .select('band, root_gap_skill, completed_at')
    .eq('learner_id', learnerId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!sess) return null
  const completedAt = sess.completed_at ? new Date(sess.completed_at as string).getTime() : Date.now()
  const weeksSince = Math.floor((Date.now() - completedAt) / (7 * 86_400_000))
  const { data: rc } = await supabase
    .from('diagnostic_rechecks')
    .select('gap_closed')
    .eq('learner_id', learnerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const alreadyClosed = rc?.gap_closed === true
  const recheckDue = !!sess.root_gap_skill && weeksSince >= 6 && !alreadyClosed
  return { rootGap: (sess.root_gap_skill as string | null) ?? null, band: sess.band as string, weeksSince, recheckDue }
}
