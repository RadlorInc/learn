'use client'

/**
 * The rest of what a parent is owed when they ask for a copy.
 *
 * ⚠️ WHY THIS EXISTS. The published privacy copy says a parent may "download a copy of
 * everything we hold about your child", and names "their answers to the placement check" among
 * the things stored. The export returned learner + stats + progress + sessions — it omitted the
 * diagnostic entirely (14 sessions, 166 answers) and every analytics event (2,024 rows). Under
 * COPPA a parent's right to REVIEW what was collected from their child is exactly what that
 * button is, so a subset is a live misstatement, not a nice-to-have.
 *
 * ⚠️ FETCHED ON DEMAND, NOT ADDED TO THE DASHBOARD LOAD. DataRights' own note says the export
 * is "a serialize of what is on screen" with no new queries — true, and the reason was to avoid
 * a second copy of the access rule. That reason is preserved here: every read below goes through
 * a policy the parent ALREADY has (diag_sessions_read / diag_items_read / diag_plans_read /
 * diag_progress_read / diag_rechecks_read / learner_events_select / "learner_state: parent
 * access"), so this adds no RLS surface — only reads. Doing it at click time keeps the
 * dashboard's first paint unchanged for the ~100% of visits that never press it.
 */
import { db } from '@/data/repositories/_shared'

export interface ExportExtras {
  learnerState:      unknown
  events:            unknown[]
  diagnosticSessions: unknown[]
  diagnosticAnswers:  unknown[]
  diagnosticPlans:    unknown[]
  diagnosticPlanProgress: unknown[]
  diagnosticRechecks: unknown[]
}

/** Empty-but-shaped, so a failed fetch still produces a valid file rather than nothing. */
const EMPTY: ExportExtras = {
  learnerState: null, events: [], diagnosticSessions: [], diagnosticAnswers: [],
  diagnosticPlans: [], diagnosticPlanProgress: [], diagnosticRechecks: [],
}

/**
 * Everything the dashboard has NOT already loaded, for one learner.
 *
 * ⚠️ diagnostic_items and diagnostic_plan_progress are reached through their parents
 * (session_id / plan_id) because that is how their RLS policies are written — there is no
 * learner_id column on either to filter by.
 */
export async function getLearnerExportExtras(learnerId: string): Promise<ExportExtras> {
  const supabase = db()
  try {
    const [state, events, sessions, plans, rechecks] = await Promise.all([
      supabase.from('learner_state').select('*').eq('learner_id', learnerId).maybeSingle(),
      supabase.from('learner_events').select('*').eq('learner_id', learnerId).order('created_at'),
      supabase.from('diagnostic_sessions').select('*').eq('learner_id', learnerId).order('started_at'),
      supabase.from('diagnostic_plans').select('*').eq('learner_id', learnerId).order('created_at'),
      supabase.from('diagnostic_rechecks').select('*').eq('learner_id', learnerId).order('created_at'),
    ])

    const sessionIds = (sessions.data ?? []).map((s: { id: string }) => s.id)
    const planIds    = (plans.data    ?? []).map((p: { id: string }) => p.id)

    const [answers, planProgress] = await Promise.all([
      sessionIds.length
        ? supabase.from('diagnostic_items').select('*').in('session_id', sessionIds).order('ordinal')
        : Promise.resolve({ data: [] }),
      planIds.length
        ? supabase.from('diagnostic_plan_progress').select('*').in('plan_id', planIds)
        : Promise.resolve({ data: [] }),
    ])

    return {
      learnerState:           state.data ?? null,
      events:                 events.data ?? [],
      diagnosticSessions:     sessions.data ?? [],
      diagnosticAnswers:      answers.data ?? [],
      diagnosticPlans:        plans.data ?? [],
      diagnosticPlanProgress: planProgress.data ?? [],
      diagnosticRechecks:     rechecks.data ?? [],
    }
  } catch {
    // A parent exercising a data right must still get a file. An empty section is visibly
    // empty; a failed download looks like the right does not work.
    return EMPTY
  }
}
