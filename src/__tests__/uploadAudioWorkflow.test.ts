/**
 * .github/workflows/upload-audio.yml is the ONLY way clips reach the production bucket (Audio storage loop, 2026-09-26),
 * and it holds Storage S3 keys that reach every bucket and bypass RLS. What it must keep being, read off the file:
 *
 *   · run by hand only (workflow_dispatch; no push/schedule), defaulting to a DRY RUN;
 *   · behind `production-db` (the founder's required-reviewer approval);
 *   · refusing to run against anything but this repo's production ref BEFORE it touches a key;
 *   · reading the S3 keys by NAME from secrets, and never the service-role key;
 *   · installing its Python dependencies by hash only;
 *   · refusing a source_ref that is not a plain git ref (it is interpolated into a shell).
 * Expected values are written out by hand.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
const RAW = readFileSync('.github/workflows/upload-audio.yml', 'utf8')
const WF = yaml.load(RAW) as any
const job = WF.jobs.upload
const steps: { name?: string; run?: string; uses?: string; env?: Record<string, string> }[] = job.steps
const at = (re: RegExp) => steps.findIndex(s => re.test(`${s.name ?? ''}\n${s.run ?? ''}`))

describe('upload-audio workflow', () => {
  it('positive control: the file parses and has the one job with its steps', () => {
    expect(Object.keys(WF.jobs)).toEqual(['upload'])
    expect(steps.length).toBeGreaterThanOrEqual(5)
  })

  it('runs by hand only, and a run with no choice made is a dry run', () => {
    expect(Object.keys(WF.on)).toEqual(['workflow_dispatch'])
    expect(WF.on.workflow_dispatch.inputs.mode.default).toBe('dry-run')
    expect(WF.on.workflow_dispatch.inputs.mode.options).toEqual(['dry-run', 'upload'])
    expect(WF.permissions).toEqual({ contents: 'read' })
  })

  it('sits behind the production-db approval', () => {
    expect(job.environment).toBe('production-db')
  })

  it('asserts the production ref before it fetches the audio or uses a key', () => {
    const ref = at(/scripts\/assert-prod-ref\.sh/)
    const fetchSrc = at(/git archive/)
    const upload = at(/scripts\/audio\/upload\.py/)
    expect(ref).toBeGreaterThanOrEqual(0)
    expect(ref).toBeLessThan(fetchSrc)
    expect(fetchSrc).toBeLessThan(upload)
  })

  it('reads exactly the two S3 secrets by name, and never the service-role key', () => {
    const env = steps[at(/scripts\/audio\/upload\.py/)].env!
    expect(env.S3_ACCESS_KEY_ID).toBe('${{ secrets.SUPABASE_S3_ACCESS_KEY_ID }}')
    expect(env.S3_SECRET_ACCESS_KEY).toBe('${{ secrets.SUPABASE_S3_SECRET_ACCESS_KEY }}')
    expect(env.AUDIO_BUCKET).toBe('lesson-audio')
    expect([...RAW.matchAll(/secrets\.([A-Z0-9_]+)/g)].map(m => m[1]).sort())
      .toEqual(['SUPABASE_S3_ACCESS_KEY_ID', 'SUPABASE_S3_SECRET_ACCESS_KEY'])
    expect(RAW).not.toMatch(/service_role|SERVICE_ROLE/)
  })

  it('installs its dependencies by hash only', () => {
    const install = steps.find(s => /pip.* install/.test(s.run ?? ''))!
    expect(install.run).toMatch(/--require-hashes -r scripts\/audio\/requirements\.txt/)
    const req = readFileSync('scripts/audio/requirements.txt', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    expect(req.length).toBeGreaterThanOrEqual(7)
    expect(req.filter(l => !/^[a-z0-9.-]+==[^ ]+ --hash=sha256:[0-9a-f]{64}$/.test(l))).toEqual([])
  })

  it('refuses a source_ref that is not a plain git ref, before using it', () => {
    const run = steps[at(/git archive/)].run!
    expect(run.indexOf('^[A-Za-z0-9._/-]+$')).toBeGreaterThanOrEqual(0)
    expect(run.indexOf('^[A-Za-z0-9._/-]+$')).toBeLessThan(run.indexOf('git fetch'))
    // the input reaches the shell through env, never by ${{ }} interpolation inside run:
    expect(steps.map(s => s.run ?? '').join('\n')).not.toMatch(/\$\{\{\s*inputs\./)
  })
})
