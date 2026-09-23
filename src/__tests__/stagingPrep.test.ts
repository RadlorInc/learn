// @vitest-environment node
/**
 * Staging, prepared (R14). Two properties, each stated here independently of the code it checks:
 *
 * 1. `scripts/seed-staging.mjs` REFUSES production — and refuses BEFORE it touches the network.
 *    Driven as a real process with `fetch` replaced by a trap that exits 99. The positive control
 *    (an allowed local target) must hit the trap, or "refused" and "the trap is blind" would look alike.
 *
 * 2. `.github/workflows/deploy.yml`: with no STAGING_PROJECT_REF, `migrate-prod` runs straight after a
 *    green CI; once it is set, prod runs ONLY after `migrate-staging` succeeded. Evaluated from the real
 *    workflow file — the `if:` strings and `needs:` graph are read, never restated here.
 */
import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
// Written out by hand on purpose: the test must not read production's ref from the file it guards.
const PROD = 'wrnjqjhrbnqxornmfisf'

// ── 1. the seed's guard ───────────────────────────────────────────────────────────────────────────
const TRAP = 'data:text/javascript,globalThis.fetch=()=>{console.error("TRAP: network attempted");process.exit(99)}'

function seed(env: Record<string, string>) {
  const r = spawnSync(process.execPath, ['--import', TRAP, 'scripts/seed-staging.mjs'], {
    cwd: ROOT, encoding: 'utf8', env: { PATH: process.env.PATH ?? '', ...env } as unknown as NodeJS.ProcessEnv,
  })
  return { code: r.status, err: r.stderr }
}
const ok = { STAGING_SERVICE_ROLE_KEY: 'k', SEED_PASSWORD: 'x'.repeat(12) }

describe('seed-staging refuses production, before any connection', () => {
  it('positive control: an allowed local target DOES reach the network (the trap can see)', () => {
    const r = seed({ ...ok, STAGING_PROJECT_REF: 'local', STAGING_SUPABASE_URL: 'http://127.0.0.1:9' })
    expect(r.err).toContain('TRAP: network attempted')
    expect(r.code).toBe(99)
  })

  const cases: [string, Record<string, string>, RegExp][] = [
    ['no staging ref given (even for a local URL)',
      { STAGING_SUPABASE_URL: 'http://127.0.0.1:9' }, /STAGING_PROJECT_REF is not set/],
    ['the staging ref IS production',
      { STAGING_PROJECT_REF: PROD, STAGING_SUPABASE_URL: `https://${PROD}.supabase.co` }, /STAGING_PROJECT_REF is PRODUCTION/],
    ['a staging ref, but production\'s URL',
      { STAGING_PROJECT_REF: 'abcdefghijklmnopqrst', STAGING_SUPABASE_URL: `https://${PROD}.supabase.co` }, /names the PRODUCTION project/],
    ['"local" pointed at a remote host',
      { STAGING_PROJECT_REF: 'local', STAGING_SUPABASE_URL: 'https://example.com' }, /only allowed with a 127\.0\.0\.1/],
    ['a URL for a different project than the ref',
      { STAGING_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa', STAGING_SUPABASE_URL: 'https://bbbbbbbbbbbbbbbbbbbb.supabase.co' }, /expected "aaaaaaaaaaaaaaaaaaaa\.supabase\.co"/],
  ]
  for (const [name, env, why] of cases) {
    it(`refuses: ${name}`, () => {
      const r = seed({ ...ok, ...env })
      expect(r.err).not.toContain('TRAP')
      expect(r.err).toMatch(why)
      expect(r.code).toBe(2)
    })
  }
})

// ── 2. deploy.yml's staging-first path, evaluated for both settings ──────────────────────────────
type Job = { needs?: string | string[]; if?: string }
const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
const JOBS = (yaml.load(readFileSync(resolve(ROOT, '.github/workflows/deploy.yml'), 'utf8')) as { jobs: Record<string, Job> }).jobs
const needsOf = (j: Job) => (j.needs === undefined ? [] : ([] as string[]).concat(j.needs))

type Result = 'success' | 'failure' | 'skipped'
type Scenario = { vars: Record<string, string>; changed: boolean; fail?: string[] }

/** GitHub Actions semantics for the subset deploy.yml uses: an unset var is '', and an `if` without a
 *  status function gets an implicit `success()` (every need succeeded). Jobs are assumed to succeed
 *  unless listed in `fail`. Returns each job's result, in the order they could run. */
function run(s: Scenario): [string, Result][] {
  const done = new Map<string, { result: Result; outputs: Record<string, string> }>()
  const out: [string, Result][] = []
  while (done.size < Object.keys(JOBS).length) {
    const ready = Object.keys(JOBS).filter((n) => !done.has(n) && needsOf(JOBS[n]).every((d) => done.has(d)))
    if (!ready.length) throw new Error('cycle in needs')
    for (const name of ready) {
      const job = JOBS[name]
      const needs = Object.fromEntries(needsOf(job).map((d) => [d, done.get(d)!]))
      const success = () => Object.values(needs).every((n) => n.result === 'success')
      let expr = (job.if ?? 'success()').trim().replace(/^\$\{\{\s*([\s\S]*?)\s*\}\}$/, '$1')
      if (!/\b(success|failure|always|cancelled)\(\)/.test(expr)) expr = `success() && (${expr})`
      const js = expr.replace(/needs\.([\w-]+)/g, 'needs["$1"]').replace(/([!=])=/g, '$1==')
      const vars = new Proxy({}, { get: (_t, k) => s.vars[String(k)] ?? '' })
      const go = new Function('needs', 'vars', 'github', 'success', 'cancelled', `return (${js})`)(
        needs, vars, { ref: 'refs/heads/main' }, success, () => false)
      const result: Result = !go ? 'skipped' : s.fail?.includes(name) ? 'failure' : 'success'
      const outputs: Record<string, string> = name === 'migrations-changed' && result === 'success' ? { changed: String(s.changed) } : {}
      done.set(name, { result, outputs })
      out.push([name, result])
    }
  }
  return out
}
const result = (s: Scenario) => Object.fromEntries(run(s))
const PROD_SET = { PROD_PROJECT_REF: 'wrnjqjhrbnqxornmfisf' }
const STAGING_SET = { ...PROD_SET, STAGING_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa' }

describe('deploy.yml: migrate-prod falls back only while there is no staging project', () => {
  it('migrate-prod needs migrate-staging (so when staging runs, prod waits for it)', () => {
    expect(needsOf(JOBS['migrate-prod'])).toContain('migrate-staging')
  })

  it('STAGING_PROJECT_REF unset: staging skipped, prod runs after a green CI', () => {
    expect(result({ vars: PROD_SET, changed: true })).toEqual({
      ci: 'success', promote: 'success', 'migrate-staging': 'skipped',
      'migrations-changed': 'success', 'migrate-prod': 'success',
    })
  })

  it('STAGING_PROJECT_REF set: staging runs first, then prod', () => {
    const order = run({ vars: STAGING_SET, changed: true })
    expect(Object.fromEntries(order)).toEqual({
      ci: 'success', promote: 'success', 'migrate-staging': 'success',
      'migrations-changed': 'success', 'migrate-prod': 'success',
    })
    const at = (n: string) => order.findIndex(([j]) => j === n)
    expect(at('migrate-prod')).toBeGreaterThan(at('migrate-staging'))
  })

  it('STAGING_PROJECT_REF set and staging FAILS: prod does not run', () => {
    expect(result({ vars: STAGING_SET, changed: true, fail: ['migrate-staging'] })['migrate-prod']).toBe('skipped')
  })

  it('no migration file changed: prod does not run (nothing waits for an approval)', () => {
    expect(result({ vars: PROD_SET, changed: false })['migrate-prod']).toBe('skipped')
    expect(result({ vars: STAGING_SET, changed: false })['migrate-prod']).toBe('skipped')
  })

  it('CI red: nothing after it runs', () => {
    const r = result({ vars: PROD_SET, changed: true, fail: ['ci'] })
    expect([r.promote, r['migrate-staging'], r['migrate-prod']]).toEqual(['skipped', 'skipped', 'skipped'])
  })

  it('PROD_PROJECT_REF unset: prod does not run', () => {
    expect(result({ vars: {}, changed: true })['migrate-prod']).toBe('skipped')
  })
})
