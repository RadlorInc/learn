/**
 * ADMIN DATA REQUIRES TWO-STEP VERIFICATION — `admin_assert()` on the REAL schema (baseline + every migration, _schema.ts).
 *
 * HOW THE TOKEN'S `aal` GETS HERE: in Supabase, PostgREST puts the caller's JWT claims in `request.jwt.claims`, and
 * `auth.jwt()` returns them; Supabase Auth writes `aal` into every access token ('aal1' after the password, 'aal2' after
 * an authenticator code). In this fixture `auth.jwt()` returns the `test.jwt` setting instead (and `auth.uid()` the
 * `test.uid` one) — so a test sets the claims it means, and calls AS `authenticated`, the role the real caller has.
 *
 * ⚠️ Every refusal has its positive twin in the same test: a function that refused everyone would pass a refusal-only
 * check, and /admin would be dark for the founder too. Expected values are written here by hand.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const MIGRATION = '20261006120000_admin_requires_aal2.sql'
const MIG_SQL = readFileSync(resolve(__dirname, '../../supabase/migrations', MIGRATION), 'utf8')

const ADMIN = '0000aa00-0000-4000-8000-000000000001'
const PARENT = '0000aa00-0000-4000-8000-000000000002'
const FNS = ['admin_overview', 'admin_learning', 'admin_funnel', 'admin_activation']
let db: PGlite

beforeAll(async () => {
  ;({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email) values ('${ADMIN}', 'a@x.test'), ('${PARENT}', 'p@x.test');
                 insert into public.admin_users (user_id) values ('${ADMIN}');`)
}, 120_000)

type Answer = { served: true } | { refused: string }
async function call(fn: string, uid: string, claims: Record<string, unknown> | null): Promise<Answer> {
  await db.exec(`select set_config('test.uid', '${uid}', false), set_config('test.jwt', '${claims ? JSON.stringify(claims) : ''}', false)`)
  await db.exec('set role authenticated')
  try { await db.query(`select public.${fn}(1)`); return { served: true } }
  catch (e) { const x = e as { code?: string; message: string }; return { refused: `${x.code} ${x.message}` } }
  finally { await db.exec('reset role') }
}
const REFUSED = { refused: '42501 not an administrator' }

describe('admin_* functions: an admin must be at aal2', () => {
  it('an admin with a password-only token (aal1) is refused by every admin_* function; the same admin at aal2 is served', async () => {
    for (const fn of FNS) {
      expect(await call(fn, ADMIN, { sub: ADMIN, role: 'authenticated', aal: 'aal1' }), `${fn} at aal1`).toEqual(REFUSED)
      expect(await call(fn, ADMIN, { sub: ADMIN, role: 'authenticated', aal: 'aal2' }), `${fn} at aal2`).toEqual({ served: true })
    }
  })

  it('a token with no aal claim at all is refused (it is not treated as aal2)', async () => {
    expect(await call('admin_overview', ADMIN, { sub: ADMIN, role: 'authenticated' })).toEqual(REFUSED)
    expect(await call('admin_overview', ADMIN, null)).toEqual(REFUSED)
  })

  it('a non-admin at aal2 is still refused — the second step adds to the admin check, it does not replace it', async () => {
    expect(await call('admin_overview', PARENT, { sub: PARENT, role: 'authenticated', aal: 'aal2' })).toEqual(REFUSED)
    expect(await call('admin_overview', ADMIN, { sub: ADMIN, role: 'authenticated', aal: 'aal2' }), 'control').toEqual({ served: true })
  })

  it('privilege unchanged: SECURITY DEFINER, search_path public, EXECUTE for authenticated + service_role only', async () => {
    const { rows } = await db.query<{ definer: boolean; cfg: string; acl: string }>(
      `select prosecdef as definer, array_to_string(proconfig, ',') as cfg, proacl::text as acl
         from pg_proc where oid = 'public.admin_assert()'::regprocedure`)
    expect(rows).toEqual([{ definer: true, cfg: 'search_path=public', acl: '{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}' }])
  })

  it('the rollback in the migration header restores the old rule: an aal1 admin is served again, privilege unchanged', async () => {
    const mig = MIG_SQL
    const block = mig.slice(mig.indexOf('-- ROLLBACK BEGIN\n') + '-- ROLLBACK BEGIN\n'.length, mig.indexOf('-- ROLLBACK END'))
    const sql = block.split('\n').map(l => l.replace(/^-- ?/, '')).join('\n')
    expect(sql, 'the rollback block was not found').toMatch(/create or replace function public\.admin_assert\(\)/)
    const { db: fresh } = await loadSchema()
    const was = db
    db = fresh
    try {
      await db.exec(`insert into auth.users (id, email) values ('${ADMIN}', 'a@x.test'); insert into public.admin_users (user_id) values ('${ADMIN}');`)
      expect(await call('admin_overview', ADMIN, { sub: ADMIN, aal: 'aal1' }), 'before the rollback').toEqual(REFUSED)
      await db.exec(sql)
      expect(await call('admin_overview', ADMIN, { sub: ADMIN, aal: 'aal1' }), 'after the rollback').toEqual({ served: true })
      expect(await call('admin_overview', PARENT, { sub: PARENT, aal: 'aal2' }), 'a non-admin after the rollback').toEqual(REFUSED)
      const { rows } = await db.query<{ definer: boolean; cfg: string; acl: string; m: string }>(
        `select prosecdef as definer, array_to_string(proconfig, ',') as cfg, proacl::text as acl, md5(prosrc) as m
           from pg_proc where oid = 'public.admin_assert()'::regprocedure`)
      // the body the migration's own STOP-CHECK expects, i.e. the rollback really is the previous definition
      expect(rows).toEqual([{ definer: true, cfg: 'search_path=public', acl: '{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}', m: '58c770f2aa23d2e8546ca9d8e42ddd7b' }])
    } finally { db = was }
  }, 120_000)

  it('the migration guards itself: it refuses a different admin_assert body, and a grant change — and applies on the real one', async () => {
    const outcome = (p: Promise<unknown>) => p.then(() => 'APPLIED', (e: Error) => e.message)
    // positive twin: the schema it was written against
    let { db: d } = await loadSchema({ before: MIGRATION })
    expect(await outcome(d.exec(MIG_SQL))).toBe('APPLIED')
    // production's body is not the repo's (someone edited it in the dashboard): nothing applied
    ;({ db: d } = await loadSchema({ before: MIGRATION }))
    await d.exec(`create or replace function public.admin_assert() returns void language plpgsql stable security definer
                  set search_path to 'public' as $$ begin perform 1; end; $$`)
    expect(await outcome(d.exec(MIG_SQL))).toMatch(/is not the definition this migration was written against/)
    // a grant slipped into the migration: the closing block rolls it back
    ;({ db: d } = await loadSchema({ before: MIGRATION }))
    // (a function replacer: in a replacement STRING, `$$` means a literal `$`)
    const planted = MIG_SQL.replace('\ndo $$\ndeclare b record', () => '\ngrant execute on function public.admin_assert() to anon;\ndo $$\ndeclare b record')
    expect(planted, 'the plant did not land').not.toBe(MIG_SQL)
    expect(await outcome(d.exec(planted))).toMatch(/^admin_assert\(\): .* — rolled back$/)
  }, 180_000)
})
