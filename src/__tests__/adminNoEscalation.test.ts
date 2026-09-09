// @vitest-environment node
/**
 * A signed-in parent must not be able to grant themselves the dashboard.
 *
 * ⚠️ THIS WAS A REAL, REPRODUCED ESCALATION, not a hypothetical. An earlier draft of the /admin
 * migration added 'admin' to the `user_role` enum. Against production's VERBATIM policy and grants
 * (2026-09-05):
 *
 *     policy[ALL] "profiles: own row"  USING auth.uid()=id  WITH CHECK auth.uid()=id
 *     ACL: authenticated = arwdDxtm
 *
 *     acting as authenticated · role before: parent
 *     update public.profiles set role='admin' where id=auth.uid();   -> ACCEPTED
 *     role after: admin
 *
 * The `with check` constrains WHICH ROW, never WHICH COLUMN. And the policy is not a bug —
 * `setMyRole()` exists on purpose for the one-time Teacher/Parent picker. It is a feature that
 * stops being safe the moment a privileged value joins the same column.
 *
 * The fix is structural: admin is a row in its own closed table, and `profiles.role` keeps only
 * parent/learner/teacher, so there is nothing to escalate TO.
 *
 * ⚠️ BOTH HALVES ARE ASSERTED. A build that simply refused every profile update would satisfy a
 * refusal-only check identically — and would break the picker, which is a real feature.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIG = readFileSync(resolve(__dirname, '../../supabase/migrations/20260905150000_admin_role_and_metrics.sql'), 'utf8')
const PARENT = '11111111-1111-1111-1111-111111111111'
const ADMIN  = '22222222-2222-2222-2222-222222222222'

let db: PGlite

beforeAll(async () => {
  db = await PGlite.create()
  // Schema, policy and grants copied verbatim from production 2026-09-05.
  await db.exec(`
    create schema if not exists auth;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
    end $$;
    create type public.user_role as enum ('parent','learner','teacher');
    create table auth.users (id uuid primary key);
    create table public.profiles (
      id uuid primary key, role public.user_role, display_name text not null default '',
      avatar_index smallint not null default 0,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('test.uid', true),'')::uuid $$;
    alter table public.profiles enable row level security;
    create policy "profiles: own row" on public.profiles
      for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
    grant all on public.profiles to authenticated;
    insert into auth.users (id) values ('${PARENT}'), ('${ADMIN}');
    insert into public.profiles (id, role, display_name) values
      ('${PARENT}','parent','A parent'), ('${ADMIN}','parent','The founder');
  `)
  // Only the admin-table part of the real migration — the metric functions need tables this
  // fixture does not have, and they are covered by adminMetrics.test.ts.
  const upTo = MIG.indexOf('-- ── internal accounts')
  await db.exec(MIG.slice(0, upTo))
  await db.exec(MIG.slice(MIG.indexOf('create or replace function public.admin_assert'),
                          MIG.indexOf('$$;', MIG.indexOf('create or replace function public.admin_assert')) + 3))
  await db.exec(`insert into public.admin_users (user_id) values ('${ADMIN}')`)
}, 60_000)

async function asParent<T>(sql: string): Promise<{ ok: boolean; err?: string }> {
  await db.exec(`select set_config('test.uid','${PARENT}', false)`)
  await db.exec(`set role authenticated`)
  try { await db.query(sql); return { ok: true } }
  catch (e) { return { ok: false, err: (e as Error).message } }
  finally { await db.exec(`reset role`) }
}

describe('a parent cannot grant themselves admin', () => {
  it("KNOWN-BAD CONTROL: the old shape is still reproducible — the policy DOES allow a self-role write", async () => {
    // This is the exact write that escalated. It still succeeds, because the policy is unchanged
    // and is meant to (the picker). What has gone is anything privileged to write INTO it.
    const r = await asParent(`update public.profiles set role='teacher' where id='${PARENT}'`)
    expect(r.ok).toBe(true)
    const after = await db.query<{ role: string }>(`select role from public.profiles where id='${PARENT}'`)
    expect(after.rows[0].role).toBe('teacher')   // ← the picker, still working. The positive twin.
  })

  it("'admin' is not a writable value — the enum does not contain it", async () => {
    const r = await asParent(`update public.profiles set role='admin' where id='${PARENT}'`)
    expect(r.ok).toBe(false)
    expect(r.err).toMatch(/invalid input value for enum|admin/i)
  })

  it('a parent cannot insert themselves into admin_users', async () => {
    const r = await asParent(`insert into public.admin_users (user_id) values ('${PARENT}')`)
    expect(r.ok).toBe(false)
    expect(r.err).toMatch(/permission denied|policy/i)
  })

  it('a parent cannot even READ admin_users', async () => {
    const r = await asParent(`select count(*) from public.admin_users`)
    expect(r.ok).toBe(false)
  })

  it('admin_assert refuses the parent and admits the admin', async () => {
    await db.exec(`select set_config('test.uid','${PARENT}', false)`)
    await expect(db.query(`select public.admin_assert()`)).rejects.toThrow(/not an administrator/)
    // ⚠️ the positive twin: a build that refused everyone would pass the line above identically.
    await db.exec(`select set_config('test.uid','${ADMIN}', false)`)
    await expect(db.query(`select public.admin_assert()`)).resolves.toBeTruthy()
  })
})
