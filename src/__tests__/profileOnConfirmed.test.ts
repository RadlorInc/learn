// @vitest-environment node
/**
 * A profile is created when the email is CONFIRMED, not at signup.
 *
 * Guards migration 20260908120000: the old trigger fired `after insert on auth.users`, so a
 * profile row appeared the instant signup ran, before the confirmation email was clicked — junk
 * for every typo'd or unowned address, and the address reserved against its real owner for ever.
 *
 * Real Postgres (pglite), baseline + every migration in order — the same fixture the schema tests
 * build (`_schema.ts`), so the trigger under test is the migrated one, not a retype. The three
 * cases below are watched: with the OLD trigger, case ① (unconfirmed → no profile) is red.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { loadSchema } from './_schema'
import type { PGlite } from '@electric-sql/pglite'

let db: PGlite
const count = async (sql: string) =>
  Number((await db.query<{ n: bigint }>(`select count(*)::int as n from ${sql}`)).rows[0].n)

beforeAll(async () => { ({ db } = await loadSchema()) })

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

  it('④ prune removes an unconfirmed account older than 3 days, keeps a fresh one and a confirmed one', async () => {
    await db.exec(`insert into auth.users (id, email, email_confirmed_at, created_at) values
      ('00000000-0000-4000-8000-0000000000b1', 'old-unconfirmed@example.com',  null,  now() - interval '4 days'),
      ('00000000-0000-4000-8000-0000000000b2', 'new-unconfirmed@example.com',  null,  now() - interval '1 hour'),
      ('00000000-0000-4000-8000-0000000000b3', 'old-confirmed@example.com',    now(), now() - interval '4 days')`)
    await db.exec(`select public.prune_unconfirmed_users()`)
    expect(await count(`auth.users where id = '00000000-0000-4000-8000-0000000000b1'`)).toBe(0)   // deleted
    expect(await count(`auth.users where id = '00000000-0000-4000-8000-0000000000b2'`)).toBe(1)   // too fresh
    expect(await count(`auth.users where id = '00000000-0000-4000-8000-0000000000b3'`)).toBe(1)   // confirmed
  })
})
