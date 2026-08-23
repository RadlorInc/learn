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
  /** Empty when everything came back whole. Anything in here is printed IN the file. */
  notes:             string[]
}

/**
 * ⚠️ THE ONLY UNBOUNDED SECTION, SO IT IS THE ONLY ONE WITH A CAP.
 *
 * Measured on production 2026-08-24: the heaviest learner is 545 events / 165 kB, and events are
 * **96% of the payload**. Two things bound it in practice and one does not:
 *   · `learner_events` prunes at 90 days, so volume is bounded by activity in a 90-day window
 *     rather than by account age — a year of history is not something this table can hold.
 *   · `pgrst.db_max_rows` is UNSET on this project, so PostgREST will NOT silently truncate.
 *     (Worth knowing: that also makes the `getInsightsRawRows` concern in the launch audit
 *     milder than it was filed as.)
 *   · but `authenticated` carries `statement_timeout = 8s`. THAT is the real failure mode, and
 *     before this cap the catch below turned it into an EMPTY section with nothing said — a
 *     parent would get a file labelled "everything we hold" that quietly held less.
 *
 * 5,000 is ~55 events a day for the full 90 days: comfortably above any real child and an order
 * of magnitude above today's heaviest. If it is ever hit, the file SAYS SO rather than pretending.
 */
const EVENTS_CAP = 5000

/** Empty-but-shaped, so a failed fetch still produces a valid file rather than nothing. */
const EMPTY: ExportExtras = {
  learnerState: null, events: [], diagnosticSessions: [], diagnosticAnswers: [],
  diagnosticPlans: [], diagnosticPlanProgress: [], diagnosticRechecks: [],
  notes: ['We could not read part of this data. Nothing has been deleted — please try again, or write to us and we will send it.'],
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
      supabase.from('learner_events').select('*').eq('learner_id', learnerId).order('created_at').limit(EVENTS_CAP),
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

    const eventRows: unknown[] = events.data ?? []
    const notes: string[] = []
    // ⚠️ rows === cap cannot distinguish "exactly that many" from "more than that", so say the
    // honest thing rather than guessing. A file that reports its own limit beats one that hides it.
    if (eventRows.length >= EVENTS_CAP) {
      notes.push(`The activity log here is the most recent ${EVENTS_CAP} entries and there may be more. Activity older than 90 days is deleted automatically. Write to us if you need the rest.`)
    }

    return {
      notes,
      learnerState:           state.data ?? null,
      events:                 eventRows,
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
