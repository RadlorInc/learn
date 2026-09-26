// @vitest-environment node
/**
 * OPS-02 — a migration that did not reach production must be retried on the NEXT push, even one that
 * touches no migration file.
 *
 * The property: `deploy.yml`'s `migrations-changed` job reports `changed=true` whenever a file under
 * `supabase/migrations` differs between this push and the last commit a `migrate-prod` job SUCCEEDED
 * on — and `changed=true` whenever it cannot tell. Only `changed=true` lets `migrate-prod` run (and wait
 * for Rafi's approval), so a wrong `false` is the silent direction and a wrong `true` is the loud one.
 *
 * It runs the REAL step: the `run:` and `env:` of `migrations-changed`'s `diff` step are read out of
 * deploy.yml and executed with bash, in a throwaway git repo, with `gh` replaced by a fake that serves
 * GitHub API JSON through the same `--jq` filters (via the real `jq`). Nothing reaches GitHub.
 *
 * The repo history is always: BASE → P1 (adds a migration) → P2 (app-only change).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, copyFileSync, chmodSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
type Step = { id?: string; run?: string; env?: Record<string, string> }
const WF = yaml.load(readFileSync(resolve(ROOT, '.github/workflows/deploy.yml'), 'utf8')) as {
  jobs: Record<string, { steps: Step[] }>
}
const STEP = WF.jobs['migrations-changed'].steps.find((s) => s.id === 'diff')!

let dir: string
const sha: Record<string, string> = {}
const git = (...a: string[]) => {
  const r = spawnSync('git', a, { cwd: join(dir, 'repo'), encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${r.stderr}`)
  return r.stdout.trim()
}

// A fake `gh`: `gh api <endpoint> [--jq <filter>]`. Answers from $FAKE_GH/<endpoint-with-/-as-_>.json,
// applying the filter with real jq. A missing file = the API call failed (exit 1, error JSON on stdout,
// exactly as the real gh does on a 404).
const FAKE_GH = `#!/usr/bin/env bash
[ "$1" = api ] || exit 64
ep="\${2%%\\?*}"; f="$FAKE_GH/$(printf %s "$ep" | tr / _).json"; shift 2
jqf=.; [ "\${1:-}" = --jq ] && jqf="$2"
# A "once" file answers the FIRST call only (then is removed): an API that answered blind, then normally.
o="\${f%.json}.once.json"; [ -f "$o" ] && { jq -r "$jqf" "$o"; rc=$?; rm -f "$o"; exit $rc; }
[ -f "$f" ] || { echo '{"message":"Not Found","status":"404"}'; exit 1; }
jq -r "$jqf" "$f"
`

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'ops02-'))
  mkdirSync(join(dir, 'repo/supabase/migrations'), { recursive: true })
  mkdirSync(join(dir, 'repo/src'))
  mkdirSync(join(dir, 'bin'))
  writeFileSync(join(dir, 'bin/gh'), FAKE_GH)
  chmodSync(join(dir, 'bin/gh'), 0o755)
  // The workflow runs in a checkout of this repo, so whatever script the step calls must be there.
  mkdirSync(join(dir, 'repo/scripts'))
  const script = resolve(ROOT, 'scripts/migrations-pending.sh')
  if (existsSync(script)) copyFileSync(script, join(dir, 'repo/scripts/migrations-pending.sh'))
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't')
  writeFileSync(join(dir, 'repo/src/a'), 'a'); git('add', 'src'); git('commit', '-qm', 'base'); sha.BASE = git('rev-parse', 'HEAD')
  writeFileSync(join(dir, 'repo/supabase/migrations/20260101000000_x.sql'), 'create table x();')
  git('add', 'supabase'); git('commit', '-qm', 'mig'); sha.P1 = git('rev-parse', 'HEAD')
  writeFileSync(join(dir, 'repo/src/a'), 'b'); git('commit', '-qam', 'app'); sha.P2 = git('rev-parse', 'HEAD')
})
afterAll(() => rmSync(dir, { recursive: true, force: true }))

type Run = { id: number; head: string; conclusion: string | null; migrateProd?: string; blind?: boolean }
/** Deploy runs, newest first, as the GitHub API returns them. `migrateProd` = that run's job conclusion;
 *  absent = the run has no such job (e.g. cancelled while pending: zero jobs). */
function step(before: string, head: string, runs: Run[] | 'api-down', runId = 999,
  once: Record<string, unknown> = {}) {
  const gh = mkdtempSync(join(dir, 'gh-'))
  for (const [ep, body] of Object.entries(once)) writeFileSync(join(gh, `${ep}.once.json`), JSON.stringify(body))
  if (runs !== 'api-down') {
    writeFileSync(join(gh, 'repos_o_r_actions_workflows_deploy.yml_runs.json'), JSON.stringify({
      workflow_runs: runs.map((r) => ({ id: r.id, head_sha: r.head, conclusion: r.conclusion, head_branch: 'main' })),
    }))
    for (const r of runs) writeFileSync(join(gh, `repos_o_r_actions_runs_${r.id}_jobs.json`), JSON.stringify(r.blind
      ? { total_count: 0, jobs: [] } // answered, but without the jobs every finished run has
      : { jobs: [{ name: 'ci / unit', conclusion: 'success' }, ...(r.migrateProd ? [{ name: 'migrate-prod', conclusion: r.migrateProd }] : [])] }))
  }
  const ctx: Record<string, string> = {
    'github.event.before': before, 'github.sha': head, 'github.repository': 'o/r',
    'github.run_id': String(runId), 'github.token': 'fake-token',
  }
  const sub = (s: string) => s.replace(/\$\{\{\s*([^}]+?)\s*\}\}/g, (_, k: string) => {
    if (!(k in ctx)) throw new Error(`test does not know the expression \${{ ${k} }} — add it`)
    return ctx[k]
  })
  const out = join(gh, 'out')
  writeFileSync(out, '')
  // The runner's own default variables, as GitHub sets them for every step.
  const env: Record<string, string> = {
    PATH: `${join(dir, 'bin')}:${process.env.PATH}`, HOME: dir, FAKE_GH: gh, GITHUB_OUTPUT: out,
    GITHUB_REPOSITORY: 'o/r', GITHUB_RUN_ID: String(runId), GITHUB_SHA: head,
    MIGRATIONS_PENDING_RETRY_SECS: '0', // the script waits before asking again; not in a test
  }
  for (const [k, v] of Object.entries(STEP.env ?? {})) env[k] = sub(String(v))
  // GitHub's default `run` shell: bash --noprofile --norc -eo pipefail
  const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', sub(STEP.run!)], {
    cwd: join(dir, 'repo'), encoding: 'utf8', env: env as unknown as NodeJS.ProcessEnv,
  })
  const changed = /^changed=(\w+)$/m.exec(readFileSync(out, 'utf8'))?.[1]
  return { code: r.status, changed, log: r.stdout + r.stderr }
}

describe('migrations-changed (the real step from deploy.yml)', () => {
  it('positive control: the push that ADDS a migration reports changed=true', () => {
    const r = step(sha.BASE, sha.P1, [{ id: 1, head: sha.BASE, conclusion: 'success', migrateProd: 'success' }])
    expect(r.code, r.log).toBe(0)
    expect(r.changed, r.log).toBe('true')
  })

  it('positive control: an app-only push with nothing pending reports changed=false (no approval wait)', () => {
    // P1's migrate-prod succeeded, so the migration is applied; P2 touches only src/.
    const r = step(sha.P1, sha.P2, [{ id: 2, head: sha.P1, conclusion: 'success', migrateProd: 'success' }])
    expect(r.code, r.log).toBe(0)
    expect(r.changed, r.log).toBe('false')
  })

  // The OPS-02 defect: P1's run never applied its migration, then an app-only push arrives.
  for (const [why, p1run] of [
    ['cancelled while pending (zero jobs)', { id: 2, head: '', conclusion: 'cancelled' }],
    ['approval rejected / job failed', { id: 2, head: '', conclusion: 'failure', migrateProd: 'failure' }],
  ] as [string, Run][]) {
    it(`P1's migrate-prod ${why} → the next app-only push reports changed=true`, () => {
      const r = step(sha.P1, sha.P2, [
        { ...p1run, head: sha.P1 },
        { id: 1, head: sha.BASE, conclusion: 'success', migrateProd: 'success' },
      ])
      expect(r.code, r.log).toBe(0)
      expect(r.changed, r.log).toBe('true')
      expect(r.log).toContain('20260101000000_x.sql') // true because the migration is named as pending
    })
  }

  it('fails SAFE: the GitHub API cannot be read → changed=true', () => {
    const r = step(sha.P1, sha.P2, 'api-down')
    expect(r.code, r.log).toBe(0)
    expect(r.changed, r.log).toBe('true')
    expect(r.log).toMatch(/could not list Deploy runs/)
  })

  it('fails SAFE: no run in the window has a successful migrate-prod → changed=true', () => {
    const r = step(sha.P1, sha.P2, [{ id: 2, head: sha.P1, conclusion: 'success' }])
    expect(r.code, r.log).toBe(0)
    expect(r.changed, r.log).toBe('true')
    expect(r.log).toMatch(/no successful migrate-prod/)
  })

  it('fails SAFE: the last successful commit is not an ancestor of this push (history rewritten) → changed=true', () => {
    const r = step(sha.P1, sha.P2, [{ id: 2, head: 'f'.repeat(40), conclusion: 'success', migrateProd: 'success' }])
    expect(r.code, r.log).toBe(0)
    expect(r.changed, r.log).toBe('true')
    expect(r.log).toMatch(/not an ancestor/)
  })

  // ⚠️ THE CI CASE, Deploy run 36235486482 (2026-09-26 10:20 UTC, the push of merge-train-1 #279): the step
  // scanned for 61 s, every `gh` call exited 0, and it printed "no successful migrate-prod in the last 100
  // Deploy runs" — while the three runs before it (#240, #241, #243) HAD a successful migrate-prod, and the
  // same script with the same inputs found #243's a minute later from a laptop. The API answered, but not with
  // the jobs. What exactly it answered was never logged, so this reproduces the one shape the evidence allows:
  // a FINISHED Deploy run listed with NO jobs (impossible as a truth — every run has at least
  // `migrations-changed`), i.e. "I cannot see" rendered as "there is nothing to see".
  const JOBS = (id: number) => `repos_o_r_actions_runs_${id}_jobs`
  const BLIND = { total_count: 0, jobs: [] }

  it('THE CI CASE: jobs answered empty, then normally → it looks again and finds the last success (changed=false)', () => {
    const runs: Run[] = [
      { id: 3, head: sha.P1, conclusion: 'success', migrateProd: 'success' },
      { id: 1, head: sha.BASE, conclusion: 'success', migrateProd: 'success' },
    ]
    const r = step(sha.P1, sha.P2, runs, 999, { [JOBS(3)]: BLIND, [JOBS(1)]: BLIND })
    expect(r.code, r.log).toBe(0)
    expect(r.log).not.toMatch(/no successful migrate-prod/) // the CI run's message: a blind answer read as a clean one
    expect(r.changed, r.log).toBe('false')
    expect(r.log).toMatch(new RegExp(`no migration file changed since ${sha.P1}`))
  })

  it('jobs stay empty on BOTH looks → changed=true (fails safe), and it says it could not see — not "no success"', () => {
    const r = step(sha.P1, sha.P2, [{ id: 3, head: sha.P1, conclusion: 'success', migrateProd: 'success', blind: true }])
    expect(r.code, r.log).toBe(0)
    expect(r.changed, r.log).toBe('true')
    expect(r.log).not.toMatch(/no successful migrate-prod/)
    expect(r.log).toMatch(/could not see.*1 of 1 finished Deploy run.*no jobs/)
  })

  it('the run list answers with no finished run, then normally → it looks again (changed=false)', () => {
    const runs: Run[] = [{ id: 3, head: sha.P1, conclusion: 'success', migrateProd: 'success' }]
    const r = step(sha.P1, sha.P2, runs, 999, { 'repos_o_r_actions_workflows_deploy.yml_runs': { workflow_runs: [] } })
    expect(r.code, r.log).toBe(0)
    expect(r.changed, r.log).toBe('false')
  })
})
