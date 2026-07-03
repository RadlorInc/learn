'use client'

/**
 * Read models for stats, progress, sessions, shop state, and the aggregated
 * parent-dashboard / insights / menu-bootstrap round trips.
 */
import { db } from '@/data/repositories/_shared'
import type { LearnerWithRole } from '@/data/repositories/learners'
import type { Learner, LearnerStats, LearnerProgress, LearnerState, Session } from '@/data/supabase/types'

export async function getLearnerStats(learnerId: string): Promise<LearnerStats | null> {
  const supabase = db()
  const { data } = await supabase
    .from('learner_stats')
    .select('*')
    .eq('learner_id', learnerId)
    .single()
  return data as LearnerStats | null
}

export async function getLearnerProgress(learnerId: string): Promise<LearnerProgress[]> {
  const supabase = db()
  const { data } = await supabase
    .from('learner_progress')
    .select('*')
    .eq('learner_id', learnerId)
    .order('last_played_at', { ascending: false })
  return (data ?? []) as LearnerProgress[]
}

export async function getRecentSessions(learnerId: string, limit = 5): Promise<Session[]> {
  const supabase = db()
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('learner_id', learnerId)
    .order('started_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as Session[]
}

// ─── Parent dashboard (single round trip) ─────────────────────

export interface DashboardEntry {
  learner:    LearnerWithRole
  stats:      LearnerStats | null
  progress:   LearnerProgress[]
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

  const rows = (data ?? []) as {
    learner: Learner; role: 'owner' | 'viewer'
    stats: LearnerStats | null; progress: LearnerProgress[] | null; sessions: Session[] | null
  }[]
  return rows.map(r => ({
    learner:  { ...r.learner, accessRole: r.role },
    stats:    r.stats ?? null,
    progress: r.progress ?? [],
    sessions: r.sessions ?? [],
  }))
}

// ─── Insights rollup (server-side aggregation) ────────────────

export interface InsightsRollup {
  per_learner: { learner_id: string; first_ms: number | null; last_ms: number | null; sessions: number; active_days: number }[]
  accuracy:    { correct: number; wrong: number; practice_sessions: number }
  event_counts:{ chapter_open: number; practice_complete: number; lesson_skip: number; daily_open: number; daily_complete: number }
  daily_days:  { learner_id: string; created_at: string }[]
}

/**
 * Pre-aggregated retention/funnel data for /insights in ONE round trip — no raw session/event
 * rows shipped to the browser. Returns `null` to signal the caller should fall back to the legacy
 * raw-row path (RPC missing/errored). `sinceISO` bounds the window.
 */
export async function getInsightsRollup(sinceISO: string): Promise<InsightsRollup | null> {
  const supabase = db()
  const { data, error } = await supabase.rpc('get_insights_rollup', { p_since: sinceISO })
  if (error) { console.warn('[getInsightsRollup] rpc failed, falling back:', error.message); return null }
  return data as InsightsRollup
}

// Raw-row shapes for the legacy /insights fallback (when the rollup RPC is unavailable).
export interface InsightsSessionRow { learner_id: string; phase: string; correct_count: number; wrong_count: number; completed_at: string | null; started_at: string }
export interface InsightsEventRow   { learner_id: string; event: string; created_at: string }

/**
 * Legacy fallback for /insights: the raw session + event rows within the window, aggregated
 * client-side. Only used when getInsightsRollup returns null. Throws on a real query error
 * (the caller treats it as the page's error state).
 */
export async function getInsightsRawRows(
  learnerIds: string[],
  sinceISO: string,
): Promise<{ sessions: InsightsSessionRow[]; events: InsightsEventRow[] }> {
  const supabase = db()
  const [s, e] = await Promise.all([
    supabase.from('sessions').select('learner_id, phase, correct_count, wrong_count, completed_at, started_at').in('learner_id', learnerIds).gte('started_at', sinceISO),
    supabase.from('learner_events').select('learner_id, event, created_at').in('learner_id', learnerIds).gte('created_at', sinceISO),
  ])
  if (s.error) throw new Error(s.error.message)
  if (e.error) throw new Error(e.error.message)
  return { sessions: (s.data ?? []) as InsightsSessionRow[], events: (e.data ?? []) as InsightsEventRow[] }
}

// ─── Menu bootstrap (single round trip) ───────────────────────

export interface LearnerBootstrap {
  role:     'owner' | 'viewer'
  stats:    LearnerStats | null
  progress: LearnerProgress[]
  state:    LearnerState | null
}

export type BootstrapResult =
  | { status: 'ok'; data: LearnerBootstrap }
  | { status: 'no-auth' }     // not signed in / session not hydrated / transient error — leave local state
  | { status: 'no-access' }   // signed in, but this account has no access to the learner — stale/foreign

/**
 * One RPC for everything the menu needs: access role + stats + progress + shop
 * state. Replaces getMyAccessRole + getLearnerStats + getLearnerProgress +
 * getLearnerState (4 round trips → 1).
 *
 * Resolves the auth user first so we can tell "not signed in yet" (don't touch
 * the active learner) apart from "signed in but no access" (evict the stale
 * learner). A cold-start race must never bounce a valid learner.
 */
export async function getLearnerBootstrap(learnerId: string): Promise<BootstrapResult> {
  const supabase = db()
  // Local session read (no network). The RPC below is SECURITY DEFINER and does its own
  // auth.uid() ownership check, so this is only the "signed in at all?" gate — a null return
  // from the RPC still signals no-access.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { status: 'no-auth' }

  const { data, error } = await supabase.rpc('get_learner_bootstrap', { p_learner_id: learnerId })
  if (error) { console.error('[getLearnerBootstrap] rpc failed:', error.message); return { status: 'no-auth' } }
  if (!data) return { status: 'no-access' }

  const d = data as { role: 'owner' | 'viewer'; stats: LearnerStats | null; progress: LearnerProgress[] | null; state: LearnerState | null }
  return { status: 'ok', data: { role: d.role, stats: d.stats ?? null, progress: d.progress ?? [], state: d.state ?? null } }
}

// ─── Shop / coins state (cross-device) ────────────────────────

export async function getLearnerState(learnerId: string): Promise<LearnerState | null> {
  const supabase = db()
  const { data } = await supabase
    .from('learner_state')
    .select('*')
    .eq('learner_id', learnerId)
    .maybeSingle()
  return (data ?? null) as LearnerState | null
}

export async function saveLearnerState(
  learnerId: string,
  state: { coinsSpent: number; ownedItems: string[]; equippedItems: Record<string, string> },
): Promise<boolean> {
  const supabase = db()

  // learner_state is the only direct client write gated by RLS (progress/stats/
  // sessions all go through the sync_session SECURITY DEFINER RPC). The policy
  // requires auth.uid() to own the learner, so resolve the session first — this
  // both forces the singleton client to hydrate its session before we write and
  // lets us skip the write cleanly when genuinely signed out (expired token,
  // stale sessionStorage learner) instead of throwing an RLS error.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('learner_state')
    .upsert({
      learner_id:     learnerId,
      coins_spent:    state.coinsSpent,
      owned_items:    state.ownedItems,
      equipped_items: state.equippedItems,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'learner_id' })
  if (error) { console.error('[saveLearnerState] upsert failed:', error.message); return false }
  return true
}
