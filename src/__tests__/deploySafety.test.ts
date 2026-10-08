// @vitest-environment node
/**
 * Deploy safety (OPS-08). Properties, stated independently of the files they check:
 *
 * OPS-08 — `migrate-prod` in deploy.yml takes a backup (a `supabase db dump`, encrypted, uploaded)
 *    AFTER the step that runs scripts/assert-prod-ref.sh and BEFORE the step that runs `supabase db push`,
 *    and nothing lets `db push` run when the backup failed. Checked on the parsed YAML: step ORDER and
 *    the absence of `continue-on-error` / `if:` overrides. That a real dump succeeds on a real runner is
 *    NOT checked here — only an Actions run can show that.
 *    Positive control: migrate-prod's `needs`, `environment` and `if` are exactly what they were
 *    (written out by hand below), so the job graph and the production-db approval are unchanged.
 *
 * OPS-03 (what red-main's issues say) moved to redMain.test.ts on 2026-10-06.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
const load = (p: string) => yaml.load(readFileSync(resolve(ROOT, p), 'utf8')) as any

type Step = { name?: string; uses?: string; run?: string; with?: Record<string, unknown>; if?: string; 'continue-on-error'?: unknown }

/** A step "is" a dump if it runs `supabase db dump` itself, or uses a local composite action that does. */
function stepRuns(step: Step, pattern: RegExp): boolean {
  if (step.run && pattern.test(step.run)) return true
  if (step.uses?.startsWith('./')) {
    const action = load(join(step.uses, 'action.yml'))
    return (action.runs.steps as Step[]).some((s) => stepRuns(s, pattern))
  }
  return false
}

describe('OPS-08: migrate-prod backs up production before db push', () => {
  const job = load('.github/workflows/deploy.yml').jobs['migrate-prod']
  const steps = job.steps as Step[]
  const at = (re: RegExp) => steps.findIndex((s) => stepRuns(s, re))

  it('positive control: the job graph and approval are unchanged', () => {
    expect(job.needs).toEqual(['ci', 'migrate-staging', 'migrations-changed'])
    expect(job.environment).toBe('production-db')
    expect(job.if).toBe(
      "${{ !cancelled() && needs.ci.result == 'success' && needs.migrations-changed.outputs.changed == 'true' && vars.PROD_PROJECT_REF != '' && (needs.migrate-staging.result == 'success' || (needs.migrate-staging.result == 'skipped' && vars.STAGING_PROJECT_REF == '')) }}",
    )
  })

  it('order: assert-prod-ref < dump < db push', () => {
    const ref = at(/scripts\/assert-prod-ref\.sh/)
    const dump = at(/supabase db dump/)
    const push = at(/supabase db push/)
    expect(ref).toBeGreaterThanOrEqual(0)
    expect(push).toBeGreaterThanOrEqual(0)
    expect(dump, 'no step in migrate-prod runs `supabase db dump`').toBeGreaterThanOrEqual(0)
    expect(ref).toBeLessThan(dump)
    expect(dump).toBeLessThan(push)
  })

  it('a failed backup stops the job before db push', () => {
    const dump = at(/supabase db dump/)
    const push = at(/supabase db push/)
    expect(dump).toBeGreaterThanOrEqual(0) // else the loop below checks nothing
    for (const s of steps.slice(dump, push + 1)) {
      expect(s['continue-on-error'], s.name).toBeUndefined()
      expect(s.if, s.name).toBeUndefined()
    }
  })

  it('the backup is encrypted and uploaded with 30-day retention, and the nightly job uses the same one', () => {
    const backup = steps.find((s) => stepRuns(s, /supabase db dump/))!
    expect(stepRuns(backup, /openssl enc -aes-256-cbc/)).toBe(true)
    const action = load(join(backup.uses!, 'action.yml'))
    const upload = (action.runs.steps as Step[]).find((s) => s.uses?.startsWith('actions/upload-artifact'))!
    expect(upload.with!['retention-days']).toBe(30)
    const nightly = load('.github/workflows/backup.yml').jobs.dump.steps as Step[]
    expect(nightly.map((s) => s.uses)).toContain(backup.uses)
  })
})
