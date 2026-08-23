import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { buildExport } from '@/shared/ui/DataRights'

/**
 * ⚠️ "DOWNLOAD A COPY OF EVERYTHING WE HOLD ABOUT YOUR CHILD" MUST STAY TRUE.
 *
 * It was not. The export returned learner + stats + progress + sessions and silently omitted the
 * whole diagnostic (14 sessions, 166 answers) and every analytics event (2,024 rows) — while the
 * privacy policy explicitly names "their answers to the placement check" as data we store. Under
 * COPPA that button is the parent's right to review what was collected from their child, so a
 * subset is a live misstatement.
 *
 * The failure mode is DRIFT: someone adds a child-data table in six months and nothing notices
 * the export got smaller relative to the promise. So the table list is DERIVED from the schema
 * rather than written here — every table carrying learner data must be either exported or
 * explicitly excluded with a reason, and a new one is a build failure until somebody decides.
 */
const ROOT = join(__dirname, '../..')
const sql = [
  readFileSync(join(ROOT, 'supabase/schema/baseline_schema.sql'), 'utf8'),
  ...readdirSync(join(ROOT, 'supabase/migrations')).filter(f => f.endsWith('.sql'))
    .map(f => readFileSync(join(ROOT, 'supabase/migrations', f), 'utf8')),
].join('\n')

/** Tables whose rows describe one child: they carry learner_id, or hang off one that does. */
const CHILD_DATA_TABLES = (() => {
  const found = new Set<string>()
  for (const m of sql.matchAll(/create table (?:if not exists )?public\.([a-z_]+)\s*\(([\s\S]*?)\n\);/g)) {
    if (/\blearner_id\b/.test(m[2])) found.add(m[1])
  }
  // Reached through a parent key rather than learner_id — the RLS policies join the same way.
  found.add('diagnostic_items')          // → diagnostic_sessions.session_id
  found.add('diagnostic_plan_progress')  // → diagnostic_plans.plan_id
  return found
})()

/** Each covered table and the export key that carries it. */
const EXPORTED: Record<string, string> = {
  learners:                 'learner',
  learner_stats:            'stats',
  learner_progress:         'chapterProgress',
  sessions:                 'sessions',
  learner_state:            'shopState',
  learner_events:           'activityEvents',
  diagnostic_sessions:      'placementChecks',
  diagnostic_items:         'placementCheckAnswers',
  diagnostic_plans:         'learningPlans',
  diagnostic_plan_progress: 'learningPlanProgress',
  diagnostic_rechecks:      'gapRechecks',
}

/** Deliberately out, each with the reason it is out. Adding to this list is a decision. */
const EXCLUDED: Record<string, string> = {
  // Crash telemetry, not child work. RLS on with zero policies, so a parent CANNOT read it even
  // with their own token — exporting it would need the service-role key and a second access path.
  // Pruned at 90 days, and its learner_id gains an ON DELETE SET NULL fkey in Stage 1.
  error_events: 'service-role only; a parent cannot read it, and it is crash telemetry not child data',
  // The access-control edge itself (which adult may see this child), not data about the child.
  learner_access: 'an authorisation edge between adults, not child data',
  // ⚠️ Flagged by this gate on its first run, which is the gate working. It carries learner_id,
  // but a row is an invitation from the owner to ANOTHER ADULT and holds that adult's email —
  // third-party PII. Handing it out inside a child-data export would disclose someone else's
  // address to satisfy a right that is about the child.
  learner_invites: "an invitation to another adult; contains a third party's email address",
}

describe('the data export covers every child-data table', () => {
  it('derives a non-empty table list from the schema (else this whole file is vacuous)', () => {
    expect(CHILD_DATA_TABLES.size).toBeGreaterThan(5)
  })

  it('exports or explicitly excludes every child-data table', () => {
    const undecided = [...CHILD_DATA_TABLES].filter(t => !(t in EXPORTED) && !(t in EXCLUDED)).sort()
    expect(undecided, `these carry child data and are neither exported nor excluded — decide, do not ignore:\n  ${undecided.join('\n  ')}`).toEqual([])
  })

  it('actually emits every key it claims to', () => {
    // ⚠️ The list above is a claim about buildExport. Drive the real function so the claim cannot
    // drift from the code — a table mapped to a key that no longer exists would otherwise pass.
    const out = buildExport('Test', { learner: {}, stats: {}, progress: [], sessions: [] }, {
      learnerState: {}, events: [], diagnosticSessions: [], diagnosticAnswers: [],
      diagnosticPlans: [], diagnosticPlanProgress: [], diagnosticRechecks: [], notes: [],
    })
    const missing = Object.entries(EXPORTED).filter(([, key]) => !(key in out)).map(([t, k]) => `${t} → ${k}`)
    expect(missing, `buildExport does not emit:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('says so in the file when a section was capped or unreadable', () => {
    // ⚠️ The failure this guards is silent partial success: before the cap, an 8s
    // statement_timeout on the events fetch was caught and turned into an EMPTY section, so a
    // parent got a file labelled "everything we hold" that quietly held less. Measured on prod:
    // events are 96% of the payload, so they are the section that can actually blow the timeout.
    const whole = buildExport('Test', { learner: {}, stats: {}, progress: [], sessions: [] }, {
      learnerState: null, events: [], diagnosticSessions: [], diagnosticAnswers: [],
      diagnosticPlans: [], diagnosticPlanProgress: [], diagnosticRechecks: [], notes: [],
    }) as { completeness: { complete: boolean; notes: string[] } }
    expect(whole.completeness.complete, 'a whole export must not claim to be partial').toBe(true)

    const partial = buildExport('Test', { learner: {}, stats: {}, progress: [], sessions: [] }, {
      learnerState: null, events: [], diagnosticSessions: [], diagnosticAnswers: [],
      diagnosticPlans: [], diagnosticPlanProgress: [], diagnosticRechecks: [],
      notes: ['the activity log was capped'],
    }) as { completeness: { complete: boolean; notes: string[] } }
    expect(partial.completeness.complete, 'a capped export must not claim to be complete').toBe(false)
    expect(partial.completeness.notes, 'the reason must travel with the file, not just a flag').toHaveLength(1)
  })

  it('still emits the four original sections (a rewrite must not lose them)', () => {
    const out = buildExport('Test', { learner: { id: 'x' }, stats: {}, progress: [], sessions: [] })
    for (const k of ['learner', 'stats', 'chapterProgress', 'sessions']) expect(out).toHaveProperty(k)
  })
})
