// @vitest-environment node
/**
 * red-main's issues (OPS-03, and the 2026-10-06 stale and false issues). Properties, stated independently of the code:
 *
 * 1. A failed migrate-staging on a run whose `migrations-changed` said no migration was pending does NOT file
 *    "database NOT migrated" (four such issues were false by 2026-10-06); it files the milder staging issue.
 *    Twins: the same failure with a migration pending, and a failed migrate-prod, still file "database NOT migrated".
 * 2. One open issue per kind: a second red of a kind already open comments on it and opens nothing — also when
 *    GitHub search would have missed it (search reads the NOT in the title as an operator; measured 2026-10-06).
 * 3. A finished run closes exactly the open kinds its own jobs prove fixed, each with a comment naming the run:
 *    a green run with migrate-prod skipped leaves "database NOT migrated" open; one where it succeeded closes it.
 * 4. The drift issue opens when main is more than 2 commits ahead of release and closes when it is not.
 *
 * It runs the REAL script (scripts/red-main.mjs, as red-main.yml runs it) with `gh` replaced by a fake that serves
 * the GitHub API JSON written below by hand and records every call. Nothing reaches GitHub. That the real jobs API
 * lists a skipped step with conclusion "skipped" is NOT checked here — only a real Deploy run can show that.
 */
import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
const load = (p: string) => yaml.load(readFileSync(resolve(ROOT, p), 'utf8')) as any

const DB = '🔴 app is live, database NOT migrated'
const STAGING = '🟠 staging migrate failed (no production migration pending)'
const CI = '🔴 main is red'
const PROMOTE = '🔴 promote failed — production is NOT updating'
const DRIFT = '🔴 production is not being promoted'
const RUN_URL = 'https://github.com/o/r/actions/runs/7'

// Fake gh. `api <path>`: $FAKE_API (path without query → JSON body; absent → exit 1 as on a 404).
// `issue list`: $FAKE_OPEN; with --search it answers as GitHub did on 2026-10-06 — nothing when the query has a NOT.
// Every call is appended to $FAKE_LOG as a JSON line.
const FAKE_GH = `#!/usr/bin/env node
const fs = require('fs'); const a = process.argv.slice(2)
fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify(a) + '\\n')
if (a[0] === 'api') {
  const body = JSON.parse(process.env.FAKE_API)[a[1].split('?')[0]]
  if (body === undefined) { process.stdout.write('{"message":"Not Found","status":"404"}'); process.exit(1) }
  process.stdout.write(JSON.stringify(body)); process.exit(0)
}
if (a[0] === 'issue' && a[1] === 'list') {
  const open = JSON.parse(process.env.FAKE_OPEN); const s = a.indexOf('--search')
  const q = s < 0 ? null : a[s + 1].replace(/ in:title$/, '')
  process.stdout.write(JSON.stringify(q === null ? open : / NOT /.test(q) ? [] : open.filter((i) => i.title.includes(q))))
  process.exit(0)
}
`

type Job = { name: string; conclusion: string; steps?: { name: string; conclusion: string }[] }
/** A Deploy run's jobs. `pending` = what migrations-changed said; the rest are job conclusions. */
function deploy(o: { ci?: string; promote?: string; staging?: string; prod?: string; pending: boolean }): Job[] {
  return [
    { name: 'ci / verify', conclusion: o.ci ?? 'success' },
    { name: 'ci / rls-tests', conclusion: o.ci ?? 'success' },
    { name: 'promote', conclusion: o.promote ?? 'success' },
    { name: 'migrate-staging', conclusion: o.staging ?? 'success' },
    {
      name: 'migrations-changed', conclusion: 'success',
      steps: [
        { name: 'Run scripts/migrations-pending.sh "abc"', conclusion: 'success' },
        { name: 'no production migration pending', conclusion: o.pending ? 'skipped' : 'success' },
      ],
    },
    { name: 'migrate-prod', conclusion: o.prod ?? 'skipped' },
    { name: 'record-migrated', conclusion: o.prod === 'success' ? 'success' : 'skipped' },
  ]
}

function run(env: { EVENT: string; MODE?: string; RUN_CONCLUSION?: string }, jobs: Job[] | null,
  open: { number: number; title: string }[], aheadBy: number | null = 0) {
  const dir = mkdtempSync(join(tmpdir(), 'redmain-'))
  writeFileSync(join(dir, 'gh'), FAKE_GH)
  chmodSync(join(dir, 'gh'), 0o755)
  const log = join(dir, 'log')
  const apiBodies: Record<string, unknown> = {}
  if (jobs) apiBodies['repos/o/r/actions/runs/7/jobs'] = { total_count: jobs.length, jobs }
  if (aheadBy !== null) {
    apiBodies['repos/o/r/branches/release'] = { name: 'release' }
    apiBodies['repos/o/r/compare/release...main'] = { ahead_by: aheadBy, status: 'ahead' }
  }
  const r = spawnSync(process.execPath, [resolve(ROOT, 'scripts/red-main.mjs')], {
    encoding: 'utf8',
    env: {
      PATH: `${dir}:${process.env.PATH}`, FAKE_LOG: log, FAKE_API: JSON.stringify(apiBodies), FAKE_OPEN: JSON.stringify(open),
      REPO: 'o/r', RUN_ID: '7', RUN_URL, RUN_SHA: 'abc1234', RUN_TITLE: 'a commit', MODE: '', ...env,
    } as unknown as NodeJS.ProcessEnv,
  })
  expect(r.status, r.stderr + r.stdout).toBe(0)
  const calls = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as string[]) : []
  const arg = (c: string[], flag: string) => c[c.indexOf(flag) + 1]
  return {
    created: calls.filter((c) => c[0] === 'issue' && c[1] === 'create').map((c) => ({ title: arg(c, '--title'), body: arg(c, '--body') })),
    commented: calls.filter((c) => c[0] === 'issue' && c[1] === 'comment').map((c) => Number(c[4])),
    closed: calls.filter((c) => c[0] === 'issue' && c[1] === 'close').map((c) => ({ n: Number(c[4]), why: arg(c, '--comment') })),
  }
}
const red = { EVENT: 'workflow_run', RUN_CONCLUSION: 'failure' }
const green = { EVENT: 'workflow_run', RUN_CONCLUSION: 'success' }

describe('a failed migrate job files "database NOT migrated" only when a migration was pending', () => {
  it('migrate-staging failed, no migration pending → the staging issue, never the database one', () => {
    const { created } = run(red, deploy({ staging: 'failure', pending: false }), [])
    expect(created.map((c) => c.title)).toEqual([STAGING])
    expect(created[0].body).toMatch(/no migration pending for production/)
    expect(created[0].body).toMatch(/actions\/runs\/7/)
  })

  it('twin: migrate-staging failed with a migration pending → database NOT migrated', () => {
    const { created } = run(red, deploy({ staging: 'failure', pending: true }), [])
    expect(created.map((c) => c.title)).toEqual([DB])
  })

  it('migrate-prod failed → app is live, database not migrated; never "not in production" (OPS-03)', () => {
    const { created } = run(red, deploy({ prod: 'failure', pending: true }), [])
    expect(created.map((c) => c.title)).toEqual([DB])
    const { body } = created[0]
    expect(body).toMatch(/app from this commit is already live/)
    expect(body).toMatch(/database was NOT migrated/)
    expect(body).toMatch(/expand\/contract/)
    expect(body).not.toMatch(/not\*\* in production/)
  })

  it('control: a red CI job → main is red, with the "not in production" text', () => {
    const { created } = run(red, deploy({ ci: 'failure', promote: 'skipped', staging: 'skipped', pending: false }), [])
    expect(created.map((c) => c.title)).toEqual([CI])
    expect(created[0].body).toMatch(/not\*\* in production/)
  })

  it('control: a red promote → the promote issue', () => {
    const { created } = run(red, deploy({ promote: 'failure', pending: false }), [])
    expect(created.map((c) => c.title)).toEqual([PROMOTE])
  })

  it('jobs unreadable on a red run → still reported, as main is red, and nothing closed', () => {
    const { created, closed } = run(red, null, [{ number: 5, title: PROMOTE }])
    expect(created.map((c) => c.title)).toEqual([CI])
    expect(created[0].body).toMatch(/Failed job\(s\): unknown/)
    expect(closed).toEqual([])
  })
})

describe('one open issue per kind', () => {
  it('a re-run that fails again comments on the open issue and opens none', () => {
    const r = run(red, deploy({ prod: 'failure', pending: true }), [{ number: 383, title: DB }, { number: 12, title: 'unrelated' }])
    expect(r.created).toEqual([])
    expect(r.commented).toEqual([383])
  })
})

describe('a finished run closes exactly the kinds it proves fixed', () => {
  const all = [{ number: 1, title: CI }, { number: 2, title: PROMOTE }, { number: 3, title: DB }, { number: 4, title: STAGING }, { number: 5, title: DRIFT }]

  it('green run where migrate-prod succeeded → closes every kind, each naming the run', () => {
    const { closed, created, commented } = run(green, deploy({ prod: 'success', pending: true }), all, 0)
    expect(closed.map((c) => c.n).sort()).toEqual([1, 2, 3, 4, 5])
    for (const c of closed) expect(c.why).toContain(RUN_URL)
    expect(created).toEqual([])
    expect(commented).toEqual([])
  })

  it('green run with migrate-prod skipped → closes the rest, leaves "database NOT migrated" open', () => {
    const { closed } = run(green, deploy({ pending: false }), all, 0)
    expect(closed.map((c) => c.n).sort()).toEqual([1, 2, 4, 5])
  })

  it('red run (staging failed, nothing pending) → closes CI and promote, not the database or staging issue', () => {
    const { closed, created } = run(red, deploy({ staging: 'failure', pending: false }), all, 0)
    expect(closed.map((c) => c.n).sort()).toEqual([1, 2, 5])
    expect(created).toEqual([])
  })

  it('main still 3 ahead after a green run → the drift issue stays open', () => {
    const { closed } = run(green, deploy({ pending: false }), [{ number: 5, title: DRIFT }], 3)
    expect(closed).toEqual([])
  })
})

describe('drift (daily)', () => {
  it('main 3 ahead of release → opens the drift issue', () => {
    const { created } = run({ EVENT: 'schedule' }, null, [], 3)
    expect(created.map((c) => c.title)).toEqual([DRIFT])
    expect(created[0].body).toMatch(/3 commits behind main/)
  })

  it('no release branch → opens it, saying so', () => {
    const { created } = run({ EVENT: 'schedule' }, null, [], null)
    expect(created.map((c) => c.title)).toEqual([DRIFT])
    expect(created[0].body).toMatch(/does not exist/)
  })

  it('main 2 ahead with the issue open → closes it', () => {
    const { closed } = run({ EVENT: 'schedule' }, null, [{ number: 5, title: DRIFT }], 2)
    expect(closed.map((c) => c.n)).toEqual([5])
  })
})

describe('the wiring', () => {
  it('deploy.yml shows the run\'s own changed=false as a step red-main can read', () => {
    const steps = load('.github/workflows/deploy.yml').jobs['migrations-changed'].steps as { name?: string; if?: string }[]
    const s = steps.find((x) => x.name === 'no production migration pending')
    expect(s?.if).toBe("steps.diff.outputs.changed == 'false'")
  })

  it('red-main.yml runs the script on red AND green Deploy runs, with issues: write', () => {
    const wf = load('.github/workflows/red-main.yml')
    expect(wf.permissions).toEqual({ issues: 'write', actions: 'read', contents: 'read' })
    expect(wf.jobs.notify.if).toMatch(/conclusion == 'success'/)
    expect(wf.jobs.notify.if).toMatch(/conclusion == 'failure'/)
    expect(wf.jobs.notify.steps.at(-1).run).toBe('node scripts/red-main.mjs')
  })
})
