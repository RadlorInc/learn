// @vitest-environment node
/**
 * A profile is created when the email is CONFIRMED, not at signup.
 *
 * Guards migrations 20260923180000 (profile on confirmation) and 20260923180100 (prune the
 * unconfirmed) — first written 2026-09-08 as 20260908120000/120100 and held until 2026-09-23. The old trigger fired `after insert on auth.users`, so a
 * profile row appeared the instant signup ran, before the confirmation email was clicked — junk
 * for every typo'd or unowned address, and the address reserved against its real owner for ever.
 *
 * Real Postgres (pglite), baseline + every migration in order — the same fixture the schema tests
 * build (`_schema.ts`), so the trigger under test is the migrated one, not a retype. The three
 * cases below are watched: with the OLD trigger, case ① (unconfirmed → no profile) is red.
 *
 * The schema is built STOPPING SHORT of 20260923180000 (production's shape until they are applied),
 * a control proves that shape still creates a profile at signup, then the two files are applied by
 * name — so a rename or a move of either file fails loudly here instead of testing nothing.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { loadSchema, applyFile, grantedConsent } from './_schema'
import type { PGlite } from '@electric-sql/pglite'

let db: PGlite
const count = async (sql: string) =>
  Number((await db.query<{ n: bigint }>(`select count(*)::int as n from ${sql}`)).rows[0].n)

beforeAll(async () => {
  ({ db } = await loadSchema({ before: '20260923180000' }))
  // Positive control: before these two migrations the schema creates a profile at signup.
  await db.exec(`insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000c1', 'control@example.com')`)
  if (Number((await db.query<{ n: number }>(`select count(*)::int as n from public.profiles where id = '00000000-0000-4000-8000-0000000000c1'`)).rows[0].n) !== 1) {
    throw new Error('control: the migrations alone no longer create a profile at signup — has something before 20260923180000 changed handle_new_user?')
  }
  await applyFile(db, '20260923180000_profile_on_confirmed.sql')
  await applyFile(db, '20260923180100_prune_unconfirmed_users.sql')
}, 60_000)   // builds the whole schema: ~1.5 s idle, past the 10 s hook default on a loaded machine

describe('profile creation is gated on email confirmation', () => {
  it('① email/password signup (unconfirmed) creates NO profile', async () => {
    const id = '00000000-0000-4000-8000-0000000000a1'
    await db.exec(`insert into auth.users (id, email) values ('${id}', 'unconfirmed@example.com')`)
    expect(await count(`public.profiles where id = '${id}'`)).toBe(0)
  })

  it('② clicking the confirm link (email_confirmed_at set) creates the profile', async () => {
    const id = '00000000-0000-4000-8000-0000000000a1'   // same user as ①, now confirming
    await db.exec(`update auth.users set email_confirmed_at = now() where id = '${id}'`)
    expect(await count(`public.profiles where id = '${id}'`)).toBe(1)
    const { rows } = await db.query<{ display_name: string }>(
      `select display_name from public.profiles where id = '${id}'`)
    expect(rows[0].display_name).toBe('unconfirmed@example.com')   // no full_name → falls back to email
  })

  it('③ OAuth / confirm-email-off (confirmed at insert) creates the profile at once — positive control', async () => {
    const id = '00000000-0000-4000-8000-0000000000a2'
    await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${id}', 'google@example.com', now())`)
    expect(await count(`public.profiles where id = '${id}'`)).toBe(1)
  })

  it('④ prune removes an unconfirmed account older than 3 days, keeps a fresh one, a confirmed one and one with a child', async () => {
    const [old, fresh, confirmed, parent] = ['b1', 'b2', 'b3', 'b4'].map(n => `00000000-0000-4000-8000-0000000000${n}`)
    await db.exec(`insert into auth.users (id, email, email_confirmed_at, created_at) values
      ('${old}',       'old-unconfirmed@example.com',  null,  now() - interval '4 days'),
      ('${fresh}',     'new-unconfirmed@example.com',  null,  now() - interval '1 hour'),
      ('${confirmed}', 'old-confirmed@example.com',    now(), now() - interval '4 days'),
      ('${parent}',    'old-unconfirmed-parent@example.com', now(), now() - interval '4 days')`)
    // The parent is created confirmed so a profile and a (consented) child can exist — the only way
    // either can — then its confirmation is cleared: the "cannot happen" row the child guard is for.
    const consent = await grantedConsent(db, parent)
    await db.exec(`insert into public.learners (display_name, age_group, created_by, consent_id)
                   values ('Kid', '6-8', '${parent}', '${consent}')`)
    await db.exec(`update auth.users set email_confirmed_at = null where id = '${parent}'`)

    // As the job runs it: one call over the whole table. A throw here (e.g. learners.created_by's
    // RESTRICT) means the job deleted NOBODY that night — asserted, not left to crash the test.
    const err = await db.exec(`select public.prune_unconfirmed_users()`).then(() => null, e => (e as Error).message)
    expect(err).toBeNull()

    expect(await count(`auth.users where id = '${old}'`)).toBe(0)         // deleted
    expect(await count(`auth.users where id = '${fresh}'`)).toBe(1)       // too fresh
    expect(await count(`auth.users where id = '${confirmed}'`)).toBe(1)   // confirmed
    expect(await count(`auth.users where id = '${parent}'`)).toBe(1)      // has a child
    expect(await count(`public.learners where created_by = '${parent}'`)).toBe(1)
  })

  it('⑤ both functions stay SECURITY DEFINER with search_path pinned, and no API role can call either', async () => {
    const { rows } = await db.query<{ f: string; definer: boolean; config: string; api: boolean }>(`
      select p.proname as f, p.prosecdef as definer, array_to_string(p.proconfig, ',') as config,
             has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE') as api
        from pg_proc p where p.pronamespace = 'public'::regnamespace
         and p.proname in ('handle_new_user', 'prune_unconfirmed_users') order by 1`)
    expect(rows).toEqual([
      { f: 'handle_new_user',         definer: true, config: 'search_path=public', api: false },
      { f: 'prune_unconfirmed_users', definer: true, config: 'search_path=public', api: false },
    ])
  })
})
