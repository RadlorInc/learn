// @vitest-environment node
/**
 * Deploy safety (OPS-03, OPS-08). Properties, stated independently of the files they check:
 *
 * 1. OPS-08 — `migrate-prod` in deploy.yml takes a backup (a `supabase db dump`, encrypted, uploaded)
 *    AFTER the step that runs scripts/assert-prod-ref.sh and BEFORE the step that runs `supabase db push`,
 *    and nothing lets `db push` run when the backup failed. Checked on the parsed YAML: step ORDER and
 *    the absence of `continue-on-error` / `if:` overrides. That a real dump succeeds on a real runner is
 *    NOT checked here — only an Actions run can show that.
 *    Positive control: migrate-prod's `needs`, `environment` and `if` are exactly what they were
 *    (written out by hand below), so the job graph and the production-db approval are unchanged.
 *
 * 2. OPS-03 — red-main.yml's message step, DRIVEN as bash with a fake `gh`: when the failed job is
 *    `migrate-prod`, the issue says the app is live and the database is not migrated, and does NOT
 *    say "not in production". Controls: a red CI job still gets the old "main is red / not in
 *    production" text, and a red promote still gets the promote text.
 */
import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
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

// ── OPS-03: drive red-main's message step ───────────────────────────────────────────────────────
const RED_MAIN = load('.github/workflows/red-main.yml')
const SCRIPT = (RED_MAIN.jobs.notify.steps as Step[]).find((s) => s.name === 'Work out what to say')!.run!

function say(failedJobs: string) {
  const dir = mkdtempSync(join(tmpdir(), 'redmain-'))
  const gh = join(dir, 'gh')
  // Fake gh: the only call on the workflow_run path is the jobs lookup; answer it with the failed names.
  writeFileSync(gh, '#!/usr/bin/env bash\nprintf "%s" "$FAKE_FAILED"\n')
  chmodSync(gh, 0o755)
  const out = join(dir, 'out')
  writeFileSync(out, '')
  const r = spawnSync('bash', ['-c', SCRIPT], {
    encoding: 'utf8',
    env: {
      PATH: `${dir}:${process.env.PATH}`, GITHUB_OUTPUT: out, FAKE_FAILED: failedJobs,
      EVENT: 'workflow_run', MODE: '', REPO: 'o/r', RUN_ID: '1', RUN_URL: 'https://x/run/1',
      RUN_SHA: 'abc1234', RUN_TITLE: 'a commit',
    } as unknown as NodeJS.ProcessEnv,
  })
  expect(r.status, r.stderr).toBe(0)
  const o = readFileSync(out, 'utf8')
  const title = /title<<EOF\n([\s\S]*?)\nEOF/.exec(o)![1]
  const body = /body<<EOF\n([\s\S]*?)\nEOF/.exec(o)![1]
  return { title, body }
}

describe('OPS-03: red-main says what is true when migrate-prod fails', () => {
  it('migrate-prod failed → app is live, database not migrated; never "not in production"', () => {
    const { title, body } = say('migrate-prod')
    expect(title).toBe('🔴 app is live, database NOT migrated')
    expect(body).toMatch(/app from this commit is already live/)
    expect(body).toMatch(/database was NOT migrated/)
    expect(body).toMatch(/expand\/contract/)
    expect(body).not.toMatch(/not\*\* in production/)
    expect(body).not.toMatch(/gate working/)
    // The next step pastes the body inside '…' in bash: a single quote would break it.
    expect(body).not.toContain("'")
  })

  it('control: a red CI job keeps the "not in production" text', () => {
    const { title, body } = say('ci / verify')
    expect(title).toBe('🔴 main is red')
    expect(body).toMatch(/not\*\* in production/)
  })

  it('control: a red promote keeps the promote text', () => {
    const { title } = say('promote')
    expect(title).toBe('🔴 promote failed — production is NOT updating')
  })
})
