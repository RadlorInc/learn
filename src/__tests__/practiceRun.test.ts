// @vitest-environment node
/**
 * `lesson_progress.run` — where a child is in a topic's practice (migration 20260925100000), driven in the repo's real
 * schema as the roles a browser has. It is a new field about a child, so the founder's rule 3 applies: behind the
 * consent gate, deleted with one child and with a whole-account withdrawal. (Export: withdrawExportE2e.test.ts.)
 * Every refusal is paired with the same caller, or the rightful one, succeeding — a function nobody can call, or a
 * deletion that deletes everything, would pass a refusal-only check.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', GATED = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const KID = '11111111-1111-4111-8111-111111111111', SIB = '22222222-2222-4222-8222-222222222222'
const KID3 = '33333333-3333-4333-8333-333333333333'
const RUN = `'{"asked": 7, "recent": ["q1", "q2"], "current": {"from": "g3m2-t1", "problem": {"text": "q2", "answer": 2, "picture": {"kind": "eq", "text": ""}}}, "review": null}'`
let db: PGlite, consent3 = ''

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
    ('${PARENT}', 'p@x.test', now()), ('${CHILD}', 'kid@learner.adaptivelearn.invalid', now()),
    ('${OTHER}', 'o@x.test', now()), ('${GATED}', 'g@x.test', now())`)
  const c1 = await grantedConsent(db, PARENT)
  consent3 = await grantedConsent(db, GATED)
  await db.exec(`
    insert into public.learners (id, display_name, created_by, age_group, consent_id, attested_notice_version) values
      ('${KID}', 'Kid', '${PARENT}', '3-5', '${c1}', '${FIXTURE_NOTICE}'),
      ('${SIB}', 'Sib', '${PARENT}', '3-5', '${c1}', '${FIXTURE_NOTICE}');
    insert into public.learners (id, display_name, created_by, age_group, consent_id, attested_notice_version) values
      ('${KID3}', 'Three', '${GATED}', '3-5', '${consent3}', '${FIXTURE_NOTICE}');
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${KID}', '${CHILD}', 'self');`)
}, 120_000)

async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ v?: unknown; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try {
    const r = await db.query<Record<string, unknown>>(sql)
    return { v: r.rows[0] ? Object.values(r.rows[0])[0] : undefined }
  } catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const save = (uid: string | null, kid: string, lesson = 'g3m2-t1', role = 'authenticated') =>
  as(uid, `select public.save_practice_run('${kid}', '${lesson}', ${RUN})`, role)
const runOf = async (kid: string, lesson = 'g3m2-t1') =>
  (await db.query<{ run: { asked: number } | null }>(`select run from public.lesson_progress where learner_id = '${kid}' and lesson_id = '${lesson}'`)).rows[0]?.run ?? null

describe('save_practice_run', () => {
  it('the child\'s own login and the parent save it and read it back — another family and anon cannot', async () => {
    expect((await save(CHILD, KID)).err).toBeUndefined()
    expect((await as(PARENT, `select run->>'asked' from public.lesson_progress where learner_id = '${KID}'`)).v).toBe('7')
    expect((await save(PARENT, KID, 'g3m2-t2')).err).toBeUndefined()
    expect((await save(OTHER, KID)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect((await as(OTHER, `select count(*)::int from public.lesson_progress where learner_id = '${KID}'`)).v).toBe(0)
    expect((await save(null, KID, 'g3m2-t1', 'anon')).err ?? 'ALLOWED').toMatch(/permission denied/)
  })

  it('writes only the run: it cannot move a level, mastery, done or a point', async () => {
    await as(CHILD, `select public.record_lesson_progress('${KID}', 'g3m2-t3', false, 2, 1, false, null, null)`)
    const pts = async () => (await db.query<{ n: number }>(`select count(*)::int as n from public.point_events where learner_id = '${KID}'`)).rows[0].n
    const before = await pts()
    expect((await save(CHILD, KID, 'g3m2-t3')).err).toBeUndefined()
    const row = (await db.query<Record<string, unknown>>(`select level, streak, mastered, done from public.lesson_progress where learner_id = '${KID}' and lesson_id = 'g3m2-t3'`)).rows[0]
    expect(row).toEqual({ level: 2, streak: 1, mastered: false, done: false })
    expect(await pts()).toBe(before)
    expect((await runOf(KID, 'g3m2-t3'))?.asked).toBe(7)
    // …and record_lesson_progress, the other writer, leaves the run alone.
    await as(CHILD, `select public.record_lesson_progress('${KID}', 'g3m2-t3', false, 3, 0, false, null, null)`)
    expect((await runOf(KID, 'g3m2-t3'))?.asked).toBe(7)
  })

  it('a browser still cannot write lesson_progress directly — not even the run', async () => {
    expect((await as(CHILD, `update public.lesson_progress set run = '{}' where learner_id = '${KID}'`)).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(CHILD, `select count(*)::int from public.lesson_progress where learner_id = '${KID}'`)).v).toBeGreaterThan(0)   // positive control: the read is allowed
  })

  it('is behind the consent gate: refused once the account\'s consent is withdrawn', async () => {
    expect((await save(GATED, KID3)).err).toBeUndefined()          // positive control: consent granted → saved
    await db.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = '${consent3}'`)
    expect((await save(GATED, KID3, 'g3m2-t2')).err ?? 'ALLOWED').toMatch(/consent/i)
    expect(await runOf(KID3, 'g3m2-t2')).toBeNull()
  })
})

describe('deleted with the child', () => {
  it('deleting one child removes that child\'s run and leaves the sibling\'s', async () => {
    expect((await save(PARENT, SIB)).err).toBeUndefined()
    expect(await runOf(SIB)).not.toBeNull()                          // positive control: the row existed
    expect((await as(PARENT, `select public.delete_learner('${KID}')`)).err).toBeUndefined()
    expect((await db.query(`select 1 from public.lesson_progress where learner_id = '${KID}'`)).rows).toEqual([])
    expect(await runOf(SIB)).not.toBeNull()
  })

  it('withdrawing the whole account\'s consent removes every child\'s run', async () => {
    expect(await runOf(SIB)).not.toBeNull()
    expect((await as(PARENT, `select public.withdraw_my_consent()`)).err).toBeUndefined()
    expect((await db.query(`select 1 from public.lesson_progress where learner_id = '${SIB}'`)).rows).toEqual([])
  })
})

describe('the migration refuses to land wrong — and takes everything with it', () => {
  const FILE = '20260925100000_practice_run.sql'
  const sqlOf = () => readFileSync(resolve(__dirname, '../../supabase/migrations', FILE), 'utf8')
  const plant = (line: string) => sqlOf().replace('-- ── Closing assertions', `${line}\n-- ── Closing assertions`)
  const hasColumn = async (d: PGlite) => (await d.query(`select 1 from information_schema.columns where table_name = 'lesson_progress' and column_name = 'run'`)).rows.length === 1

  it.each([
    ['anon can call it', 'grant execute on function public.save_practice_run(uuid, text, jsonb) to anon;'],
    ['browsers can update the table', 'grant update on public.lesson_progress to authenticated;'],
    ['the consent gate is gone', 'drop trigger trg_enforce_child_consent on public.lesson_progress;'],
  ])('%s → the file raises and the column is not there afterwards', async (_why, line) => {
    const { db: fresh } = await loadSchema({ before: FILE })
    const refused = await fresh.exec(plant(line)).then(() => 'LANDED', (e: Error) => e.message)
    expect(refused).toMatch(/practice-run: .* rolled back/)
    expect(await hasColumn(fresh)).toBe(false)
    // Positive control: the same database takes the file as written.
    await fresh.exec(sqlOf())
    expect(await hasColumn(fresh)).toBe(true)
  }, 120_000)
})

describe('the founder\'s before/proof SQL, rehearsed on the production-shaped schema', () => {
  // supabase_migrations is the CLI's ledger; the fixture has none, so it is created here the way the CLI records a file.
  const ledger = `create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (version text primary key);`
  const run = async (d: PGlite, f: string) =>
    (await d.query<{ check: string; result: string }>(readFileSync(resolve(__dirname, '../../docs/legal/sql', f), 'utf8'))).rows
  const fails = (rows: { check: string; result: string }[]) => rows.filter(r => !r.check.startsWith('INFO') && r.result !== 'PASS').map(r => r.check)
  const info = (rows: { check: string; result: string }[], k: string) => rows.find(r => r.check.startsWith(`INFO ${k}`))!.result

  it('before: all PASS on the pre-migration schema; proof: all PASS after it, and the counts move as stated', async () => {
    const { db: d } = await loadSchema({ before: '20260925100000_practice_run.sql' })
    await d.exec(ledger)
    const before = await run(d, 'ss-before.sql')
    expect(fails(before)).toEqual([])
    // Control: the proof, run BEFORE the apply, does not pass — it errors on the missing column — so it can tell the
    // two states apart.
    expect(await run(d, 'ss-proof.sql').then(r => fails(r).length, () => 'error')).not.toBe(0)
    await d.exec(readFileSync(resolve(__dirname, '../../supabase/migrations/20260925100000_practice_run.sql'), 'utf8'))
    await d.exec(`insert into supabase_migrations.schema_migrations values ('20260925100000')`)
    const after = await run(d, 'ss-proof.sql')
    expect(fails(after)).toEqual([])
    expect(info(after, 'lesson_progress rows')).toBe(info(before, 'lesson_progress rows'))
    expect(Number(info(after, 'SECURITY DEFINER'))).toBe(Number(info(before, 'SECURITY DEFINER')) + 1)
  }, 120_000)
})
