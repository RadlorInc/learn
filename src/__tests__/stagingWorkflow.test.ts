// @vitest-environment node
/**
 * `.github/workflows/staging.yml` tries changes against STAGING before a merge. Its whole safety is that it can never
 * reach production. Stated here by hand, read from the real file:
 *   · it triggers only on the `staging` branch (or by hand), never on main or a pull request;
 *   · no job reads a production secret or variable;
 *   · every job refuses production's ref BEFORE its first `supabase link`.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
type Step = { name?: string; run?: string; uses?: string; env?: Record<string, string> }
type Wf = { on: { push?: { branches?: string[] }; pull_request?: unknown; workflow_dispatch?: unknown }; jobs: Record<string, { steps: Step[] }> }
const PROD = 'wrnjqjhrbnqxornmfisf' // written out by hand, as in stagingPrep.test.ts

const text = readFileSync(resolve(__dirname, '../../.github/workflows/staging.yml'), 'utf8')
const wf = yaml.load(text) as Wf

/** Index of the first step that links, and of the first step that refuses production's ref. */
export function order(steps: Step[]) {
  const link = steps.findIndex((s) => /supabase link/.test(s.run ?? ''))
  const refuse = steps.findIndex((s) => (s.run ?? '').includes(`= "${PROD}"`) && /exit 1/.test(s.run ?? ''))
  return { link, refuse }
}

describe('staging.yml cannot reach production', () => {
  it('triggers: the staging branch and by hand — not main, not pull requests', () => {
    expect(wf.on.push?.branches).toEqual(['staging'])
    expect(wf.on.pull_request).toBeUndefined()
    expect(wf.on.workflow_dispatch).toBeDefined()
  })

  it('reads no production secret or variable', () => {
    expect(text).not.toMatch(/PROD_DB_PASSWORD|PROD_PROJECT_REF|BACKUP_PASSPHRASE|production-db/)
  })

  it('positive control: the order check sees a link that comes before its refusal', () => {
    const bad: Step[] = [{ run: 'supabase link --project-ref x' }, { run: `if [ "$R" = "${PROD}" ]; then exit 1; fi` }]
    const o = order(bad)
    expect(o.link).toBe(0)
    expect(o.refuse).toBe(1)
    expect(o.refuse < o.link).toBe(false)
  })

  for (const [name, job] of Object.entries(wf.jobs)) {
    it(`${name}: refuses production's ref before it links`, () => {
      const o = order(job.steps)
      expect(o.link, `${name} never links — then this check has nothing to guard`).toBeGreaterThanOrEqual(0)
      expect(o.refuse, `${name} has no refusal of production's ref`).toBeGreaterThanOrEqual(0)
      expect(o.refuse).toBeLessThan(o.link)
    })
  }
})
