// @vitest-environment node
/**
 * Paid testers (migration 20261004120000): the admin makes a link, the link's token lets an anonymous tester open
 * their one module and review its screens, and nothing else. Every refusal here has its admitted twin.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ADMIN_MIG = readFileSync(resolve(__dirname, '../../supabase/migrations/20260905150000_admin_role_and_metrics.sql'), 'utf8')
const MIG = readFileSync(resolve(__dirname, '../../supabase/migrations/20261004120000_tester_reviews.sql'), 'utf8')
const PARENT = '11111111-1111-1111-1111-111111111111'
const ADMIN = '22222222-2222-2222-2222-222222222222'

let db: PGlite
let token = '', id = ''

beforeAll(async () => {
  db = await PGlite.create()
  await db.exec(`
    create schema if not exists auth;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
    end $$;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('test.uid', true),'')::uuid $$;
    grant usage on schema public to anon, authenticated;
    create table public.admin_users (user_id uuid primary key);
    alter table public.admin_users enable row level security;
    insert into public.admin_users values ('${ADMIN}');
  `)
  const at = ADMIN_MIG.indexOf('create or replace function public.admin_assert')
  await db.exec(ADMIN_MIG.slice(at, ADMIN_MIG.indexOf('$$;', at) + 3))
  await db.exec(MIG)
}, 60_000)

async function as<T>(role: 'anon' | 'authenticated', uid: string | null, sql: string, params: unknown[] = []) {
  await db.exec(`select set_config('test.uid','${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { return { ok: true as const, rows: (await db.query<T>(sql, params)).rows } }
  catch (e) { return { ok: false as const, err: (e as Error).message, rows: [] as T[] } }
  finally { await db.exec('reset role') }
}
const review = (t: string, lesson: string, screen: string, verdict: string, note: string | null) =>
  as('anon', null, 'select public.tester_review($1,$2,$3,$4,$5,$6,$7,$8)', [t, lesson, screen, verdict, note, null, 4200, true])

describe('making a tester link', () => {
  it('anon and a signed-in parent are refused', async () => {
    expect((await as('anon', null, `select public.admin_tester_create('t@x.co','g3m1')`)).ok).toBe(false)
    const p = await as('authenticated', PARENT, `select public.admin_tester_create('t@x.co','g3m1')`)
    expect(p.ok).toBe(false)
    expect(p.err).toMatch(/not an administrator/)
  })
  it('the admin gets a 64-hex token', async () => {
    const r = await as<{ j: { id: string; token: string } }>('authenticated', ADMIN, `select public.admin_tester_create(' T@X.co ','g3m1') j`)
    expect(r.ok).toBe(true)
    ;({ id, token } = r.rows[0].j)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('the tester, holding only the token', () => {
  it('opens their module; a wrong token opens nothing', async () => {
    const r = await as<{ j: { module_id: string } }>('anon', null, 'select public.tester_open($1) j', [token])
    expect(r.rows[0]?.j.module_id).toBe('g3m1')
    expect((await as('anon', null, 'select public.tester_open($1)', ['0'.repeat(64)])).ok).toBe(false)
  })
  it('cannot read the tables directly', async () => {
    expect((await as('anon', null, 'select * from public.tester_assignments')).ok).toBe(false)
    expect((await as('anon', null, 'select * from public.tester_reviews')).ok).toBe(false)
  })
  it('an issue needs a note; a looks-right does not', async () => {
    const bad = await review(token, 'g3m1-t1', '3', 'issue', 'no')
    expect(bad.ok).toBe(false)
    expect(bad.err).toMatch(/at least 5 characters/)
    expect((await review(token, 'g3m1-t1', '3', 'issue', 'the 4 should be a 6')).ok).toBe(true)
    expect((await review(token, 'g3m1-t1', '4', 'ok', null)).ok).toBe(true)
  })
  it('cannot review a topic outside their module, or a made-up verdict', async () => {
    expect((await review(token, 'g4m1-t1', '3', 'ok', null)).err).toMatch(/not in this tester's module/)
    expect((await review(token, 'g3m1-t1', '5', 'great', null)).ok).toBe(false)
  })
  it('a second review of the same screen replaces the first', async () => {
    expect((await review(token, 'g3m1-t1', '4', 'issue', 'audio cuts off')).ok).toBe(true)
    const r = await as<{ j: { screen: string; verdict: string }[] }>('authenticated', ADMIN, 'select public.admin_tester_reviews($1) j', [id])
    expect(r.rows[0].j.map(x => `${x.screen}:${x.verdict}`).sort()).toEqual(['3:issue', '4:issue'])
  })
})

describe('a KG–2 chapter link', () => {
  it('reviews only its own chapter, with question, re-teach and intro keys', async () => {
    const r = await as<{ j: { token: string } }>('authenticated', ADMIN, `select public.admin_tester_create('k@x.co','c:addition') j`)
    const t = r.rows[0].j.token
    expect((await review(t, 'c:addition', 'intro', 'ok', null)).ok).toBe(true)
    expect((await review(t, 'c:addition', 'q3', 'issue', 'the apples do not match the number')).ok).toBe(true)
    expect((await review(t, 'c:addition', 'r1', 'ok', null)).ok).toBe(true)
    expect((await review(t, 'c:subtraction', 'q1', 'ok', null)).err).toMatch(/not in this tester's module/)
    expect((await review(t, 'g3m1-t1', '3', 'ok', null)).err).toMatch(/not in this tester's module/)
    // and a lesson link cannot review a chapter
    expect((await review(token, 'c:addition', 'q1', 'ok', null)).err).toMatch(/not in this tester's module/)
  })
  it('a made-up module id cannot be assigned', async () => {
    expect((await as('authenticated', ADMIN, `select public.admin_tester_create('k@x.co','c:add ition')`)).ok).toBe(false)
  })
})

describe('the admin view and marks', () => {
  it('the list counts what the tester did; a parent cannot see it', async () => {
    const r = await as<{ j: { email: string; screens: number; issues: number }[] }>('authenticated', ADMIN, 'select public.admin_tester_list() j')
    expect(r.rows[0].j.find(x => x.email === 't@x.co')).toMatchObject({ screens: 2, issues: 2 })
    expect((await as('authenticated', PARENT, 'select public.admin_tester_list()')).ok).toBe(false)
  })
  it('a revoked link stops working, and works again when un-revoked', async () => {
    expect((await as('authenticated', ADMIN, 'select public.admin_tester_mark($1,$2)', [id, 'revoke'])).ok).toBe(true)
    expect((await as('anon', null, 'select public.tester_open($1)', [token])).ok).toBe(false)
    expect((await review(token, 'g3m1-t1', '5', 'ok', null)).ok).toBe(false)
    expect((await as('authenticated', ADMIN, 'select public.admin_tester_mark($1,$2)', [id, 'unrevoke'])).ok).toBe(true)
    expect((await as('anon', null, 'select public.tester_open($1)', [token])).ok).toBe(true)
  })
  it('a paid link is closed too', async () => {
    expect((await as('authenticated', ADMIN, 'select public.admin_tester_mark($1,$2)', [id, 'paid'])).ok).toBe(true)
    expect((await as('anon', null, 'select public.tester_open($1)', [token])).ok).toBe(false)
  })
})
