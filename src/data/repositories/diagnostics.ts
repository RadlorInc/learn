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
 * Cold-funnel lead capture: record the email a logged-out visitor gives before the checkup, so a
 * visitor who never signs up is still counted. Best-effort + fire-and-forget — never blocks or throws
 * (the checkup starts regardless).
 *
 * ⚠️ VIA OUR OWN ROUTE, NOT STRAIGHT INTO THE TABLE. This used to insert with the anon key, which is
 * public by design — so the write was an open, unlimited, unauthenticated endpoint that anyone could
 * POST for ever (launch-plan finding #9). `/api/lead` rate-limits by IP and validates the address;
 * the anon INSERT grant is revoked by `20260823221818_leads_server_only.sql`.
 */
export async function captureDiagnosticLead(email: string, band: string): Promise<void> {
  try {
    await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.slice(0, 254), band }),
      keepalive: true,   // the checkup navigates immediately after; without this the POST is cancelled
    })
  } catch { /* best-effort — a failed lead capture must never stop the checkup */ }
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
/**
 * Record that a probe STARTED. Before 2026-09-05 nothing did, so `diagnostic_sessions` held only
 * completions — 13 of 13 rows with `completed_at = started_at` exactly — and "how many start the
 * check vs finish it" had no denominator: it could only ever return 100%.
 *
 * Best-effort and deliberately NOT queued: an unrecorded start costs one row in a funnel, while
 * blocking or retrying it would delay a child getting to their first question. A failure IS
 * reported, though — a silently swallowed write is what hid the missing login history for six weeks.
 *
 * ⚠️ Returns false for a signed-out visitor. `/diagnostic` is reachable logged-out (lead capture),
 * and there is no learner to attach a start to, so anonymous starts are genuinely not counted.
 */
export async function startDiagnostic(learnerId: string, band: string, clientId: string): Promise<boolean> {
  const supabase = db()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return false
  const { error } = await supabase.rpc('start_diagnostic', {
    p_learner_id: learnerId, p_band: band, p_client_id: clientId,
  })
  if (error) { console.error('[startDiagnostic] rpc failed:', error.message); return false }
  return true
}

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
    // ⚠️ an in-progress row has completed_at NULL, and a NULL sorts FIRST under DESC in Postgres —
    // without this filter an abandoned probe becomes "the latest diagnosis", with no gap.
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return { band: data.band as string, rootGap: (data.root_gap_skill as string | null) ?? null }
}

/**
 * The learner's active plan chapter sequence, from the server.
 *
 * ⚠️ THIS IS WHAT MAKES THE PLAN SURVIVE A DEVICE SWITCH. The walkable pointer is localStorage, so
 * a parent who ran the check on a phone and handed over a tablet previously got no plan card at
 * all. Read-only and gated by the table's own RLS (`diag_plans_read`, via `learner_access`), so it
 * needs no new grant, no migration and no second write path — `reconcilePlan` derives the position
 * from `learner_progress`, which is already synced.
 */
export async function getActivePlanChapters(learnerId: string): Promise<string[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('diagnostic_plans')
    .select('chapter_sequence')
    .eq('learner_id', learnerId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  // Best-effort: no plan, no access or no network just means the local pointer stands.
  if (error || !data) return []
  return (data.chapter_sequence as string[] | null) ?? []
}

/** The latest check-up, as the bootstrap RPC and the two direct selects both return it. */
export interface CheckupRow { band: string; root_gap_skill: string | null; completed_at: string | null }
export interface CheckupStatus { rootGap: string | null; band: string; weeksSince: number; recheckDue: boolean }

/**
 * The week-N rule, in one place: a re-check is DUE when there is a real gap, it was diagnosed at
 * least six weeks ago, and no later re-check has closed it. Pure, so the menu (which now gets the
 * rows inside `get_learner_bootstrap`) and the parent dashboard (`getCheckupStatus`) cannot drift.
 * A check-up with no `completed_at` counts as now — week zero.
 */
export function checkupStatus(sess: CheckupRow | null, alreadyClosed: boolean, now = Date.now()): CheckupStatus | null {
  if (!sess) return null
  const completedAt = sess.completed_at ? new Date(sess.completed_at).getTime() : now
  const weeksSince = Math.floor((now - completedAt) / (7 * 86_400_000))
  const recheckDue = !!sess.root_gap_skill && weeksSince >= 6 && !alreadyClosed
  return { rootGap: sess.root_gap_skill ?? null, band: sess.band, weeksSince, recheckDue }
}

/** Week-N re-check status for the guarantee loop — the parent dashboard's nudge. The menu no longer
 *  calls this: its rows ride inside `get_learner_bootstrap`. Two reads, gated by the tables' own RLS.
 *  ⚠️ `getSession()` is a local read; `getUser()` was a round trip to GoTrue on every menu load that
 *  bought nothing — RLS is the boundary on the reads below, exactly as `getMyLearners` says. */
export async function getCheckupStatus(learnerId: string): Promise<CheckupStatus | null> {
  const supabase = db()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  const { data: sess } = await supabase
    .from('diagnostic_sessions')
    .select('band, root_gap_skill, completed_at')
    .eq('learner_id', learnerId)
    .eq('status', 'completed')   // ⚠️ see getLatestGap — a NULL completed_at sorts first under DESC
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!sess) return null
  const { data: rc } = await supabase
    .from('diagnostic_rechecks')
    .select('gap_closed')
    .eq('learner_id', learnerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return checkupStatus(sess as CheckupRow, rc?.gap_closed === true)
}
