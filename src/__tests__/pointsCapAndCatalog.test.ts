// @vitest-environment node
/**
 * 20260928180000 — points are paid only for lessons, chapters and modules the app really has, and at most 300 a day.
 *
 * Driven as the child's own sign-in (`authenticated`, access_role 'self'), the caller the rule is about, on the real
 * schema (baseline + every migration) in PGlite. Every refusal has its positive twin: a real lesson still pays, a new
 * day pays again, progress is recorded even when points are not. Numbers written out here by hand.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'
import { ALL_MODULES, MODULES } from '@/features/lessons/modules'
import { classifySyncError } from '@/data/repositories/_shared'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
let db: PGlite
let kid: string
let seq = 0

const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows
async function asChild(sql: string): Promise<{ v?: { earned: number; balance: number }; error?: { code?: string; message: string } }> {
  await db.exec(`select set_config('test.uid', '${CHILD}', false)`)
  await db.exec('set role authenticated')
  try { return { v: (await db.query<{ v: { earned: number; balance: number } }>(sql)).rows[0].v } }
  catch (e) { return { error: { code: (e as { code?: string }).code, message: (e as Error).message } } }
  finally { await db.exec('reset role') }
}
const ev = () => `'00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}'`
const answer = (lesson: string, outcome = 'first', level = 0) =>
  asChild(`select public.record_lesson_progress('${kid}', '${lesson}', false, ${level}, 1, false, '${outcome}', ${ev()}) as v`)
const balance = async () => Number((await q<{ b: number }>(`select coalesce(sum(points), 0)::int b from public.point_events where learner_id = '${kid}'`))[0].b)

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${PARENT}', 'p@x.test', now()), ('${CHILD}', 'kid@learner.adaptivelearn.invalid', now())`)
  const consent = await grantedConsent(db, PARENT)
  ;[{ id: kid }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('Kid', 0, '9-11', '${PARENT}', '${consent}', '${FIXTURE_NOTICE}') returning id`)
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${CHILD}', 'self')`)
}, 120_000)

describe('only real lessons, chapters and modules', () => {
  it('a made-up topic id is refused (P0L01) and nothing is written', async () => {
    const r = await answer('g8m99-t1')
    expect(r.error?.code).toBe('P0L01')
    expect(await q(`select 1 from public.lesson_progress where learner_id = '${kid}' and lesson_id = 'g8m99-t1'`)).toEqual([])
    expect(await balance()).toBe(0)
  })
  it('a made-up chapter id is refused too', async () => {
    expect((await answer('c:notAChapter')).error?.code).toBe('P0L01')
  })
  it('a made-up module is refused, and a lesson id is not a module', async () => {
    for (const m of ['g3m99', 'g3m1-t1']) {
      expect((await asChild(`select public.record_module_practice('${kid}', '${m}', ${ev()}) as v`)).error?.code, m).toBe('P0L01')
    }
  })
  it('POSITIVE TWIN: a real topic, a real chapter and a real module still pay (2, 2, 10)', async () => {
    expect((await answer('g3m1-t1')).v?.earned).toBe(2)
    expect((await answer('c:counting')).v?.earned).toBe(2)
    expect((await asChild(`select public.record_module_practice('${kid}', 'g3m1', ${ev()}) as v`)).v?.earned).toBe(10)
  })
  it("the app keeps a refused answer on the device: P0L01 is 'retry', never 'drop'", () => {
    expect(classifySyncError({ code: 'P0L01', message: 'unknown_lesson' })).toBe('retry')
  })
  it('the catalogue is exactly what the app records under (every topic, chapter and module; nothing else)', async () => {
    const rows = await q<{ id: string; kind: string }>(`select id, kind from public.lesson_catalog`)
    const want = [
      ...ALL_MODULES.flatMap(m => m.lessons.map(l => `${l.id.startsWith('c:') ? 'chapter' : 'lesson'} ${l.id}`)),
      ...MODULES.filter(m => m.lessons.length > 0).map(m => `module ${m.id}`),
    ].sort()
    expect(rows.map(r => `${r.kind} ${r.id}`).sort()).toEqual(want)
    expect(want.length, 'control: the app lists its lessons').toBeGreaterThan(300)
  })
})

describe('at most 300 points a day', () => {
  it('first-try answers stop paying at 300 — and progress is still recorded', async () => {
    await db.exec(`delete from public.point_events where learner_id = '${kid}'`)
    let last = { earned: -1, balance: -1 }
    for (let i = 0; i < 160; i++) last = (await answer('g3m1-t2')).v ?? last
    expect(await balance()).toBe(300)
    expect(last.earned).toBe(0)
    // A level up at the cap pays nothing either (awards are never split: a +3 does not fit in the room of 0).
    expect((await answer('g3m1-t2', 'first', 1)).v?.earned).toBe(0)
    expect(await q(`select lesson_id from public.lesson_progress where learner_id = '${kid}' and lesson_id = 'g3m1-t2'`)).toEqual([{ lesson_id: 'g3m1-t2' }])
  })
  it('a module finished at the cap pays nothing', async () => {
    expect((await asChild(`select public.record_module_practice('${kid}', 'g3m2', ${ev()}) as v`)).v?.earned).toBe(0)
  })
  it('POSITIVE TWIN: the next day pays again', async () => {
    await db.exec(`update public.point_events set created_at = created_at - interval '1 day' where learner_id = '${kid}'`)
    expect((await answer('g3m1-t3')).v?.earned).toBe(2)
  })
  it('a client cannot call the room function or read the catalogue', async () => {
    for (const sql of [`select public.points_room_today('${kid}') as v`, `select count(*) as v from public.lesson_catalog`]) {
      expect(String((await asChild(sql)).error?.message), sql).toMatch(/permission denied/)
    }
  })
})
