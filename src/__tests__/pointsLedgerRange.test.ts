// @vitest-environment node
/**
 * 20261016120000 — the ledger is read by range, today's room once per answer, and the upload queue in one request.
 *
 * Same numbers as before, written out by hand: rows are planted at the edges of the family's day (a second before
 * today's local midnight, exactly at it, a second before tomorrow's), and the expected room, game minutes and balance
 * are counted here, not read from the functions under test. Driven as the child's own sign-in (`authenticated`,
 * access_role 'self'), on the real schema (baseline + every migration) in PGlite.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccd'
let db: PGlite
let kid: string
let seq = 0

const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows
async function as(role: 'authenticated' | 'anon', sql: string): Promise<{ v?: Record<string, unknown>; error?: { code?: string; message: string } }> {
  await db.exec(`select set_config('test.uid', '${role === 'anon' ? '' : CHILD}', false)`)
  await db.exec(`set role ${role}`)
  try { return { v: (await db.query<{ v: Record<string, unknown> }>(sql)).rows[0].v } }
  catch (e) { return { error: { code: (e as { code?: string }).code, message: (e as Error).message } } }
  finally { await db.exec('reset role') }
}
const ev = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`
// Today's local midnight in the family's zone, as a timestamptz expression (Asia/Kolkata: UTC+5:30, no DST).
const MIDNIGHT = `(((now() at time zone 'Asia/Kolkata')::date)::timestamp at time zone 'Asia/Kolkata')`
const plant = (points: number, at: string, reason = 'problem', minutes: number | null = null) =>
  db.exec(`insert into public.point_events (learner_id, reason, lesson_id, points, minutes, created_at)
           values ('${kid}', '${reason}', 'g3m1-t1', ${points}, ${minutes ?? 'null'}, ${at})`)

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${PARENT}', 'p2@x.test', now()), ('${CHILD}', 'kid2@learner.adaptivelearn.invalid', now())`)
  const consent = await grantedConsent(db, PARENT)
  ;[{ id: kid }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('Kid', 0, '9-11', '${PARENT}', '${consent}', '${FIXTURE_NOTICE}') returning id`)
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${CHILD}', 'self')`)
  await db.exec(`insert into public.game_settings (learner_id, enabled, minutes_per_day, time_zone) values ('${kid}', true, 30, 'Asia/Kolkata')`)
}, 120_000)

describe("today is the family's local day, edges included", () => {
  it('room, game minutes and balance are the hand-counted numbers', async () => {
    await db.exec(`delete from public.point_events where learner_id = '${kid}'`)
    await plant(100, `${MIDNIGHT} - interval '1 second'`)                 // yesterday: in the balance, not today's room
    await plant(7, MIDNIGHT)                                              // today's first instant: counted
    await plant(11, `${MIDNIGHT} + interval '1 day' - interval '1 second'`) // today's last second: counted
    await plant(13, `${MIDNIGHT} + interval '1 day'`)                     // tomorrow: not today
    await plant(-40, `${MIDNIGHT} + interval '1 hour'`, 'game', 5)        // 5 game minutes today (negative: not "earned")
    await plant(-80, `${MIDNIGHT} - interval '1 hour'`, 'game', 10)       // 10 game minutes yesterday
    // room = 300 - (7 + 11) = 282; minutes today = 5; balance = 100 + 7 + 11 + 13 - 40 - 80 = 11
    expect((await q<{ r: number }>(`select public.points_room_today('${kid}') r`))[0].r).toBe(282)
    const w = (await as('authenticated', `select public.game_wallet('${kid}') as v`)).v
    expect(w?.minutes_used_today).toBe(5)
    expect(w?.balance).toBe(11)
  })

  it("an answer's awards share ONE room: with 4 left, first-try (2) fits and the level up (3) then does not", async () => {
    await db.exec(`delete from public.point_events where learner_id = '${kid}'; delete from public.lesson_progress where learner_id = '${kid}'`)
    for (const n of [100, 100, 96]) await plant(n, `${MIDNIGHT} + interval '1 minute'`)   // 296 today (a row holds at most 100)
    const r = await as('authenticated', `select public.record_lesson_progress('${kid}', 'g3m1-t1', false, 1, 1, false, 'first', '${ev()}', now()) as v`)
    // 2, not 5: a room read once and not reduced by what this answer already earned would also pay the +3.
    expect(r.v?.earned).toBe(2)
    expect(r.v?.balance).toBe(298)
  })
})

describe('sync_batch: the queue in one request, in order, stopping at the first refusal', () => {
  const lesson = (lessonId: string, event = ev()) => ({ k: 'lesson', a: { p_learner: kid, p_lesson: lessonId, p_done: false, p_level: 0, p_streak: 1, p_mastered: false, p_outcome: 'first', p_event: event, p_answered_at: new Date().toISOString() } })
  const batch = (items: unknown[]) => `select public.sync_batch('${JSON.stringify(items).replace(/'/g, "''")}'::jsonb) as v`

  it('runs every item, as the existing functions would one by one', async () => {
    await db.exec(`delete from public.point_events where learner_id = '${kid}'; delete from public.lesson_progress where learner_id = '${kid}'`)
    const r = await as('authenticated', batch([
      lesson('g3m1-t1'),
      { k: 'run', a: { p_learner: kid, p_lesson: 'g3m1-t1', p_run: { asked: 1 } } },
      { k: 'module', a: { p_learner: kid, p_module: 'g3m1', p_event: ev() } },
    ]))
    expect(r.v).toEqual({ done: 3 })
    expect(await q(`select reason, points from public.point_events where learner_id = '${kid}' order by points`))
      .toEqual([{ reason: 'problem', points: 2 }, { reason: 'module_done', points: 10 }])
    expect(await q(`select run from public.lesson_progress where learner_id = '${kid}'`)).toEqual([{ run: { asked: 1 } }])
  })

  it('a re-sent batch pays nothing twice (client_id idempotency still holds)', async () => {
    await db.exec(`delete from public.point_events where learner_id = '${kid}'`)
    const items = [lesson('g3m1-t2', ev())]
    expect((await as('authenticated', batch(items))).v).toEqual({ done: 1 })
    expect((await as('authenticated', batch(items))).v).toEqual({ done: 1 })
    expect((await q<{ n: number }>(`select count(*)::int n from public.point_events where learner_id = '${kid}'`))[0].n).toBe(1)
  })

  it('stops at the first refusal: what came before is kept, the refused item and what follows are not run', async () => {
    await db.exec(`delete from public.point_events where learner_id = '${kid}'`)
    const r = await as('authenticated', batch([lesson('g3m1-t3'), lesson('g8m99-t1'), lesson('g3m1-t4')]))
    expect(r.v?.done).toBe(1)
    expect(r.v?.code).toBe('P0L01')
    expect(await q(`select lesson_id from public.point_events where learner_id = '${kid}'`)).toEqual([{ lesson_id: 'g3m1-t3' }])
    expect(await q(`select 1 from public.lesson_progress where learner_id = '${kid}' and lesson_id in ('g8m99-t1', 'g3m1-t4')`)).toEqual([])
  })

  it("another family's child is refused inside the batch (42501), exactly as the single call refuses it", async () => {
    const r = await as('authenticated', batch([{ ...lesson('g3m1-t1'), a: { ...lesson('g3m1-t1').a, p_learner: '99999999-9999-4999-8999-999999999999' } }]))
    expect(r.v).toMatchObject({ done: 0, code: '42501' })
  })

  it('anon cannot call it; POSITIVE TWIN: authenticated can (above)', async () => {
    expect(String((await as('anon', batch([]))).error?.message)).toMatch(/permission denied/)
    expect((await as('authenticated', batch([]))).v).toEqual({ done: 0 })
  })
})
