import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * ARC-07 / OPS-18 — every GitHub Actions job carries its own `timeout-minutes`.
 *
 * Without one a job gets GitHub's 360-minute default. A test that spins synchronously cannot be
 * stopped by vitest's `testTimeout` (it is a timer on the event loop the loop is blocking), so a
 * hung `ci / verify` holds the Deploy run — and with it `promote` — for six hours.
 *
 * Property checked: each job listed below exists in its file AND has a `timeout-minutes:` key in
 * its own block, and no job exists that is not listed (a new job has to be added here, which is the
 * reminder to give it a timeout). It does NOT check that the numbers are sensible.
 *
 * The list is written out by hand on purpose — deriving it from the files would pass on whatever
 * the files say.
 */
const EXPECTED: Record<string, string[]> = {
  'backup.yml': ['dump'],
  'ci.yml': ['verify', 'rls-tests'],
  // `ci` calls ci.yml as a reusable workflow; GitHub rejects `timeout-minutes` on such a job
  // (only name/uses/with/secrets/strategy/needs/if/concurrency/permissions are allowed). The
  // called jobs carry their own, checked under ci.yml above.
  'deploy.yml': ['promote', 'migrate-staging', 'migrations-changed', 'migrate-prod'],
  'migrate-region.yml': ['migrate'],
  'nightly-e2e.yml': ['legacy-gate', 'chapters'],
  'red-main.yml': ['notify'],
  'weekly-layout.yml': ['legacy-gate', 'layout'],
}
const REUSABLE_CALLERS: Record<string, string[]> = { 'deploy.yml': ['ci'] }

/** job id → the lines of its block, found by indentation under the top-level `jobs:` key. */
function jobs(file: string): Map<string, string[]> {
  const lines = readFileSync(resolve(process.cwd(), '.github/workflows', file), 'utf8').split('\n')
  const out = new Map<string, string[]>()
  const start = lines.findIndex((l) => /^jobs:\s*$/.test(l))
  if (start < 0) return out
  let current: string | null = null
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break // next top-level key ends `jobs:`
    const id = /^ {2}([A-Za-z0-9_-]+):\s*(#.*)?$/.exec(line)
    if (id) { current = id[1]; out.set(current, []); continue }
    if (current) out.get(current)!.push(line)
  }
  return out
}
const hasOwnKey = (block: string[], key: string) =>
  block.some((l) => new RegExp(`^ {4}${key}:`).test(l))

describe('every CI job has its own timeout-minutes (ARC-07 / OPS-18)', () => {
  // Positive control: the walker must find the two timeouts that already existed before this fix,
  // or a broken parser would report "no jobs" and every assertion below would be vacuous.
  it('the parser sees the pre-existing timeouts (nightly chapters, weekly layout)', () => {
    expect(hasOwnKey(jobs('nightly-e2e.yml').get('chapters') ?? [], 'timeout-minutes')).toBe(true)
    expect(hasOwnKey(jobs('weekly-layout.yml').get('layout') ?? [], 'timeout-minutes')).toBe(true)
  })

  for (const [file, expected] of Object.entries(EXPECTED)) {
    it(`${file}: jobs are exactly ${expected.join(', ')} and each has timeout-minutes`, () => {
      const found = jobs(file)
      const callers = REUSABLE_CALLERS[file] ?? []
      expect([...found.keys()].filter((j) => !callers.includes(j)).sort()).toEqual([...expected].sort())
      for (const c of callers) expect(hasOwnKey(found.get(c) ?? [], 'uses'), `${file}/${c} calls a reusable workflow`).toBe(true)
      const missing = expected.filter((j) => !hasOwnKey(found.get(j)!, 'timeout-minutes'))
      expect(missing, `${file}: jobs with no timeout-minutes (GitHub default is 360 min)`).toEqual([])
    })
  }
})
