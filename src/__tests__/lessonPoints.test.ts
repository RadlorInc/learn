// @vitest-environment node
/**
 * Lesson progress on the account, points, and game time (migration 20260917112109), driven in the repo's real schema
 * as the roles a browser has: the parent who owns the child, the child's own 'self' login, and another family.
 * Rules: docs/new-flow/points.md. Every refusal is paired with the same caller succeeding at something, so a function
 * nobody can call cannot pass.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'     // the child's own login
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'     // another family
const KID = '11111111-1111-4111-8111-111111111111'
let db: PGlite

beforeAll(async () => {
  ({ db } = await loadSchema())
  // ⚠️ THREE STATEMENTS, NOT ONE. `await grantedConsent(...)` inside a template literal is evaluated
  // BEFORE the exec it sits in, so folding these together inserts the consent before the parent's
  // auth.users row exists and trips the foreign key. Order the awaits, not just the SQL.
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
      ('${PARENT}', 'p@x.test', now()), ('${CHILD}', 'kid@learner.adaptivelearn.invalid', now()), ('${OTHER}', 'o@x.test', now())`)
  const consent = await grantedConsent(db, PARENT)
  await db.exec(`
    insert into public.learners (id, display_name, created_by, age_group, consent_id) values ('${KID}', 'Kid', '${PARENT}', '3-5', '${consent}');
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${KID}', '${CHILD}', 'self');
  `)
}, 120_000)

async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ v?: unknown; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try {
    const r = await db.query<Record<string, unknown>>(sql)
    return { v: r.rows[0] ? Object.values(r.rows[0])[0] : undefined }
  } catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const rpc = async (uid: string, call: string) => {
  const r = await as(uid, `select public.${call}`)
  if (r.err) throw new Error(r.err)
  return r.v as Record<string, unknown>
}
let n = 0
const ev = () => `'00000000-0000-4000-8000-${String(++n).padStart(12, '0')}'`
const progress = (uid: string, lesson: string, done: boolean, level: number, mastered: boolean, outcome: string | null, event: string | null = null) =>
  rpc(uid, `record_lesson_progress('${KID}', '${lesson}', ${done}, ${level}, 0, ${mastered}, ${outcome ? `'${outcome}'` : 'null'}, ${event ?? 'null'})`)
const balance = async () => (await rpc(PARENT, `game_wallet('${KID}')`)).balance

describe('lesson progress and points', () => {
  it('the tables are read-only to a browser — rows only arrive through the functions', async () => {
    for (const t of ['lesson_progress', 'point_events', 'game_settings']) {
      expect((await as(CHILD, `select count(*) from public.${t}`)).err, `${t} select`).toBeUndefined()   // positive control
    }
    expect((await as(CHILD, `insert into public.point_events (learner_id, reason, points) values ('${KID}', 'problem', 100)`)).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(CHILD, `insert into public.lesson_progress (learner_id, lesson_id, mastered) values ('${KID}', 'g3m2-t1', true)`)).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(CHILD, `insert into public.game_settings (learner_id, minutes_per_day) values ('${KID}', 240)`)).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(null, `select public.game_wallet('${KID}')`, 'anon')).err ?? 'ALLOWED').toMatch(/permission denied/)
  })

  it('another family can neither record nor read this child — while the child and the parent can', async () => {
    expect((await as(OTHER, `select public.record_lesson_progress('${KID}', 'g3m2-t1', true, 0, 0, false, null, null)`)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect((await as(OTHER, `select public.game_wallet('${KID}')`)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect((await as(OTHER, `select public.start_game_time('${KID}', 1)`)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect(await balance()).toBe(0)
    expect((await rpc(CHILD, `game_wallet('${KID}')`)).balance).toBe(0)
  })

  it('a problem earns 2 on the first try and 1 otherwise, and a retried upload is not paid twice', async () => {
    const e = ev()
    expect((await progress(CHILD, 'g3m2-t1', false, 0, false, 'first', e)).earned).toBe(2)
    expect((await progress(CHILD, 'g3m2-t1', false, 0, false, 'first', e)).earned).toBe(0)   // the offline queue retrying
    expect((await progress(CHILD, 'g3m2-t1', false, 0, false, 'second', ev())).earned).toBe(1)
    expect((await progress(CHILD, 'g3m2-t1', false, 0, false, 'worked', ev())).earned).toBe(1)
    expect(await balance()).toBe(4)
  })

  it('a level up earns 3; mastering and finishing earn 15 and 10 ONCE, however often they are sent', async () => {
    expect((await progress(CHILD, 'g3m2-t1', false, 1, false, null)).earned).toBe(3)
    expect((await progress(CHILD, 'g3m2-t1', false, 1, false, null)).earned).toBe(0)
    expect((await progress(CHILD, 'g3m2-t1', true, 1, true, null)).earned).toBe(25)
    expect((await progress(CHILD, 'g3m2-t1', true, 1, true, null)).earned).toBe(0)
    // Losing mastery (the worked steps) and winning it back is not a second bonus.
    await progress(CHILD, 'g3m2-t1', true, 0, false, null)
    expect((await progress(CHILD, 'g3m2-t1', true, 1, true, null)).earned).toBe(3)   // only the level
    expect(await balance()).toBe(4 + 3 + 25 + 3)
  })

  it('progress follows the account: what one device saved, any signed-in device reads', async () => {
    const row = (await as(PARENT, `select row_to_json(p) from public.lesson_progress p where learner_id = '${KID}' and lesson_id = 'g3m2-t1'`)).v as Record<string, unknown>
    expect([row.done, row.level, row.mastered]).toEqual([true, 1, true])
    // A device that never saw it finished cannot un-finish it.
    await progress(CHILD, 'g3m2-t1', false, 1, true, null)
    expect((await as(PARENT, `select done from public.lesson_progress where learner_id = '${KID}' and lesson_id = 'g3m2-t1'`)).v).toBe(true)
  })

  it('module practice earns 10 per run, once per upload', async () => {
    const e = ev()
    expect((await rpc(CHILD, `record_module_practice('${KID}', 'g3m2', ${e})`)).earned).toBe(10)
    expect((await rpc(CHILD, `record_module_practice('${KID}', 'g3m2', ${e})`)).earned).toBe(0)
  })
})

describe('game time', () => {
  it('only the owning adult sets the rules — the child\'s own login cannot give itself more minutes', async () => {
    expect((await as(CHILD, `select public.set_game_settings('${KID}', true, 240, 'UTC')`)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect((await as(OTHER, `select public.set_game_settings('${KID}', true, 240, 'UTC')`)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect(await rpc(PARENT, `set_game_settings('${KID}', true, 5, 'America/New_York')`)).toEqual({ ok: true })
    expect(await rpc(PARENT, `set_game_settings('${KID}', true, 5, 'Mars/Olympus')`)).toEqual({ ok: false, error: 'bad_time_zone' })
    const w = await rpc(CHILD, `game_wallet('${KID}')`)
    expect([w.minutes_per_day, w.time_zone, w.points_per_minute]).toEqual([5, 'America/New_York', 8])
  })

  it('spends 8 points a minute, refuses past the balance and the daily limit, and never charges a running game twice', async () => {
    const before = Number(await balance())   // 45
    expect(await rpc(CHILD, `start_game_time('${KID}', 6)`)).toEqual({ ok: false, error: 'daily_limit' })
    const started = await rpc(CHILD, `start_game_time('${KID}', 3)`)
    expect([started.ok, started.balance]).toEqual([true, before - 24])
    const again = await rpc(CHILD, `start_game_time('${KID}', 2)`)
    expect([again.ok, again.balance, again.playing_until]).toEqual([true, before - 24, started.playing_until])

    await db.exec(`update public.point_events set ends_at = now() - interval '1 second' where reason = 'game'`)   // the game ends
    expect(await rpc(CHILD, `start_game_time('${KID}', 3)`)).toEqual({ ok: false, error: 'daily_limit' })   // 3 used of 5
    expect((await rpc(CHILD, `start_game_time('${KID}', 2)`)).ok).toBe(true)                                 // 2 left: allowed
    expect((await rpc(CHILD, `game_wallet('${KID}')`)).minutes_used_today).toBe(5)

    await db.exec(`update public.point_events set ends_at = now() - interval '1 second', created_at = now() - interval '2 days' where reason = 'game'`)   // another day
    expect(await rpc(CHILD, `start_game_time('${KID}', 3)`)).toEqual({ ok: false, error: 'not_enough_points' })   // 5 points left
  })

  it('switched off means no game, whatever the balance', async () => {
    await progress(CHILD, 'g3m2-t2', true, 0, true, null)   // +25
    expect(await rpc(PARENT, `set_game_settings('${KID}', false, 20, 'UTC')`)).toEqual({ ok: true })
    expect(await rpc(CHILD, `start_game_time('${KID}', 1)`)).toEqual({ ok: false, error: 'off' })
    expect(await rpc(PARENT, `set_game_settings('${KID}', true, 20, 'UTC')`)).toEqual({ ok: true })
    expect((await rpc(CHILD, `start_game_time('${KID}', 1)`)).ok).toBe(true)
  })
})
