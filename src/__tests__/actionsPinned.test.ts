// @vitest-environment node
/**
 * Supply chain + backup ref (OPS-13 = SEC-10, OPS-17). Properties, stated independently of the files:
 *
 * 1. OPS-13 — every `uses:` of an EXTERNAL action (anything not `./…`) in `.github/workflows/*.yml` and
 *    `.github/actions/**\/action.yml` is pinned to a full 40-hex commit SHA. A tag or branch (`@v4`,
 *    `@v1`, `@main`) is mutable: whoever controls the upstream repo can move it and run code next to
 *    SUPABASE_ACCESS_TOKEN / PROD_DB_PASSWORD. This checks the SHAPE of the ref only — not that the SHA
 *    is the one its `# vX.Y.Z` comment names (that was resolved via the GitHub API when pinning).
 *    Positive controls: the parser finds exactly the 26 `uses:` keys counted by hand (23 external,
 *    3 local), equal to a raw line count; and a planted `@v4` is caught by the same predicate.
 *
 * 2. OPS-17 — in the prod-backup composite, and in every job of backup.yml / deploy.yml that dumps,
 *    a step running scripts/assert-prod-ref.sh comes BEFORE the first `supabase db dump` (composite
 *    steps expanded in place). Whether the script itself is right is checked by its own header; this
 *    only checks it is reached first.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')
const load = (p: string) => yaml.load(read(p)) as any

const WORKFLOWS = readdirSync(resolve(ROOT, '.github/workflows'))
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => `.github/workflows/${f}`)
const ACTIONS = readdirSync(resolve(ROOT, '.github/actions'))
  .map((d) => `.github/actions/${d}/action.yml`)
  .filter((p) => existsSync(resolve(ROOT, p)))
const FILES = [...WORKFLOWS, ...ACTIONS]

/** Every `uses:` value in a parsed workflow or action: job-level (reusable workflow) and step-level. */
function usesOf(doc: any): string[] {
  const out: string[] = []
  const steps = (s: any[] | undefined) => (s ?? []).forEach((st) => st?.uses && out.push(st.uses))
  for (const job of Object.values<any>(doc?.jobs ?? {})) {
    if (job?.uses) out.push(job.uses)
    steps(job?.steps)
  }
  steps(doc?.runs?.steps)
  return out
}

const isLocal = (u: string) => u.startsWith('./')
const isPinned = (u: string) => /^[^@\s]+@[0-9a-f]{40}$/.test(u)

describe('OPS-13: external actions are pinned to a commit SHA', () => {
  const all = FILES.flatMap((f) => usesOf(load(f)).map((u) => ({ f, u })))

  it('positive control: the parser sees every uses: key (26, counted by hand; = raw line count)', () => {
    const raw = FILES.reduce((n, f) => n + (read(f).match(/^\s*(-\s+)?uses:\s/gm) ?? []).length, 0)
    expect(all.length).toBe(26)
    expect(all.length).toBe(raw)
    expect(all.filter(({ u }) => isLocal(u)).length).toBe(3)
  })

  it('positive control: a planted tag is caught', () => {
    const planted = usesOf(yaml.load('jobs:\n  a:\n    steps:\n      - uses: supabase/setup-cli@v1\n'))
    expect(planted).toEqual(['supabase/setup-cli@v1'])
    expect(isPinned(planted[0])).toBe(false)
    expect(isPinned('actions/checkout@11d5960a326750d5838078e36cf38b85af677262')).toBe(true)
  })

  it('every external uses: is a 40-hex SHA', () => {
    const bad = all.filter(({ u }) => !isLocal(u) && !isPinned(u)).map(({ f, u }) => `${f}: ${u}`)
    expect(bad).toEqual([])
  })
})

type Step = { uses?: string; run?: string }
/** A job's steps with local composite actions expanded in place, in execution order. */
function flat(steps: Step[] = []): Step[] {
  return steps.flatMap((s) =>
    s.uses?.startsWith('./') && existsSync(resolve(ROOT, s.uses, 'action.yml'))
      ? flat(load(join(s.uses, 'action.yml')).runs.steps)
      : [s],
  )
}
const idx = (steps: Step[], re: RegExp) => steps.findIndex((s) => !!s.run && re.test(s.run))
const ASSERT = /scripts\/assert-prod-ref\.sh/
const DUMP = /supabase db dump/

describe('OPS-17: the backup path asserts the prod ref before dumping', () => {
  it('the prod-backup composite runs assert-prod-ref.sh before its first db dump', () => {
    const steps = flat(load('.github/actions/prod-backup/action.yml').runs.steps)
    const dump = idx(steps, DUMP)
    expect(dump, 'composite no longer dumps — this check is looking at nothing').toBeGreaterThanOrEqual(0)
    const ref = idx(steps, ASSERT)
    expect(ref, 'no assert-prod-ref.sh step in prod-backup').toBeGreaterThanOrEqual(0)
    expect(ref).toBeLessThan(dump)
  })

  it('every dumping job in backup.yml and deploy.yml asserts first', () => {
    const jobs = ['.github/workflows/backup.yml', '.github/workflows/deploy.yml'].flatMap((f) =>
      Object.entries<any>(load(f).jobs).map(([name, j]) => ({ name: `${f}#${name}`, steps: flat(j.steps) })),
    )
    const dumping = jobs.filter((j) => idx(j.steps, DUMP) >= 0)
    // positive control: backup.yml#dump and deploy.yml#migrate-prod both dump
    expect(dumping.map((j) => j.name).sort()).toEqual([
      '.github/workflows/backup.yml#dump',
      '.github/workflows/deploy.yml#migrate-prod',
    ])
    for (const j of dumping) {
      const ref = idx(j.steps, ASSERT)
      expect(ref, `${j.name}: no assert-prod-ref.sh`).toBeGreaterThanOrEqual(0)
      expect(ref, `${j.name}: assert-prod-ref.sh after db dump`).toBeLessThan(idx(j.steps, DUMP))
    }
  })
})
