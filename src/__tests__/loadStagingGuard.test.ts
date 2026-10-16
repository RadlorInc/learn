// @vitest-environment node
/**
 * `scripts/load-staging.mjs` (the capacity load test, docs/runbooks/capacity.md) REFUSES production, and refuses
 * BEFORE it touches the network. Driven as a real process with `fetch` replaced by a trap that exits 99; the positive
 * control (a non-production ref with every input set) must hit the trap, or "refused" and "blind trap" look alike.
 */
import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
// Written out by hand on purpose: the test must not read production's ref from the file it guards.
const PROD = 'wrnjqjhrbnqxornmfisf'
const NOT_PROD = 'abcdefghijklmnopqrst'
const TRAP = 'data:text/javascript,delete globalThis.WebSocket;globalThis.fetch=()=>{console.error("TRAP: network attempted");process.exit(99)}'
const jwtFor = (ref: string) => `e30.${Buffer.from(JSON.stringify({ ref })).toString('base64url')}.sig`

function load(env: Record<string, string>) {
  const r = spawnSync(process.execPath, ['--import', TRAP, 'scripts/load-staging.mjs', 'run'], {
    cwd: ROOT, encoding: 'utf8', env: { PATH: process.env.PATH ?? '', ...env } as unknown as NodeJS.ProcessEnv,
  })
  return { code: r.status, err: r.stderr }
}
const ok = { STAGING_PROJECT_REF: NOT_PROD, STAGING_ANON_KEY: 'anon', STAGING_SERVICE_ROLE_KEY: 'svc', SEED_PASSWORD: 'x'.repeat(12) }

describe('load-staging refuses production, before any connection', () => {
  it('positive control: a non-production ref with every input set DOES reach the network', () => {
    const r = load(ok)
    expect(r.err).toContain('TRAP: network attempted')
    expect(r.code).toBe(99)
  })

  const cases: [string, Record<string, string>, RegExp][] = [
    ['no ref', { ...ok, STAGING_PROJECT_REF: '' }, /STAGING_PROJECT_REF is not set/],
    ['the ref IS production', { ...ok, STAGING_PROJECT_REF: PROD }, /the target is PRODUCTION/],
    ['the service key carries production\'s ref', { ...ok, STAGING_SERVICE_ROLE_KEY: `x${PROD}x` }, /carries the PRODUCTION ref/],
    ['the service key is a JWT for production', { ...ok, STAGING_SERVICE_ROLE_KEY: jwtFor(PROD) }, /belongs to project PRODUCTION/],
    ['the anon key is a JWT for production', { ...ok, STAGING_ANON_KEY: jwtFor(PROD) }, /belongs to project PRODUCTION/],
    ['no anon key', { ...ok, STAGING_ANON_KEY: '' }, /STAGING_ANON_KEY is not set/],
    ['no service key', { ...ok, STAGING_SERVICE_ROLE_KEY: '' }, /STAGING_SERVICE_ROLE_KEY is not set/],
    ['a short fake-account password', { ...ok, SEED_PASSWORD: 'short' }, /SEED_PASSWORD/],
  ]
  for (const [what, env, msg] of cases) {
    it(`refuses, contacting nothing: ${what}`, () => {
      const r = load(env)
      expect(r.err).not.toContain('TRAP')
      expect(r.err).toMatch(msg)
      expect(r.code).toBe(2)
    })
  }
})
