/**
 * The round-trip budget of the child's pages, and the two fixes that bought it — 2026-09-03.
 *
 * Measured on production first (edge logs, one child's session): /menu made SIX network requests
 * where two would do, and the parent dashboard fired `is_chapter_entitled` 12–24 times in parallel
 * per tap (124 of 275 API requests in a day, p90 684 ms). Every request pays a 212 ms floor because
 * the project is in Sydney and the users are in the US, so the count IS the latency.
 *
 * Three kinds of check, none of which subsumes another:
 *  - the client functions, DRIVEN with a mocked db (one rpc, the mapping, the fail-open);
 *  - the pure 6-week rule, driven at its boundaries;
 *  - source gates on what nothing can drive here: the migration keeps ONE definition of
 *    entitlement, and the menu no longer imports the calls it folded away.
 * Every expectation below is written out, never imported from the thing it checks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
const decomment = (sql: string) => sql.replace(/--[^\n]*/g, '')

// ── the client: entitledChapters is ONE call ──────────────────────────────────────────────────
const rpc = vi.fn()
vi.mock('@/data/repositories/_shared', () => ({ db: () => ({ rpc }) }))

describe('entitledChapters — the parent dashboard asks once', () => {
  beforeEach(() => rpc.mockReset())

  it('makes exactly one rpc, to entitled_chapters, carrying the whole list', async () => {
    rpc.mockResolvedValue({ data: { counting: true, shapes: false }, error: null })
    const { entitledChapters } = await import('@/data/repositories/billing')
    const out = await entitledChapters('L1', ['counting', 'shapes'])
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('entitled_chapters', { p_learner_id: 'L1', p_chapters: ['counting', 'shapes'] })
    expect(out).toEqual({ counting: true, shapes: false })
  })

  it('a chapter the server did not answer is null, not false — and so is every chapter on an error', async () => {
    rpc.mockResolvedValueOnce({ data: { counting: true }, error: null })
    const { entitledChapters } = await import('@/data/repositories/billing')
    expect(await entitledChapters('L1', ['counting', 'shapes'])).toEqual({ counting: true, shapes: null })
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
    expect(await entitledChapters('L1', ['counting', 'shapes'])).toEqual({ counting: null, shapes: null })
    rpc.mockRejectedValueOnce(new Error('offline'))
    expect(await entitledChapters('L1', ['counting'])).toEqual({ counting: null })
  })

  it('an empty list costs no request at all', async () => {
    const { entitledChapters } = await import('@/data/repositories/billing')
    expect(await entitledChapters('L1', [])).toEqual({})
    expect(rpc).not.toHaveBeenCalled()
  })
})

// ── the pure 6-week rule, now shared by the menu and the parent dashboard ─────────────────────
describe('checkupStatus — the week-6 rule in one place', () => {
  const WEEK = 7 * 86_400_000
  const now = Date.UTC(2026, 8, 3)
  const at = (weeksAgo: number) => new Date(now - weeksAgo * WEEK).toISOString()

  it('is due at six weeks with a real gap and no closing re-check', async () => {
    const { checkupStatus } = await import('@/data/repositories/diagnostics')
    expect(checkupStatus({ band: '6-8', root_gap_skill: 'add10', completed_at: at(6) }, false, now))
      .toEqual({ rootGap: 'add10', band: '6-8', weeksSince: 6, recheckDue: true })
  })

  it('is NOT due one day short of six weeks, nor with no gap, nor once a re-check closed it', async () => {
    const { checkupStatus } = await import('@/data/repositories/diagnostics')
    const justShort = new Date(now - 6 * WEEK + 86_400_000).toISOString()
    expect(checkupStatus({ band: '6-8', root_gap_skill: 'add10', completed_at: justShort }, false, now)?.recheckDue).toBe(false)
    expect(checkupStatus({ band: '6-8', root_gap_skill: null, completed_at: at(9) }, false, now)?.recheckDue).toBe(false)
    expect(checkupStatus({ band: '6-8', root_gap_skill: 'add10', completed_at: at(9) }, true, now)?.recheckDue).toBe(false)
  })

  it('no check-up at all → null; an unfinished one counts as week zero', async () => {
    const { checkupStatus } = await import('@/data/repositories/diagnostics')
    expect(checkupStatus(null, false, now)).toBeNull()
    expect(checkupStatus({ band: '3-5', root_gap_skill: 'count', completed_at: null }, false, now)?.weeksSince).toBe(0)
  })
})

// ── source gates: what a unit cannot see ──────────────────────────────────────────────────────
describe('the migration keeps ONE definition of entitlement, and it is plan-cached', () => {
  const migDir = join(ROOT, 'supabase/migrations')
  const migFiles = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort()
  const all = decomment(migFiles.map(f => read(`supabase/migrations/${f}`)).join('\n'))

  it("the NEWEST is_chapter_entitled is plpgsql — a SQL-language body is re-planned on every call on PG 17", () => {
    const defs = [...all.matchAll(/create or replace function public\.is_chapter_entitled\(p_learner_id uuid, p_chapter text\)\s*returns boolean\s*language (\w+)/gi)]
    expect(defs.length, 'no definition found — this gate is inert').toBeGreaterThan(1)
    expect(defs[defs.length - 1][1].toLowerCase()).toBe('plpgsql')
  })

  it('entitled_chapters CALLS is_chapter_entitled and does not restate the rule', () => {
    const m = all.match(/create or replace function public\.entitled_chapters\(p_learner_id uuid, p_chapters text\[\]\)[\s\S]*?\$\$([\s\S]*?)\$\$/i)
    expect(m, 'entitled_chapters not found — this gate is inert').not.toBeNull()
    const body = m![1]
    expect(body).toMatch(/public\.is_chapter_entitled\(p_learner_id, c\)/)
    // a copy of the rule would name the switch, the free flag or the seats; the one definition does not live here
    expect(body).not.toMatch(/billing_config|is_free|subscription_seats/)
    expect(body, 'unbounded array — the V5 rule').toMatch(/array_length\(p_chapters, 1\)/)
  })

  it('the newest get_learner_bootstrap carries the three folded rows', () => {
    const defs = [...all.matchAll(/create or replace function public\.get_learner_bootstrap\(p_learner_id uuid\)[\s\S]*?\$\$([\s\S]*?)\$\$/gi)]
    expect(defs.length, 'no definition found — this gate is inert').toBeGreaterThan(0)
    const body = defs[defs.length - 1][1]
    for (const key of ["'checkup'", "'recheck_closed'", "'plan'"]) expect(body).toContain(key)
    expect(body).toMatch(/from public\.diagnostic_sessions d[\s\S]*order by d\.completed_at desc limit 1/)
    expect(body).toMatch(/from public\.diagnostic_rechecks r[\s\S]*order by r\.created_at desc limit 1/)
    expect(body).toMatch(/from public\.diagnostic_plans dp[\s\S]*and dp\.active/)
  })
})

describe('/menu: two requests, not six', () => {
  const menu = read('src/app/menu/page.tsx')
  const diag = read('src/data/repositories/diagnostics.ts')

  it('imports nothing from the data layer but the bootstrap, the grade list and the shop write-back', () => {
    const m = menu.match(/import \{([^}]*)\} from '@\/data\/repositories'/g) ?? []
    expect(m.length, 'one import line from the data layer').toBe(1)
    const names = m[0]!.replace(/import \{|\} from .*/g, '').split(',').map(s => s.trim().replace(/^type\s+/, '')).filter(Boolean).sort()
    // `checkupStatus` is pure and `LearnerBootstrap` is a type — neither is a request
    expect(names).toEqual(['LearnerBootstrap', 'checkupStatus', 'getGradeChapterIds', 'getLearnerBootstrap', 'saveLearnerState'])
    expect(menu).not.toMatch(/getCheckupStatus|getActivePlanChapters/)
  })

  it('reads the re-check card off the bootstrap, on the cold path AND the 30 s remount path', () => {
    // the declaration is `showRecheck = (…) =>`, so `showRecheck(` counts CALLS only: cold path + TTL remount
    expect((menu.match(/showRecheck\(/g) ?? []).length, 'called on both paths').toBe(2)
    expect(menu).toMatch(/applyPlan\(progress\.filter[^\n]*, boot\.data\.plan\)/)
  })

  it('getCheckupStatus no longer round-trips to GoTrue for an identity RLS already enforces', () => {
    const fn = diag.match(/export async function getCheckupStatus[\s\S]*?\n\}/)![0]
    expect(fn).not.toMatch(/auth\.getUser\(/)
    expect(fn).toMatch(/auth\.getSession\(/)
    expect(fn).toMatch(/return checkupStatus\(/)
  })
})
